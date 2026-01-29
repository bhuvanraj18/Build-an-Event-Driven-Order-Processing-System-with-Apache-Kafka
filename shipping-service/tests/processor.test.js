const processor = require('../../src/services/processor');
const producer = require('../../src/kafka/producer');

// Mock the producer
jest.mock('../../src/kafka/producer');

describe('Shipping Service - Processor', () => {

    beforeEach(() => {
        producer.publishShippingScheduled.mockClear();
        // Since processor has internal state (Set), we strictly speaking should reset it.
        // But the module exports a function closing over the Set. 
        // For unit testing purely, we might need to rely on unique IDs or 
        // refactor processor to accept the state or export a clean method.
        // For this task, we'll just use unique IDs for each test to avoid collision.
    });

    it('should process a new order and publish shipping event', async () => {
        const orderEvent = {
            orderId: 'order-test-1-' + Date.now(),
            customerId: 'cust-1',
            items: []
        };

        await processor.processOrderEvent(orderEvent);

        expect(producer.publishShippingScheduled).toHaveBeenCalledTimes(1);
        const shippingEvent = producer.publishShippingScheduled.mock.calls[0][0];
        expect(shippingEvent.orderId).toBe(orderEvent.orderId);
        expect(shippingEvent).toHaveProperty('trackingNumber');
    });

    it('should implement idempotency and NOT process duplicate orders', async () => {
        const orderId = 'order-duplicate-test-' + Date.now();
        const orderEvent = {
            orderId: orderId,
            customerId: 'cust-1',
            items: []
        };

        // First process
        await processor.processOrderEvent(orderEvent);
        expect(producer.publishShippingScheduled).toHaveBeenCalledTimes(1);

        // Clear mock to verify second call
        producer.publishShippingScheduled.mockClear();

        // Second process (Duplicate)
        await processor.processOrderEvent(orderEvent);

        // Should NOT call producer again
        expect(producer.publishShippingScheduled).not.toHaveBeenCalled();
    });
});

const orderController = require('../../src/controllers/orderController');
const producer = require('../../src/kafka/producer');
const { z } = require('zod');

// Mock the producer
jest.mock('../../src/kafka/producer');

describe('Order Service - Order Controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {
                customerId: 'test-cust-1',
                items: [
                    { productId: 'p1', quantity: 2 }
                ]
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        producer.publishOrderCreated.mockClear();
    });

    it('should create an order and publish event when input is valid', async () => {
        await orderController.createOrder(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: "Order created successfully",
            orderId: expect.any(String),
            order: expect.objectContaining({
                customerId: 'test-cust-1',
                items: expect.arrayContaining([
                    expect.objectContaining({ productId: 'p1', quantity: 2 })
                ])
            })
        }));

        // Verify Kafka producer was called
        expect(producer.publishOrderCreated).toHaveBeenCalledTimes(1);
        const publishedOrder = producer.publishOrderCreated.mock.calls[0][0];
        expect(publishedOrder).toHaveProperty('orderId');
        expect(publishedOrder.customerId).toBe('test-cust-1');
    });

    it('should return 400 validation error for missing fields', async () => {
        req.body.customerId = ''; // Invalid

        await orderController.createOrder(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: "Validation Error"
        }));
        expect(producer.publishOrderCreated).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid items', async () => {
        req.body.items = []; // Empty items

        await orderController.createOrder(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(producer.publishOrderCreated).not.toHaveBeenCalled();
    });

    it('should handle producer errors gracefully (return 500)', async () => {
        producer.publishOrderCreated.mockRejectedValue(new Error('Kafka Error'));

        await orderController.createOrder(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
    });
});

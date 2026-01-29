const { v4: uuidv4 } = require('uuid');
const { publishShippingScheduled } = require('./../kafka/producer');

// Idempotency Store (In-Memory Set)
const processedOrderIds = new Set();

const processOrderEvent = async (orderEvent) => {
    const { orderId, customerId, items } = orderEvent;

    // 1. Idempotency Check
    if (processedOrderIds.has(orderId)) {
        console.log(`[Shipping Service] Skipping duplicate order processing for Order ID: ${orderId}`);
        return;
    }

    console.log(`[Shipping Service] Processing Order: ${orderId}`);

    // 2. Simulate Processing Delay (e.g., 500ms)
    await new Promise(resolve => setTimeout(resolve, 500));

    // 3. Generate Shipping Details (Mock)
    const shippingAddress = "123 Main St, Tech City, Cloud Land"; // Mocked
    const trackingNumber = `TRK-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Estimated delivery: 3 days from now
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3);

    const shippingEvent = {
        orderId,
        shippingAddress,
        estimatedDeliveryDate: deliveryDate.toISOString(),
        trackingNumber,
        timestamp: new Date().toISOString()
    };

    // 4. Publish ShippingScheduled Event
    await publishShippingScheduled(shippingEvent);

    // 5. Mark as Processed (Update Idempotency Store)
    // Ideally this happens in a transaction with step 4 or before acknowledging the message
    processedOrderIds.add(orderId);

    console.log(`[Shipping Service] Successfully scheduled shipment for Order ID: ${orderId}`);
};

module.exports = { processOrderEvent };

const { z } = require('zod');
const { v4: uuidv4 } = require('uuid');
const { publishOrderCreated } = require('../kafka/producer');

// In-memory store (simple array/object)
const orders = {};

// Validation Schema
const orderSchema = z.object({
    customerId: z.string().min(1, "Customer ID is required"),
    items: z.array(z.object({
        productId: z.string().min(1, "Product ID is required"),
        quantity: z.number().int().positive("Quantity must be a positive integer")
    })).min(1, "Order must contain at least one item")
});

exports.createOrder = async (req, res) => {
    try {
        // 1. Validate Input
        const validatedData = orderSchema.parse(req.body);

        // 2. Generate Order Logic 
        const orderId = uuidv4();
        // Simple mock calculation for total amount
        const totalAmount = validatedData.items.reduce((sum, item) => sum + (item.quantity * 10.0), 0);

        const newOrder = {
            orderId,
            customerId: validatedData.customerId,
            items: validatedData.items,
            totalAmount,
            status: 'CREATED',
            timestamp: new Date().toISOString()
        };

        // 3. Persist Order (In-Memory)
        orders[orderId] = newOrder;

        // 4. Publish Event
        await publishOrderCreated(newOrder);

        // 5. Response
        res.status(201).json({
            message: "Order created successfully",
            orderId: orderId,
            order: newOrder
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation Error", details: error.errors });
        }
        console.error("Error creating order:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

require('dotenv').config();
const { connectConsumer } = require('./kafka/consumer');
const { connectProducer } = require('./kafka/producer');
const express = require('express');

// Optional: Express server for Health Check
const app = express();
const port = 3001; // Internal port for health check

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

const startService = async () => {
    try {
        console.log("Starting Shipping Service...");

        // 1. Connect Producer (for publishing ShippingScheduled events)
        await connectProducer();

        // 2. Connect Consumer (subscribe to order_events)
        await connectConsumer();

        // 3. Start Health Check Server
        app.listen(port, () => {
            console.log(`Shipping Service Health Check running on port ${port}`);
        });

    } catch (error) {
        console.error("Failed to start Shipping Service:", error);
        process.exit(1);
    }
};

startService();

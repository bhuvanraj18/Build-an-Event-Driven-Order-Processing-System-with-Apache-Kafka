require('dotenv').config();
const express = require('express');
const orderRoutes = require('./routes/orders');
const { connectProducer } = require('./kafka/producer');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Routes
app.use('/api/orders', orderRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Start server and Kafka producer
const startServer = async () => {
    try {
        await connectProducer();
        app.listen(port, () => {
            console.log(`Order Service running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to start Order Service:', error);
        process.exit(1);
    }
};

startServer();

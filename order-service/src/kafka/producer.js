const { Kafka, Partitioners } = require('kafkajs');

const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'order-service',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    retry: {
        initialRetryTime: 100,
        retries: 5
    }
});

// Use LegacyPartitioner to act closer to default behavior if needed, 
// but DefaultPartitioner is fine.
const producer = kafka.producer({
    createPartitioner: Partitioners.DefaultPartitioner
});

const connectProducer = async () => {
    try {
        await producer.connect();
        console.log("Kafka Producer connected");
    } catch (error) {
        console.error("Error connecting Kafka Producer", error);
        // Let the service fail if Kafka is down, orchestration handles restart
        throw error;
    }
};

const publishOrderCreated = async (orderData) => {
    const topic = process.env.TOPIC_ORDER_CREATED || 'order_events';

    try {
        await producer.send({
            topic,
            messages: [
                {
                    key: orderData.orderId, // Key by OrderID for ordering guarantees if partitioned
                    value: JSON.stringify(orderData)
                }
            ]
        });
        console.log(`[Order Service] Published OrderCreated event for Order ID: ${orderData.orderId}`);
    } catch (error) {
        console.error(`[Order Service] Failed to publish event for Order ID: ${orderData.orderId}`, error);
        // In a real app, we might want to rollback the DB transaction here or use Transactional Outbox
        throw error;
    }
};

module.exports = { connectProducer, publishOrderCreated };

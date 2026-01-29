const { Kafka, Partitioners } = require('kafkajs');

const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'shipping-service',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
});

const producer = kafka.producer({
    createPartitioner: Partitioners.DefaultPartitioner
});

const connectProducer = async () => {
    try {
        await producer.connect();
        console.log("Shipping Kafka Producer connected");
    } catch (error) {
        console.error("Error connecting Shipping Kafka Producer", error);
        throw error;
    }
};

const publishShippingScheduled = async (shippingData) => {
    const topic = process.env.TOPIC_SHIPPING_SCHEDULED || 'shipping_events';
    try {
        await producer.send({
            topic,
            messages: [
                {
                    key: shippingData.orderId,
                    value: JSON.stringify(shippingData)
                }
            ]
        });
        console.log(`[Shipping Service] Published ShippingScheduled event for Order ID: ${shippingData.orderId}`);
    } catch (error) {
        console.error(`[Shipping Service] Failed to publish event for Order ID: ${shippingData.orderId}`, error);
        throw error;
    }
};

// DLQ Producer helper
const publishToDLQ = async (failedMessage, originalTopic, error) => {
    const dlqTopic = process.env.TOPIC_DLQ || 'order_events_dlq';
    try {
        await producer.send({
            topic: dlqTopic,
            messages: [{
                key: failedMessage.key,
                value: failedMessage.value, // Keep original payload
                headers: {
                    'original-topic': originalTopic,
                    'error-message': error.message
                }
            }]
        });
        console.log(`[Shipping Service] Sent message to DLQ: ${dlqTopic}`);
    } catch (dlqError) {
        console.error("[Shipping Service] CRITICAL: Failed to publish to DLQ!", dlqError);
    }
};

module.exports = { connectProducer, publishShippingScheduled, publishToDLQ };

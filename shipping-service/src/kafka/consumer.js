const { Kafka } = require('kafkajs');
const { processOrderEvent } = require('../services/processor');
const { publishToDLQ } = require('./producer');

const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'shipping-service',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
});

const consumer = kafka.consumer({
    groupId: process.env.KAFKA_GROUP_ID || 'shipping-group'
});

const connectConsumer = async () => {
    const topic = process.env.TOPIC_ORDER_CREATED || 'order_events';

    try {
        await consumer.connect();
        console.log("Shipping Kafka Consumer connected");

        await consumer.subscribe({ topic, fromBeginning: true });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const messageKey = message.key ? message.key.toString() : null;
                const messageValue = message.value ? message.value.toString() : null;

                console.log(`[Shipping Service] Received message on ${topic}:`, messageKey);

                try {
                    if (!messageValue) throw new Error("Empty message value");
                    const orderEvent = JSON.parse(messageValue);

                    await processOrderEvent(orderEvent);

                } catch (error) {
                    console.error(`[Shipping Service] Error processing message`, error);
                    // DLQ Logic
                    // Note: In a real world, we likely retry a few times before DLQ.
                    // KafkaJS can handle retries on consumer.run, but if it throws here, it might crash the consumer or retry indefinitely depending on config.
                    // Here we catch it to prevent crash and send to DLQ.

                    // If it's a parsing error or fatal business logic error, send to DLQ immediately.
                    await publishToDLQ({ key: messageKey, value: messageValue }, topic, error);
                }
            },
        });

    } catch (error) {
        console.error("Error connecting Shipping Kafka Consumer", error);
        throw error;
    }
};

module.exports = { connectConsumer };

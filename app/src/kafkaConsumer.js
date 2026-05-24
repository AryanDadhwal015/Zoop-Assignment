const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'consumer-app',
  brokers: [process.env.KAFKA_BROKER]
});

const consumer = kafka.consumer({
  groupId: 'counter-group'
});

async function run() {
  await consumer.connect();

  await consumer.subscribe({
    topic: process.env.KAFKA_TOPIC,
    fromBeginning: true
  });

  console.log('Kafka consumer started');

  await consumer.run({
    eachMessage: async ({ message }) => {
      console.log(`Received Event: ${message.value.toString()}`);
    }
  });
}

run().catch(console.error);
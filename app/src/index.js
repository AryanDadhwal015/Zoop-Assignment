const express = require('express');
const Redis = require('ioredis');
const { Kafka } = require('kafkajs');

const app = express();
app.use(express.json());

const PORT = 3000;

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});

const kafka = new Kafka({
  clientId: 'backend-app',
  brokers: [process.env.KAFKA_BROKER]
});

const producer = kafka.producer();

async function connectKafka() {
  await producer.connect();
  console.log('Kafka producer connected');
}

connectKafka();

app.get('/health', async (req, res) => {
  return res.status(200).json({
    status: 'ok'
  });
});

app.get('/redis-check', async (req, res) => {
  try {
    const response = await redis.ping();

    return res.status(200).json({
      redis: response
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
});

app.post('/counter/increment', async (req, res) => {
  try {
    const value = await redis.incr('counter');

    const payload = {
      event: 'counter_incremented',
      value,
      timestamp: new Date().toISOString()
    };

    await producer.send({
      topic: process.env.KAFKA_TOPIC,
      messages: [
        {
          value: JSON.stringify(payload)
        }
      ]
    });

    return res.status(200).json({
      counter: value,
      kafka: 'event published'
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
});

app.post('/kafka/publish', async (req, res) => {
  try {
    const payload = {
      event: 'manual_publish',
      timestamp: new Date().toISOString()
    };

    await producer.send({
      topic: process.env.KAFKA_TOPIC,
      messages: [
        {
          value: JSON.stringify(payload)
        }
      ]
    });

    return res.status(200).json({
      status: 'published'
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`App running on port ${PORT}`);
});
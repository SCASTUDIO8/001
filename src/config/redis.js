'use strict';

const redis = require('redis');

let client;

async function getRedisClient() {
  if (client && client.isReady) return client;

  client = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
    },
    password: process.env.REDIS_PASSWORD || undefined,
  });

  client.on('error', (err) => console.error('[Redis] Error:', err));
  client.on('connect', () => console.log('[Redis] Connected'));

  await client.connect();
  return client;
}

module.exports = { getRedisClient };

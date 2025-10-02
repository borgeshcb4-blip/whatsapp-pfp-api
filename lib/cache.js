import { createClient } from '@vercel/kv';
import Redis from 'ioredis';

let cacheClient;
const getClient = () => {
  if (cacheClient) return cacheClient;
  if (process.env.VERCEL_KV_URL) {
    cacheClient = createClient({
      url: process.env.VERCEL_KV_URL,
      token: process.env.VERCEL_KV_TOKEN,
    });
  } else if (process.env.UPSTASH_REDIS_URL) {
    cacheClient = new Redis(process.env.UPSTASH_REDIS_URL);
  }
  return cacheClient;
};

export const getCache = async (key) => {
  const client = getClient();
  if (!client) return null;
  return client.get(key);
};

export const setCache = async (key, value, ttlSeconds) => {
  const client = getClient();
  if (!client) return;
  await client.set(key, value, 'EX', ttlSeconds);
};

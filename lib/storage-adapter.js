import { createClient } from '@vercel/kv';
import Redis from 'ioredis';
import fs from 'fs/promises';
import path from 'path';

const AUTH_KEY = 'WA_AUTH_SESSION';

export const createStorageAdapter = () => {
  if (process.env.VERCEL_KV_URL) {
    console.log('Usando Vercel KV para persistência da sessão.');
    const kv = createClient({
      url: process.env.VERCEL_KV_URL,
      token: process.env.VERCEL_KV_TOKEN,
    });
    return {
      readData: async (file) => {
        try {
          const data = await kv.hget(AUTH_KEY, file);
          return data ? JSON.parse(data) : null;
        } catch (error) { return null; }
      },
      writeData: async (file, data) => kv.hset(AUTH_KEY, { [file]: JSON.stringify(data) }),
      deleteData: async (file) => kv.hdel(AUTH_KEY, file),
    };
  }
  if (process.env.UPSTASH_REDIS_URL) {
    console.log('Usando Upstash Redis para persistência da sessão.');
    const redis = new Redis(process.env.UPSTASH_REDIS_URL);
    return {
      readData: async (file) => {
        const data = await redis.hget(AUTH_KEY, file);
        return data ? JSON.parse(data) : null;
      },
      writeData: async (file, data) => redis.hset(AUTH_KEY, file, JSON.stringify(data)),
      deleteData: async (file) => redis.hdel(AUTH_KEY, file),
    };
  }
  console.log('Usando sistema de arquivos local para persistência da sessão.');
  const dir = path.resolve(process.cwd(), 'session');
  return {
    readData: async (file) => {
      try {
        const data = await fs.readFile(path.join(dir, file), 'utf-8');
        return JSON.parse(data);
      } catch (error) { return null; }
    },
    writeData: async (file, data) => {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, file), JSON.stringify(data, null, 2));
    },
    deleteData: async (file) => {
      try { await fs.unlink(path.join(dir, file)); } catch (error) {}
    },
  };
};

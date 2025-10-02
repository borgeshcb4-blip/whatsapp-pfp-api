import { getWASocket } from '../../lib/whatsapp.js';
import { getCache, setCache } from '../../lib/cache.js';
import { rateLimit } from 'express-rate-limit';
import express from 'express';

const app = express();
const apiKeyAuth = (req, res, next) => {
  if (process.env.API_KEY && req.headers['x-api-key'] !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
  }
  next();
};
const limiter = rateLimit({ windowMs: 60 * 1000, max: 20, message: { error: 'Too many requests.' } });
const toJid = (phone) => {
  let jid = phone.replace(/[^0-9]/g, '');
  if (!jid.endsWith('@s.whatsapp.net')) jid += '@s.whatsapp.net';
  return jid;
};

app.use(limiter);
app.use(apiKeyAuth);

app.get('/api/profile/:phone', async (req, res) => {
  const { phone } = req.params;
  const { force } = req.query;
  if (!phone) return res.status(400).json({ error: 'Phone number is required' });

  const jid = toJid(phone);
  const cacheKey = `pfp:${jid}`;

  try {
    if (force !== 'true') {
      const cachedImage = await getCache(cacheKey);
      if (cachedImage) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Content-Type', 'image/jpeg');
        return res.send(Buffer.from(cachedImage, 'base64'));
      }
    }
    
    const sock = await getWASocket();
    const picUrl = await sock.profilePictureUrl(jid, 'image');
    const response = await fetch(picUrl);
    if (!response.ok) throw new Error('Failed to fetch profile picture from URL');
    
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    await setCache(cacheKey, imageBuffer.toString('base64'), 6 * 60 * 60);

    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Content-Type', 'image/jpeg');
    res.send(imageBuffer);
  } catch (error) {
    if (error.message.includes('404')) {
      return res.status(404).json({ error: "Profile picture not available or user not found" });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default app;

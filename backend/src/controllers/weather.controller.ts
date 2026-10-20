import { Request, Response as ExpressResponse } from 'express';
import { redisClient } from '../config/redis';

const WEATHERSTACK_API_KEY = process.env.WEATHERSTACK_API_KEY;
const WEATHERSTACK_BASE_URL = 'http://api.weatherstack.com';

// Cache weather for 10 minutes to avoid hitting the Weatherstack rate limit.
const CACHE_TTL_SECONDS = 600;

export const getCurrentWeather = async (req: Request, res: ExpressResponse) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const cacheKey = `weather:current:${encodeURIComponent(query as string)}`;

    // Serve from cache if available
    if (redisClient) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          return res.json(JSON.parse(cached));
        }
      } catch (cacheErr) {
        console.error('Weather cache read failed, fetching live:', cacheErr);
      }
    }

    const url = `${WEATHERSTACK_BASE_URL}/current?access_key=${WEATHERSTACK_API_KEY}&query=${encodeURIComponent(query as string)}`;
    const response = await fetch(url);

    // Surface the actual API error (rate limit, invalid key, etc.)
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const apiError = (data as any)?.error;
      const message = apiError?.info
        || (response.status === 429 ? 'Weather API rate limit reached' : 'Weather API error')
        || response.statusText;
      return res.status(response.status).json({ error: message, code: response.status });
    }

    if (data && typeof data === 'object' && 'error' in data && (data as any).error) {
      return res.status(400).json({ error: (data as any).error.info || 'Weather API error' });
    }

    // Write through cache
    if (redisClient) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(data), 'EX', CACHE_TTL_SECONDS);
      } catch (cacheErr) {
        console.error('Weather cache write failed:', cacheErr);
      }
    }

    res.json(data);
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

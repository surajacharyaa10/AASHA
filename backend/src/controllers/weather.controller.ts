import { Request, Response } from 'express';

const WEATHERSTACK_API_KEY = process.env.WEATHERSTACK_API_KEY;
const WEATHERSTACK_BASE_URL = 'http://api.weatherstack.com';

export const getCurrentWeather = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const url = `${WEATHERSTACK_BASE_URL}/current?access_key=${WEATHERSTACK_API_KEY}&query=${encodeURIComponent(query as string)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data && typeof data === 'object' && 'error' in data && data.error) {
       return res.status(400).json({ error: (data.error as any).info || 'Weather API error' });
    }

    res.json(data);
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

import { Request, Response } from 'express';

const AMBEE_API_KEY = process.env.AMBEE_API_KEY;
const AMBEE_BASE_URL = 'https://api.ambeedata.com';

export const getLatestDisastersByCountry = async (req: Request, res: Response) => {
  try {
    const { countryCode, limit = '20', page = '1', eventType } = req.query;

    if (!countryCode || typeof countryCode !== 'string') {
      return res.status(400).json({ error: 'countryCode query parameter is required' });
    }

    const url = new URL(`${AMBEE_BASE_URL}/disasters/processed/latest/by-country-code`);
    url.searchParams.set('countryCode', countryCode.toUpperCase());
    url.searchParams.set('limit', limit as string);
    url.searchParams.set('page', page as string);
    if (eventType && typeof eventType === 'string') {
      url.searchParams.set('eventType', eventType);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'x-api-key': AMBEE_API_KEY || '',
        'Content-type': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Ambee API error:', response.status, text);
      return res.status(response.status).json({ error: `Ambee API error: ${response.statusText}` });
    }

    const data = await response.json() as { result?: unknown[]; message?: string };
    const result = Array.isArray(data?.result) ? data.result : [];
    res.json({ message: data.message || 'success', result });
  } catch (error) {
    console.error('Failed to fetch disasters by country:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getLatestDisastersByLatLng = async (req: Request, res: Response) => {
  try {
    const { lat, lng, limit = '20', page = '1', eventType } = req.query;

    if (!lat || !lng || typeof lat !== 'string' || typeof lng !== 'string') {
      return res.status(400).json({ error: 'lat and lng query parameters are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      return res.status(400).json({ error: 'Invalid latitude. Must be between -90 and 90' });
    }
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'Invalid longitude. Must be between -180 and 180' });
    }

    const url = new URL(`${AMBEE_BASE_URL}/disasters/processed/latest/by-lat-lng`);
    url.searchParams.set('lat', lat);
    url.searchParams.set('lng', lng);
    url.searchParams.set('limit', limit as string);
    url.searchParams.set('page', page as string);
    if (eventType && typeof eventType === 'string') {
      url.searchParams.set('eventType', eventType);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'x-api-key': AMBEE_API_KEY || '',
        'Content-type': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Ambee API error:', response.status, text);
      return res.status(response.status).json({ error: `Ambee API error: ${response.statusText}` });
    }

    const data = await response.json() as { result?: unknown[]; message?: string };
    const result = Array.isArray(data?.result) ? data.result : [];
    res.json({ message: data.message || 'success', result });
  } catch (error) {
    console.error('Failed to fetch disasters by lat/lng:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getDisasterGeometry = async (req: Request, res: Response) => {
  try {
    const { sourceEventId } = req.query;

    if (!sourceEventId || typeof sourceEventId !== 'string') {
      return res.status(400).json({ error: 'sourceEventId query parameter is required' });
    }

    const url = new URL(`${AMBEE_BASE_URL}/disasters/latest/by-source-eventId`);
    url.searchParams.set('sourceEventId', sourceEventId);
    url.searchParams.set('geometry', 'true');

    const response = await fetch(url.toString(), {
      headers: {
        'x-api-key': AMBEE_API_KEY || '',
        'Content-type': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Ambee API error:', response.status, text);
      return res.status(response.status).json({ error: `Ambee API error: ${response.statusText}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Failed to fetch disaster geometry:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

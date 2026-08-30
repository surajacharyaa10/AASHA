import { Request, Response } from 'express';
import { fetchAllDisasters } from '../services/disasterData.service';

export const getLatestDisastersByCountry = async (req: Request, res: Response) => {
  try {
    const { countryCode, limit = '50', page = '1', eventType, days = '365' } = req.query;

    if (!countryCode || typeof countryCode !== 'string') {
      return res.status(400).json({ error: 'countryCode query parameter is required' });
    }

    const maxDays = Math.min(parseInt(days as string, 10) || 365, 365);
    let disasters = await fetchAllDisasters(maxDays);

    if (eventType && typeof eventType === 'string') {
      const types = eventType.split(',').map((t) => t.trim().toUpperCase());
      disasters = disasters.filter((d) => types.includes(d.event_type));
    }

    const maxResults = Math.min(parseInt(limit as string, 10) || 50, 200);
    const startIdx = (parseInt(page as string, 10) - 1) * maxResults;
    const paginated = disasters.slice(startIdx, startIdx + maxResults);

    res.json({ message: 'success', result: paginated, total: disasters.length });
  } catch (error) {
    console.error('Failed to fetch disasters:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getLatestDisastersByLatLng = async (req: Request, res: Response) => {
  try {
    const { lat, lng, limit = '50', page = '1', eventType, days = '365' } = req.query;

    if (!lat || !lng || typeof lat !== 'string' || typeof lng !== 'string') {
      return res.status(400).json({ error: 'lat and lng query parameters are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      return res.status(400).json({ error: 'Invalid latitude' });
    }
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'Invalid longitude' });
    }

    const maxDays = Math.min(parseInt(days as string, 10) || 365, 365);
    let disasters = await fetchAllDisasters(maxDays);

    if (eventType && typeof eventType === 'string') {
      const types = eventType.split(',').map((t) => t.trim().toUpperCase());
      disasters = disasters.filter((d) => types.includes(d.event_type));
    }

    const maxResults = Math.min(parseInt(limit as string, 10) || 50, 200);
    const startIdx = (parseInt(page as string, 10) - 1) * maxResults;
    const paginated = disasters.slice(startIdx, startIdx + maxResults);

    res.json({ message: 'success', result: paginated, total: disasters.length });
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

    res.json({ message: 'No polygon data available from NASA EONET/GDACS', result: [] });
  } catch (error) {
    console.error('Failed to fetch disaster geometry:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

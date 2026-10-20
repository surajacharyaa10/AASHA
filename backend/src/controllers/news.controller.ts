import { Request, Response as ExpressResponse } from 'express';

const NEWSDATA_API_KEY = process.env.NEWSDATA_API_KEY || '';
const NEWSDATA_BASE_URL = 'https://newsdata.io/api/1/latest';

const CATEGORIES = ['environment', 'health', 'other', 'politics', 'tourism'];
const EXCLUDE_LANGUAGES = ['ne', 'en'];
const COUNTRY = 'np';

interface NewsArticle {
  title: string;
  link: string;
  description: string;
  content?: string;
  image_url?: string;
  video_url?: string | null;
  published_at: string;
  source_id: string;
  source_priority?: number;
  country: string[];
  category: string[];
  language: string;
}

interface NewsResponse {
  status: string;
  totalResults: number;
  results: NewsArticle[];
}

export const getLatestNews = async (req: Request, res: ExpressResponse) => {
  try {
    if (!NEWSDATA_API_KEY) {
      return res.status(500).json({ status: 'error', message: 'NEWSDATA_API_KEY not configured', results: [] });
    }

    const categoryParam = CATEGORIES.join(',');
    const excludeLanguageParam = EXCLUDE_LANGUAGES.join(',');

    const url = `${NEWSDATA_BASE_URL}?apikey=${encodeURIComponent(NEWSDATA_API_KEY)}&country=${encodeURIComponent(COUNTRY)}&category=${encodeURIComponent(categoryParam)}&excludelanguage=${encodeURIComponent(excludeLanguageParam)}`;

    const response: any = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ status: 'error', message: `NewsData error ${response.status}: ${text}`, results: [] });
    }

    const data = (await response.json()) as NewsResponse;

    if (data.status !== 'success' || !Array.isArray(data.results)) {
      return res.status(200).json({ status: 'success', totalResults: 0, results: [] });
    }

    return res.status(200).json({
      status: 'success',
      totalResults: data.totalResults,
      results: data.results,
    });
  } catch (error) {
    console.error('Failed to fetch news from NewsData:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch news', results: [] });
  }
};

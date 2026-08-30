import { Router } from 'express';
import { getLatestNews } from '../controllers/news.controller';

const router = Router();

router.get('/latest', getLatestNews);

export default router;

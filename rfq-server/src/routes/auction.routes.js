import { Router } from 'express';
import {
  listAuctions,
  getAuctionDetails,
  getActivityLog,
} from '../controllers/auction.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', listAuctions);
router.get('/:rfqId', getAuctionDetails);
router.get('/:rfqId/log', getActivityLog);

export default router;
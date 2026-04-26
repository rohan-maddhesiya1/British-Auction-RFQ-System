import { Router } from 'express';
import { submitBid, getBidsForRfq } from '../controllers/bid.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import requireRole from '../middleware/role.middleware.js';
import { validateSubmitBid } from '../validators/bid.validator.js';

const router = Router();

router.use(authMiddleware);

router.post('/', requireRole('supplier'), validateSubmitBid, submitBid);
router.get('/:rfqId', getBidsForRfq);

export default router;
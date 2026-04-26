import { Router } from 'express';
import { createRfq, listRfqs, getRfq, activateRfq } from '../controllers/rfq.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import requireRole from '../middleware/role.middleware.js';
import { validateCreateRfq } from '../validators/rfq.validator.js';

const router = Router();

// All RFQ routes require authentication
router.use(authMiddleware);

router.get('/', listRfqs);
router.get('/:id', getRfq);
router.post('/', requireRole('buyer'), validateCreateRfq, createRfq);
router.patch('/:id/activate', requireRole('buyer'), activateRfq);

export default router;
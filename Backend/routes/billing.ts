import express from 'express';
import { getInvoices, createInvoice, getStats, searchInvoice, getInvoiceById } from '../controllers/billingController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/', protect, getInvoices);
router.get('/stats', protect, getStats);
router.get('/search', protect, searchInvoice);
router.get('/:id', protect, getInvoiceById);
router.post('/', protect, createInvoice);

export default router;

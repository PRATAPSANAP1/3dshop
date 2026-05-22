import express from 'express';
import { getGodowns, createGodown, getGodownOverview } from '../controllers/godownController';
import { protect, admin } from '../middleware/auth';

import { getRacks, createRack, updateRack, deleteRack, getAllRacks } from '../controllers/godownRackController';
import { getStock, addStock, updateStock, getAllStock } from '../controllers/godownStockController';

const router = express.Router();

router.use(protect);
router.use(admin);

// Godown Core Routes
router.get('/overview', getGodownOverview);
router.get('/racks/all', getAllRacks);
router.get('/stock/all', getAllStock);
router.get('/', getGodowns);
router.post('/', createGodown);

// Godown Rack Routes
router.get('/:godownId/racks', getRacks);
router.post('/:godownId/racks', createRack);
router.put('/:godownId/racks/:rackId', updateRack);
router.delete('/:godownId/racks/:rackId', deleteRack);

// Godown Stock Routes
router.get('/:godownId/stock', getStock);
router.post('/:godownId/stock', addStock);
router.put('/:godownId/stock/:stockId', updateStock);

export default router;

import express from 'express';
import * as exportController from '../controllers/export.controller.js';

const router = express.Router();

// GET /api/export?ids[]=1&ids[]=2&format=json
router.get('/', exportController.exportJSON);

// GET /api/export/zip?ids[]=1&ids[]=2
router.get('/zip', exportController.exportZIP);

// GET /api/export/:id
router.get('/:id', exportController.exportSingleJSON);

export default router;

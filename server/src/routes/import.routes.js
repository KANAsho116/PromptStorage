import express from 'express';
import * as importController from '../controllers/import.controller.js';

const router = express.Router();

// POST /api/import
router.post('/', importController.uploadMiddleware, importController.importWorkflows);

export default router;

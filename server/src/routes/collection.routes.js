import { Router } from 'express';
import {
  getAllCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
  addWorkflowToCollection,
  removeWorkflowFromCollection,
  getWorkflowCollections
} from '../controllers/collection.controller.js';

const router = Router();

// Collection CRUD
router.get('/', getAllCollections);
router.get('/:id', getCollectionById);
router.post('/', createCollection);
router.put('/:id', updateCollection);
router.delete('/:id', deleteCollection);

// Workflow-Collection relationships
router.post('/:id/workflows', addWorkflowToCollection);
router.delete('/:id/workflows/:workflowId', removeWorkflowFromCollection);

// Get collections for a specific workflow
router.get('/workflow/:workflowId', getWorkflowCollections);

export default router;

import CollectionModel from '../models/collection.model.js';

/**
 * Get all collections
 */
export const getAllCollections = async (req, res, next) => {
  try {
    const collections = CollectionModel.findAll();
    res.json({
      success: true,
      data: collections,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get collection by ID
 */
export const getCollectionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collection = CollectionModel.findById(id);

    if (!collection) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Collection not found' }
      });
    }

    // Get workflows in collection
    const workflows = CollectionModel.getWorkflows(id);

    res.json({
      success: true,
      data: { ...collection, workflows },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new collection
 */
export const createCollection = async (req, res, next) => {
  try {
    const { name, description, color, icon } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Collection name is required' }
      });
    }

    const collection = CollectionModel.create({
      name: name.trim(),
      description: description?.trim() || '',
      color: color || '#3B82F6',
      icon: icon || 'folder'
    });

    res.status(201).json({
      success: true,
      data: collection,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update collection
 */
export const updateCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, color, icon } = req.body;

    const existing = CollectionModel.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Collection not found' }
      });
    }

    const collection = CollectionModel.update(id, {
      name: name?.trim(),
      description: description?.trim(),
      color,
      icon
    });

    res.json({
      success: true,
      data: collection,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete collection
 */
export const deleteCollection = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = CollectionModel.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Collection not found' }
      });
    }

    CollectionModel.delete(id);

    res.json({
      success: true,
      message: 'Collection deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add workflow to collection
 */
export const addWorkflowToCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { workflowId, workflowIds } = req.body;

    const collection = CollectionModel.findById(id);
    if (!collection) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Collection not found' }
      });
    }

    if (workflowIds && Array.isArray(workflowIds)) {
      CollectionModel.addWorkflows(id, workflowIds);
    } else if (workflowId) {
      CollectionModel.addWorkflow(id, workflowId);
    } else {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'workflowId or workflowIds is required' }
      });
    }

    const updated = CollectionModel.findById(id);

    res.json({
      success: true,
      data: updated,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove workflow from collection
 */
export const removeWorkflowFromCollection = async (req, res, next) => {
  try {
    const { id, workflowId } = req.params;

    CollectionModel.removeWorkflow(id, workflowId);

    const updated = CollectionModel.findById(id);

    res.json({
      success: true,
      data: updated,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get collections for a workflow
 */
export const getWorkflowCollections = async (req, res, next) => {
  try {
    const { workflowId } = req.params;
    const collections = CollectionModel.getWorkflowCollections(workflowId);

    res.json({
      success: true,
      data: collections,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

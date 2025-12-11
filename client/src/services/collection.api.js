import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Collection API
 */
export const collectionAPI = {
  // Get all collections
  getAll: async () => {
    const response = await api.get('/collections');
    return response.data;
  },

  // Get collection by ID with workflows
  getById: async (id) => {
    const response = await api.get(`/collections/${id}`);
    return response.data;
  },

  // Create new collection
  create: async (data) => {
    const response = await api.post('/collections', data);
    return response.data;
  },

  // Update collection
  update: async (id, data) => {
    const response = await api.put(`/collections/${id}`, data);
    return response.data;
  },

  // Delete collection
  delete: async (id) => {
    const response = await api.delete(`/collections/${id}`);
    return response.data;
  },

  // Add workflow(s) to collection
  addWorkflows: async (collectionId, workflowIds) => {
    const response = await api.post(`/collections/${collectionId}/workflows`, {
      workflowIds: Array.isArray(workflowIds) ? workflowIds : [workflowIds]
    });
    return response.data;
  },

  // Remove workflow from collection
  removeWorkflow: async (collectionId, workflowId) => {
    const response = await api.delete(`/collections/${collectionId}/workflows/${workflowId}`);
    return response.data;
  },

  // Get collections for a workflow
  getWorkflowCollections: async (workflowId) => {
    const response = await api.get(`/collections/workflow/${workflowId}`);
    return response.data;
  },
};

export default collectionAPI;

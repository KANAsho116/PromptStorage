import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// レスポンスインターセプター（エラーハンドリング）
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

/**
 * ワークフローAPI
 */
export const workflowAPI = {
  // ワークフロー作成
  create: async (workflowData) => {
    const response = await api.post('/workflows', workflowData);
    return response.data;
  },

  // ワークフロー一覧取得
  getAll: async (params = {}) => {
    const response = await api.get('/workflows', { params });
    return response.data;
  },

  // 特定のワークフロー取得
  getById: async (id) => {
    const response = await api.get(`/workflows/${id}`);
    return response.data;
  },

  // ワークフロー更新
  update: async (id, updates) => {
    const response = await api.put(`/workflows/${id}`, updates);
    return response.data;
  },

  // ワークフロー削除
  delete: async (id) => {
    const response = await api.delete(`/workflows/${id}`);
    return response.data;
  },

  // お気に入り切り替え
  toggleFavorite: async (id) => {
    const response = await api.patch(`/workflows/${id}/favorite`);
    return response.data;
  },

  // 検索
  search: async (query, params = {}) => {
    const response = await api.get('/workflows/search', {
      params: { q: query, ...params },
    });
    return response.data;
  },
};

/**
 * 画像API
 */
export const imageAPI = {
  // ワークフローに画像をアップロード
  uploadImages: async (workflowId, files) => {
    const formData = new FormData();
    for (const file of files) {
      formData.append('images', file);
    }

    const response = await api.post(`/images/workflows/${workflowId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // ワークフローの画像一覧を取得
  getWorkflowImages: async (workflowId) => {
    const response = await api.get(`/images/workflows/${workflowId}/images`);
    return response.data;
  },

  // 画像URLを取得
  getImageUrl: (imageId) => {
    return `${API_BASE_URL}/images/${imageId}`;
  },

  // 画像を削除
  deleteImage: async (imageId) => {
    const response = await api.delete(`/images/${imageId}`);
    return response.data;
  },
};

export default api;

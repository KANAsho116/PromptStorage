import api from './api.js';

/**
 * エクスポートAPI
 */
export const exportAPI = {
  // JSON形式でエクスポート
  exportJSON: async (workflowIds) => {
    const ids = Array.isArray(workflowIds) ? workflowIds : [workflowIds];
    const params = new URLSearchParams();
    ids.forEach(id => params.append('ids[]', id));

    const response = await api.get(`/export?${params.toString()}`, {
      responseType: 'blob',
    });

    // ファイルダウンロード
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `workflows-export-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // ZIP形式でエクスポート
  exportZIP: async (workflowIds) => {
    const ids = Array.isArray(workflowIds) ? workflowIds : [workflowIds];
    const params = new URLSearchParams();
    ids.forEach(id => params.append('ids[]', id));

    const response = await api.get(`/export/zip?${params.toString()}`, {
      responseType: 'blob',
    });

    // ファイルダウンロード
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `workflows-export-${Date.now()}.zip`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // 単一ワークフローをエクスポート
  exportSingle: async (workflowId) => {
    const response = await api.get(`/export/${workflowId}`, {
      responseType: 'blob',
    });

    // ファイルダウンロード
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `workflow-${workflowId}-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

/**
 * インポートAPI
 */
export const importAPI = {
  // ワークフローをインポート（JSON/ZIP）
  import: async (file, duplicateAction = 'rename') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('duplicateAction', duplicateAction);

    const response = await api.post('/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

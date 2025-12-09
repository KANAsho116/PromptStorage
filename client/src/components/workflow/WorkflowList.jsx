import { useState, useEffect } from 'react';
import { workflowAPI } from '../../services/api';

export default function WorkflowList({ refresh }) {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const result = await workflowAPI.getAll();
      setWorkflows(result.data);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [refresh]);

  const handleDelete = async (id) => {
    if (!confirm('このワークフローを削除しますか？')) return;

    try {
      await workflowAPI.delete(id);
      fetchWorkflows();
    } catch (err) {
      alert('削除に失敗しました: ' + err.message);
    }
  };

  const handleToggleFavorite = async (id) => {
    try {
      await workflowAPI.toggleFavorite(id);
      fetchWorkflows();
    } catch (err) {
      alert('更新に失敗しました: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-500"></div>
        <p className="mt-4 text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        エラー: {error}
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        ワークフローがありません。上のフォームからアップロードしてください。
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {workflows.map((workflow) => (
        <div
          key={workflow.id}
          className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-white truncate">
              {workflow.name}
            </h3>
            <button
              onClick={() => handleToggleFavorite(workflow.id)}
              className={`ml-2 ${workflow.favorite ? 'text-yellow-400' : 'text-gray-500'}`}
            >
              ★
            </button>
          </div>

          {workflow.description && (
            <p className="text-sm text-gray-400 mb-4 line-clamp-2">
              {workflow.description}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
            <span>{workflow.promptCount || 0} プロンプト</span>
            <span>{new Date(workflow.created_at).toLocaleDateString('ja-JP')}</span>
          </div>

          {workflow.tags && workflow.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {workflow.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-1 bg-blue-900/30 text-blue-300 text-xs rounded"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => handleDelete(workflow.id)}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
            >
              削除
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

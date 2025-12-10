import { useState, useEffect } from 'react';
import { workflowAPI, imageAPI } from '../../services/api';
import WorkflowDetail from './WorkflowDetail';

// スケルトンカードコンポーネント
function SkeletonCard() {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 animate-pulse">
      <div className="w-full h-48 bg-gray-700"></div>
      <div className="p-6">
        <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-2/3 mb-4"></div>
        <div className="flex gap-2 mb-4">
          <div className="h-6 bg-gray-700 rounded w-16"></div>
          <div className="h-6 bg-gray-700 rounded w-20"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 bg-gray-700 rounded flex-1"></div>
          <div className="h-10 bg-gray-700 rounded flex-1"></div>
        </div>
      </div>
    </div>
  );
}

// 空状態コンポーネント
function EmptyState() {
  return (
    <div className="text-center py-16">
      <svg
        className="mx-auto h-24 w-24 text-gray-600 mb-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
      <h3 className="text-xl font-semibold text-gray-400 mb-2">
        ワークフローがありません
      </h3>
      <p className="text-gray-500 mb-6">
        ComfyUI のワークフロー JSON をアップロードして<br />
        プロンプトを管理しましょう
      </p>
      <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <span>上のエリアにドラッグ&ドロップ</span>
      </div>
    </div>
  );
}

export default function WorkflowList({ refresh, filters = {}, onSelectionChange }) {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      if (filters.q) {
        const result = await workflowAPI.search(filters.q, filters);
        setWorkflows(result.data);
      } else {
        const result = await workflowAPI.getAll(filters);
        setWorkflows(result.data);
      }
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
    setSelectedIds([]);
    if (onSelectionChange) onSelectionChange([]);
  }, [refresh, JSON.stringify(filters)]);

  useEffect(() => {
    if (onSelectionChange) onSelectionChange(selectedIds);
  }, [selectedIds]);

  const handleDelete = async (id) => {
    if (!confirm('このワークフローを削除しますか？')) return;
    try {
      await workflowAPI.delete(id);
      fetchWorkflows();
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
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

  const handleSelectWorkflow = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    setSelectedIds(selectedIds.length === workflows.length ? [] : workflows.map(w => w.id));
  };

  const handleViewDetail = (id, event) => {
    event.stopPropagation();
    setSelectedWorkflowId(id);
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="h-5 bg-gray-700 rounded w-24 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-center">
        <p className="text-red-400 font-semibold mb-2">エラーが発生しました</p>
        <p className="text-red-300 text-sm">{error}</p>
        <button onClick={fetchWorkflows} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors">再試行</button>
      </div>
    );
  }

  if (workflows.length === 0) {
    return <EmptyState />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <label className="flex items-center cursor-pointer hover:text-blue-400 transition-colors">
          <input type="checkbox" checked={selectedIds.length === workflows.length && workflows.length > 0} onChange={handleSelectAll} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2" />
          <span className="ml-2 text-sm text-gray-300">全選択</span>
        </label>
        {selectedIds.length > 0 && <span className="text-sm text-blue-400 font-semibold">{selectedIds.length}件選択中</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            className={`bg-gray-800 rounded-lg overflow-hidden transition-all duration-200 relative group ${selectedIds.includes(workflow.id) ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900' : 'border border-gray-700 hover:border-gray-600'}`}
            onMouseEnter={() => setHoveredId(workflow.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="absolute top-3 left-3 z-10">
              <label className="cursor-pointer block">
                <input type="checkbox" checked={selectedIds.includes(workflow.id)} onChange={() => handleSelectWorkflow(workflow.id)} className="w-5 h-5 text-blue-600 bg-gray-900/80 backdrop-blur border-2 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer" onClick={(e) => e.stopPropagation()} />
              </label>
            </div>

            {workflow.images && workflow.images.length > 0 && (
              <div
                className="w-full h-48 bg-gray-900 overflow-hidden relative cursor-pointer"
                onClick={(e) => handleViewDetail(workflow.id, e)}
              >
                <img
                  src={imageAPI.getImageUrl(workflow.images.find(img => img.is_thumbnail)?.id || workflow.images[0].id)}
                  alt={workflow.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />

                {/* ホバープレビュー */}
                {hoveredId === workflow.id && workflow.images.length > 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm font-medium">クリックで詳細</span>
                  </div>
                )}
              </div>
            )}

            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3
                  className="text-lg font-semibold text-white truncate flex-1 cursor-pointer hover:text-blue-400 transition-colors"
                  onClick={(e) => handleViewDetail(workflow.id, e)}
                >
                  {workflow.name}
                </h3>
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggleFavorite(workflow.id); }}
                  className={`text-2xl transition-all duration-200 ${workflow.favorite ? 'text-yellow-400 hover:text-yellow-500 hover:scale-110' : 'text-gray-600 hover:text-yellow-400 hover:scale-110'}`}
                  title={workflow.favorite ? 'お気に入りから削除' : 'お気に入りに追加'}
                >
                  ★
                </button>
              </div>

              {workflow.description && <p className="text-sm text-gray-400 mb-4 line-clamp-2">{workflow.description}</p>}

              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span>{workflow.promptCount || 0} プロンプト</span>
                <span>{new Date(workflow.created_at).toLocaleDateString('ja-JP')}</span>
              </div>

              {workflow.tags && workflow.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {workflow.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-2 py-1 bg-blue-900/30 text-blue-300 text-xs rounded hover:bg-blue-900/50 transition-colors"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={(e) => handleViewDetail(workflow.id, e)}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                >
                  詳細
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(workflow.id); }}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedWorkflowId && (
        <WorkflowDetail
          workflowId={selectedWorkflowId}
          onClose={() => setSelectedWorkflowId(null)}
        />
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { workflowAPI, imageAPI } from '../../services/api';

export default function WorkflowList({ refresh, filters = {}, onSelectionChange }) {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

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

  if (loading) {
    return (
      <div className='text-center py-12'>
        <div className='inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-500'></div>
        <p className='mt-4 text-gray-500'>読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-red-900/20 border border-red-500 rounded-lg p-4 text-center'>
        <p className='text-red-400 font-semibold mb-2'>エラーが発生しました</p>
        <p className='text-red-300 text-sm'>{error}</p>
        <button onClick={fetchWorkflows} className='mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors'>再試行</button>
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className='text-center py-12 text-gray-500'>
        <p>ワークフローがありません</p>
        <p className='text-sm mt-2'>上のフォームからアップロードしてください</p>
      </div>
    );
  }

  return (
    <div>
      <div className='flex items-center justify-between mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700'>
        <label className='flex items-center cursor-pointer hover:text-blue-400 transition-colors'>
          <input type='checkbox' checked={selectedIds.length === workflows.length && workflows.length > 0} onChange={handleSelectAll} className='w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2' />
          <span className='ml-2 text-sm text-gray-300'>全選択</span>
        </label>
        {selectedIds.length > 0 && <span className='text-sm text-blue-400 font-semibold'>{selectedIds.length}件選択中</span>}
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {workflows.map((workflow) => (
          <div key={workflow.id} className={}>
            <div className='absolute top-3 left-3 z-10'>
              <label className='cursor-pointer block'>
                <input type='checkbox' checked={selectedIds.includes(workflow.id)} onChange={() => handleSelectWorkflow(workflow.id)} className='w-5 h-5 text-blue-600 bg-gray-900/80 backdrop-blur border-2 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer' onClick={(e) => e.stopPropagation()} />
              </label>
            </div>
            {workflow.images && workflow.images.length > 0 && (
              <div className='w-full h-48 bg-gray-900 overflow-hidden relative'>
                <img src={imageAPI.getImageUrl(workflow.images.find(img => img.is_thumbnail)?.id || workflow.images[0].id)} alt={workflow.name} className='w-full h-full object-cover' onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
            )}
            <div className='p-6'>
              <div className='flex justify-between items-start mb-4'>
                <h3 className='text-lg font-semibold text-white truncate flex-1'>{workflow.name}</h3>
                <button onClick={() => handleToggleFavorite(workflow.id)} className={} title={workflow.favorite ? 'お気に入りから削除' : 'お気に入りに追加'}>★</button>
              </div>
              {workflow.description && <p className='text-sm text-gray-400 mb-4 line-clamp-2'>{workflow.description}</p>}
              <div className='flex items-center justify-between text-xs text-gray-500 mb-4'>
                <span>{workflow.promptCount || 0} プロンプト</span>
                <span>{new Date(workflow.created_at).toLocaleDateString('ja-JP')}</span>
              </div>
              {workflow.tags && workflow.tags.length > 0 && (
                <div className='flex flex-wrap gap-2 mb-4'>
                  {workflow.tags.map((tag) => <span key={tag.id} className='px-2 py-1 bg-blue-900/30 text-blue-300 text-xs rounded hover:bg-blue-900/50 transition-colors'>{tag.name}</span>)}
                </div>
              )}
              <div className='flex gap-2'>
                <button onClick={() => handleDelete(workflow.id)} className='flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors'>削除</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

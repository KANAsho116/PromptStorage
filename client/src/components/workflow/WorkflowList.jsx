import { useState, useEffect, useCallback, useRef } from 'react';
import { workflowAPI, imageAPI } from '../../services/api';
import WorkflowDetail from './WorkflowDetail';
import { useToast } from '../common/Toast';
import { useConfirm } from '../common/ConfirmDialog';

// View mode icons
const GridIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const ListIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

const CompactIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

// Skeleton components
function SkeletonCard() {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 animate-pulse">
      <div className="w-full h-48 bg-gray-700"></div>
      <div className="p-6">
        <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
        <div className="flex gap-2"><div className="h-6 bg-gray-700 rounded w-16"></div></div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700 animate-pulse">
      <div className="w-16 h-16 bg-gray-700 rounded"></div>
      <div className="flex-1">
        <div className="h-5 bg-gray-700 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  );
}

// Empty state
function EmptyState() {
  return (
    <div className="text-center py-16">
      <svg className="mx-auto h-24 w-24 text-gray-600 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      <h3 className="text-xl font-semibold text-gray-400 mb-2">ワークフローがありません</h3>
      <p className="text-gray-500 mb-6">ComfyUI のワークフロー JSON をアップロードして<br />プロンプトを管理しましょう</p>
    </div>
  );
}

// Pagination component
function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const showEllipsis = totalPages > 7;

  if (showEllipsis) {
    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    }
  } else {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded transition-colors"
      >
        ←
      </button>
      {pages.map((page, idx) => (
        page === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">...</span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 rounded transition-colors ${
              currentPage === page
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            {page}
          </button>
        )
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded transition-colors"
      >
        →
      </button>
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
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('viewMode') || 'grid');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const toast = useToast();
  const confirm = useConfirm();
  const containerRef = useRef(null);

  const fetchWorkflows = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = { ...filters, page, limit: viewMode === 'compact' ? 50 : 20 };
      let result;
      if (filters.q) {
        result = await workflowAPI.search(filters.q, params);
      } else {
        result = await workflowAPI.getAll(params);
      }
      setWorkflows(result.data);
      if (result.pagination) {
        setPagination({
          page: result.pagination.page,
          totalPages: result.pagination.totalPages,
          total: result.pagination.total,
        });
      }
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, viewMode]);

  useEffect(() => {
    fetchWorkflows(1);
    setSelectedIds([]);
    setFocusedIndex(-1);
    if (onSelectionChange) onSelectionChange([]);
  }, [refresh, JSON.stringify(filters), viewMode]);

  useEffect(() => {
    if (onSelectionChange) onSelectionChange(selectedIds);
  }, [selectedIds]);

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedWorkflowId || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const cols = viewMode === 'grid' ? 3 : 1;
      const len = workflows.length;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => Math.min(prev + cols, len - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => Math.max(prev - cols, 0));
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (viewMode === 'grid') setFocusedIndex(prev => Math.min(prev + 1, len - 1));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (viewMode === 'grid') setFocusedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          if (focusedIndex >= 0 && focusedIndex < len) {
            setSelectedWorkflowId(workflows[focusedIndex].id);
          }
          break;
        case ' ':
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < len) {
            handleSelectWorkflow(workflows[focusedIndex].id);
          }
          break;
        case 'Escape':
          setFocusedIndex(-1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [workflows, focusedIndex, viewMode, selectedWorkflowId]);

  const handleDelete = async (id, workflowName) => {
    const confirmed = await confirm({
      title: '削除の確認',
      message: `"${workflowName}" を削除しますか？この操作は取り消せません。`,
      confirmLabel: '削除',
      type: 'danger',
    });
    if (!confirmed) return;
    try {
      await workflowAPI.delete(id);
      toast.success('ワークフローを削除しました');
      fetchWorkflows(pagination.page);
      setSelectedIds(prev => prev.filter(sid => sid !== id));
    } catch (err) {
      toast.error('削除に失敗しました: ' + err.message);
    }
  };

  const handleToggleFavorite = async (id) => {
    try {
      await workflowAPI.toggleFavorite(id);
      fetchWorkflows(pagination.page);
    } catch (err) {
      toast.error('更新に失敗しました: ' + err.message);
    }
  };

  const handleSelectWorkflow = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    setSelectedIds(selectedIds.length === workflows.length ? [] : workflows.map(w => w.id));
  };

  const handleViewDetail = (id, e) => {
    e?.stopPropagation();
    setSelectedWorkflowId(id);
  };

  const handlePageChange = (page) => {
    fetchWorkflows(page);
    setFocusedIndex(-1);
  };

  // Render grid item
  const renderGridItem = (workflow, index) => (
    <div
      key={workflow.id}
      className={`bg-gray-800 rounded-lg overflow-hidden transition-all duration-200 relative group ${
        selectedIds.includes(workflow.id) ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900' : 'border border-gray-700 hover:border-gray-600'
      } ${focusedIndex === index ? 'ring-2 ring-yellow-400' : ''}`}
      onMouseEnter={() => setHoveredId(workflow.id)}
      onMouseLeave={() => setHoveredId(null)}
      onClick={() => setFocusedIndex(index)}
    >
      <div className="absolute top-3 left-3 z-10">
        <input type="checkbox" checked={selectedIds.includes(workflow.id)} onChange={() => handleSelectWorkflow(workflow.id)} className="w-5 h-5 text-blue-600 bg-gray-900/80 border-2 border-gray-600 rounded cursor-pointer" onClick={e => e.stopPropagation()} />
      </div>
      {workflow.images?.length > 0 && (
        <div className="w-full h-48 bg-gray-900 overflow-hidden relative cursor-pointer" onClick={e => handleViewDetail(workflow.id, e)}>
          <img src={imageAPI.getImageUrl(workflow.images.find(i => i.is_thumbnail)?.id || workflow.images[0].id)} alt={workflow.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" onError={e => { e.target.style.display = 'none'; }} />
          {hoveredId === workflow.id && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-sm">クリックで詳細</span>
            </div>
          )}
        </div>
      )}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-white truncate flex-1 cursor-pointer hover:text-blue-400" onClick={e => handleViewDetail(workflow.id, e)}>{workflow.name}</h3>
          <button onClick={e => { e.stopPropagation(); handleToggleFavorite(workflow.id); }} className={`text-2xl transition-all ${workflow.favorite ? 'text-yellow-400 hover:scale-110' : 'text-gray-600 hover:text-yellow-400 hover:scale-110'}`}>★</button>
        </div>
        {workflow.description && <p className="text-sm text-gray-400 mb-4 line-clamp-2">{workflow.description}</p>}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span>{workflow.promptCount || 0} プロンプト</span>
          <span>{new Date(workflow.created_at).toLocaleDateString('ja-JP')}</span>
        </div>
        {workflow.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {workflow.tags.map(tag => <span key={tag.id} className="px-2 py-1 bg-blue-900/30 text-blue-300 text-xs rounded">{tag.name}</span>)}
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={e => handleViewDetail(workflow.id, e)} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded">詳細</button>
          <button onClick={e => { e.stopPropagation(); handleDelete(workflow.id, workflow.name); }} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded">削除</button>
        </div>
      </div>
    </div>
  );

  // Render list item
  const renderListItem = (workflow, index) => (
    <div
      key={workflow.id}
      className={`flex items-center gap-4 p-4 bg-gray-800 rounded-lg transition-all ${
        selectedIds.includes(workflow.id) ? 'ring-2 ring-blue-500' : 'border border-gray-700 hover:border-gray-600'
      } ${focusedIndex === index ? 'ring-2 ring-yellow-400' : ''}`}
      onClick={() => setFocusedIndex(index)}
    >
      <input type="checkbox" checked={selectedIds.includes(workflow.id)} onChange={() => handleSelectWorkflow(workflow.id)} className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded cursor-pointer" onClick={e => e.stopPropagation()} />
      {workflow.images?.length > 0 ? (
        <img src={imageAPI.getImageUrl(workflow.images[0].id)} alt="" className="w-20 h-20 object-cover rounded cursor-pointer" onClick={e => handleViewDetail(workflow.id, e)} />
      ) : (
        <div className="w-20 h-20 bg-gray-700 rounded flex items-center justify-center text-gray-500 text-xs">No Image</div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white truncate cursor-pointer hover:text-blue-400" onClick={e => handleViewDetail(workflow.id, e)}>{workflow.name}</h3>
          {workflow.favorite && <span className="text-yellow-400">★</span>}
        </div>
        {workflow.description && <p className="text-sm text-gray-400 truncate">{workflow.description}</p>}
        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
          <span>{workflow.promptCount || 0} プロンプト</span>
          <span>{new Date(workflow.created_at).toLocaleDateString('ja-JP')}</span>
          {workflow.tags?.map(tag => <span key={tag.id} className="px-2 py-0.5 bg-blue-900/30 text-blue-300 rounded">{tag.name}</span>)}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => handleToggleFavorite(workflow.id)} className={`p-2 rounded transition-colors ${workflow.favorite ? 'text-yellow-400 hover:bg-gray-700' : 'text-gray-500 hover:text-yellow-400 hover:bg-gray-700'}`}>★</button>
        <button onClick={e => handleViewDetail(workflow.id, e)} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded">詳細</button>
        <button onClick={() => handleDelete(workflow.id, workflow.name)} className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded">削除</button>
      </div>
    </div>
  );

  // Render compact item
  const renderCompactItem = (workflow, index) => (
    <div
      key={workflow.id}
      className={`flex items-center gap-3 px-3 py-2 rounded transition-all cursor-pointer ${
        selectedIds.includes(workflow.id) ? 'bg-blue-900/30' : 'hover:bg-gray-700'
      } ${focusedIndex === index ? 'ring-1 ring-yellow-400' : ''}`}
      onClick={() => setFocusedIndex(index)}
      onDoubleClick={e => handleViewDetail(workflow.id, e)}
    >
      <input type="checkbox" checked={selectedIds.includes(workflow.id)} onChange={() => handleSelectWorkflow(workflow.id)} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded cursor-pointer" onClick={e => e.stopPropagation()} />
      {workflow.favorite && <span className="text-yellow-400 text-sm">★</span>}
      <span className="flex-1 text-white truncate text-sm">{workflow.name}</span>
      <span className="text-xs text-gray-500">{workflow.promptCount || 0}p</span>
      <span className="text-xs text-gray-500 w-20">{new Date(workflow.created_at).toLocaleDateString('ja-JP')}</span>
    </div>
  );

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="h-5 bg-gray-700 rounded w-24 animate-pulse"></div>
        </div>
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <SkeletonRow key={i} />)}
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-center">
        <p className="text-red-400 font-semibold mb-2">エラーが発生しました</p>
        <p className="text-red-300 text-sm">{error}</p>
        <button onClick={() => fetchWorkflows(1)} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded">再試行</button>
      </div>
    );
  }

  if (workflows.length === 0) return <EmptyState />;

  return (
    <div ref={containerRef}>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center gap-4">
          <label className="flex items-center cursor-pointer hover:text-blue-400 transition-colors">
            <input type="checkbox" checked={selectedIds.length === workflows.length && workflows.length > 0} onChange={handleSelectAll} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded" />
            <span className="ml-2 text-sm text-gray-300">全選択</span>
          </label>
          {selectedIds.length > 0 && <span className="text-sm text-blue-400 font-semibold">{selectedIds.length}件選択中</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 mr-2">{pagination.total}件</span>
          <div className="flex bg-gray-700 rounded overflow-hidden">
            {[['grid', GridIcon], ['list', ListIcon], ['compact', CompactIcon]].map(([mode, Icon]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`p-2 transition-colors ${viewMode === mode ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-600'}`}
                title={`${mode === 'grid' ? 'グリッド' : mode === 'list' ? 'リスト' : 'コンパクト'}表示`}
              >
                <Icon />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Keyboard hint */}
      {focusedIndex >= 0 && (
        <div className="mb-2 text-xs text-gray-500 text-center">
          ↑↓←→ 移動 | Space 選択 | Enter 詳細 | Esc 解除
        </div>
      )}

      {/* Content */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((w, i) => renderGridItem(w, i))}
        </div>
      )}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {workflows.map((w, i) => renderListItem(w, i))}
        </div>
      )}
      {viewMode === 'compact' && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 divide-y divide-gray-700">
          {workflows.map((w, i) => renderCompactItem(w, i))}
        </div>
      )}

      {/* Pagination */}
      <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={handlePageChange} />

      {/* Detail Modal */}
      {selectedWorkflowId && (
        <WorkflowDetail workflowId={selectedWorkflowId} onClose={() => setSelectedWorkflowId(null)} onUpdate={() => fetchWorkflows(pagination.page)} />
      )}
    </div>
  );
}

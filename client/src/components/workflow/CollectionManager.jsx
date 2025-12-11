import { useState, useEffect } from 'react';
import { collectionAPI } from '../../services/collection.api';
import { useToast } from '../common/Toast';
import { useConfirm } from '../common/ConfirmDialog';

const COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#84CC16'
];

export default function CollectionManager({ selectedIds = [], onCollectionSelect, onRefresh }) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', color: '#3B82F6' });
  const [activeCollection, setActiveCollection] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const result = await collectionAPI.getAll();
      setCollections(result.data || []);
    } catch (err) {
      console.error('Failed to fetch collections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('コレクション名を入力してください');
      return;
    }
    try {
      await collectionAPI.create(formData);
      toast.success('コレクションを作成しました');
      setShowCreate(false);
      setFormData({ name: '', description: '', color: '#3B82F6' });
      fetchCollections();
    } catch (err) {
      toast.error('作成に失敗しました');
    }
  };

  const handleUpdate = async () => {
    if (!formData.name.trim()) {
      toast.error('コレクション名を入力してください');
      return;
    }
    try {
      await collectionAPI.update(editingId, formData);
      toast.success('コレクションを更新しました');
      setEditingId(null);
      setFormData({ name: '', description: '', color: '#3B82F6' });
      fetchCollections();
    } catch (err) {
      toast.error('更新に失敗しました');
    }
  };

  const handleDelete = async (id, name) => {
    const confirmed = await confirm({
      title: 'コレクションの削除',
      message: `"${name}" を削除しますか？ワークフローは削除されません。`,
      confirmLabel: '削除',
      type: 'danger',
    });
    if (!confirmed) return;

    try {
      await collectionAPI.delete(id);
      toast.success('コレクションを削除しました');
      if (activeCollection === id) {
        setActiveCollection(null);
        if (onCollectionSelect) onCollectionSelect(null);
      }
      fetchCollections();
    } catch (err) {
      toast.error('削除に失敗しました');
    }
  };

  const handleAddWorkflows = async (collectionId) => {
    if (selectedIds.length === 0) {
      toast.info('追加するワークフローを選択してください');
      return;
    }
    try {
      await collectionAPI.addWorkflows(collectionId, selectedIds);
      toast.success(`${selectedIds.length}件をコレクションに追加しました`);
      setShowAddMenu(false);
      fetchCollections();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error('追加に失敗しました');
    }
  };

  const handleSelectCollection = (id) => {
    const newActive = activeCollection === id ? null : id;
    setActiveCollection(newActive);
    if (onCollectionSelect) onCollectionSelect(newActive);
  };

  const startEdit = (collection) => {
    setEditingId(collection.id);
    setFormData({
      name: collection.name,
      description: collection.description || '',
      color: collection.color || '#3B82F6',
    });
    setShowCreate(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowCreate(false);
    setFormData({ name: '', description: '', color: '#3B82F6' });
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          コレクション
        </h3>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                追加 ({selectedIds.length})
              </button>
              {showAddMenu && collections.length > 0 && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-gray-700 border border-gray-600 rounded shadow-lg z-20">
                  {collections.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleAddWorkflows(c.id)}
                      className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-600 flex items-center gap-2"
                    >
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }}></span>
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => { setShowCreate(true); setEditingId(null); }}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            新規
          </button>
        </div>
      </div>

      {/* Create/Edit Form */}
      {(showCreate || editingId) && (
        <div className="p-4 border-b border-gray-700 bg-gray-900/50">
          <div className="space-y-3">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="コレクション名"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
              autoFocus
            />
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="説明（任意）"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
            />
            <div>
              <label className="block text-xs text-gray-400 mb-2">カラー</label>
              <div className="flex gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-6 h-6 rounded-full transition-transform ${formData.color === color ? 'ring-2 ring-white scale-110' : 'hover:scale-110'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={editingId ? handleUpdate : handleCreate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
              >
                {editingId ? '更新' : '作成'}
              </button>
              <button
                onClick={cancelEdit}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collection List */}
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-500 border-t-blue-500"></div>
          </div>
        ) : collections.length === 0 ? (
          <p className="text-center text-gray-500 py-4">コレクションがありません</p>
        ) : (
          <div className="space-y-2">
            {/* All workflows button */}
            <button
              onClick={() => handleSelectCollection(null)}
              className={`w-full px-3 py-2 rounded text-left flex items-center gap-3 transition-colors ${
                activeCollection === null ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-gray-700 text-gray-300'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span className="flex-1">すべてのワークフロー</span>
            </button>

            {/* Collections */}
            {collections.map((collection) => (
              <div
                key={collection.id}
                className={`group rounded transition-colors ${
                  activeCollection === collection.id ? 'bg-blue-600/20' : 'hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-2 px-3 py-2">
                  <button
                    onClick={() => handleSelectCollection(collection.id)}
                    className="flex-1 flex items-center gap-3 text-left"
                  >
                    <span
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: collection.color }}
                    ></span>
                    <span className={`flex-1 truncate ${activeCollection === collection.id ? 'text-blue-400' : 'text-gray-300'}`}>
                      {collection.name}
                    </span>
                    <span className="text-xs text-gray-500">{collection.workflow_count}</span>
                  </button>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(collection)}
                      className="p-1 text-gray-400 hover:text-white"
                      title="編集"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(collection.id, collection.name)}
                      className="p-1 text-gray-400 hover:text-red-400"
                      title="削除"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

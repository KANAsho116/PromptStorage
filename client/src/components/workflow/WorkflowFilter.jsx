import { useState, useEffect, useCallback } from 'react';
import { tagAPI } from '../../services/api';

export default function WorkflowFilter({ onFilterChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [favorite, setFavorite] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('DESC');
  const [availableTags, setAvailableTags] = useState([]);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const result = await tagAPI.getAll();
      setAvailableTags(result.data);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    }
  };

  // デバウンス付きフィルター適用
  const applyFilters = useCallback(() => {
    const filters = {
      q: searchQuery || undefined,
      tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
      favorite: favorite || undefined,
      sortBy,
      order,
    };
    onFilterChange(filters);
  }, [searchQuery, selectedTags, favorite, sortBy, order, onFilterChange]);

  // フィルター変更時に自動適用（デバウンス）
  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilters();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedTags, favorite, sortBy, order, applyFilters]);

  const handleReset = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setFavorite(false);
    setSortBy('created_at');
    setOrder('DESC');
  };

  const toggleTag = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">検索・フィルター</h3>
        <button
          onClick={handleReset}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          リセット
        </button>
      </div>

      {/* 検索バー */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">
          プロンプト検索
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="プロンプト内容で検索..."
            className="w-full px-4 py-2 pl-10 bg-gray-900 border border-gray-700 rounded text-white focus:border-blue-500 focus:outline-none transition-colors"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* タグフィルター */}
      {availableTags.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">
            タグで絞り込み
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1 rounded text-sm transition-all ${
                  selectedTags.includes(tag.id)
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {tag.name} ({tag.workflow_count || 0})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ソート・その他オプション */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            並び替え
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:border-blue-500 focus:outline-none transition-colors"
          >
            <option value="created_at">作成日</option>
            <option value="updated_at">更新日</option>
            <option value="name">名前</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">
            順序
          </label>
          <select
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:border-blue-500 focus:outline-none transition-colors"
          >
            <option value="DESC">降順</option>
            <option value="ASC">昇順</option>
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              checked={favorite}
              onChange={(e) => setFavorite(e.target.checked)}
              className="mr-2 w-4 h-4 rounded border-gray-600 bg-gray-700 text-yellow-500 focus:ring-yellow-500"
            />
            <span className="text-sm text-gray-300 group-hover:text-white transition-colors flex items-center gap-1">
              <span className={favorite ? 'text-yellow-400' : 'text-gray-500'}>★</span>
              お気に入りのみ
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
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

  const handleApplyFilter = () => {
    const filters = {
      q: searchQuery || undefined,
      tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
      favorite: favorite || undefined,
      sortBy,
      order,
    };

    onFilterChange(filters);
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setFavorite(false);
    setSortBy('created_at');
    setOrder('DESC');
    onFilterChange({});
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
      <h3 className="text-lg font-semibold mb-4">検索・フィルター</h3>

      {/* 検索バー */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">
          プロンプト検索
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="プロンプト内容で検索..."
          className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:border-blue-500 focus:outline-none"
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleApplyFilter();
          }}
        />
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
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  selectedTags.includes(tag.id)
                    ? 'bg-blue-600 text-white'
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            並び替え
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:border-blue-500 focus:outline-none"
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
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="DESC">降順</option>
            <option value="ASC">昇順</option>
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={favorite}
              onChange={(e) => setFavorite(e.target.checked)}
              className="mr-2 w-4 h-4"
            />
            <span className="text-sm text-gray-300">お気に入りのみ</span>
          </label>
        </div>
      </div>

      {/* ボタン */}
      <div className="flex gap-2">
        <button
          onClick={handleApplyFilter}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
        >
          フィルター適用
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
        >
          リセット
        </button>
      </div>
    </div>
  );
}

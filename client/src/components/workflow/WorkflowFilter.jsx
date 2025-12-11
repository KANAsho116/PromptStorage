import { useState, useEffect, useCallback } from 'react';
import { tagAPI } from '../../services/api';
import { useToast } from '../common/Toast';

const PRESET_STORAGE_KEY = 'filterPresets';

export default function WorkflowFilter({ onFilterChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [favorite, setFavorite] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('DESC');
  const [availableTags, setAvailableTags] = useState([]);

  // Advanced filters (metadata)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [modelName, setModelName] = useState('');
  const [seedValue, setSeedValue] = useState('');
  const [minWidth, setMinWidth] = useState('');
  const [minHeight, setMinHeight] = useState('');

  // Presets
  const [presets, setPresets] = useState([]);
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const toast = useToast();

  useEffect(() => {
    fetchTags();
    loadPresets();
  }, []);

  const fetchTags = async () => {
    try {
      const result = await tagAPI.getAll();
      setAvailableTags(result.data);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    }
  };

  const loadPresets = () => {
    try {
      const saved = localStorage.getItem(PRESET_STORAGE_KEY);
      if (saved) setPresets(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load presets:', e);
    }
  };

  const savePresets = (newPresets) => {
    setPresets(newPresets);
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(newPresets));
  };

  const getCurrentFilters = () => ({
    q: searchQuery || undefined,
    tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
    favorite: favorite || undefined,
    sortBy,
    order,
    model: modelName || undefined,
    seed: seedValue || undefined,
    minWidth: minWidth || undefined,
    minHeight: minHeight || undefined,
  });

  const applyFilters = useCallback(() => {
    onFilterChange(getCurrentFilters());
  }, [searchQuery, selectedTags, favorite, sortBy, order, modelName, seedValue, minWidth, minHeight, onFilterChange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilters();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedTags, favorite, sortBy, order, modelName, seedValue, minWidth, minHeight, applyFilters]);

  const handleReset = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setFavorite(false);
    setSortBy('created_at');
    setOrder('DESC');
    setModelName('');
    setSeedValue('');
    setMinWidth('');
    setMinHeight('');
  };

  const toggleTag = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      toast.error('プリセット名を入力してください');
      return;
    }
    const preset = {
      id: Date.now(),
      name: newPresetName.trim(),
      filters: {
        searchQuery,
        selectedTags,
        favorite,
        sortBy,
        order,
        modelName,
        seedValue,
        minWidth,
        minHeight,
      },
    };
    savePresets([...presets, preset]);
    setNewPresetName('');
    setShowPresetMenu(false);
    toast.success(`プリセット "${preset.name}" を保存しました`);
  };

  const handleLoadPreset = (preset) => {
    const f = preset.filters;
    setSearchQuery(f.searchQuery || '');
    setSelectedTags(f.selectedTags || []);
    setFavorite(f.favorite || false);
    setSortBy(f.sortBy || 'created_at');
    setOrder(f.order || 'DESC');
    setModelName(f.modelName || '');
    setSeedValue(f.seedValue || '');
    setMinWidth(f.minWidth || '');
    setMinHeight(f.minHeight || '');
    if (f.modelName || f.seedValue || f.minWidth || f.minHeight) {
      setShowAdvanced(true);
    }
    setShowPresetMenu(false);
    toast.info(`プリセット "${preset.name}" を適用しました`);
  };

  const handleDeletePreset = (id, e) => {
    e.stopPropagation();
    savePresets(presets.filter(p => p.id !== id));
    toast.success('プリセットを削除しました');
  };

  const hasAdvancedFilters = modelName || seedValue || minWidth || minHeight;

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">検索・フィルター</h3>
        <div className="flex items-center gap-2">
          {/* Preset button */}
          <div className="relative">
            <button
              onClick={() => setShowPresetMenu(!showPresetMenu)}
              className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              プリセット
              {presets.length > 0 && (
                <span className="bg-blue-600 text-white text-xs px-1.5 rounded-full">{presets.length}</span>
              )}
            </button>
            {showPresetMenu && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-gray-700 border border-gray-600 rounded-lg shadow-xl z-20">
                <div className="p-3 border-b border-gray-600">
                  <p className="text-xs text-gray-400 mb-2">現在のフィルターを保存</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      placeholder="プリセット名"
                      className="flex-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                    />
                    <button
                      onClick={handleSavePreset}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                    >
                      保存
                    </button>
                  </div>
                </div>
                {presets.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto">
                    {presets.map((preset) => (
                      <div
                        key={preset.id}
                        onClick={() => handleLoadPreset(preset)}
                        className="flex items-center justify-between px-3 py-2 hover:bg-gray-600 cursor-pointer group"
                      >
                        <span className="text-sm text-gray-300">{preset.name}</span>
                        <button
                          onClick={(e) => handleDeletePreset(preset.id, e)}
                          className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="px-3 py-4 text-sm text-gray-500 text-center">保存されたプリセットがありません</p>
                )}
              </div>
            )}
          </div>
          <button onClick={handleReset} className="text-sm text-gray-400 hover:text-white transition-colors">
            リセット
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">プロンプト検索</label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="プロンプト内容で検索..."
            className="w-full px-4 py-2 pl-10 bg-gray-900 border border-gray-700 rounded text-white focus:border-blue-500 focus:outline-none"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Advanced filters toggle */}
      <div className="mb-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`text-sm flex items-center gap-1 transition-colors ${hasAdvancedFilters ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
        >
          <svg className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          メタデータ検索
          {hasAdvancedFilters && <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded">有効</span>}
        </button>

        {showAdvanced && (
          <div className="mt-3 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">モデル名</label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="例: sd_xl_base"
                  className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Seed</label>
                <input
                  type="text"
                  value={seedValue}
                  onChange={(e) => setSeedValue(e.target.value)}
                  placeholder="例: 12345"
                  className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">最小幅</label>
                <input
                  type="number"
                  value={minWidth}
                  onChange={(e) => setMinWidth(e.target.value)}
                  placeholder="例: 1024"
                  className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">最小高さ</label>
                <input
                  type="number"
                  value={minHeight}
                  onChange={(e) => setMinHeight(e.target.value)}
                  placeholder="例: 1024"
                  className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tags */}
      {availableTags.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">タグで絞り込み</label>
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

      {/* Sort options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">並び替え</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:border-blue-500"
          >
            <option value="created_at">作成日</option>
            <option value="updated_at">更新日</option>
            <option value="name">名前</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">順序</label>
          <select
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:border-blue-500"
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
              className="mr-2 w-4 h-4 rounded border-gray-600 bg-gray-700 text-yellow-500"
            />
            <span className="text-sm text-gray-300 group-hover:text-white flex items-center gap-1">
              <span className={favorite ? 'text-yellow-400' : 'text-gray-500'}>★</span>
              お気に入りのみ
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { workflowAPI, imageAPI, tagAPI } from '../../services/api';
import { useToast } from '../common/Toast';
import { useConfirm } from '../common/ConfirmDialog';
import Lightbox from '../common/Lightbox';

export default function WorkflowDetail({ workflowId, onClose, onUpdate }) {
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPrompts, setExpandedPrompts] = useState({});
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Tag management
  const [allTags, setAllTags] = useState([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  // Image upload
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    const fetchWorkflowDetail = async () => {
      try {
        setLoading(true);
        const [workflowResult, tagsResult] = await Promise.all([
          workflowAPI.getById(workflowId),
          tagAPI.getAll()
        ]);
        setWorkflow(workflowResult.data);
        setAllTags(tagsResult.data || []);
        setEditName(workflowResult.data.name || '');
        setEditDescription(workflowResult.data.description || '');
        setError(null);
      } catch (err) {
        console.error('Failed to fetch workflow detail:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (workflowId) {
      fetchWorkflowDetail();
    }
  }, [workflowId]);

  const togglePrompt = (index) => {
    setExpandedPrompts(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const copyPrompt = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('プロンプトをコピーしました');
    } catch (err) {
      toast.error('コピーに失敗しました');
    }
  };

  const downloadJSON = () => {
    if (!workflow || !workflow.workflow_json) {
      toast.error('ワークフローJSONが見つかりません');
      return;
    }
    try {
      const json = typeof workflow.workflow_json === 'string'
        ? workflow.workflow_json
        : JSON.stringify(workflow.workflow_json, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (workflow.name || 'workflow') + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('JSONファイルをダウンロードしました');
    } catch (err) {
      toast.error('ダウンロードに失敗しました');
    }
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      toast.error('名前は必須です');
      return;
    }
    setSaving(true);
    try {
      await workflowAPI.update(workflowId, {
        name: editName.trim(),
        description: editDescription.trim(),
      });
      setWorkflow(prev => ({
        ...prev,
        name: editName.trim(),
        description: editDescription.trim(),
      }));
      setIsEditing(false);
      toast.success('保存しました');
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error('保存に失敗しました: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditName(workflow.name || '');
    setEditDescription(workflow.description || '');
    setIsEditing(false);
  };

  const handleAddTag = async (tagId) => {
    try {
      const currentTagIds = workflow.tags?.map(t => t.id) || [];
      await workflowAPI.update(workflowId, {
        tagIds: [...currentTagIds, tagId]
      });
      const tag = allTags.find(t => t.id === tagId);
      setWorkflow(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag]
      }));
      setShowTagDropdown(false);
      toast.success('タグを追加しました');
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error('タグの追加に失敗しました');
    }
  };

  const handleRemoveTag = async (tagId) => {
    try {
      const currentTagIds = workflow.tags?.map(t => t.id) || [];
      await workflowAPI.update(workflowId, {
        tagIds: currentTagIds.filter(id => id !== tagId)
      });
      setWorkflow(prev => ({
        ...prev,
        tags: prev.tags.filter(t => t.id !== tagId)
      }));
      toast.success('タグを削除しました');
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error('タグの削除に失敗しました');
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const result = await tagAPI.create({ name: newTagName.trim() });
      const newTag = result.data;
      setAllTags(prev => [...prev, newTag]);
      await handleAddTag(newTag.id);
      setNewTagName('');
    } catch (err) {
      toast.error('タグの作成に失敗しました');
    }
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const result = await imageAPI.uploadImages(workflowId, files);
      const newImages = result.data || [];
      setWorkflow(prev => ({
        ...prev,
        images: [...(prev.images || []), ...newImages]
      }));
      toast.success(`${files.length}件の画像をアップロードしました`);
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error('画像のアップロードに失敗しました');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteImage = async (imageId) => {
    const confirmed = await confirm({
      title: '画像の削除',
      message: 'この画像を削除しますか？',
      confirmLabel: '削除',
      type: 'danger',
    });
    if (!confirmed) return;

    try {
      await imageAPI.deleteImage(imageId);
      setWorkflow(prev => ({
        ...prev,
        images: prev.images.filter(img => img.id !== imageId)
      }));
      toast.success('画像を削除しました');
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error('画像の削除に失敗しました');
    }
  };

  const getPromptTypeColor = (type) => {
    switch (type) {
      case 'positive': return 'bg-green-900/30 border-green-500 text-green-300';
      case 'negative': return 'bg-red-900/30 border-red-500 text-red-300';
      default: return 'bg-gray-900/30 border-gray-500 text-gray-300';
    }
  };

  const getPromptTypeLabel = (type) => {
    switch (type) {
      case 'positive': return 'Positive';
      case 'negative': return 'Negative';
      default: return 'Unknown';
    }
  };

  const lightboxImages = workflow?.images?.map(img => ({
    id: img.id,
    url: imageAPI.getImageUrl(img.id),
    file_name: img.file_name,
  })) || [];

  const availableTags = allTags.filter(
    tag => !workflow?.tags?.some(t => t.id === tag.id)
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
        <div className="bg-gray-800 rounded-lg p-8 max-w-4xl w-full mx-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-500"></div>
            <p className="mt-4 text-gray-400">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
        <div className="bg-gray-800 rounded-lg p-8 max-w-4xl w-full mx-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
          <div className="text-center">
            <p className="text-red-400">{error || 'ワークフローが見つかりません'}</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors">閉じる</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-y-auto p-4 animate-fade-in" onClick={onClose}>
        <div className="bg-gray-800 rounded-lg max-w-4xl w-full my-8 animate-scale-in" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="border-b border-gray-700 p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-xl font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ワークフロー名"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="説明（任意）"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
                      >
                        {saving ? '保存中...' : '保存'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded transition-colors"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-white">{workflow.name}</h2>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
                        title="編集"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                    {workflow.description && (
                      <p className="text-gray-400 text-sm mt-2">{workflow.description}</p>
                    )}
                  </>
                )}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span>作成: {new Date(workflow.created_at).toLocaleString('ja-JP')}</span>
                  {workflow.category && <span className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded">{workflow.category}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={downloadJSON} className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors" title="JSONをダウンロード">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors" title="閉じる">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tags */}
            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-2">
                {workflow.tags?.map((tag) => (
                  <span key={tag.id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-900/30 text-blue-300 text-xs rounded">
                    {tag.name}
                    <button
                      onClick={() => handleRemoveTag(tag.id)}
                      className="hover:text-red-400 transition-colors"
                      title="タグを削除"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
                <div className="relative">
                  <button
                    onClick={() => setShowTagDropdown(!showTagDropdown)}
                    className="px-2 py-1 text-xs text-gray-400 hover:text-blue-400 border border-dashed border-gray-600 hover:border-blue-400 rounded transition-colors"
                  >
                    + タグ追加
                  </button>
                  {showTagDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-gray-700 border border-gray-600 rounded shadow-lg z-10">
                      <div className="p-2 border-b border-gray-600">
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            placeholder="新規タグ"
                            className="flex-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs"
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                          />
                          <button
                            onClick={handleCreateTag}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                          >
                            作成
                          </button>
                        </div>
                      </div>
                      <div className="max-h-32 overflow-y-auto">
                        {availableTags.length > 0 ? (
                          availableTags.map((tag) => (
                            <button
                              key={tag.id}
                              onClick={() => handleAddTag(tag.id)}
                              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-600 transition-colors"
                            >
                              {tag.name}
                            </button>
                          ))
                        ) : (
                          <p className="px-3 py-2 text-xs text-gray-500">利用可能なタグがありません</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="border-b border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                生成画像 ({workflow.images?.length || 0})
                <span className="text-sm font-normal text-gray-400 ml-2">クリックで拡大</span>
              </h3>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {uploading ? 'アップロード中...' : '画像を追加'}
                </button>
              </div>
            </div>
            {workflow.images && workflow.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {workflow.images.map((img, index) => (
                  <div key={img.id} className="relative aspect-square bg-gray-900 rounded overflow-hidden group">
                    <img
                      src={imageAPI.getImageUrl(img.id)}
                      alt={img.file_name}
                      className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                      onClick={() => setLightboxIndex(index)}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center pointer-events-none">
                      <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                      </svg>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteImage(img.id); }}
                      className="absolute top-2 right-2 p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="画像を削除"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>画像がありません</p>
                <p className="text-sm mt-1">上のボタンから画像を追加できます</p>
              </div>
            )}
          </div>

          {/* Prompts */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">プロンプト ({workflow.prompts?.length || 0}件)</h3>
            {workflow.prompts && workflow.prompts.length > 0 ? (
              <div className="space-y-3">
                {workflow.prompts.map((prompt, index) => {
                  const isExpanded = expandedPrompts[index];
                  const textPreview = prompt.prompt_text.length > 150
                    ? prompt.prompt_text.substring(0, 150) + '...'
                    : prompt.prompt_text;
                  return (
                    <div key={index} className={`border rounded-lg p-4 transition-all ${getPromptTypeColor(prompt.prompt_type)}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-black/20 rounded text-xs font-semibold">{getPromptTypeLabel(prompt.prompt_type)}</span>
                          <span className="text-xs text-gray-400">{prompt.node_type} (Node {prompt.node_id})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => copyPrompt(prompt.prompt_text)} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-black/20 rounded transition-colors" title="コピー">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          {prompt.prompt_text.length > 150 && (
                            <button onClick={() => togglePrompt(index)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                              {isExpanded ? '折りたたむ' : '全て表示'}
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">{isExpanded ? prompt.prompt_text : textPreview}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">プロンプトが見つかりません</p>
            )}
          </div>

          {/* Metadata */}
          {workflow.metadata && Object.keys(workflow.metadata).length > 0 && (
            <div className="border-t border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">メタデータ</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {workflow.metadata.models && workflow.metadata.models.length > 0 && (
                  <div>
                    <span className="text-gray-400">モデル:</span>
                    <p className="text-white font-mono text-xs mt-1">{workflow.metadata.models[0].name}</p>
                  </div>
                )}
                {workflow.metadata.seed && (
                  <div>
                    <span className="text-gray-400">Seed:</span>
                    <p className="text-white font-mono">{workflow.metadata.seed}</p>
                  </div>
                )}
                {workflow.metadata.steps && (
                  <div>
                    <span className="text-gray-400">Steps:</span>
                    <p className="text-white font-mono">{workflow.metadata.steps}</p>
                  </div>
                )}
                {workflow.metadata.cfg && (
                  <div>
                    <span className="text-gray-400">CFG:</span>
                    <p className="text-white font-mono">{workflow.metadata.cfg}</p>
                  </div>
                )}
                {workflow.metadata.dimensions && (
                  <div>
                    <span className="text-gray-400">サイズ:</span>
                    <p className="text-white font-mono">{workflow.metadata.dimensions.width} × {workflow.metadata.dimensions.height}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-700 p-6 flex justify-end gap-3">
            <button onClick={downloadJSON} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              JSON
            </button>
            <button onClick={onClose} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors">閉じる</button>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && lightboxImages.length > 0 && (
        <Lightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}

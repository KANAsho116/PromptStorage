import { useState, useEffect } from 'react';
import { workflowAPI, imageAPI } from '../../services/api';

export default function WorkflowDetail({ workflowId, onClose }) {
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPrompts, setExpandedPrompts] = useState({});

  useEffect(() => {
    const fetchWorkflowDetail = async () => {
      try {
        setLoading(true);
        const result = await workflowAPI.getById(workflowId);
        setWorkflow(result.data);
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
    setExpandedPrompts(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getPromptTypeColor = (type) => {
    switch (type) {
      case 'positive':
        return 'bg-green-900/30 border-green-500 text-green-300';
      case 'negative':
        return 'bg-red-900/30 border-red-500 text-red-300';
      default:
        return 'bg-gray-900/30 border-gray-500 text-gray-300';
    }
  };

  const getPromptTypeLabel = (type) => {
    switch (type) {
      case 'positive':
        return 'Positive';
      case 'negative':
        return 'Negative';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-gray-800 rounded-lg p-8 max-w-4xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
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
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-gray-800 rounded-lg p-8 max-w-4xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
          <div className="text-center">
            <p className="text-red-400">{error || 'ワークフローが見つかりません'}</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors">
              閉じる
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-y-auto p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full my-8" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="border-b border-gray-700 p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">{workflow.name}</h2>
              {workflow.description && (
                <p className="text-gray-400 text-sm">{workflow.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span>作成: {new Date(workflow.created_at).toLocaleString('ja-JP')}</span>
                {workflow.category && <span className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded">{workflow.category}</span>}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-3xl leading-none transition-colors"
              title="閉じる"
            >
              ×
            </button>
          </div>
        </div>

        {/* Images */}
        {workflow.images && workflow.images.length > 0 && (
          <div className="border-b border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">生成画像</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {workflow.images.map((img) => (
                <div key={img.id} className="relative aspect-square bg-gray-900 rounded overflow-hidden">
                  <img
                    src={imageAPI.getImageUrl(img.id)}
                    alt={img.file_name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prompts */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            プロンプト ({workflow.prompts?.length || 0}件)
          </h3>

          {workflow.prompts && workflow.prompts.length > 0 ? (
            <div className="space-y-3">
              {workflow.prompts.map((prompt, index) => {
                const isExpanded = expandedPrompts[index];
                const textPreview = prompt.prompt_text.length > 150
                  ? prompt.prompt_text.substring(0, 150) + '...'
                  : prompt.prompt_text;

                return (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 transition-all ${getPromptTypeColor(prompt.prompt_type)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-black/20 rounded text-xs font-semibold">
                          {getPromptTypeLabel(prompt.prompt_type)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {prompt.node_type} (Node {prompt.node_id})
                        </span>
                      </div>
                      {prompt.prompt_text.length > 150 && (
                        <button
                          onClick={() => togglePrompt(index)}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {isExpanded ? '折りたたむ' : '全て表示'}
                        </button>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {isExpanded ? prompt.prompt_text : textPreview}
                    </p>
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
                  <p className="text-white font-mono">
                    {workflow.metadata.dimensions.width} × {workflow.metadata.dimensions.height}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-700 p-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

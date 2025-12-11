import { useState, useEffect, useMemo } from 'react';
import { workflowAPI, imageAPI } from '../../services/api';

// Simple diff algorithm - highlight differences
function diffStrings(str1, str2) {
  if (str1 === str2) return { same: true, text1: str1, text2: str2 };

  // Split by words for comparison
  const words1 = str1.split(/(\s+)/);
  const words2 = str2.split(/(\s+)/);

  const diff1 = [];
  const diff2 = [];

  const maxLen = Math.max(words1.length, words2.length);

  for (let i = 0; i < maxLen; i++) {
    const w1 = words1[i] || '';
    const w2 = words2[i] || '';

    if (w1 === w2) {
      diff1.push({ type: 'same', text: w1 });
      diff2.push({ type: 'same', text: w2 });
    } else {
      if (w1) diff1.push({ type: 'removed', text: w1 });
      if (w2) diff2.push({ type: 'added', text: w2 });
    }
  }

  return { same: false, diff1, diff2 };
}

// Render diff text
function DiffText({ diffs }) {
  return (
    <span>
      {diffs.map((d, i) => (
        <span
          key={i}
          className={
            d.type === 'removed' ? 'bg-red-900/50 text-red-300' :
            d.type === 'added' ? 'bg-green-900/50 text-green-300' :
            ''
          }
        >
          {d.text}
        </span>
      ))}
    </span>
  );
}

export default function WorkflowCompare({ workflowIds, onClose }) {
  const [workflows, setWorkflows] = useState([null, null]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('prompts');

  useEffect(() => {
    const fetchWorkflows = async () => {
      if (!workflowIds || workflowIds.length < 2) {
        setError('比較するワークフローを2つ選択してください');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [w1, w2] = await Promise.all([
          workflowAPI.getById(workflowIds[0]),
          workflowAPI.getById(workflowIds[1]),
        ]);
        setWorkflows([w1.data, w2.data]);
        setError(null);
      } catch (err) {
        setError('ワークフローの読み込みに失敗しました');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflows();
  }, [workflowIds]);

  // Compare prompts
  const promptComparison = useMemo(() => {
    if (!workflows[0] || !workflows[1]) return [];

    const prompts1 = workflows[0].prompts || [];
    const prompts2 = workflows[1].prompts || [];

    // Group by prompt type
    const types = new Set([
      ...prompts1.map(p => p.prompt_type),
      ...prompts2.map(p => p.prompt_type),
    ]);

    const result = [];
    for (const type of types) {
      const p1List = prompts1.filter(p => p.prompt_type === type);
      const p2List = prompts2.filter(p => p.prompt_type === type);

      const maxLen = Math.max(p1List.length, p2List.length);
      for (let i = 0; i < maxLen; i++) {
        const p1 = p1List[i];
        const p2 = p2List[i];

        const text1 = p1?.prompt_text || '';
        const text2 = p2?.prompt_text || '';

        const diff = diffStrings(text1, text2);

        result.push({
          type,
          nodeType1: p1?.node_type || '-',
          nodeType2: p2?.node_type || '-',
          text1,
          text2,
          diff,
        });
      }
    }

    return result;
  }, [workflows]);

  // Compare metadata
  const metadataComparison = useMemo(() => {
    if (!workflows[0] || !workflows[1]) return [];

    const meta1 = workflows[0].metadata || {};
    const meta2 = workflows[1].metadata || {};

    const allKeys = new Set([...Object.keys(meta1), ...Object.keys(meta2)]);

    return Array.from(allKeys).map(key => ({
      key,
      value1: meta1[key] !== undefined ? JSON.stringify(meta1[key]) : '-',
      value2: meta2[key] !== undefined ? JSON.stringify(meta2[key]) : '-',
      same: JSON.stringify(meta1[key]) === JSON.stringify(meta2[key]),
    }));
  }, [workflows]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded"
          >
            閉じる
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            ワークフロー比較
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Workflow titles */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-900/50 border-b border-gray-700">
          {workflows.map((w, idx) => (
            <div key={idx} className="flex items-center gap-3">
              {w?.images?.[0] && (
                <img
                  src={imageAPI.getImageUrl(w.images[0].id)}
                  alt=""
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <div>
                <h3 className="font-semibold text-white">{w?.name || '不明'}</h3>
                <p className="text-xs text-gray-500">
                  {w?.created_at ? new Date(w.created_at).toLocaleDateString('ja-JP') : ''}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('prompts')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'prompts'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            プロンプト ({promptComparison.length})
          </button>
          <button
            onClick={() => setActiveTab('metadata')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'metadata'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            メタデータ ({metadataComparison.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'prompts' && (
            <div className="space-y-4">
              {promptComparison.length === 0 ? (
                <p className="text-center text-gray-500 py-8">プロンプトがありません</p>
              ) : (
                promptComparison.map((item, idx) => (
                  <div key={idx} className="bg-gray-900/50 rounded-lg overflow-hidden">
                    {/* Prompt type header */}
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-700/50 border-b border-gray-700">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.type === 'positive' ? 'bg-green-900/50 text-green-300' :
                        item.type === 'negative' ? 'bg-red-900/50 text-red-300' :
                        'bg-gray-600 text-gray-300'
                      }`}>
                        {item.type}
                      </span>
                      <span className={`text-xs ${item.diff.same ? 'text-green-400' : 'text-yellow-400'}`}>
                        {item.diff.same ? '✓ 一致' : '≠ 差異あり'}
                      </span>
                    </div>

                    {/* Side by side comparison */}
                    <div className="grid grid-cols-2 divide-x divide-gray-700">
                      <div className="p-4">
                        <div className="text-xs text-gray-500 mb-2">{item.nodeType1}</div>
                        <div className="text-sm text-gray-300 whitespace-pre-wrap">
                          {item.diff.same ? (
                            item.text1 || <span className="text-gray-500 italic">なし</span>
                          ) : (
                            item.text1 ? <DiffText diffs={item.diff.diff1} /> : <span className="text-gray-500 italic">なし</span>
                          )}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="text-xs text-gray-500 mb-2">{item.nodeType2}</div>
                        <div className="text-sm text-gray-300 whitespace-pre-wrap">
                          {item.diff.same ? (
                            item.text2 || <span className="text-gray-500 italic">なし</span>
                          ) : (
                            item.text2 ? <DiffText diffs={item.diff.diff2} /> : <span className="text-gray-500 italic">なし</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'metadata' && (
            <div className="bg-gray-900/50 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-700/50 text-left text-sm text-gray-400">
                    <th className="px-4 py-3 font-medium">キー</th>
                    <th className="px-4 py-3 font-medium">{workflows[0]?.name || 'ワークフロー1'}</th>
                    <th className="px-4 py-3 font-medium">{workflows[1]?.name || 'ワークフロー2'}</th>
                    <th className="px-4 py-3 font-medium w-20">状態</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {metadataComparison.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                        メタデータがありません
                      </td>
                    </tr>
                  ) : (
                    metadataComparison.map((item, idx) => (
                      <tr key={idx} className={item.same ? '' : 'bg-yellow-900/10'}>
                        <td className="px-4 py-3 font-medium text-gray-300">{item.key}</td>
                        <td className="px-4 py-3 text-sm text-gray-400 font-mono break-all">
                          {item.value1}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400 font-mono break-all">
                          {item.value2}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.same ? (
                            <span className="text-green-400">✓</span>
                          ) : (
                            <span className="text-yellow-400">≠</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-700 bg-gray-900/50">
          <div className="text-sm text-gray-500">
            <span className="inline-block w-3 h-3 bg-green-900/50 rounded mr-1"></span>追加
            <span className="inline-block w-3 h-3 bg-red-900/50 rounded ml-3 mr-1"></span>削除
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

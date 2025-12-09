import { useState } from 'react';
import { workflowAPI } from '../../services/api';

export default function BulkActions({ selectedIds, onActionComplete }) {
  const [loading, setLoading] = useState(false);

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      alert('削除するワークフローを選択してください');
      return;
    }

    if (!confirm(`選択した${selectedIds.length}件のワークフローを削除しますか？\nこの操作は取り消せません。`)) {
      return;
    }

    setLoading(true);
    try {
      // 並列で削除
      await Promise.all(selectedIds.map(id => workflowAPI.delete(id)));
      alert(`${selectedIds.length}件のワークフローを削除しました`);
      if (onActionComplete) onActionComplete();
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('一括削除に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkFavorite = async (favorite) => {
    if (selectedIds.length === 0) {
      alert('ワークフローを選択してください');
      return;
    }

    setLoading(true);
    try {
      // お気に入りの更新は個別に実行
      for (const id of selectedIds) {
        await workflowAPI.update(id, { favorite });
      }
      alert(`${selectedIds.length}件のワークフローを${favorite ? 'お気に入りに追加' : 'お気に入りから削除'}しました`);
      if (onActionComplete) onActionComplete();
    } catch (error) {
      console.error('Bulk favorite error:', error);
      alert('一括更新に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-4 z-50">
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-300">
          {selectedIds.length}件選択中
        </span>

        <div className="h-6 w-px bg-gray-700"></div>

        <button
          onClick={() => handleBulkFavorite(true)}
          disabled={loading}
          className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors flex items-center gap-2"
        >
          <span>★</span>
          <span>お気に入りに追加</span>
        </button>

        <button
          onClick={() => handleBulkFavorite(false)}
          disabled={loading}
          className="px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors flex items-center gap-2"
        >
          <span>☆</span>
          <span>お気に入り解除</span>
        </button>

        <button
          onClick={handleBulkDelete}
          disabled={loading}
          className="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
        >
          {loading ? '処理中...' : '一括削除'}
        </button>
      </div>
    </div>
  );
}

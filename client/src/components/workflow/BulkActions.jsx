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
    <div className='fixed bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 md:w-auto bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-3 md:p-4 z-50 max-w-full'>
      <div className='flex flex-wrap items-center justify-center gap-2 md:gap-4'>
        <span className='text-xs md:text-sm text-gray-300 font-semibold'>
          {selectedIds.length}件選択中
        </span>

        <div className='hidden md:block h-6 w-px bg-gray-700'></div>

        <button
          onClick={() => handleBulkFavorite(true)}
          disabled={loading}
          className='px-2 md:px-3 py-1.5 md:py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white text-xs md:text-sm rounded transition-colors flex items-center gap-1 md:gap-2'
        >
          <span>★</span>
          <span className='hidden sm:inline'>お気に入りに追加</span>
          <span className='sm:hidden'>追加</span>
        </button>

        <button
          onClick={() => handleBulkFavorite(false)}
          disabled={loading}
          className='px-2 md:px-3 py-1.5 md:py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 text-white text-xs md:text-sm rounded transition-colors flex items-center gap-1 md:gap-2'
        >
          <span>☆</span>
          <span className='hidden sm:inline'>お気に入り解除</span>
          <span className='sm:hidden'>解除</span>
        </button>

        <button
          onClick={handleBulkDelete}
          disabled={loading}
          className='px-2 md:px-3 py-1.5 md:py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white text-xs md:text-sm rounded transition-colors'
        >
          {loading ? '処理中...' : '一括削除'}
        </button>
      </div>
    </div>
  );
}

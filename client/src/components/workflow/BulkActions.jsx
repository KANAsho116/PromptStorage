import { useState } from 'react';
import { workflowAPI } from '../../services/api';
import { useToast } from '../common/Toast';
import { useConfirm } from '../common/ConfirmDialog';

export default function BulkActions({ selectedIds, onActionComplete, onCompare }) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.info('削除するワークフローを選択してください');
      return;
    }

    const confirmed = await confirm({
      title: '一括削除の確認',
      message: `選択した${selectedIds.length}件のワークフローを削除しますか？この操作は取り消せません。`,
      confirmLabel: '削除',
      cancelLabel: 'キャンセル',
      type: 'danger',
    });

    if (!confirmed) return;

    setLoading(true);
    try {
      await Promise.all(selectedIds.map(id => workflowAPI.delete(id)));
      toast.success(`${selectedIds.length}件のワークフローを削除しました`);
      if (onActionComplete) onActionComplete();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('一括削除に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkFavorite = async (favorite) => {
    if (selectedIds.length === 0) {
      toast.info('ワークフローを選択してください');
      return;
    }

    setLoading(true);
    try {
      for (const id of selectedIds) {
        await workflowAPI.update(id, { favorite });
      }
      toast.success(`${selectedIds.length}件のワークフローを${favorite ? 'お気に入りに追加' : 'お気に入りから削除'}しました`);
      if (onActionComplete) onActionComplete();
    } catch (error) {
      console.error('Bulk favorite error:', error);
      toast.error('一括更新に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = () => {
    if (selectedIds.length !== 2) {
      toast.info('比較するには2つのワークフローを選択してください');
      return;
    }
    if (onCompare) onCompare(selectedIds);
  };

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <div className='fixed bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 md:w-auto bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-3 md:p-4 z-40 max-w-full'>
      <div className='flex flex-wrap items-center justify-center gap-2 md:gap-4'>
        <span className='text-xs md:text-sm text-gray-300 font-semibold'>
          {selectedIds.length}件選択中
        </span>

        <div className='hidden md:block h-6 w-px bg-gray-700'></div>

        {/* Compare button - only enabled when exactly 2 selected */}
        <button
          onClick={handleCompare}
          disabled={loading || selectedIds.length !== 2}
          className={`px-2 md:px-3 py-1.5 md:py-2 text-white text-xs md:text-sm rounded transition-colors flex items-center gap-1 md:gap-2 ${
            selectedIds.length === 2
              ? 'bg-purple-600 hover:bg-purple-700'
              : 'bg-gray-600 cursor-not-allowed opacity-50'
          }`}
          title={selectedIds.length !== 2 ? '2つ選択すると比較できます' : 'プロンプトを比較'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className='hidden sm:inline'>比較</span>
        </button>

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

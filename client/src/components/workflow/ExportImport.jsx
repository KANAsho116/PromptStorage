import { useState } from 'react';
import { exportAPI, importAPI } from '../../services/export-import.api.js';

export default function ExportImport({ selectedIds = [], onImportSuccess }) {
  const [importing, setImporting] = useState(false);
  const [duplicateAction, setDuplicateAction] = useState('rename');

  const handleExportJSON = async () => {
    if (selectedIds.length === 0) {
      alert('エクスポートするワークフローを選択してください');
      return;
    }

    try {
      await exportAPI.exportJSON(selectedIds);
    } catch (error) {
      console.error('Export failed:', error);
      alert('エクスポートに失敗しました');
    }
  };

  const handleExportZIP = async () => {
    if (selectedIds.length === 0) {
      alert('エクスポートするワークフローを選択してください');
      return;
    }

    try {
      await exportAPI.exportZIP(selectedIds);
    } catch (error) {
      console.error('Export failed:', error);
      alert('エクスポートに失敗しました');
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);

    try {
      const result = await importAPI.import(file, duplicateAction);

      if (result.success) {
        const { success, skipped, errors } = result.data;

        let message = `インポート完了:\n`;
        message += `成功: ${success.length}件\n`;

        if (skipped.length > 0) {
          message += `スキップ: ${skipped.length}件\n`;
        }

        if (errors.length > 0) {
          message += `エラー: ${errors.length}件\n`;
          errors.forEach(err => {
            message += `  - ${err.name}: ${err.error}\n`;
          });
        }

        alert(message);

        // インポート成功時のコールバック
        if (onImportSuccess) {
          onImportSuccess();
        }
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert(`インポートに失敗しました: ${error.message}`);
    } finally {
      setImporting(false);
      // ファイル入力をリセット
      event.target.value = '';
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4 bg-gray-800 border-b border-gray-700">
      {/* エクスポートセクション */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs md:text-sm text-gray-400 font-semibold">エクスポート:</span>
        <button
          onClick={handleExportJSON}
          disabled={selectedIds.length === 0}
          className="px-2 md:px-3 py-1 md:py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-xs md:text-sm transition-colors"
        >
          JSON
        </button>
        <button
          onClick={handleExportZIP}
          disabled={selectedIds.length === 0}
          className="px-2 md:px-3 py-1 md:py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-xs md:text-sm transition-colors"
        >
          <span className="hidden sm:inline">ZIP (画像含む)</span>
          <span className="sm:hidden">ZIP</span>
        </button>
        {selectedIds.length > 0 && (
          <span className="text-xs text-blue-400">({selectedIds.length}件)</span>
        )}
      </div>

      {/* 区切り */}
      <div className="hidden md:block h-6 w-px bg-gray-700"></div>
      <div className="md:hidden h-px w-full bg-gray-700"></div>

      {/* インポートセクション */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs md:text-sm text-gray-400 font-semibold">インポート:</span>

        {/* 重複時の処理選択 */}
        <select
          value={duplicateAction}
          onChange={(e) => setDuplicateAction(e.target.value)}
          className="px-2 py-1 md:py-1.5 bg-gray-700 text-white rounded text-xs md:text-sm border border-gray-600 focus:ring-2 focus:ring-blue-500"
        >
          <option value="rename">名前変更</option>
          <option value="skip">スキップ</option>
          <option value="overwrite">上書き</option>
        </select>

        {/* ファイル選択ボタン */}
        <label className="px-2 md:px-3 py-1 md:py-1.5 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer text-xs md:text-sm transition-colors">
          {importing ? 'インポート中...' : 'ファイル選択'}
          <input
            type="file"
            accept=".json,.zip"
            onChange={handleImport}
            disabled={importing}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}

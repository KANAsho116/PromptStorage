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
    <div className="flex items-center gap-4 p-4 bg-gray-800 border-b border-gray-700">
      {/* エクスポートセクション */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">エクスポート:</span>
        <button
          onClick={handleExportJSON}
          disabled={selectedIds.length === 0}
          className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-sm"
        >
          JSON
        </button>
        <button
          onClick={handleExportZIP}
          disabled={selectedIds.length === 0}
          className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-sm"
        >
          ZIP (画像含む)
        </button>
        {selectedIds.length > 0 && (
          <span className="text-xs text-gray-500">({selectedIds.length}件選択中)</span>
        )}
      </div>

      {/* 区切り */}
      <div className="h-6 w-px bg-gray-700"></div>

      {/* インポートセクション */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">インポート:</span>

        {/* 重複時の処理選択 */}
        <select
          value={duplicateAction}
          onChange={(e) => setDuplicateAction(e.target.value)}
          className="px-2 py-1.5 bg-gray-700 text-white rounded text-sm border border-gray-600"
        >
          <option value="rename">重複時: 名前変更</option>
          <option value="skip">重複時: スキップ</option>
          <option value="overwrite">重複時: 上書き</option>
        </select>

        {/* ファイル選択ボタン */}
        <label className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer text-sm">
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

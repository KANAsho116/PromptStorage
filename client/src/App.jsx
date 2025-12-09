import { useState } from 'react';
import WorkflowUpload from './components/workflow/WorkflowUpload';
import WorkflowList from './components/workflow/WorkflowList';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    // ワークフロー一覧を再読み込み
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* ヘッダー */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">PromptStorage</h1>
          <p className="text-gray-400 mt-1">ComfyUI Workflow Manager</p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        {/* アップロードセクション */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">ワークフローをアップロード</h2>
          <WorkflowUpload onSuccess={handleUploadSuccess} />
        </section>

        {/* 一覧セクション */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">保存されたワークフロー</h2>
          <WorkflowList refresh={refreshKey} />
        </section>
      </main>

      {/* フッター */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p>フェーズ2: コア機能実装完了</p>
        </div>
      </footer>
    </div>
  );
}

export default App;

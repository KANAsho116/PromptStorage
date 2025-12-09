import { useState } from 'react';
import WorkflowUpload from './components/workflow/WorkflowUpload';
import WorkflowList from './components/workflow/WorkflowList';
import WorkflowFilter from './components/workflow/WorkflowFilter';
import ExportImport from './components/workflow/ExportImport';
import BulkActions from './components/workflow/BulkActions';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleImportSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleSelectionChange = (ids) => {
    setSelectedIds(ids);
  };

  const handleBulkActionComplete = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">PromptStorage</h1>
          <p className="text-gray-400 mt-1">ComfyUI Workflow Manager</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">ワークフローをアップロード</h2>
          <WorkflowUpload onSuccess={handleUploadSuccess} />
        </section>

        <section className="mb-8">
          <ExportImport
            selectedIds={selectedIds}
            onImportSuccess={handleImportSuccess}
          />
        </section>

        <section className="mb-8">
          <WorkflowFilter onFilterChange={handleFilterChange} />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-6">保存されたワークフロー</h2>
          <WorkflowList
            refresh={refreshKey}
            filters={filters}
            onSelectionChange={handleSelectionChange}
          />
        </section>
      </main>

      <BulkActions
        selectedIds={selectedIds}
        onActionComplete={handleBulkActionComplete}
      />

      <footer className="bg-gray-800 border-t border-gray-700 mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p>フェーズ6: UI/UX改善（選択・一括操作）</p>
        </div>
      </footer>
    </div>
  );
}

export default App;

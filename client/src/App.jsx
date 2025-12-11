import { useState } from 'react';
import WorkflowUpload from './components/workflow/WorkflowUpload';
import WorkflowList from './components/workflow/WorkflowList';
import WorkflowFilter from './components/workflow/WorkflowFilter';
import ExportImport from './components/workflow/ExportImport';
import BulkActions from './components/workflow/BulkActions';
import CollectionManager from './components/workflow/CollectionManager';
import WorkflowCompare from './components/workflow/WorkflowCompare';
import { ToastProvider } from './components/common/Toast';
import { ConfirmProvider } from './components/common/ConfirmDialog';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeCollection, setActiveCollection] = useState(null);
  const [compareIds, setCompareIds] = useState(null);

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleFilterChange = (newFilters) => {
    setFilters({ ...newFilters, collectionId: activeCollection });
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

  const handleCollectionSelect = (collectionId) => {
    setActiveCollection(collectionId);
    setFilters((prev) => ({ ...prev, collectionId }));
  };

  const handleCollectionRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleCompare = (ids) => {
    setCompareIds(ids);
  };

  return (
    <ToastProvider>
      <ConfirmProvider>
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

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar - Collections */}
              <div className="lg:col-span-1">
                <CollectionManager
                  selectedIds={selectedIds}
                  onCollectionSelect={handleCollectionSelect}
                  onRefresh={handleCollectionRefresh}
                />
              </div>

              {/* Main content */}
              <div className="lg:col-span-3">
                <section className="mb-8">
                  <WorkflowFilter onFilterChange={handleFilterChange} />
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-6">
                    {activeCollection ? 'コレクション内のワークフロー' : '保存されたワークフロー'}
                  </h2>
                  <WorkflowList
                    refresh={refreshKey}
                    filters={filters}
                    onSelectionChange={handleSelectionChange}
                  />
                </section>
              </div>
            </div>
          </main>

          <BulkActions
            selectedIds={selectedIds}
            onActionComplete={handleBulkActionComplete}
            onCompare={handleCompare}
          />

          {/* Compare Modal */}
          {compareIds && (
            <WorkflowCompare
              workflowIds={compareIds}
              onClose={() => setCompareIds(null)}
            />
          )}

          <footer className="bg-gray-800 border-t border-gray-700 mt-16">
            <div className="container mx-auto px-4 py-6 text-center text-gray-500 text-sm">
              <p>フェーズ8: コレクション + 比較機能</p>
            </div>
          </footer>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;

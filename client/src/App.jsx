import { useState } from 'react';
import WorkflowUpload from './components/workflow/WorkflowUpload';
import WorkflowList from './components/workflow/WorkflowList';
import WorkflowFilter from './components/workflow/WorkflowFilter';
import ExportImport from './components/workflow/ExportImport';
import BulkActions from './components/workflow/BulkActions';
import CollectionManager from './components/workflow/CollectionManager';
import WorkflowCompare from './components/workflow/WorkflowCompare';
import StatsDashboard from './components/workflow/StatsDashboard';
import { ToastProvider } from './components/common/Toast';
import { ConfirmProvider } from './components/common/ConfirmDialog';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeCollection, setActiveCollection] = useState(null);
  const [compareIds, setCompareIds] = useState(null);
  const [showStats, setShowStats] = useState(false);

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
            <div className="container mx-auto px-4 py-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">PromptStorage</h1>
                <p className="text-gray-400 mt-1">ComfyUI Workflow Manager</p>
              </div>
              <button
                onClick={() => setShowStats(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                統計
              </button>
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

          {/* Stats Dashboard Modal */}
          {showStats && (
            <StatsDashboard onClose={() => setShowStats(false)} />
          )}

          <footer className="bg-gray-800 border-t border-gray-700 mt-16">
            <div className="container mx-auto px-4 py-6 text-center text-gray-500 text-sm">
              <p>フェーズ8: コレクション + 比較 + 統計</p>
            </div>
          </footer>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;

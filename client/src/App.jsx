import { useState, useEffect } from 'react';

function App() {
  const [serverStatus, setServerStatus] = useState('checking...');

  useEffect(() => {
    // サーバー接続テスト
    fetch('/api/test')
      .then(res => res.json())
      .then(data => {
        setServerStatus(data.success ? 'connected' : 'error');
      })
      .catch(() => {
        setServerStatus('disconnected');
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4">
            PromptStorage
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            ComfyUI Workflow Manager
          </p>
          <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Server Status:</span>
              <span className={`font-semibold ${
                serverStatus === 'connected' ? 'text-green-400' :
                serverStatus === 'disconnected' ? 'text-red-400' :
                'text-yellow-400'
              }`}>
                {serverStatus}
              </span>
            </div>
          </div>
          <p className="mt-8 text-gray-500">
            フェーズ1: 基盤構築完了
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;

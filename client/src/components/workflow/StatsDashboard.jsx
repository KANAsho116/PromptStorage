import { useState, useEffect } from 'react';
import { statsAPI } from '../../services/stats.api';

// Simple bar chart component
function BarChart({ data, label, colorClass = 'bg-blue-500' }) {
  if (!data || data.length === 0) return null;

  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <div className="space-y-2">
      {data.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="text-sm text-gray-400 w-24 truncate" title={item.name || item.model || item.type || item.sampler || item.range}>
            {item.name || item.model || item.type || item.sampler || item.range || '不明'}
          </span>
          <div className="flex-1 h-6 bg-gray-700 rounded overflow-hidden">
            <div
              className={`h-full ${item.color ? '' : colorClass} transition-all duration-300`}
              style={{
                width: `${(item.count / maxCount) * 100}%`,
                backgroundColor: item.color || undefined,
              }}
            />
          </div>
          <span className="text-sm text-gray-300 w-10 text-right">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

// Timeline chart component
function TimelineChart({ data }) {
  if (!data || data.length === 0) return null;

  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((item, idx) => (
        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-green-500 rounded-t transition-all duration-300 min-h-[4px]"
            style={{ height: `${(item.count / maxCount) * 100}%` }}
            title={`${item.month}: ${item.count}件`}
          />
          <span className="text-xs text-gray-500 rotate-45 origin-left transform whitespace-nowrap">
            {item.month?.slice(-2)}月
          </span>
        </div>
      ))}
    </div>
  );
}

// Stat card component
function StatCard({ title, value, icon, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
    green: 'bg-green-600/20 text-green-400 border-green-600/30',
    yellow: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
    purple: 'bg-purple-600/20 text-purple-400 border-purple-600/30',
    red: 'bg-red-600/20 text-red-400 border-red-600/30',
    gray: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
  };

  return (
    <div className={`rounded-lg border p-4 ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-80">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className="text-4xl opacity-50">{icon}</div>
      </div>
    </div>
  );
}

export default function StatsDashboard({ onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const result = await statsAPI.getStats();
        setStats(result.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
        setError('統計データの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded">
            閉じる
          </button>
        </div>
      </div>
    );
  }

  const { summary, modelUsage, tagDistribution, promptTypes, timeline, sizeDistribution, samplerUsage } = stats || {};

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            統計ダッシュボード
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <StatCard title="ワークフロー" value={summary?.totalWorkflows || 0} icon="📁" color="blue" />
            <StatCard title="プロンプト" value={summary?.totalPrompts || 0} icon="💬" color="green" />
            <StatCard title="画像" value={summary?.totalImages || 0} icon="🖼️" color="purple" />
            <StatCard title="タグ" value={summary?.totalTags || 0} icon="🏷️" color="yellow" />
            <StatCard title="お気に入り" value={summary?.favoriteCount || 0} icon="⭐" color="red" />
            <StatCard title="直近7日" value={summary?.recentActivity || 0} icon="📈" color="gray" />
          </div>

          {/* Charts grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Timeline */}
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-green-400">📊</span> 月別作成数
              </h3>
              {timeline && timeline.length > 0 ? (
                <TimelineChart data={timeline} />
              ) : (
                <p className="text-gray-500 text-center py-8">データがありません</p>
              )}
            </div>

            {/* Prompt types */}
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-blue-400">💬</span> プロンプトタイプ
              </h3>
              {promptTypes && promptTypes.length > 0 ? (
                <BarChart data={promptTypes} colorClass="bg-blue-500" />
              ) : (
                <p className="text-gray-500 text-center py-8">データがありません</p>
              )}
            </div>

            {/* Tag distribution */}
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-yellow-400">🏷️</span> タグ分布
              </h3>
              {tagDistribution && tagDistribution.length > 0 ? (
                <BarChart data={tagDistribution} colorClass="bg-yellow-500" />
              ) : (
                <p className="text-gray-500 text-center py-8">タグがありません</p>
              )}
            </div>

            {/* Model usage */}
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-purple-400">🤖</span> モデル使用状況
              </h3>
              {modelUsage && modelUsage.length > 0 ? (
                <BarChart data={modelUsage} colorClass="bg-purple-500" />
              ) : (
                <p className="text-gray-500 text-center py-8">モデルデータがありません</p>
              )}
            </div>

            {/* Sampler usage */}
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-cyan-400">⚙️</span> サンプラー使用状況
              </h3>
              {samplerUsage && samplerUsage.length > 0 ? (
                <BarChart data={samplerUsage} colorClass="bg-cyan-500" />
              ) : (
                <p className="text-gray-500 text-center py-8">サンプラーデータがありません</p>
              )}
            </div>

            {/* Size distribution */}
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-orange-400">📐</span> サイズ分布
              </h3>
              {sizeDistribution && sizeDistribution.length > 0 ? (
                <BarChart data={sizeDistribution} colorClass="bg-orange-500" />
              ) : (
                <p className="text-gray-500 text-center py-8">サイズデータがありません</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-700 bg-gray-900/50">
          <button onClick={onClose} className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded">
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

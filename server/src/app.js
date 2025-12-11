import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import db, { initializeDatabase } from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import {
  PORT,
  HOST,
  API_PREFIX,
  CORS_ORIGIN,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS
} from './config/constants.js';
import workflowRoutes from './routes/workflow.routes.js';
import imageRoutes from './routes/image.routes.js';
import tagRoutes from './routes/tag.routes.js';
import exportRoutes from './routes/export.routes.js';
import importRoutes from './routes/import.routes.js';
import collectionRoutes from './routes/collection.routes.js';

// 環境変数読み込み
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Expressアプリ初期化
const app = express();

// データベース初期化
initializeDatabase();

// ミドルウェア設定
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// レート制限
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.'
    }
  }
});
app.use(API_PREFIX, limiter);

// 静的ファイル提供（画像）
app.use('/uploads', express.static(path.join(__dirname, '../storage/images')));

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API ルート
app.use(`${API_PREFIX}/workflows`, workflowRoutes);
app.use(`${API_PREFIX}/images`, imageRoutes);
app.use(`${API_PREFIX}/tags`, tagRoutes);
app.use(`${API_PREFIX}/export`, exportRoutes);
app.use(`${API_PREFIX}/import`, importRoutes);
app.use(`${API_PREFIX}/collections`, collectionRoutes);

// テスト用エンドポイント
app.get(`${API_PREFIX}/test`, (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'API is working',
      api_prefix: API_PREFIX
    },
    timestamp: new Date().toISOString()
  });
});

// 404 ハンドラー
app.use(notFoundHandler);

// エラーハンドラー
app.use(errorHandler);

// サーバー起動
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running at http://${HOST}:${PORT}`);
  console.log(`📡 API available at http://${HOST}:${PORT}${API_PREFIX}`);
  console.log(`🗄️  Database connected`);
});

// グレースフルシャットダウン
process.on('SIGINT', () => {
  console.log('\n⏳ Shutting down gracefully...');
  db.close();
  process.exit(0);
});

export default app;

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../storage/database/prompts.db');

// データベースディレクトリが存在しない場合は作成
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// データベース接続
const db = new Database(DB_PATH, { verbose: console.log });

// WALモード有効化（パフォーマンス向上）
db.pragma('journal_mode = WAL');

/**
 * データベーススキーマの初期化
 */
export function initializeDatabase() {
  // workflows テーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      workflow_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      favorite BOOLEAN DEFAULT 0,
      category VARCHAR(100)
    );
  `);

  // prompts テーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS prompts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workflow_id INTEGER NOT NULL,
      node_id VARCHAR(50) NOT NULL,
      node_type VARCHAR(100),
      prompt_type VARCHAR(20),
      prompt_text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
    );
  `);

  // images テーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workflow_id INTEGER NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_size INTEGER,
      mime_type VARCHAR(50),
      width INTEGER,
      height INTEGER,
      is_thumbnail BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
    );
  `);

  // tags テーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL UNIQUE,
      color VARCHAR(7),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // workflow_tags 中間テーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_tags (
      workflow_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (workflow_id, tag_id),
      FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );
  `);

  // metadata テーブル
  db.exec(`
    CREATE TABLE IF NOT EXISTS metadata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workflow_id INTEGER NOT NULL,
      key VARCHAR(100) NOT NULL,
      value TEXT,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
    );
  `);

  // インデックス作成
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_workflows_name ON workflows(name);
    CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON workflows(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_workflows_favorite ON workflows(favorite);
    CREATE INDEX IF NOT EXISTS idx_workflows_category ON workflows(category);

    CREATE INDEX IF NOT EXISTS idx_prompts_workflow_id ON prompts(workflow_id);
    CREATE INDEX IF NOT EXISTS idx_prompts_type ON prompts(prompt_type);

    CREATE INDEX IF NOT EXISTS idx_images_workflow_id ON images(workflow_id);
    CREATE INDEX IF NOT EXISTS idx_images_thumbnail ON images(is_thumbnail);

    CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

    CREATE INDEX IF NOT EXISTS idx_workflow_tags_workflow ON workflow_tags(workflow_id);
    CREATE INDEX IF NOT EXISTS idx_workflow_tags_tag ON workflow_tags(tag_id);

    CREATE INDEX IF NOT EXISTS idx_metadata_workflow_id ON metadata(workflow_id);
    CREATE INDEX IF NOT EXISTS idx_metadata_key ON metadata(key);
  `);

  // FTS5 全文検索テーブル（promptsテーブル用）
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS prompts_fts USING fts5(
      prompt_text,
      content='prompts',
      content_rowid='id'
    );
  `);

  // FTS5テーブルへのトリガー（自動同期）
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS prompts_ai AFTER INSERT ON prompts BEGIN
      INSERT INTO prompts_fts(rowid, prompt_text) VALUES (new.id, new.prompt_text);
    END;
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS prompts_ad AFTER DELETE ON prompts BEGIN
      DELETE FROM prompts_fts WHERE rowid = old.id;
    END;
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS prompts_au AFTER UPDATE ON prompts BEGIN
      UPDATE prompts_fts SET prompt_text = new.prompt_text WHERE rowid = new.id;
    END;
  `);

  // updated_at 自動更新トリガー
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS workflows_update_timestamp
    AFTER UPDATE ON workflows
    FOR EACH ROW
    BEGIN
      UPDATE workflows SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);

  console.log('✅ Database initialized successfully');
}

export default db;

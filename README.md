# PromptStorage

ComfyUI ワークフロー管理アプリケーション - ワークフローJSON、プロンプト、生成画像を一元管理

![Phase](https://img.shields.io/badge/phase-6%20completed-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## 概要

PromptStorageは、ComfyUIで作成したワークフローを効率的に管理するためのWebアプリケーションです。ワークフローJSON、使用したプロンプト、生成された画像を保存・検索・整理できます。

## 主な機能

### ワークフロー管理
- ✅ **ドラッグ&ドロップアップロード** - ComfyUI ワークフローJSONを簡単アップロード
- ✅ **プロンプト自動抽出** - Positive/Negativeプロンプトを自動判定・抽出
- ✅ **画像管理** - 生成画像の保存とサムネイル自動生成（Sharp使用）
- ✅ **ワークフロー編集・削除** - 個別または一括で管理可能
- ✅ **お気に入り機能** - 重要なワークフローをマーク

### 検索・フィルター
- ✅ **全文検索** - プロンプト内容をFTS5で高速検索
- ✅ **タグフィルタリング** - 複数タグによる絞り込み
- ✅ **お気に入りフィルター** - お気に入りワークフローのみ表示
- ✅ **並び替え** - 作成日時、更新日時、名前でソート

### エクスポート/インポート
- ✅ **JSON形式エクスポート** - ワークフロー単体または複数を一括エクスポート
- ✅ **ZIP形式エクスポート** - 画像を含む完全バックアップ
- ✅ **柔軟なインポート** - 重複時の処理を選択可能
  - スキップ（既存を保持）
  - 名前変更（自動リネーム）
  - 上書き（既存を更新）
- ✅ **メタデータ保持** - タグ、カテゴリ、メタデータを完全保持

### 一括操作
- ✅ **複数選択** - チェックボックスで複数ワークフローを選択
- ✅ **一括削除** - 選択したワークフローをまとめて削除
- ✅ **一括お気に入り** - 選択したワークフローをまとめてお気に入り追加/解除
- ✅ **一括エクスポート** - 選択したワークフローをまとめてエクスポート

### UI/UX
- ✅ **レスポンシブデザイン** - モバイル/タブレット/デスクトップ対応
- ✅ **ダークテーマ** - 目に優しいダークモードUI
- ✅ **視覚的フィードバック** - 選択状態をリングで表示、ホバーエフェクト
- ✅ **エラーハンドリング** - 詳細なエラーメッセージとリトライ機能

## 技術スタック

### フロントエンド
- **React 18** - UIライブラリ
- **Vite** - 高速ビルドツール
- **Tailwind CSS** - ユーティリティファーストCSSフレームワーク
- **Axios** - HTTP クライアント

### バックエンド
- **Node.js** - サーバーランタイム
- **Express** - Webフレームワーク
- **SQLite (better-sqlite3)** - 軽量データベース
- **Sharp** - 画像処理ライブラリ
- **Archiver / adm-zip** - ZIP圧縮・解凍
- **Multer** - ファイルアップロード処理

### セキュリティ
- **Helmet** - HTTPセキュリティヘッダー
- **CORS** - クロスオリジンリソース共有
- **Rate Limiting** - レート制限

## セットアップ

### 必要要件
- Node.js 18以上
- npm または yarn

### インストール

\`\`\`bash
# リポジトリのクローン
git clone https://github.com/KANAsho116/PromptStorage.git
cd PromptStorage

# 全依存パッケージのインストール
npm run install:all
\`\`\`

### 開発サーバーの起動

\`\`\`bash
# サーバーとクライアントを同時起動（推奨）
npm run dev

# または個別に起動
npm run dev:server  # サーバーのみ
npm run dev:client  # クライアントのみ
\`\`\`

**アクセス:**
- クライアント: `http://localhost:5173`
- API: `http://localhost:3001/api`
- ヘルスチェック: `http://localhost:3001/health`

### 環境変数

#### サーバー (\`server/.env\`)
\`\`\`env
NODE_ENV=development
PORT=3001
HOST=localhost
DB_PATH=./storage/database/prompts.db
CORS_ORIGIN=http://localhost:5173
\`\`\`

#### クライアント (\`client/.env.development\`)
\`\`\`env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_MAX_UPLOAD_SIZE=52428800
\`\`\`

## 使い方

### 1. ワークフローのアップロード
1. ComfyUIからワークフローJSONをエクスポート
2. アプリのアップロードエリアにドラッグ&ドロップ
3. 画像ファイルも一緒にアップロード可能（最大10枚、50MB）

### 2. 検索・フィルター
- **全文検索**: プロンプト内容で検索
- **タグフィルター**: タグを選択して絞り込み
- **お気に入り**: お気に入りのみ表示
- **並び替え**: 作成日時、更新日時、名前でソート

### 3. エクスポート
1. エクスポートしたいワークフローを選択
2. 「JSON」または「ZIP（画像含む）」ボタンをクリック
3. ファイルが自動ダウンロード

### 4. インポート
1. 重複時の処理を選択（スキップ/名前変更/上書き）
2. 「ファイル選択」ボタンをクリック
3. JSON または ZIP ファイルを選択
4. インポート結果が表示される

## プロジェクト構造

\`\`\`
PromptStorage/
├── client/                    # React フロントエンド
│   ├── src/
│   │   ├── components/
│   │   │   └── workflow/      # ワークフロー関連コンポーネント
│   │   │       ├── WorkflowUpload.jsx
│   │   │       ├── WorkflowList.jsx
│   │   │       ├── WorkflowFilter.jsx
│   │   │       ├── ExportImport.jsx
│   │   │       └── BulkActions.jsx
│   │   ├── services/
│   │   │   ├── api.js         # API クライアント
│   │   │   └── export-import.api.js
│   │   └── App.jsx
│   └── package.json
├── server/                    # Node.js バックエンド
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js    # データベース初期化
│   │   ├── controllers/       # リクエストハンドラ
│   │   │   ├── workflow.controller.js
│   │   │   ├── tag.controller.js
│   │   │   ├── export.controller.js
│   │   │   └── import.controller.js
│   │   ├── models/            # データモデル
│   │   │   ├── workflow.model.js
│   │   │   ├── prompt.model.js
│   │   │   ├── image.model.js
│   │   │   ├── tag.model.js
│   │   │   └── metadata.model.js
│   │   ├── routes/            # APIルート
│   │   ├── services/          # ビジネスロジック
│   │   │   ├── parser.service.js     # ComfyUI JSON パーサー
│   │   │   ├── image.service.js      # 画像処理
│   │   │   ├── export.service.js
│   │   │   └── import.service.js
│   │   ├── middleware/        # ミドルウェア
│   │   │   └── upload.middleware.js
│   │   └── app.js             # エントリーポイント
│   ├── storage/
│   │   ├── database/          # SQLiteデータベース
│   │   └── uploads/           # アップロード画像
│   └── package.json
└── package.json               # ルートパッケージ
\`\`\`

## データベーススキーマ

### workflows
ワークフロー情報を格納
\`\`\`sql
- id: INTEGER PRIMARY KEY
- name: VARCHAR(255) UNIQUE
- description: TEXT
- workflow_json: TEXT
- created_at: DATETIME
- updated_at: DATETIME
- favorite: BOOLEAN
- category: VARCHAR(100)
\`\`\`

### prompts
プロンプトデータ（FTS5全文検索対応）
\`\`\`sql
- id: INTEGER PRIMARY KEY
- workflow_id: INTEGER
- node_id: VARCHAR(50)
- node_type: VARCHAR(100)
- prompt_type: VARCHAR(20)  # positive/negative/unknown
- prompt_text: TEXT
- created_at: DATETIME
\`\`\`

### images
画像メタデータ
\`\`\`sql
- id: INTEGER PRIMARY KEY
- workflow_id: INTEGER
- file_path: VARCHAR(500)
- file_name: VARCHAR(255)
- file_size: INTEGER
- mime_type: VARCHAR(50)
- width: INTEGER
- height: INTEGER
- is_thumbnail: BOOLEAN
- created_at: DATETIME
\`\`\`

### tags
タグマスター
\`\`\`sql
- id: INTEGER PRIMARY KEY
- name: VARCHAR(100) UNIQUE
- color: VARCHAR(7)
- created_at: DATETIME
\`\`\`

### workflow_tags
ワークフロー-タグ関連テーブル
\`\`\`sql
- workflow_id: INTEGER
- tag_id: INTEGER
- PRIMARY KEY (workflow_id, tag_id)
\`\`\`

### metadata
追加メタデータ
\`\`\`sql
- id: INTEGER PRIMARY KEY
- workflow_id: INTEGER
- key: VARCHAR(100)
- value: TEXT
\`\`\`

## API エンドポイント

### ヘルスチェック
- \`GET /health\` - サーバー状態確認

### ワークフロー管理
- \`POST /api/workflows\` - ワークフローアップロード（multipart/form-data）
- \`GET /api/workflows\` - 一覧取得（クエリパラメータでフィルター可能）
- \`GET /api/workflows/search\` - 全文検索
- \`GET /api/workflows/:id\` - 詳細取得
- \`PUT /api/workflows/:id\` - 更新
- \`PATCH /api/workflows/:id/favorite\` - お気に入り切り替え
- \`DELETE /api/workflows/:id\` - 削除

### タグ管理
- \`GET /api/tags\` - タグ一覧取得
- \`POST /api/tags\` - タグ作成
- \`DELETE /api/tags/:id\` - タグ削除

### エクスポート/インポート
- \`POST /api/export/json\` - JSON形式でエクスポート
- \`POST /api/export/zip\` - ZIP形式でエクスポート（画像含む）
- \`POST /api/import\` - インポート（multipart/form-data）

### 画像
- \`GET /api/images/:id\` - 画像取得

## 開発履歴

### ✅ フェーズ1: 基盤構築
- プロジェクト構造作成
- SQLiteデータベースセットアップ（FTS5対応）
- Express + React + Vite 環境構築
- Git リポジトリ初期化

### ✅ フェーズ2: コア機能実装
- ComfyUI JSONパーサー実装
- ワークフロー CRUD 操作
- プロンプト抽出ロジック
- クライアント側 API 通信

### ✅ フェーズ3: 画像管理
- Sharp による画像処理
- サムネイル自動生成
- Multer ファイルアップロード
- 画像表示機能

### ✅ フェーズ4: 検索・フィルター
- FTS5 全文検索実装
- タグ管理システム
- 複合フィルター機能
- ソート機能

### ✅ フェーズ5: エクスポート/インポート
- JSON エクスポート/インポート
- ZIP エクスポート/インポート（画像含む）
- 重複処理（skip/rename/overwrite）
- メタデータ保持機能

### ✅ フェーズ6: UI/UX改善
- ワークフロー選択機能
- 一括操作（削除、お気に入り、エクスポート）
- レスポンシブデザイン対応
- 視覚的フィードバック改善
- バグ修正（空のclassName修正）

## トラブルシューティング

### データベースエラー
\`\`\`bash
# データベースファイルを削除して再作成
cd server
rm -rf storage/database/prompts.db*
npm run dev
\`\`\`

### ポート競合
\`\`\`bash
# .envファイルでポート番号を変更
PORT=3002  # サーバー
VITE_PORT=5174  # クライアント（vite.config.jsで設定）
\`\`\`

### 画像が表示されない
- \`server/storage/uploads/\` ディレクトリの権限を確認
- 画像ファイルサイズが制限（50MB）を超えていないか確認

## 今後の改善案

- [ ] ユーザー認証機能
- [ ] ワークフロー共有機能
- [ ] プロンプト編集機能
- [ ] ワークフロー詳細ビュー
- [ ] キーボードショートカット
- [ ] ページネーション
- [ ] トースト通知システム
- [ ] Docker対応

## ライセンス

MIT

## 作成者

KANAsho116

---

**🤖 Generated with [Claude Code](https://claude.com/claude-code)**

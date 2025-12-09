# PromptStorage

ComfyUI ワークフロー管理アプリケーション - ワークフローJSON、プロンプト、生成画像を一元管理

## 概要

PromptStorageは、ComfyUIで作成したワークフローを効率的に管理するためのWebアプリケーションです。ワークフローJSON、使用したプロンプト、生成された画像を保存・検索・整理できます。

## 主な機能

- ✅ ComfyUI ワークフローJSONのアップロード
- ✅ プロンプトの自動抽出（positive/negative判定）
- ✅ 生成画像の保存と管理
- 🔄 ワークフロー検索・フィルター（タグ、日付、カテゴリ）
- 🔄 全文検索（プロンプト内容）
- 🔄 エクスポート/インポート（JSON/ZIP）
- 🔄 お気に入り・タグ管理

## 技術スタック

### フロントエンド
- React 18
- Vite
- Tailwind CSS
- React Query
- Axios

### バックエンド
- Node.js
- Express
- SQLite (better-sqlite3)
- Sharp (画像処理)

## セットアップ

### 必要要件
- Node.js 18+
- npm または yarn

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/KANAsho116/PromptStorage.git
cd PromptStorage

# 全依存パッケージのインストール
npm run install:all
```

### 開発サーバーの起動

```bash
# サーバーとクライアントを同時起動
npm run dev

# または個別に起動
npm run dev:server  # サーバーのみ (http://localhost:3001)
npm run dev:client  # クライアントのみ (http://localhost:5173)
```

### 環境変数

#### サーバー (`server/.env`)
```env
NODE_ENV=development
PORT=3001
HOST=localhost
DB_PATH=./storage/database/prompts.db
CORS_ORIGIN=http://localhost:5173
```

#### クライアント (`client/.env.development`)
```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_MAX_UPLOAD_SIZE=52428800
```

## プロジェクト構造

```
PromptStorage/
├── client/              # React フロントエンド
│   ├── src/
│   │   ├── components/  # UIコンポーネント
│   │   ├── pages/       # ページコンポーネント
│   │   ├── hooks/       # カスタムフック
│   │   └── services/    # API通信
├── server/              # Node.js バックエンド
│   ├── src/
│   │   ├── config/      # 設定ファイル
│   │   ├── controllers/ # リクエストハンドラ
│   │   ├── models/      # データモデル
│   │   ├── routes/      # APIルート
│   │   └── services/    # ビジネスロジック
│   └── storage/
│       ├── database/    # SQLiteデータベース
│       └── images/      # アップロード画像
```

## データベーススキーマ

- **workflows** - ワークフロー情報
- **prompts** - プロンプトデータ（FTS5全文検索対応）
- **images** - 画像メタデータ
- **tags** - タグマスター
- **workflow_tags** - ワークフロー-タグ関連
- **metadata** - 追加メタデータ

## API エンドポイント

### ワークフロー管理
- `POST /api/workflows` - ワークフローアップロード
- `GET /api/workflows` - 一覧取得
- `GET /api/workflows/:id` - 詳細取得
- `PUT /api/workflows/:id` - 更新
- `DELETE /api/workflows/:id` - 削除

### 検索・フィルター
- `GET /api/workflows/search` - 全文検索
- `GET /api/workflows/filter` - 複合フィルター

### その他
- `GET /health` - ヘルスチェック
- `GET /api/test` - API動作確認

## 開発状況

- ✅ フェーズ1: 基盤構築（完了）
  - プロジェクト構造作成
  - データベースセットアップ
  - サーバー・クライアント基本設定
- 🔄 フェーズ2: コア機能実装（進行中）
- ⏳ フェーズ3: 画像管理
- ⏳ フェーズ4: 検索・フィルター
- ⏳ フェーズ5: エクスポート・インポート
- ⏳ フェーズ6: UI/UX改善
- ⏳ フェーズ7: 最適化

## ライセンス

MIT

## 作成者

KANAsho116

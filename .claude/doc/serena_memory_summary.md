# SHEIKEプロジェクト開発記録 - Serenaメモリまとめ

*生成日時: 2025-09-20*

## 1. プロジェクト概要

### 目的
顔特徴解析アプリケーションの概念実証（PoC）として以下の機能を提供：
- スマートフォンWebインターフェースによる顔画像の撮影・アップロード
- MediaPipe Face Landmarkerを使用した顔特徴点検出
- 黄金比計算に基づく特徴抽出
- 目・鼻・顎エリアの採点（0-100点）
- 分析結果に基づく美容施術カテゴリーの提案

### 対象ユーザー
- カメラアクセス対応のモバイルWebブラウザ
- 日本語UIを前提
- モバイルファーストのレスポンシブデザイン重視

### 主要機能
1. **画像入力**: カメラ撮影またはファイルアップロード（EXIF補正対応）
2. **特徴点検出**: MediaPipe Face Landmarker（468ポイント）
3. **特徴抽出**: 目の寸法、鼻幅、顎の測定値
4. **品質検証**: 顔角度（±15°）、明度閾値
5. **採点システム**: 目・鼻・顎カテゴリーの0-100点評価
6. **提案マッピング**: ルックアップテーブルによる施術提案

### 重要な考慮事項
- 顔生体認証データの処理 - プライバシーコンプライアンス必須
- デバイス上推論（サーバーサイドML処理なし）
- MediaPipe WASMに適切なCORSとセキュリティヘッダーが必要
- 黄金比ベースの特徴分析アルゴリズム

## 2. 技術スタック

### フロントエンドフレームワーク
- **Vite + React + TypeScript**: メイン開発スタック
- **状態管理**: React hooks（最小限の設定）
- **ビルドツール**: 高速開発と最適化ビルド用Vite

### 顔解析
- **MediaPipe Face Landmarker**: WASM/WebGLベースの特徴点検出
- **468ポイント特徴点**: 精密な顔測定用
- **デバイス上推論**: サーバーサイドML処理不要

### ストレージ & デプロイメント
- **IndexedDB**: PWA機能用ローカル履歴ストレージ
- **Vercel**: フロントエンドデプロイメント
- **Railway**: APIモックデプロイメント（必要に応じて）

### 開発ツール
- **TypeScript**: 90%カバレッジ要件の強力な型付け
- **ESLint**: TypeScriptサポート付きコードリンティング
- **Type Coverage**: 最低90%の型カバレッジ強制
- **TSD**: TypeScript定義テスト

### 現在の主要依存関係
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.0.0",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "tsd": "^0.29.0",
    "type-coverage": "^2.27.1",
    "typescript": "^5.0.0",
    "vite": "^4.4.0"
  }
}
```

## 3. プロジェクト構造

### 現在の実装状況: STEP1 完了

### ディレクトリ構成
```
SHEIKE/
├── .serena/                 # Serena MCP設定
├── src/
│   ├── lib/                 # コアビジネスロジックモジュール
│   │   ├── mediapipe.ts     # MediaPipe Face Landmarker統合
│   │   ├── metrics.ts       # 顔メトリクス計算（黄金比）
│   │   └── quality.ts       # 画像・顔品質検証
│   ├── types/               # TypeScript型定義
│   │   ├── mediapipe.ts     # MediaPipe型とインターフェース
│   │   ├── metrics.ts       # 顔解析型
│   │   └── quality.ts       # 品質検証型
│   └── ui/                  # Reactコンポーネント
│       ├── Capture.tsx      # カメラ撮影コンポーネント
│       └── DebugOverlay.tsx # 特徴点可視化コンポーネント
├── tests/
│   └── types/               # 型定義テスト（tsd）
│       ├── mediapipe.test-d.ts
│       ├── metrics.test-d.ts
│       └── quality.test-d.ts
├── tsconfig.json            # TypeScript厳格設定
├── .eslintrc.cjs           # 型対応ESLintルール
├── vite.config.ts          # MediaPipe対応Vite設定
├── package.json            # 依存関係とスクリプト
└── CLAUDE.md               # プロジェクト文書
```

### 実装済み機能（STEP1）

#### コアモジュール
1. **MediaPipe統合** (`src/lib/mediapipe.ts`)
   - 468ポイント顔特徴点検出
   - MediaPipe Face Landmarker用型安全ラッパー
   - GPU加速サポート
   - 特徴点抽出ユーティリティ

2. **顔メトリクス** (`src/lib/metrics.ts`)
   - 黄金比ベースの特徴分析
   - 目・鼻・顎メトリクス計算
   - 0-100採点システム: `100 × (1 - Σ w_i * d_i)`
   - 設定可能なベースライン範囲と重み係数

3. **品質検証** (`src/lib/quality.ts`)
   - 顔角度検証（±15°閾値）
   - 明度・コントラスト分析
   - ブラー検出と品質スコアリング
   - 日本語モバイル最適化推奨事項

#### UIコンポーネント
1. **撮影コンポーネント** (`src/ui/Capture.tsx`)
   - getUserMediaカメラ統合
   - モバイルファーストレスポンシブデザイン
   - リアルタイム品質フィードバック
   - 日本語インターフェース

2. **デバッグオーバーレイ** (`src/ui/DebugOverlay.tsx`)
   - 特徴点可視化
   - 品質メトリクス表示
   - 特徴分析オーバーレイ
   - マルチモード可視化（特徴点・特徴・品質・メトリクス）

#### 型安全インフラ
- exactOptionalPropertyTypes付き厳格TypeScript設定
- 全モジュール用包括的型定義
- 型カバレッジ≥90%要件
- TSDベース型テスト

### 開発基準の達成
- ✅ noUncheckedIndexedAccess付きTypeScript厳格モード
- ✅ 0警告付きESLint型対応ルール
- ✅ 型テストインフラ（tsd）
- ✅ モバイルファーストレスポンシブデザイン
- ✅ 日本語UI
- ✅ 非診断言語コンプライアンス
- ✅ プライバシー重視の顔データ処理
- ✅ デバイス上推論のみ

### 次のステップ（STEP2）
- 採点システムの改善
- 施術提案マッピング
- ゲージUIコンポーネント
- PWA機能（STEP3）

## 4. 開発規約とスタイル

### TypeScript設定
- **厳格モード**: 全ての厳格TypeScript設定有効
- **noUncheckedIndexedAccess**: 安全でない配列・オブジェクトアクセスを防止
- **exactOptionalPropertyTypes**: 正確なオプショナルプロパティ処理強制
- **型カバレッジ**: 最低90%必須

### コード品質基準
- **リンティング**: TypeScript型対応ルール付きESLint
- **型テスト**: TypeScript定義テスト用TSD
- **Any型禁止**: 全体にわたって明示的型付け必須
- **エラー処理**: 包括的エラー境界と検証

### 命名規則
- **ファイル**: kebab-case（mediapipe.ts、quality.ts）
- **コンポーネント**: PascalCase（Capture.tsx、DebugOverlay.tsx）
- **関数**: 説明的名前でcamelCase
- **型・インターフェース**: 明確な意図のPascalCase

### ファイル構成
```
src/
├── lib/           # コアロジックモジュール
│   ├── mediapipe.ts   # MediaPipe統合
│   ├── metrics.ts     # 顔メトリクス計算
│   └── quality.ts     # 品質検証
├── ui/            # Reactコンポーネント
│   ├── Capture.tsx        # カメラ撮影インターフェース
│   └── DebugOverlay.tsx   # 特徴点可視化
└── types/         # TypeScript定義
```

### 特別要件
- **非診断言語**: 医療・診断用語の回避
- **プライバシーコンプライアンス**: 顔生体認証データ処理
- **モバイルファースト**: カメラ機能最適化
- **日本語UI**: 対象オーディエンスの言語考慮

## 5. 開発コマンド

### コア開発コマンド
```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番ビルドプレビュー
npm run preview
```

### 品質保証コマンド
```bash
# 型チェック
npm run typecheck

# リンティング
npm run lint

# リンティング問題の自動修正
npm run lint:fix

# 型カバレッジチェック（最低90%）
npm run types:coverage

# API型定義テスト
npm run types:api
```

### システムコマンド（macOS/Darwin）
```bash
# ファイル操作
ls -la          # 詳細付きファイル一覧
find . -name    # 名前でファイル検索
grep -r         # ファイル内再帰検索

# Git操作
git status      # リポジトリ状態確認
git add .       # 全変更をステージ
git commit -m   # メッセージ付きコミット
git push        # リモートへプッシュ

# パッケージ管理
npm install     # 依存関係インストール
npm update      # パッケージ更新
npm audit       # セキュリティ監査
```

### タスク完了チェックリスト
任意の開発タスク完了時に必ず実行：
1. `npm run typecheck` - TypeScriptエラーなし確認
2. `npm run lint` - コードスタイルコンプライアンス確認
3. `npm run types:coverage` - 90%型カバレッジ検証
4. `npm run build` - 本番ビルド動作確認

### MediaPipe固有の注意事項
- WASM読み込み用適切なCORSヘッダーが必要
- カメラ機能のモバイルデバイステスト
- 顔角度と照明品質の検証

## 6. 品質管理とワークフロー

### 品質ゲート - 全開発タスク後に実行

#### 1. 型安全検証
```bash
npm run typecheck          # 0エラーで通過必須
npm run types:coverage     # ≥90%カバレッジ維持必須
npm run types:api          # 型定義テスト通過必須
```

#### 2. コード品質チェック
```bash
npm run lint               # 0警告で通過必須（--max-warnings=0）
npm run lint:fix           # 可能な場合は問題自動修正
```

#### 3. ビルド検証
```bash
npm run build             # 本番ビルド成功必須
npm run preview           # ビルドプレビュー動作確認
```

### 開発ワークフロー基準

#### 開発開始前
- [ ] SerenaでSHEIKEプロジェクト有効化
- [ ] コンテキスト用プロジェクトメモリ確認
- [ ] 要件と制約の理解

#### 開発中
- [ ] TypeScript厳格設定に従う
- [ ] 型安全コード維持（`any`型なし）
- [ ] 型付きエラーで適切なエラー処理使用
- [ ] 非診断言語ガイドラインに従う
- [ ] モバイルファーストレスポンシブデザイン実装

#### コード変更後
- [ ] 全品質ゲート実行（上記）
- [ ] UI変更時のモバイルカメラ機能テスト
- [ ] MediaPipe WASM読み込み動作検証
- [ ] 日本語テキスト適切表示確認
- [ ] 顔データのプライバシーコンプライアンス検証

### ファイル構成ルール
- [ ] コアロジックは`src/lib/`に
- [ ] 型定義は`src/types/`に
- [ ] UIコンポーネントは`src/ui/`に
- [ ] 型テストは`tests/types/`に

### 特別な考慮事項
- [ ] MediaPipeに適切なCORSヘッダー必要（vite.config.tsで設定済み）
- [ ] 本番でのカメラアクセスにHTTPS必要
- [ ] 顔生体認証データはプライバシーコンプライアンスで処理必須
- [ ] 日本語UI対象
- [ ] モバイルファーストカメラインターフェースデザイン
- [ ] デバイス上推論のみ（サーバーサイドMLなし）

### CI/CD要件（実装時）
- [ ] 全品質ゲート通過
- [ ] 型カバレッジ≥90%
- [ ] 0警告ESLint
- [ ] 本番ビルド成功
- [ ] MediaPipe WASM読み込みテスト

---

*このドキュメントはSerenaメモリの内容を日本語でまとめたものです。プロジェクトの進行に合わせて更新してください。*
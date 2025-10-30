# @gftdcojp/biome-rules

ESLint-like configurable Biome rules for Next.js

## 🚀 クイックスタート

### 1. インストール

```bash
pnpm add -D @gftdcojp/biome-rules @biomejs/biome
```

### 2. Biome設定に追加

`biome.json`に以下を追加：

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "extends": [
    "@gftdcojp/biome-rules/config/recommended.json"
  ],
  "biomeRules": {
    "@gftdcojp/nextjs-require-promise-params": "error"
  }
}
```

### 3. 実行

```bash
# Biomeでリント
pnpm biome ci .

# biome-rulesで実行
pnpm biome-rules
```

## 📋 設定方法（ESLint-like）

### 基本的な設定

```json
{
  "biomeRules": {
    "@gftdcojp/nextjs-require-promise-params": "error"
  }
}
```

### オプション付き設定

```json
{
  "biomeRules": {
    "@gftdcojp/nextjs-require-promise-params": ["error", {
      "pattern": "**/app/api/**/route.ts",
      "fixable": true
    }]
  }
}
```

### プリセット使用

```json
{
  "extends": [
    "@gftdcojp/biome-rules/config/recommended"
  ]
}
```

プリセット:
- `recommended`: 推奨ルールのみ
- `strict`: すべてのルールを有効
- `all`: すべてのルールを有効（strictと同じ）

### ルールのレベル

- `"off"`: ルールを無効化
- `"warn"`: 警告レベル
- `"error"`: エラーレベル

## 📦 利用可能なルール

- `@gftdcojp/nextjs-require-promise-params`: Next.js 14+ route handlerのparams型チェック

## 📝 ルール命名規則

`@gftdcojp/biome-rules`のルール名は、ESLintの命名規則に準拠しています：

### 基本原則

1. **kebab-case**: 単語を小文字で記述し、ハイフン（`-`）で区切る
   - 例: `nextjs-require-promise-params`

2. **プレフィックスの使用**:
   - `require-`: 特定の要件を必須とするルール
   - `prefer-`: 特定の書き方を推奨するルール
   - `no-`: 特定の動作を禁止するルール
   - `enforce-`: 特定の規則を強制するルール

3. **命名パターン**:
   - `{framework}-{action}-{target}-{requirement}`
   - 例: `nextjs-require-promise-params`
     - `nextjs`: フレームワーク
     - `require`: アクション（必須）
     - `promise`: 要件
     - `params`: 対象

### 命名規則の適用例

- ✅ `nextjs-require-promise-params` - Next.jsでparamsにPromiseを必須とする
- ✅ `nextjs-no-sync-api` - Next.jsで同期APIの使用を禁止
- ✅ `nextjs-prefer-server-components` - Next.jsでServer Componentsを推奨
- ❌ `nextjsParams` - kebab-caseではない
- ❌ `nextjs-params` - 要件が不明確

## 🔧 package.json統合

```json
{
  "scripts": {
    "lint": "biome ci .",
    "check:rules": "biome-rules",
    "lint:full": "pnpm lint && pnpm check:rules"
  }
}
```

## 📚 詳細

詳細なドキュメントについては、[GitHubリポジトリ](https://github.com/gftdcojp/biome-rules)を参照してください。


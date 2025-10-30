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
    "@gftdcojp/nextjs-params": "error"
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
    "@gftdcojp/nextjs-params": "error"
  }
}
```

### オプション付き設定

```json
{
  "biomeRules": {
    "@gftdcojp/nextjs-params": ["error", {
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

- `@gftdcojp/nextjs-params`: Next.js 14+ route handlerのparams型チェック

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


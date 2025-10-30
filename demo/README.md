# @gftdcojp/biome-rules Demo

このディレクトリは `@gftdcojp/biome-rules` の動作検証用デモプロジェクトです。

## セットアップ

```bash
pnpm install
```

## 動作確認

### biome-rulesを実行

```bash
pnpm check:rules
```

### テストファイル

- `app/api/test/route.ts` - ❌ 間違った例（paramsがPromiseでラップされていない）
- `app/api/test/correct/route.ts` - ✅ 正しい例（paramsがPromiseでラップされている）

## 期待される動作

`biome-rules` を実行すると、`app/api/test/route.ts` でエラーが検出され、`app/api/test/correct/route.ts` はパスするはずです。

### 実行結果例

```bash
$ pnpm check:rules

Running 1 rule(s)...

Running: @gftdcojp/nextjs-params (Check Next.js 14+ route handler params must be Promise<{ ... }>)...
  ❌ ❌ Found 2 violation(s) in 2 file(s)
    /path/to/demo/app/api/test/route.ts:10:3 - Next.js 14+ route handler "GET" params must be Promise<{ ... }>. Found: { id: string; }
    /path/to/demo/app/api/test/route.ts:17:3 - Next.js 14+ route handler "POST" params must be Promise<{ ... }>. Found: { id: string; }

❌ Found 2 violation(s) across 1 rule(s)
```

### 修正方法

`app/api/test/route.ts` の `params` を `Promise<{ id: string }>` に変更すると、エラーが解消されます。


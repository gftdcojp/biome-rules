/**
 * @gftdcojp/biome-rules
 * Rule registry - ESLint-like format
 */

import { loadRuleRegistry } from "../config/loader.js";
import { checkNextJsParams } from "../scripts/check-nextjs-params.js";
import type { RuleHandler, RuleContext, RuleResult } from "./types.js";

const registry = loadRuleRegistry();

/**
 * ルールハンドラーマップ
 */
export const ruleHandlers: Record<string, RuleHandler> = {
  "@gftdcojp/nextjs-require-promise-params": async (context: RuleContext) => {
    const result = await checkNextJsParams({
      cwd: context.cwd,
      tsConfigPath: context.tsConfigPath,
      pattern: (context.options?.pattern as string) || "**/app/api/**/route.ts",
      fix: context.fix || false,
    });

    return {
      success: result.success,
      violations: result.violations || [],
      message: result.message,
    };
  },

  // 他のルールをここに追加
  // "@gftdcojp/nextjs-headers": async (context) => { ... },
};

/**
 * ルールが存在するかチェック
 */
export function hasRule(ruleName: string): boolean {
  return ruleName in registry.rules || ruleName in ruleHandlers;
}

/**
 * ルールのメタ情報を取得
 */
export function getRuleMeta(ruleName: string) {
  return registry.rules[ruleName] || null;
}

/**
 * 有効なルール一覧を取得
 */
export function getAvailableRules(): string[] {
  return Object.keys(registry.rules);
}


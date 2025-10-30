/**
 * @gftdcojp/biome-rules
 * ESLint-like configuration loader
 * Biome設定 + biomeRules設定を統合
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface BiomeRulesConfig {
  [ruleName: string]: "off" | "warn" | "error" | [string, ...unknown[]];
}

export interface ExtendedBiomeConfig {
  $schema?: string;
  extends?: string[];
  linter?: {
    enabled?: boolean;
    rules?: Record<string, unknown>;
  };
  formatter?: Record<string, unknown>;
  files?: {
    include?: string[];
    ignore?: string[];
  };
  biomeRules?: BiomeRulesConfig;
  [key: string]: unknown;
}

/**
 * ルールレジストリを読み込む
 */
export function loadRuleRegistry() {
  const registryPath = join(__dirname, "../../rules/registry.json");
  return JSON.parse(readFileSync(registryPath, "utf-8"));
}

/**
 * プリセット設定を読み込む
 */
export function loadPreset(
  presetName: "recommended" | "strict" | "all",
): BiomeRulesConfig {
  const registry = loadRuleRegistry();
  return registry.presets[presetName] || {};
}

/**
 * Biome設定にbiomeRulesを統合
 */
export function mergeBiomeRulesConfig(
  config: ExtendedBiomeConfig,
  preset?: "recommended" | "strict" | "all",
): ExtendedBiomeConfig {
  const mergedConfig = { ...config };

  // プリセットからルールをマージ
  if (preset) {
    const presetRules = loadPreset(preset);
    mergedConfig.biomeRules = {
      ...presetRules,
      ...mergedConfig.biomeRules,
    };
  }

  return mergedConfig;
}

/**
 * biomeRules設定を正規化（"error" | ["error", options] 形式）
 */
export function normalizeRuleConfig(
  ruleConfig: "off" | "warn" | "error" | [string, ...unknown[]],
): { level: "off" | "warn" | "error"; options?: unknown } {
  if (typeof ruleConfig === "string") {
    return { level: ruleConfig };
  }

  const [level, options] = ruleConfig;
  return {
    level: level as "off" | "warn" | "error",
    options,
  };
}


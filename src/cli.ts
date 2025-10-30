#!/usr/bin/env node
/**
 * @gftdcojp/biome-rules
 * CLI entry point - Biome設定を読み込んでルールを実行
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import {
  loadRuleRegistry,
  mergeBiomeRulesConfig,
  normalizeRuleConfig,
} from "./config/loader.js";
import { ruleHandlers, getRuleMeta } from "./rules/index.js";
import type { ExtendedBiomeConfig, BiomeRulesConfig } from "./config/loader.js";
import type { RuleContext } from "./rules/types.js";

async function main() {
  const args = parseArgs();
  const configPath = args.config || "biome.json";

  // Biome設定を読み込む
  const config = loadBiomeConfig(configPath);

  // biomeRules設定を取得
  const biomeRules = config.biomeRules || {};

  if (Object.keys(biomeRules).length === 0) {
    console.log(
      "No @gftdcojp/biome-rules configured. Add biomeRules to biome.json",
    );
    process.exit(0);
  }

  console.log(`Running ${Object.keys(biomeRules).length} rule(s)...\n`);

  const results: Array<{
    rule: string;
    result: Awaited<ReturnType<(typeof ruleHandlers)[string]>>;
  }> = [];

  // 各ルールを実行
  for (const [ruleName, ruleConfig] of Object.entries(biomeRules)) {
    if (ruleConfig === "off") continue;

    const normalized = normalizeRuleConfig(ruleConfig);
    if (normalized.level === "off") continue;

    const handler = ruleHandlers[ruleName];
    if (!handler) {
      console.warn(`⚠️  Unknown rule: ${ruleName}`);
      continue;
    }

    const meta = getRuleMeta(ruleName);
    console.log(
      `Running: ${ruleName}${meta ? ` (${meta.description})` : ""}...`,
    );

    const context: RuleContext = {
      cwd: args.cwd || process.cwd(),
      tsConfigPath: args.tsconfig,
      options: normalized.options as never,
    };

    try {
      const result = await handler(context);
      results.push({ rule: ruleName, result });

      if (result.success) {
        console.log(`  ✅ ${result.message}\n`);
      } else {
        console.error(`  ❌ ${result.message}`);
        if (result.violations.length > 0) {
          for (const violation of result.violations) {
            console.error(
              `    ${violation.filePath}:${violation.line}:${violation.column} - ${violation.message}`,
            );
          }
        }
        console.error("");
      }
    } catch (error) {
      console.error(`  ❌ Error running ${ruleName}:`, error);
      results.push({
        rule: ruleName,
        result: {
          success: false,
          violations: [],
          message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      });
    }
  }

  // 結果をまとめる
  const allSuccess = results.every((r) => r.result.success);
  const totalViolations = results.reduce(
    (sum, r) => sum + r.result.violations.length,
    0,
  );

  if (allSuccess) {
    console.log(`✅ All rules passed!`);
    process.exit(0);
  } else {
    console.error(
      `\n❌ Found ${totalViolations} violation(s) across ${results.length} rule(s)`,
    );
    process.exit(1);
  }
}

function loadBiomeConfig(configPath: string): ExtendedBiomeConfig {
  try {
    const fullPath = resolve(configPath);
    const content = readFileSync(fullPath, "utf-8");
    return JSON.parse(content) as ExtendedBiomeConfig;
  } catch (error) {
    console.error(`Failed to load config from ${configPath}:`, error);
    return {};
  }
}

function parseArgs() {
  const args: Record<string, string | undefined> = {};
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--config":
      case "-c":
        args.config = argv[++i];
        break;
      case "--tsconfig":
      case "-t":
        args.tsconfig = argv[++i];
        break;
      case "--cwd":
        args.cwd = argv[++i];
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;
    }
  }

  return args;
}

function printHelp() {
  console.log(`
Usage: biome-rules [options]

Options:
  -c, --config <path>    Path to biome.json (default: biome.json)
  -t, --tsconfig <path>  Path to tsconfig.json
  --cwd <path>           Working directory
  -h, --help             Show this help message

Examples:
  biome-rules
  biome-rules --config custom-biome.json
`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});


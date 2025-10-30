/**
 * @gftdcojp/biome-rules
 * Main exports
 */

// Config
export {
  loadRuleRegistry,
  loadPreset,
  mergeBiomeRulesConfig,
  normalizeRuleConfig,
} from "./config/loader.js";
export type {
  ExtendedBiomeConfig,
  BiomeRulesConfig,
} from "./config/loader.js";

// Rules
export {
  ruleHandlers,
  hasRule,
  getRuleMeta,
  getAvailableRules,
} from "./rules/index.js";
export type {
  RuleHandler,
  RuleContext,
  RuleResult,
  RuleViolation,
} from "./rules/types.js";

// Scripts (ts-morph based)
export { checkNextJsParams } from "./scripts/check-nextjs-params.js";
export type {
  CheckNextJsParamsResult,
  Violation,
} from "./scripts/check-nextjs-params.js";


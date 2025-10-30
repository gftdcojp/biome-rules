/**
 * @gftdcojp/biome-rules
 * Rule type definitions
 */

export interface RuleOptions {
  pattern?: string;
  fixable?: boolean;
  allowOptional?: boolean;
  [key: string]: unknown;
}

export interface RuleContext {
  cwd: string;
  tsConfigPath?: string;
  options?: RuleOptions;
  fix?: boolean;
}

export interface RuleViolation {
  filePath: string;
  line: number;
  column: number;
  message: string;
  severity: "error" | "warning";
  fixable?: boolean;
  suggestedFix?: string;
}

export interface RuleResult {
  success: boolean;
  violations: RuleViolation[];
  message: string;
}

export type RuleHandler = (context: RuleContext) => Promise<RuleResult>;


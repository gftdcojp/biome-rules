/**
 * @gftdcojp/biome-rules
 * Next.js route handler params validation using ts-morph
 */

import { Project } from "ts-morph";
import { glob } from "glob";
import { resolve } from "path";

export interface Violation {
  filePath: string;
  line: number;
  column: number;
  message: string;
  severity: "error" | "warning";
  fixable?: boolean;
  suggestedFix?: string;
}

export interface CheckNextJsParamsOptions {
  cwd: string;
  tsConfigPath?: string;
  pattern?: string;
}

export interface CheckNextJsParamsResult {
  success: boolean;
  violations: Violation[];
  message: string;
}

/**
 * Next.js 14+ route handlerのparams型をチェック
 */
export async function checkNextJsParams(
  options: CheckNextJsParamsOptions,
): Promise<CheckNextJsParamsResult> {
  const { cwd, tsConfigPath, pattern = "**/app/api/**/route.ts" } = options;

  try {
    // プロジェクトを初期化
    const project = new Project({
      tsConfigFilePath: tsConfigPath
        ? resolve(cwd, tsConfigPath)
        : resolve(cwd, "tsconfig.json"),
      skipAddingFilesFromTsConfig: false,
    });

    // パターンにマッチするファイルを検索
    const files = await glob(pattern, {
      cwd,
      absolute: true,
    });

    if (files.length === 0) {
      return {
        success: true,
        violations: [],
        message: `No files found matching pattern: ${pattern}`,
      };
    }

    // ファイルをプロジェクトに追加
    project.addSourceFilesAtPaths(files);

    const violations: Violation[] = [];

    // 各ファイルをチェック
    for (const sourceFile of project.getSourceFiles()) {
      const filePath = sourceFile.getFilePath();

      // GET, POST, PUT, DELETE などのエクスポート関数を検索
      const exportedFunctions = sourceFile.getExportedDeclarations();

      for (const [name, declarations] of exportedFunctions) {
        if (
          !["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"].includes(
            name,
          )
        ) {
          continue;
        }

        for (const declaration of declarations) {
          // 関数宣言をチェック
          const funcDecl = declaration.asKind((d) =>
            d.getKindName() === "FunctionDeclaration",
          );
          if (!funcDecl) {
            continue;
          }

          const params = funcDecl.getParameters();

          if (params.length === 0) {
            continue;
          }

          // 最初のパラメータ（通常はrequest）をチェック
          const firstParam = params[0];
          const paramType = firstParam.getType();

          // オブジェクト型かチェック
          const properties = paramType.getProperties();

          // paramsプロパティを探す
          const paramsProperty = properties.find((p) => p.getName() === "params");

          if (paramsProperty) {
            const paramsType = paramsProperty.getType();
            const paramsTypeString = paramsType.getText();

            // Promiseでラップされているかチェック
            if (!paramsTypeString.includes("Promise")) {
              const lineAndColumn = firstParam.getStartLineAndColumn();
              violations.push({
                filePath,
                line: lineAndColumn.line,
                column: lineAndColumn.column,
                message: `Next.js 14+ route handler "${name}" params must be Promise<{ ... }>. Found: ${paramsTypeString}`,
                severity: "error",
                fixable: true,
                suggestedFix: `Wrap params type with Promise<...>`,
              });
            }
          }
        }
      }
    }

    if (violations.length === 0) {
      return {
        success: true,
        violations: [],
        message: `✅ All ${files.length} route handler(s) passed validation`,
      };
    }

    return {
      success: false,
      violations,
      message: `❌ Found ${violations.length} violation(s) in ${files.length} file(s)`,
    };
  } catch (error) {
    return {
      success: false,
      violations: [],
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}


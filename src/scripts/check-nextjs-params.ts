/**
 * @gftdcojp/biome-rules
 * Next.js route handler params validation using ts-morph
 */

import { Project, FunctionDeclaration, Node } from "ts-morph";
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
          if (!Node.isFunctionDeclaration(declaration)) {
            continue;
          }

          const funcDecl = declaration as FunctionDeclaration;
          const parameters = funcDecl.getParameters();

          if (parameters.length < 2) {
            continue;
          }

          // 2番目のパラメータ（通常は{ params }）をチェック
          const secondParam = parameters[1];
          const paramType = secondParam.getType();

          // オブジェクト型かチェック
          const properties = paramType.getProperties();

          // paramsプロパティを探す
          const paramsProperty = properties.find((p) => p.getName() === "params");

          if (paramsProperty) {
            // paramsの型を取得（SymbolからvalueDeclaration経由）
            const valueDeclaration = paramsProperty.getValueDeclaration();
            if (valueDeclaration) {
              const paramsType = valueDeclaration.getType();
              const paramsTypeString = paramsType.getText();

              // Promiseでラップされているかチェック
              if (!paramsTypeString.includes("Promise")) {
                const lineAndColumn = secondParam.getStart();
                const position = sourceFile.getLineAndColumnAtPos(lineAndColumn);
                violations.push({
                  filePath,
                  line: position.line,
                  column: position.column,
                  message: `Next.js 14+ route handler "${name}" params must be Promise<{ ... }>. Found: ${paramsTypeString}`,
                  severity: "error",
                  fixable: true,
                  suggestedFix: `Wrap params type with Promise<...>`,
                });
              }
            } else {
              // valueDeclarationがない場合、型から直接取得を試みる
              const paramsType = paramType.getProperty("params")?.getTypeAtLocation(secondParam);
              if (paramsType) {
                const paramsTypeString = paramsType.getText();
                if (!paramsTypeString.includes("Promise")) {
                  const lineAndColumn = secondParam.getStart();
                  const position = sourceFile.getLineAndColumnAtPos(lineAndColumn);
                  violations.push({
                    filePath,
                    line: position.line,
                    column: position.column,
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


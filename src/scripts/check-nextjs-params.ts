/**
 * @gftdcojp/biome-rules
 * Next.js route handler params validation using ts-morph
 */

import {
  Project,
  FunctionDeclaration,
  Node,
  PropertySignature,
} from "ts-morph";
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
  fix?: boolean;
}

export interface CheckNextJsParamsResult {
  success: boolean;
  violations: Violation[];
  message: string;
}

/**
 * Next.js 14+ route handlerのparams型を自動修正
 */
function fixNextJsParams(
  sourceFile: ReturnType<Project["getSourceFiles"]>[0],
  funcDecl: FunctionDeclaration,
  secondParam: ReturnType<FunctionDeclaration["getParameters"]>[0],
): boolean {
  try {
    // パラメータの型アノテーションを取得
    const typeNode = secondParam.getTypeNode();
    if (!typeNode) {
      return false;
    }

    // 型文字列を取得
    const typeText = typeNode.getText();
    
    // Promiseでラップされていない場合のみ修正
    if (typeText.includes("Promise")) {
      return false;
    }

    // より正確な修正: オブジェクト型のparamsプロパティだけを修正
    if (typeText.includes("params:")) {
      // TypeScript ASTを直接操作
      if (Node.isTypeLiteral(typeNode)) {
        const members = typeNode.getMembers();
        for (const member of members) {
          if (Node.isPropertySignature(member)) {
            const propSig = member as PropertySignature;
            if (propSig.getName() === "params") {
              const currentType = propSig.getTypeNode();
              if (currentType) {
                const currentTypeText = currentType.getText();
                if (!currentTypeText.includes("Promise")) {
                  // Promiseでラップされた新しい型ノードを作成
                  propSig.setType(`Promise<${currentTypeText}>`);
                  return true;
                }
              }
            }
          }
        }
      }
    }

    return false;
  } catch (error) {
    console.error(`Error fixing ${sourceFile.getFilePath()}:`, error);
    return false;
  }
}

/**
 * Next.js 14+ route handlerのparams型をチェック
 */
export async function checkNextJsParams(
  options: CheckNextJsParamsOptions,
): Promise<CheckNextJsParamsResult> {
  const { cwd, tsConfigPath, pattern = "**/app/api/**/route.ts", fix = false } =
    options;

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
    const fixedFiles = new Set<string>();

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
                // 自動修正モードの場合
                if (fix) {
                  const fixed = fixNextJsParams(sourceFile, funcDecl, secondParam);
                  if (fixed) {
                    fixedFiles.add(filePath);
                    continue; // 修正済みなので違反に追加しない
                  }
                }

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
              const paramsType = paramType
                .getProperty("params")
                ?.getTypeAtLocation(secondParam);
              if (paramsType) {
                const paramsTypeString = paramsType.getText();
                if (!paramsTypeString.includes("Promise")) {
                  // 自動修正モードの場合
                  if (fix) {
                    const fixed = fixNextJsParams(sourceFile, funcDecl, secondParam);
                    if (fixed) {
                      fixedFiles.add(filePath);
                      continue; // 修正済みなので違反に追加しない
                    }
                  }

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

    // 自動修正モードの場合、ファイルを保存
    if (fix && fixedFiles.size > 0) {
      for (const filePath of fixedFiles) {
        const sourceFile = project.getSourceFile(filePath);
        if (sourceFile) {
          sourceFile.saveSync();
        }
      }
      return {
        success: violations.length === 0,
        violations,
        message: `✅ Fixed ${fixedFiles.size} file(s). ${violations.length > 0 ? `Found ${violations.length} remaining violation(s).` : "All violations fixed!"}`,
      };
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


import { parse } from '@babel/parser'
import {
  isClassDeclaration,
  isClassMethod,
  isClassPrivateMethod,
  isExportDefaultDeclaration,
  isIdentifier,
  isObjectExpression,
  isObjectMethod,
  isVariableDeclaration,
  isVariableDeclarator,
} from '@babel/types'
import type { Ast } from './contracts'
import type {
  ClassBody,
  ClassDeclaration,
  ClassMethod,
  ExportDefaultDeclaration,
  Expression,
  ObjectExpression,
  ObjectMethod,
} from '@babel/types'

export class Extractor {
  /**
   * Generate an AST from the given source
   */
  private generateAst(source: string) {
    return parse(source, {
      sourceType: 'module',
      plugins: [
        'typescript',
        'decoratorAutoAccessors',
        ['decorators', { decoratorsBeforeExport: true }],
      ],
    })
  }

  /**
   * Get the statement that exports the default export
   */
  private getExportDefaultDeclaration(ast: Ast) {
    const statement = ast.program.body.find((statement) =>
      isExportDefaultDeclaration(statement)
    ) as ExportDefaultDeclaration | undefined

    if (!statement) {
      return null
    }

    return statement.declaration
  }

  /**
   * Traverse the AST for finding the expression of the given identifier
   *
   * Imagine we have :
   * ```ts
   * class foo {
   *  bar() {}
   * }
   *
   * export default foo
   * ```
   *
   * For the above code, we want to have the ClassDeclaration for the export default identifier `foo`
   */
  private findMatchingExpressionForIdentifier(ast: Ast, identifier: string) {
    const expression: ClassDeclaration | Expression | null = null

    for (const statement of ast.program.body) {
      /**
       * Class Declaration matching
       */
      if (isClassDeclaration(statement) && statement.id.name === identifier) {
        return statement
      }

      /**
       * Variable declaration matching.
       */
      if (isVariableDeclaration(statement)) {
        const matchingExpression = statement.declarations.find((declaration) => {
          return (
            isVariableDeclarator(declaration) &&
            isIdentifier(declaration.id) &&
            declaration.id.name === identifier
          )
        })

        if (matchingExpression) {
          return matchingExpression.init!
        }
      }
    }

    if (!expression) {
      throw new Error(`Could not find expression for identifier ${identifier}`)
    }

    return expression
  }

  /**
   * Get the default export expression. Either a class declaration or an object.
   * - Only support ESM exports. CJS exports are not supported for now.
   */
  private getExportExpression(ast: Ast) {
    /**
     * We get the export default declaration
     */
    const exportDefaultDeclaration = this.getExportDefaultDeclaration(ast)

    if (!exportDefaultDeclaration) {
      throw new Error('No export default declaration found')
    }

    if (
      isClassDeclaration(exportDefaultDeclaration) ||
      isObjectExpression(exportDefaultDeclaration)
    ) {
      /**
       * If the export default is a class declaration, or an object expression,
       * we just returns it.
       */
      return exportDefaultDeclaration
    } else if (isIdentifier(exportDefaultDeclaration)) {
      /**
       * Otherwise, that means that the export default is an identifier.
       * So we have to find the matching expression/declaration for that identifier
       */
      return this.findMatchingExpressionForIdentifier(ast, exportDefaultDeclaration.name)
    }

    throw new Error('Invalid export default declaration')
  }

  /**
   * Is the given class body is a public method ?
   */
  private isPublicClassMethod(statement: ClassBody['body'][number]): statement is ClassMethod {
    return (
      isClassMethod(statement) &&
      !isClassPrivateMethod(statement) &&
      statement.accessibility !== 'private'
    )
  }

  /**
   * Extract the public methods from the given ClassDeclaration
   */
  private extractMethodsFromClass(exportExpression: ClassDeclaration) {
    const methods = exportExpression.body.body
      .filter(this.isPublicClassMethod)
      .map((statement) => ({
        name: isIdentifier(statement.key) ? statement.key.name : '',
        lineno: statement.key.loc!.start.line,
      }))

    return { kind: 'class', methods }
  }

  /**
   * Is the given expression a object method ?
   */
  private isObjectMethod(
    property: ObjectExpression['properties'][number]
  ): property is ObjectMethod {
    return isObjectMethod(property)
  }

  /**
   * Extract the methods from the given ObjectExpression
   */
  private extractMethodsFromObject(exportExpression: ObjectExpression) {
    const methods = exportExpression.properties.filter(this.isObjectMethod).map((property) => ({
      name: isIdentifier(property.key) ? property.key.name : '',
      lineno: property.key.loc!.start.line,
    }))

    return { kind: 'object', methods }
  }

  public extract(source: string) {
    const ast = this.generateAst(source)
    const exportExpression = this.getExportExpression(ast)

    if (isClassDeclaration(exportExpression)) {
      return this.extractMethodsFromClass(exportExpression)
    } else if (isObjectExpression(exportExpression)) {
      return this.extractMethodsFromObject(exportExpression)
    }

    return null
  }
}

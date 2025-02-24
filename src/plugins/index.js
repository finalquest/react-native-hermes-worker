module.exports = function (babel) {
  const { types: t } = babel;

  function generateES5Function(
    functionName,
    functionBody,
    isAsync = false,
    params = ''
  ) {
    // Convert arrow function syntax to ES5
    let es5Body = functionBody
      // Convert arrow functions to regular functions
      .replace(/\(\s*\)\s*=>\s*/, '')
      // Convert let/const to var
      .replace(/\b(let|const)\b/g, 'var')
      // Convert template literals to string concatenation (if needed)
      .replace(/`([^`]*)`/g, function (_, contents) {
        return "'" + contents.replace(/'/g, "\\'") + "'";
      })
      // Remove extra curly braces if they exist
      .replace(/^{|}$/g, '')
      // Remove all newlines and extra spaces
      .replace(/\s+/g, ' ')
      .trim();

    const asyncPrefix = isAsync ? 'async ' : '';
    return `${asyncPrefix}function ${functionName}(${params}) { ${es5Body} } ${functionName}();`;
  }

  function extractFunctionParts(path, node) {
    let functionBody = '';
    let params = '';
    let isAsync = false;

    if (t.isFunctionDeclaration(node) || t.isFunctionExpression(node)) {
      isAsync = node.async;
      params = node.params
        .map((param) => {
          return t.isIdentifier(param)
            ? param.name
            : path.hub.file.code.slice(param.start, param.end);
        })
        .join(', ');
      functionBody = path.hub.file.code
        .slice(node.body.start + 1, node.body.end - 1)
        .replace(/\s+/g, ' ')
        .trim();
    } else if (t.isArrowFunctionExpression(node)) {
      isAsync = node.async;
      params = node.params
        .map((param) => {
          return t.isIdentifier(param)
            ? param.name
            : path.hub.file.code.slice(param.start, param.end);
        })
        .join(', ');
      if (t.isBlockStatement(node.body)) {
        functionBody = path.hub.file.code
          .slice(node.body.start + 1, node.body.end - 1)
          .replace(/\s+/g, ' ')
          .trim();
      } else {
        functionBody = `return ${path.hub.file.code.slice(node.body.start, node.body.end)};`;
      }
    }

    return { functionBody, params, isAsync };
  }

  return {
    visitor: {
      CallExpression(path) {
        // Only care about enqueueItem calls, regardless of how they're accessed
        const isEnqueueItemCall =
          (t.isIdentifier(path.node.callee) &&
            path.node.callee.name === 'enqueueItem') ||
          (t.isMemberExpression(path.node.callee) &&
            path.node.callee.property.name === 'enqueueItem');

        if (isEnqueueItemCall && path.node.arguments.length > 0) {
          const arg = path.node.arguments[0];

          // New Case: Handle function calls with arguments
          if (t.isCallExpression(arg)) {
            const callee = arg.callee;
            if (t.isIdentifier(callee)) {
              const binding = path.scope.getBinding(callee.name);

              // Check if there's no binding or if the binding is from an import
              if (
                !binding ||
                (binding.path.parent &&
                  t.isImportDeclaration(binding.path.parent))
              ) {
                // Check arguments for runtime values
                const args = arg.arguments.map((argNode) => {
                  if (t.isIdentifier(argNode)) {
                    const argBinding = path.scope.getBinding(argNode.name);
                    if (argBinding) {
                      return {
                        value: argNode.name,
                        isRuntime: true,
                      };
                    }
                  } else if (t.isBinaryExpression(argNode)) {
                    // For binary expressions, we need to handle the entire expression as one unit
                    const hasRuntimeValue = (node) => {
                      if (t.isIdentifier(node)) {
                        return path.scope.getBinding(node.name) != null;
                      }
                      if (t.isBinaryExpression(node)) {
                        return (
                          hasRuntimeValue(node.left) ||
                          hasRuntimeValue(node.right)
                        );
                      }
                      return false;
                    };

                    const isRuntime = hasRuntimeValue(argNode);
                    return {
                      value: path.hub.file.code.slice(
                        argNode.start,
                        argNode.end
                      ),
                      isRuntime,
                      isBinaryExpression: true,
                    };
                  } else if (t.isObjectExpression(argNode)) {
                    const properties = argNode.properties
                      .map((prop) => {
                        if (t.isObjectProperty(prop)) {
                          if (t.isIdentifier(prop.value)) {
                            const objectBinding = path.scope.getBinding(
                              prop.value.name
                            );
                            if (objectBinding) {
                              return {
                                key: prop.key.name,
                                value: prop.value.name,
                                isRuntime: true,
                              };
                            }
                          }
                          return {
                            key: prop.key.name,
                            value: path.hub.file.code.slice(
                              prop.value.start,
                              prop.value.end
                            ),
                            isRuntime: false,
                          };
                        }
                        return null;
                      })
                      .filter(Boolean);

                    const hasRuntimeProps = properties.some((p) => p.isRuntime);
                    if (hasRuntimeProps) {
                      return {
                        properties,
                        isObject: true,
                        isRuntime: true,
                      };
                    }
                  }
                  return {
                    value: path.hub.file.code.slice(argNode.start, argNode.end),
                    isRuntime: false,
                  };
                });

                if (args.some((runtimeArg) => runtimeArg.isRuntime)) {
                  // Create template elements for each argument
                  const quasis = [];
                  const expressions = [];

                  // Add the function name and opening parenthesis
                  quasis.push(
                    t.templateElement(
                      { raw: `${callee.name}(`, cooked: `${callee.name}(` },
                      false
                    )
                  );

                  // Add each argument
                  args.forEach((objectArg, index) => {
                    if (objectArg.isObject) {
                      const prev = quasis.pop();
                      let objStr = prev.value.raw + '{ ';

                      arg.properties.forEach((prop, propIndex) => {
                        if (prop.isRuntime) {
                          objStr += `${prop.key}: `;
                          quasis.push(
                            t.templateElement(
                              { raw: objStr, cooked: objStr },
                              false
                            )
                          );
                          expressions.push(t.identifier(prop.value));
                          objStr =
                            propIndex < arg.properties.length - 1 ? ', ' : '';
                        } else {
                          objStr += `${prop.key}: ${prop.value}${propIndex < arg.properties.length - 1 ? ', ' : ''}`;
                        }
                      });

                      objStr += ' }' + (index === args.length - 1 ? ')' : ', ');
                      quasis.push(
                        t.templateElement(
                          { raw: objStr, cooked: objStr },
                          index === args.length - 1
                        )
                      );
                    } else if (arg.isRuntime) {
                      if (arg.isBinaryExpression) {
                        expressions.push(t.identifier(arg.value));
                      } else {
                        expressions.push(t.identifier(arg.value));
                      }
                      const separator = index === args.length - 1 ? ')' : ', ';
                      quasis.push(
                        t.templateElement(
                          {
                            raw: separator,
                            cooked: separator,
                          },
                          index === args.length - 1
                        )
                      );
                    } else {
                      const prev = quasis.pop();
                      const separator = index === args.length - 1 ? ')' : ', ';
                      const newRaw = prev.value.raw + arg.value + separator;
                      const newCooked =
                        prev.value.cooked + arg.value + separator;
                      quasis.push(
                        t.templateElement(
                          { raw: newRaw, cooked: newCooked },
                          index === args.length - 1
                        )
                      );
                    }
                  });

                  path.node.arguments[0] = t.templateLiteral(
                    quasis,
                    expressions
                  );
                } else {
                  // If no runtime values, use string literal
                  const argsString = args
                    .map((stringArg) => stringArg.value)
                    .join(', ');
                  path.node.arguments[0] = t.stringLiteral(
                    `${callee.name}(${argsString})`
                  );
                }
                return;
              }

              if (binding) {
                const bindingNode = binding.path.node;
                let functionNode;

                if (t.isFunctionDeclaration(bindingNode)) {
                  functionNode = bindingNode;
                } else if (
                  t.isVariableDeclarator(bindingNode) &&
                  (t.isArrowFunctionExpression(bindingNode.init) ||
                    t.isFunctionExpression(bindingNode.init))
                ) {
                  functionNode = bindingNode.init;
                }

                if (functionNode) {
                  const { functionBody, params, isAsync } =
                    extractFunctionParts(path, functionNode);

                  // Extract argument values and their declarations if they are variables
                  const args = arg.arguments.map((argNode) => {
                    if (t.isBinaryExpression(argNode)) {
                      // For binary expressions, check if either operand is a runtime value
                      const left =
                        t.isIdentifier(argNode.left) &&
                        path.scope.getBinding(argNode.left.name)
                          ? { value: argNode.left.name, isRuntime: true }
                          : {
                              value: path.hub.file.code.slice(
                                argNode.left.start,
                                argNode.left.end
                              ),
                              isRuntime: false,
                            };

                      const right =
                        t.isIdentifier(argNode.right) &&
                        path.scope.getBinding(argNode.right.name)
                          ? { value: argNode.right.name, isRuntime: true }
                          : {
                              value: path.hub.file.code.slice(
                                argNode.right.start,
                                argNode.right.end
                              ),
                              isRuntime: false,
                            };

                      const operator = argNode.operator;

                      return {
                        value: {
                          left,
                          operator,
                          right,
                        },
                        isRuntime: left.isRuntime || right.isRuntime,
                        isBinaryExpression: true,
                      };
                    } else if (t.isIdentifier(argNode)) {
                      const argBinding = path.scope.getBinding(argNode.name);
                      if (argBinding) {
                        return {
                          value: argNode.name,
                          isRuntime: true,
                        };
                      }
                    }
                    return {
                      value: path.hub.file.code.slice(
                        argNode.start,
                        argNode.end
                      ),
                      isRuntime: false,
                    };
                  });

                  // Clean up function body - remove extra spaces and newlines
                  const cleanBody = functionBody
                    .replace(/\s+/g, ' ')
                    .replace(/\n/g, '')
                    .trim();

                  // If we have runtime values, create a template literal
                  if (args.some((calleeArg) => calleeArg.isRuntime)) {
                    const asyncPrefix = isAsync ? 'async ' : '';
                    const beforeExpr = `${asyncPrefix}function ${callee.name}(${params}) { ${cleanBody} } return ${callee.name}(`;
                    const afterExpr = ');';

                    // Create template elements for each argument
                    const quasis = [];
                    const expressions = [];

                    // Add the function definition and opening parenthesis
                    quasis.push(
                      t.templateElement(
                        { raw: beforeExpr, cooked: beforeExpr },
                        false
                      )
                    );

                    // Add each argument
                    args.forEach((expressionArg, index) => {
                      if (expressionArg.isBinaryExpression) {
                        const { left, operator, right } = arg.value;
                        if (left.isRuntime) {
                          expressions.push(t.identifier(left.value));
                          quasis.push(
                            t.templateElement(
                              {
                                raw: ` ${operator} ${right.value}${index === args.length - 1 ? afterExpr : ', '}`,
                                cooked: ` ${operator} ${right.value}${index === args.length - 1 ? afterExpr : ', '}`,
                              },
                              index === args.length - 1
                            )
                          );
                        } else if (right.isRuntime) {
                          const prev = quasis.pop();
                          const newRaw =
                            prev.value.raw + `${left.value} ${operator} `;
                          const newCooked =
                            prev.value.cooked + `${left.value} ${operator} `;
                          quasis.push(
                            t.templateElement(
                              { raw: newRaw, cooked: newCooked },
                              false
                            )
                          );
                          expressions.push(t.identifier(right.value));
                          quasis.push(
                            t.templateElement(
                              {
                                raw:
                                  index === args.length - 1 ? afterExpr : ', ',
                                cooked:
                                  index === args.length - 1 ? afterExpr : ', ',
                              },
                              index === args.length - 1
                            )
                          );
                        }
                      } else if (arg.isRuntime) {
                        expressions.push(t.identifier(arg.value));
                        quasis.push(
                          t.templateElement(
                            {
                              raw: index === args.length - 1 ? afterExpr : ', ',
                              cooked:
                                index === args.length - 1 ? afterExpr : ', ',
                            },
                            index === args.length - 1
                          )
                        );
                      } else {
                        const prev = quasis.pop();
                        const newRaw =
                          prev.value.raw +
                          arg.value +
                          (index === args.length - 1 ? afterExpr : ', ');
                        const newCooked =
                          prev.value.cooked +
                          arg.value +
                          (index === args.length - 1 ? afterExpr : ', ');
                        quasis.push(
                          t.templateElement(
                            { raw: newRaw, cooked: newCooked },
                            index === args.length - 1
                          )
                        );
                      }
                    });

                    path.node.arguments[0] = t.templateLiteral(
                      quasis,
                      expressions
                    );
                  } else {
                    const asyncPrefix = isAsync ? 'async ' : '';
                    const functionString = `${asyncPrefix}function ${callee.name}(${params}) { ${cleanBody} } return ${callee.name}(${args
                      .map((calleeArg) =>
                        calleeArg.isBinaryExpression
                          ? `${calleeArg.value.left.value} ${calleeArg.value.operator} ${calleeArg.value.right.value}`
                          : calleeArg.value
                      )
                      .join(', ')});`;
                    path.node.arguments[0] = t.stringLiteral(functionString);
                  }
                }
              }
            }
          } else if (t.isIdentifier(arg)) {
            const binding = path.scope.getBinding(arg.name);

            if (binding) {
              const bindingNode = binding.path.node;

              // Case 1: Function Declaration
              if (t.isFunctionDeclaration(bindingNode)) {
                const { functionBody, params, isAsync } = extractFunctionParts(
                  path,
                  bindingNode
                );
                const functionString = generateES5Function(
                  arg.name,
                  functionBody,
                  isAsync,
                  params
                );
                path.node.arguments[0] = t.stringLiteral(functionString);
              }

              // Case 2: Arrow Function or Function Expression Assigned to a Variable
              else if (
                t.isVariableDeclarator(bindingNode) &&
                (t.isArrowFunctionExpression(bindingNode.init) ||
                  t.isFunctionExpression(bindingNode.init))
              ) {
                const { functionBody, params, isAsync } = extractFunctionParts(
                  path,
                  bindingNode.init
                );
                const functionString = generateES5Function(
                  arg.name,
                  functionBody,
                  isAsync,
                  params
                );
                path.node.arguments[0] = t.stringLiteral(functionString);
              }
            }
          }

          // Case 3: Directly Passed Arrow Functions or Function Expressions
          else if (
            t.isArrowFunctionExpression(arg) ||
            t.isFunctionExpression(arg)
          ) {
            const { functionBody, params, isAsync } = extractFunctionParts(
              path,
              arg
            );
            const functionString = generateES5Function(
              'anonymousFunction',
              functionBody,
              isAsync,
              params
            );
            path.node.arguments[0] = t.stringLiteral(functionString);
          }
        }
      },
    },
  };
};

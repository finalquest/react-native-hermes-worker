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
        .map((param) => path.hub.file.code.slice(param.start, param.end))
        .join(', ');
      functionBody = path.hub.file.code
        .slice(node.body.start + 1, node.body.end - 1)
        .trim();
    } else if (t.isArrowFunctionExpression(node)) {
      isAsync = node.async;
      params = node.params
        .map((param) => path.hub.file.code.slice(param.start, param.end))
        .join(', ');
      if (t.isBlockStatement(node.body)) {
        functionBody = path.hub.file.code
          .slice(node.body.start + 1, node.body.end - 1)
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

          // Handle function references (e.g., enqueueItem(funcToRun);)
          if (t.isIdentifier(arg)) {
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

module.exports = function (babel) {
  const { types: t } = babel;

  return {
    visitor: {
      CallExpression(path) {
        if (
          path.node.callee.name === 'enqueueItem' &&
          path.node.arguments.length > 0
        ) {
          const arg = path.node.arguments[0];

          // Handle function references (e.g., enqueueItem(funcToRun);)
          if (t.isIdentifier(arg)) {
            const binding = path.scope.getBinding(arg.name);

            if (binding) {
              const bindingNode = binding.path.node;

              // Case 1: Function Declaration
              if (t.isFunctionDeclaration(bindingNode)) {
                let functionCode = path.hub.file.code.slice(
                  bindingNode.start,
                  bindingNode.end
                );

                // Clean up whitespace & ensure single-line format
                const cleanFunctionCode = functionCode.replace(/\s+/g, ' ');
                const functionString = `${cleanFunctionCode} ${arg.name}();`;

                path.node.arguments[0] = t.stringLiteral(functionString);
              }

              // Case 2: Arrow Function Assigned to a Variable
              else if (
                t.isVariableDeclarator(bindingNode) &&
                t.isArrowFunctionExpression(bindingNode.init)
              ) {
                let functionCode = path.hub.file.code.slice(
                  bindingNode.init.start,
                  bindingNode.init.end
                );

                const functionName = arg.name;

                // Clean up the function formatting first
                const cleanFunctionCode = functionCode.replace(/\s+/g, ' ');
                // Create the complete function string with proper syntax, ensuring () is included
                const functionString = `function ${functionName}() ${cleanFunctionCode.replace(/^\(\s*\)?\s*=>\s*/, '')} ${functionName}();`;

                path.node.arguments[0] = t.stringLiteral(functionString);
              }
            }
          }

          // Case 3: Directly Passed Arrow Functions (Inline Functions)
          else if (
            t.isArrowFunctionExpression(arg) ||
            t.isFunctionExpression(arg)
          ) {
            let functionCode = path.hub.file.code.slice(arg.start, arg.end);

            const funcName = 'anonymousFunction';

            // ✅ Replace inline `() => {}` with `function anonymousFunction() {}`
            functionCode = functionCode.replace(
              /^\(\)?\s*=>\s*/,
              `function ${funcName} `
            );

            // Clean up formatting
            const cleanFunctionCode = functionCode.replace(/\s+/g, ' ');
            const wrappedFunction = `function ${funcName} ${cleanFunctionCode} ${funcName}();`;

            path.node.arguments[0] = t.stringLiteral(wrappedFunction);
          }
        }
      },
    },
  };
};

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

          // Check if the argument is a function identifier (variable holding a function)
          if (t.isIdentifier(arg)) {
            const binding = path.scope.getBinding(arg.name);

            // If the binding exists, check if it's a function declaration or function expression
            if (binding) {
              const bindingNode = binding.path.node;

              if (t.isFunctionDeclaration(bindingNode)) {
                let functionCode = path.hub.file.code.slice(
                  bindingNode.start,
                  bindingNode.end
                );

                // Remove newlines and extra spaces
                const cleanFunctionCode = functionCode
                  .replace(/\n/g, ' ') // Remove newlines
                  .replace(/\s+/g, ' '); // Collapse spaces

                // Use JSON.stringify() to handle escaping properly
                const functionString = JSON.stringify(
                  `${cleanFunctionCode} ${arg.name}();`
                );

                path.node.arguments[0] = t.stringLiteral(
                  functionString.slice(1, -1)
                );
              }

              // If it's a variable declaration with a function expression or arrow function
              else if (
                t.isVariableDeclarator(bindingNode) &&
                (t.isFunctionExpression(bindingNode.init) ||
                  t.isArrowFunctionExpression(bindingNode.init))
              ) {
                let functionCode = path.hub.file.code.slice(
                  bindingNode.init.start,
                  bindingNode.init.end
                );

                // Convert arrow function to function declaration format
                const functionName = arg.name; // Variable name
                const functionDeclaration = `function ${functionName} ${functionCode} ${functionName}();`;

                // Use JSON.stringify() for safe formatting
                const functionString = JSON.stringify(functionDeclaration);

                path.node.arguments[0] = t.stringLiteral(
                  functionString.slice(1, -1)
                );
              }
            }
          }

          // If argument is an inline function (arrow or function expression)
          else if (
            t.isFunctionExpression(arg) ||
            t.isArrowFunctionExpression(arg)
          ) {
            const funcName = arg.id ? arg.id.name : 'anonymousFunction';
            let functionCode = path.hub.file.code.slice(arg.start, arg.end);

            // Remove newlines and extra spaces
            const cleanFunctionCode = functionCode
              .replace(/\n/g, ' ') // Remove newlines
              .replace(/\s+/g, ' '); // Collapse spaces

            // Convert function expression into function declaration
            const wrappedFunction = `function ${funcName} ${cleanFunctionCode} ${funcName}();`;

            // Use JSON.stringify() to handle escaping properly
            const functionString = JSON.stringify(wrappedFunction);

            path.node.arguments[0] = t.stringLiteral(
              functionString.slice(1, -1)
            );
          }
        }
      },
    },
  };
};

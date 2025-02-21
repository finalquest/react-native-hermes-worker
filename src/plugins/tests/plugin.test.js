const pluginTester = require('babel-plugin-tester').default;
const myPlugin = require('../index'); // Import the Babel plugin

pluginTester({
  plugin: myPlugin,
  pluginName: 'babel-plugin-transform-enqueue-item',
  tests: [
    {
      title: 'Transforms function declaration',
      code: `
        function funcToRun() {
          return 12234;
        }
        enqueueItem(funcToRun);
      `,
      output: `
        function funcToRun() {
          return 12234;
        }
        enqueueItem('function funcToRun() { return 12234; } funcToRun();');
      `,
    },
    {
      title: 'Transforms function declaration with return map',
      code: `
        function funcToRun() {
          return {
            test: 'test',
            otroTest: 'otroTest',
          };
        }
        enqueueItem(funcToRun);
      `,
      output: `
        function funcToRun() {
          return {
            test: 'test',
            otroTest: 'otroTest',
          };
        }
        enqueueItem(
          "function funcToRun() { return {\\n    test: 'test',\\n    otroTest: 'otroTest',\\n  }; } funcToRun();"
        );
      `,
    },
    {
      title: 'Transforms arrow function reference',
      code: `
        const funcToRun = () => {
          return 12234;
        };
        enqueueItem(funcToRun);
      `,
      output: `
        const funcToRun = () => {
          return 12234;
        };
        enqueueItem('function funcToRun() { return 12234; } funcToRun();');
      `,
    },
    {
      title: 'Transforms any object method named enqueueItem',
      code: `
        const worker = {
          enqueueItem(func) {
            return func();
          }
        };
        function funcToRun() {
          return 12234;
        }
        worker.enqueueItem(funcToRun);
      `,
      output: `
        const worker = {
          enqueueItem(func) {
            return func();
          },
        };
        function funcToRun() {
          return 12234;
        }
        worker.enqueueItem('function funcToRun() { return 12234; } funcToRun();');
      `,
    },
    {
      title: 'Transforms deeply nested enqueueItem calls',
      code: `
        function funcToRun() {
          return 12234;
        }
        some.deeply.nested.path.enqueueItem(funcToRun);
      `,
      output: `
        function funcToRun() {
          return 12234;
        }
        some.deeply.nested.path.enqueueItem(
          'function funcToRun() { return 12234; } funcToRun();'
        );
      `,
    },
    {
      title:
        'Transforms transpiled _reactNative.NativeModules.HermesWorker.enqueueItem',
      code: `
        function funcToRun() {
          return 12234;
        }
        _reactNative.NativeModules.HermesWorker.enqueueItem(funcToRun);
      `,
      output: `
        function funcToRun() {
          return 12234;
        }
        _reactNative.NativeModules.HermesWorker.enqueueItem(
          'function funcToRun() { return 12234; } funcToRun();'
        );
      `,
    },
    {
      title: 'Handles async functions correctly',
      code: `
        async function asyncFunc() {
          return await Promise.resolve(123);
        }
        NativeModules.HermesWorker.enqueueItem(asyncFunc);
      `,
      output: `
        async function asyncFunc() {
          return await Promise.resolve(123);
        }
        NativeModules.HermesWorker.enqueueItem(
          'async function asyncFunc() { return await Promise.resolve(123); } asyncFunc();'
        );
      `,
    },
    {
      title: 'Handles functions with parameters correctly',
      code: `
        function paramFunc(a, b) {
          return a + b;
        }
        NativeModules.HermesWorker.enqueueItem(paramFunc);
      `,
      output: `
        function paramFunc(a, b) {
          return a + b;
        }
        NativeModules.HermesWorker.enqueueItem(
          'function paramFunc(a, b) { return a + b; } paramFunc();'
        );
      `,
    },
    {
      title: 'Transforms transpiled arrow function',
      code: `
        var loopForeverSync = function loopForeverSync() {
          for (var i = 0; i < 100000000; i++) {}
          return 'pepito';
        };
        enqueueItem(loopForeverSync);
      `,
      output: `
        var loopForeverSync = function loopForeverSync() {
          for (var i = 0; i < 100000000; i++) {}
          return 'pepito';
        };
        enqueueItem(
          "function loopForeverSync() { for (var i = 0; i < 100000000; i++) {}\\n  return 'pepito'; } loopForeverSync();"
        );
      `,
    },
    {
      title: 'Transforms transpiled arrow function with complex logic',
      code: `
        var complexFunc = function complexFunc() {
          var result = [];
          for (var i = 0; i < 10; i++) {
            result.push(i * 2);
          }
          return { data: result, sum: result.reduce(function(a, b) { return a + b; }, 0) };
        };
        enqueueItem(complexFunc);
      `,
      output: `
        var complexFunc = function complexFunc() {
          var result = [];
          for (var i = 0; i < 10; i++) {
            result.push(i * 2);
          }
          return {
            data: result,
            sum: result.reduce(function (a, b) {
              return a + b;
            }, 0),
          };
        };
        enqueueItem(
          'function complexFunc() { var result = [];\\n  for (var i = 0; i < 10; i++) {\\n    result.push(i * 2);\\n  }\\n  return { data: result, sum: result.reduce(function(a, b) { return a + b; }, 0) }; } complexFunc();'
        );
      `,
    },
    {
      title: 'Converts ES6 syntax to ES5 in the generated string',
      code: `
        const loopForeverSync = () => {
          let count = 0;
          for (let i = 0; i < 100000000; i++) {
            count += i;
          }
          return \`Result: \${count}\`;
        };
        _reactNative.NativeModules.HermesWorker.enqueueItem(loopForeverSync);
      `,
      output: `
        const loopForeverSync = () => {
          let count = 0;
          for (let i = 0; i < 100000000; i++) {
            count += i;
          }
          return \`Result: \${count}\`;
        };
        _reactNative.NativeModules.HermesWorker.enqueueItem(
          "function loopForeverSync() { var count = 0;\\n  for (var i = 0; i < 100000000; i++) {\\n    count += i;\\n  }\\n  return 'Result: \${count}'; } loopForeverSync();"
        );
      `,
    },
    {
      title: 'Handles ES6 features in transpiled functions',
      code: `
        var complexFunc = function complexFunc() {
          let items = [];
          const max = 10;
          for (let i = 0; i < max; i++) {
            items.push(\`Item \${i}\`);
          }
          return items;
        };
        enqueueItem(complexFunc);
      `,
      output: `
        var complexFunc = function complexFunc() {
          let items = [];
          const max = 10;
          for (let i = 0; i < max; i++) {
            items.push(\`Item \${i}\`);
          }
          return items;
        };
        enqueueItem(
          "function complexFunc() { var items = [];\\n  var max = 10;\\n  for (var i = 0; i < max; i++) {\\n    items.push('Item \${i}');\\n  }\\n  return items; } complexFunc();"
        );
      `,
    },
  ],
});

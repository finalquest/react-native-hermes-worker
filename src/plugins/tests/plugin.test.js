const pluginTester = require('babel-plugin-tester').default;
const myPlugin = require('../index'); // Import the Babel plugin

pluginTester({
  plugin: myPlugin,
  pluginName: 'babel-plugin-transform-enqueue-item',
  babelOptions: {
    parserOpts: {
      plugins: ['typescript'],
    },
  },
  tests: [
    {
      title: 'Transforms function call with number literal argument',
      code: `
        const loopForever = (count) => {
          for (let i = 0; i < count; i++) {}
          return 'done';
        };
        enqueueItem(loopForever(100000000));
      `,
      output: `
        const loopForever = (count) => {
          for (let i = 0; i < count; i++) {}
          return 'done';
        };
        enqueueItem(
          " function loopForever(count) { for (let i = 0; i < count; i++) {}\\n  return 'done'; } return loopForever(100000000);"
        );
      `,
    },
    {
      title: 'Transforms function call with variable argument',
      code: `
        const amount = 100000000;
        const loopForever = (count) => {
          for (let i = 0; i < count; i++) {}
          return 'done';
        };
        enqueueItem(loopForever(amount));
      `,
      output: `
        const amount = 100000000;
        const loopForever = (count) => {
          for (let i = 0; i < count; i++) {}
          return 'done';
        };
        enqueueItem(
          "const amount = 100000000; function loopForever(count) { for (let i = 0; i < count; i++) {}\\n  return 'done'; } return loopForever(amount);"
        );
      `,
    },
    {
      title: 'Transforms function call with expression argument',
      code: `
        const base = 1000;
        const loopForever = (count) => {
          for (let i = 0; i < count; i++) {}
          return 'done';
        };
        enqueueItem(loopForever(base * 100));
      `,
      output: `
        const base = 1000;
        const loopForever = (count) => {
          for (let i = 0; i < count; i++) {}
          return 'done';
        };
        enqueueItem(
          " function loopForever(count) { for (let i = 0; i < count; i++) {}\\n  return 'done'; } return loopForever(base * 100);"
        );
      `,
    },
    {
      title: 'Transforms function call with multiple arguments',
      code: `
        const processData = (count, label) => {
          for (let i = 0; i < count; i++) {}
          return label;
        };
        enqueueItem(processData(1000, "processing"));
      `,
      output: `
        const processData = (count, label) => {
          for (let i = 0; i < count; i++) {}
          return label;
        };
        enqueueItem(
          ' function processData(count, label) { for (let i = 0; i < count; i++) {}\\n  return label; } return processData(1000, "processing");'
        );
      `,
    },
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
    {
      title: 'Transforms function call with TypeScript types',
      code: `
        const loopForeverSync = (amount: number) => {
          for (let i = 0; i < amount; i++) {}
          return 'pepito';
        };
        enqueueItem(loopForeverSync(100000000));
      `,
      output: `
        const loopForeverSync = (amount: number) => {
          for (let i = 0; i < amount; i++) {}
          return 'pepito';
        };
        enqueueItem(
          " function loopForeverSync(amount) { for (let i = 0; i < amount; i++) {}\\n  return 'pepito'; } return loopForeverSync(100000000);"
        );
      `,
    },
    {
      title: 'Transforms function call with multiple TypeScript types',
      code: `
        const processData = (count: number, label: string) => {
          for (let i = 0; i < count; i++) {}
          return label;
        };
        enqueueItem(processData(1000, "processing"));
      `,
      output: `
        const processData = (count: number, label: string) => {
          for (let i = 0; i < count; i++) {}
          return label;
        };
        enqueueItem(
          ' function processData(count, label) { for (let i = 0; i < count; i++) {}\\n  return label; } return processData(1000, "processing");'
        );
      `,
    },
    {
      title: 'Handles external Hermes context functions - basic case',
      code: `
        import { externalFunc } from 'some-module';
        enqueueItem(externalFunc());
      `,
      output: `
        import { externalFunc } from 'some-module';
        enqueueItem('externalFunc()');
      `,
    },
    {
      title:
        'Handles external Hermes context functions - with literal arguments',
      code: `
        import { externalFunc } from 'some-module';
        enqueueItem(externalFunc(123, "test"));
      `,
      output: `
        import { externalFunc } from 'some-module';
        enqueueItem('externalFunc(123, "test")');
      `,
    },
    {
      title: 'Handles external Hermes context functions - with expressions',
      code: `
        import { processData } from 'worker-functions';
        const count = 1000;
        const label = "processing";
        enqueueItem(processData(count * 2, label + "_task"));
      `,
      output: `
        import { processData } from 'worker-functions';
        const count = 1000;
        const label = 'processing';
        enqueueItem('processData(count * 2, label + "_task")');
      `,
    },
    {
      title: 'Transforms local function with variable expression argument',
      code: `
        const loop = (value) => {
          return value;
        };
        const newValue = 123 + 123;
        enqueueItem(loop(newValue));
      `,
      output: `
        const loop = (value) => {
          return value;
        };
        const newValue = 123 + 123;
        enqueueItem(
          'const newValue = 123 + 123; function loop(value) { return value; } return loop(newValue);'
        );
      `,
    },
  ],
});

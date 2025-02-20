/* eslint-disable no-useless-escape */
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
          return {test: "test", otroTest:"otroTest"};
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
          'function funcToRun() { return {test: \"test\", otroTest:\"otroTest\"}; } funcToRun();'
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
  ],
});

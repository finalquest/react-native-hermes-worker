const path = require('path');

// Set up global to mimic the Hermes environment
global.global = global;

// Load the bundle
const bundlePath = path.join(
  __dirname,
  '../android/src/main/assets/worker.bundle.js'
);
console.log('Loading bundle from:', bundlePath);

try {
  require(bundlePath);

  // Check if transpile function exists
  console.log('\nChecking transpile function...');
  if (typeof global.transpile !== 'function') {
    throw new Error('transpile function not found in global scope');
  }
  console.log('✓ transpile function found');

  // Test the transpile function with some sample JSX
  console.log('\nTesting transpile with sample JSX...');
  const testJSX = `
        function App() {
            return <View><Text>Hello</Text></View>;
        }
    `;

  const result = global.transpile(testJSX);
  console.log('\nInput JSX:', testJSX);
  console.log('\nOutput:', result);
} catch (error) {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
}

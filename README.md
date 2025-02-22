

````markdown
# React Native Hermes Worker

A React Native library that enables JavaScript code execution in a separate thread using the Hermes engine.

## Key Features

- Run JavaScript code in a background thread to avoid blocking the main UI thread
- Uses Hermes engine for JavaScript execution
- Supports both old and new React Native architectures
- Cross-platform support (iOS & Android)
- TypeScript support

## Installation

    ```bash
    npm install react-native-hermes-worker
    # or
    yarn add react-native-hermes-worker
    ```

## Basic Usage

    ```typescript
    import { startProcessingThread, stopProcessingThread, enqueueItem } from 'react-native-hermes-worker';

    // Start the worker thread
    startProcessingThread();

    // Execute code in background
    const result = await enqueueItem(() => {
      // Heavy computation here
      return "computation result";
    });

    // Stop the worker thread when done
    stopProcessingThread();
    ```

## Custom Hermes Bytecode

You can compile custom JavaScript code into Hermes bytecode to initialize the worker thread with predefined functions.

### 1. Create Worker Code

Create a JavaScript file with your worker code:

    ```javascript
    // worker/index.js
    
    // Define functions available to the worker
    function heavyComputation(data) {
      // Your computation logic
      return result;
    }

    // Expose functions to the worker scope
    globalThis.heavyComputation = heavyComputation;
    ```

### 2. Configure Worker Files

Create a `hermes-workers.json` in your project root:

    ```json
    [
      "./src/worker/index.js"
    ]
    ```

### 3. Compile Bytecode

The library will automatically compile your worker files into Hermes bytecode during the build process. The compiled files will be placed in:

- iOS: `ios/assets/index.worker.bundle.hbc`
- Android: `android/app/src/main/assets/index.worker.bundle.hbc`

### 4. Platform-Specific Setup

#### iOS
You need to manually add the `.hbc` file to your Xcode project:

1. Open your project in Xcode
2. Right-click on your project's target
3. Select "Add Files to [YourProject]"
4. Navigate to `ios/assets/`
5. Select `index.worker.bundle.hbc`
6. Make sure "Copy items if needed" is checked
7. Add to your main application target

#### Android
No additional setup required. The asset will be automatically bundled.

### 5. Use Custom Bytecode

    ```typescript
    // Initialize worker with custom bytecode
    // Note: Only pass the base name of your entry file, without extensions
    startProcessingThread('index');  // Will look for 'index.worker.bundle.hbc'

    // Now you can call your predefined functions
    const result = await enqueueItem('heavyComputation(data)');
    ```

## API Reference

### `startProcessingThread(hbcFileName?: string)`

Starts the worker thread. If providing a custom bytecode file, only pass the base name of your entry file (e.g., 'index' for 'index.worker.bundle.hbc'). The library will automatically append the required extensions.

### `stopProcessingThread()`

Stops the worker thread and cleans up resources.

### `enqueueItem(item: string | (() => any))`

Enqueues code to be executed in the worker thread. Accepts either:
- A string containing JavaScript code
- A function to be executed

Returns a Promise that resolves with the execution result.

## Platform Requirements

- iOS 15.1+
- Android API level 24+
- React Native 0.71.0+

## Architecture Support

- Supports both the old and new React Native architectures
- Uses TurboModules when available
- Falls back to the legacy native module system on older versions

## Development Setup

    ```bash
    # Install dependencies
    yarn install

    # Run example app
    yarn example ios
    # or
    yarn example android
    ```

## License

MIT License - see LICENSE file for details

## Contributing

See CONTRIBUTING.md for details on how to contribute to this project.
````

import HermesWorker from './NativeHermesWorker';

export function startProcessingThread(hbcFileName?: string): void {
  HermesWorker.startProcessingThread(hbcFileName);
}

export function stopProcessingThread(): void {
  HermesWorker.stopProcessingThread();
}

export function enqueueItem(item: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      HermesWorker.enqueueItem(item).then((result: string) => {
        if (result.startsWith('Error:')) {
          reject(new Error(result));
        } else {
          resolve(result);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

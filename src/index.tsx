import HermesWorker from './NativeHermesWorker';
import stringValidator from './stringValidator';

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

/**
 * Recursively ensures all string values in the parameter are properly quoted
 * @param param - The parameter to process
 * @returns The processed parameter with properly quoted strings
 */
export function assureStringParam(param: any): any {
  return stringValidator(param);
}

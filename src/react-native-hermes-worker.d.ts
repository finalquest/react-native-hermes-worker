declare module 'react-native-hermes-worker' {
  export function startProcessingThread(hbcFileName: string | null): void;
  export function stopProcessingThread(): void;
  export function enqueueItem(item: string | (() => any)): Promise<string>;
}

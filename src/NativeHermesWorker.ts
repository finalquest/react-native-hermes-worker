import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  startProcessingThread(): void;
  stopProcessingThread(): void;
  enqueueItem(item: string): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('HermesWorker');

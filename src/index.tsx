import HermesWorker from './NativeHermesWorker';

export function multiply(a: number, b: number): number {
  return HermesWorker.multiply(a, b);
}

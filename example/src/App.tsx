import { useEffect, useState } from 'react';
import { View, StyleSheet, Button, Text } from 'react-native';
import {
  startProcessingThread,
  stopProcessingThread,
  enqueueItem,
} from 'react-native-hermes-worker';

// loop for a great amount of time
function funcToRun() {
  return { test: 'test', otroTest: 'otroTest' };
}
// const funcToExec = `
//   funcToRun();
// `;

// const funcToBundle = `
//   pepito(12222222);
// `;

const loopForeverSync = () => {
  return new Promise((resolve) => {
    for (let i = 0; i < 100000000; i++) {}
    resolve('12');
  });
};

export default function App() {
  const [counter, setCounter] = useState(0);
  const [result, setResult] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter((prev) => prev + 1);
    }, 10);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Text>{counter}</Text>
      <Text>{`function result: ${result}`}</Text>
      <Button
        title="Start Processing Thread"
        onPress={() => startProcessingThread('index')}
      />
      <Button
        title="Stop Processing Thread"
        onPress={() => stopProcessingThread()}
      />
      <Button
        title="Enqueue Item function"
        onPress={() => {
          setResult('processing...');

          return enqueueItem(funcToRun).then((res: unknown) => {
            console.log('res', res);
            setResult(res as string);
          });
        }}
      />
      {/* <Button
        title="Enqueue Item execute"
        onPress={() => {
          setResult('processing...');
          return enqueueItem(funcToExec).then((res: string) => {
            setResult(res);
          });
        }}
      />
      <Button
        title="Enqueue Item bundle"
        onPress={() => {
          setResult('processing...');
          return enqueueItem(funcToBundle).then((res: string) => {
            setResult(res);
          });
        }}
      /> */}
      <Button
        title="Enqueue Item sync"
        onPress={() => {
          setResult('processing...');
          loopForeverSync().then((res: any) => {
            setResult(res);
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

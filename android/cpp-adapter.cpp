#include <jni.h>
#include "react-native-hermes-worker.h"

extern "C"
JNIEXPORT jdouble JNICALL
Java_com_hermesworker_HermesWorkerModule_nativeMultiply(JNIEnv *env, jclass type, jdouble a, jdouble b) {
    return hermesworker::multiply(a, b);
}

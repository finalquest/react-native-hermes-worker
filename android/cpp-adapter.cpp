#include <jni.h>
#include "react-native-hermes-worker.h"
#include <mutex>
#include <condition_variable>

extern "C"
JNIEXPORT jboolean JNICALL
Java_com_hermesworker_HermesWorkerModule_nativeIsProcessingThreadRunning(JNIEnv *env, jclass type)
{
    return hermesworker::isProcessingThreadRunning();
}

extern "C"
JNIEXPORT jstring JNICALL
Java_com_hermesworker_HermesWorkerModule_nativeEnqueueItem(JNIEnv *env, jclass type, jstring item)
{
    const char *nativeString = env->GetStringUTFChars(item, 0);
    std::string result;
    
    // Create synchronization primitives
    std::mutex mtx;
    std::condition_variable cv;
    bool ready = false;
    
    hermesworker::enqueueItem(nativeString, [&](bool success, const std::string& response) {
        std::lock_guard<std::mutex> lock(mtx);
        if (success) {
            result = response;
        } else {
            result = "Error: " + response;
        }
        ready = true;
        cv.notify_one();
    });
    
    // Wait for the callback to complete
    std::unique_lock<std::mutex> lock(mtx);
    cv.wait(lock, [&ready]{ return ready; });
    
    env->ReleaseStringUTFChars(item, nativeString);
    return env->NewStringUTF(result.c_str());
}

extern "C"
JNIEXPORT void JNICALL
Java_com_hermesworker_HermesWorkerModule_nativeStartProcessingThread(JNIEnv *env, jclass type, jbyteArray bytecode)
{
    // Get the length of the bytecode array
    jsize length = env->GetArrayLength(bytecode);

    // Get the raw bytecode data
    jbyte *bytecodeData = env->GetByteArrayElements(bytecode, nullptr);

    // Cast the bytecode data to const uint8_t* and pass it to the processing function
    hermesworker::startProcessingThread(
        reinterpret_cast<const uint8_t *>(bytecodeData),
        static_cast<size_t>(length));

    // Release the bytecode array elements
    env->ReleaseByteArrayElements(bytecode, bytecodeData, JNI_ABORT);
}

extern "C"
JNIEXPORT void JNICALL
Java_com_hermesworker_HermesWorkerModule_nativeStopProcessingThread(JNIEnv *env, jclass type)
{
    hermesworker::stopProcessingThread();
}

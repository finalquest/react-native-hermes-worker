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
JNIEXPORT void JNICALL
Java_com_hermesworker_HermesWorkerModule_nativeEnqueueItem(JNIEnv *env, jclass type, jstring item, jobject callback)
{
    const char *nativeString = env->GetStringUTFChars(item, 0);
    
    // Get the callback class and methods
    jclass callbackClass = env->GetObjectClass(callback);
    jmethodID onSuccessMethod = env->GetMethodID(callbackClass, "onSuccess", "(Ljava/lang/String;)V");
    jmethodID onErrorMethod = env->GetMethodID(callbackClass, "onError", "(Ljava/lang/String;)V");
    
    // Create global references for use in the worker thread
    jobject globalCallback = env->NewGlobalRef(callback);
    JavaVM* jvm;
    env->GetJavaVM(&jvm);
    
    hermesworker::enqueueItem(nativeString, [jvm, globalCallback, onSuccessMethod, onErrorMethod](bool success, const std::string& response) {
        JNIEnv* env;
        jvm->AttachCurrentThread(&env, nullptr);
        
        jstring jResponse = env->NewStringUTF(response.c_str());
        if (success) {
            env->CallVoidMethod(globalCallback, onSuccessMethod, jResponse);
        } else {
            env->CallVoidMethod(globalCallback, onErrorMethod, jResponse);
        }
        
        env->DeleteLocalRef(jResponse);
        env->DeleteGlobalRef(globalCallback);
        jvm->DetachCurrentThread();
    });
    
    env->ReleaseStringUTFChars(item, nativeString);
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

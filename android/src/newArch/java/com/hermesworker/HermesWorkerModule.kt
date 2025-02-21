package com.hermesworker

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.bridge.Promise
import android.util.Log
import java.io.IOException

@ReactModule(name = HermesWorkerModule.NAME)
class HermesWorkerModule(reactContext: ReactApplicationContext) :
  NativeHermesWorkerSpec(reactContext) {
  
  external fun nativeEnqueueItem(item: String): String
  external fun nativeStartProcessingThread(bytecode: ByteArray)
  external fun nativeStopProcessingThread()
  external fun nativeIsProcessingThreadRunning(): Boolean     

  override fun getName(): String {
    return NAME
  }

  companion object {
    const val NAME = "HermesWorker"
    init {
        System.loadLibrary("HermesWorker")
    }
  }

  override fun enqueueItem(item: String, promise: Promise) {
    if (!nativeIsProcessingThreadRunning()) {
        Log.d(NAME, "Processing thread not running. Starting with default runtime")
        nativeStartProcessingThread(ByteArray(0))
    }
    try {
        Log.d(NAME, "Processing item Module")
        val result = nativeEnqueueItem(item)
        promise.resolve(result)
    } catch (e: Exception) {
        promise.reject("ENQUEUE_ERROR", e)
    }
  }

  override fun startProcessingThread(fileName: String?) {
      try {
        if (nativeIsProcessingThreadRunning()) {
              Log.d(NAME, "Processing thread already running")
              return
          }
          
        Log.d(NAME, "Starting processing thread")
        
        if (fileName == null) {
            nativeStartProcessingThread(ByteArray(0))
            return
        }

        val bundlePath = "$fileName.worker.bundle.hbc" 
        val bytecode = loadBytecodeFromBundle(bundlePath)

        if (bytecode != null) {
            nativeStartProcessingThread(bytecode)
        } else {
            System.err.println("Error: Could not load worker.bundle.hbc")
        }
      } catch (e: Exception) {
          Log.e(NAME, "Error starting processing thread", e)
          // Handle error if needed
      }
  }

  override fun stopProcessingThread() {
      try {
          nativeStopProcessingThread()
      } catch (e: Exception) {
          // Handle error if needed
      }
  }

  private fun loadBytecodeFromBundle(bundlePath: String): ByteArray? {
      return try {
          val inputStream = reactApplicationContext.assets.open(bundlePath)
          inputStream.use { it.readBytes() }
      } catch (e: IOException) {
          e.printStackTrace()
          null
      }
  }
}

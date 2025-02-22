package com.hermesworker

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.bridge.Promise
import android.util.Log
import java.io.IOException

interface HermesCallback {
    fun onSuccess(result: String)
    fun onError(error: String)
}

@ReactModule(name = HermesWorkerModule.NAME)
class HermesWorkerModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  
  external fun nativeEnqueueItem(item: String, callback: HermesCallback)
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

  @ReactMethod
  fun enqueueItem(item: String, promise: Promise) {
    if (!nativeIsProcessingThreadRunning()) {
        Log.d(NAME, "Processing thread not running. Starting with default runtime")
        nativeStartProcessingThread(ByteArray(0))
    }
    
    // Create a callback object that will handle the eventual result
    val callback = object : HermesCallback {
        override fun onSuccess(result: String) {
            // This will be called later when C++ finishes processing
            promise.resolve(result)
        }
        
        override fun onError(error: String) {
            // This will be called later if C++ encounters an error
            promise.reject("PROCESSING_ERROR", error)
        }
    }
    
    // Pass both the item and the callback to the native code
    nativeEnqueueItem(item, callback)
  }

  @ReactMethod
  fun startProcessingThread(fileName: String?) {
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

  @ReactMethod
  fun stopProcessingThread() {
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

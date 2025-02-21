package com.hermesworker

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import java.util.HashMap
import android.util.Log

class HermesWorkerPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    Log.d("HermesWorkerModule", "getModule called with name: $name")
    return if (name == HermesWorkerModule.NAME) {
      Log.d("HermesWorkerModule", "Creating new HermesWorkerModule instance")
      HermesWorkerModule(reactContext)
    } else {
      Log.d("HermesWorkerModule", "Module name not matched, returning null")
      null
    }
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      val moduleInfos: MutableMap<String, ReactModuleInfo> = HashMap()
      val isTurboModule = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      Log.d("HermesWorkerModule", "Initializing module with isTurboModule: $isTurboModule")

      moduleInfos[HermesWorkerModule.NAME] = ReactModuleInfo(
                            HermesWorkerModule.NAME,
                            HermesWorkerModule.NAME,
                            false, // canOverrideExistingModule
                            false, // needsEagerInit
                            true, // hasConstants
                            false, // isCxxModule
                            isTurboModule // isTurboModule
      )
      Log.d("HermesWorkerModule", "Module info created: ${moduleInfos[HermesWorkerModule.NAME]}")
      moduleInfos
    }
  }
}

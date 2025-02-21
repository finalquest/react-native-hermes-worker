#import "HermesWorker.h"

@implementation HermesWorker
RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(startProcessingThread:(NSString *)hbcFileName) {
    
    if (hermesworker::isProcessingThreadRunning()) {
        NSLog(@"Processing thread already running");
        return;
    }
    if(hbcFileName == nil) {
        hermesworker::startProcessingThread(nullptr, 0);
        return;
    }
    // Load bytecode bundle
    NSString *bundlePath = [[NSBundle mainBundle] pathForResource:hbcFileName ofType:@".worker.bundle.hbc"];
    if (!bundlePath) {
        NSLog(@"Error: Could not find worker.bundle.hbc");
        return;
    }
    
    NSData *bundleData = [NSData dataWithContentsOfFile:bundlePath];
    if (!bundleData) {
        NSLog(@"Error: Could not load worker.bundle.hbc");
        return;
    }
    
    // Pass the raw bytecode to C++
  hermesworker::startProcessingThread(
        static_cast<const uint8_t*>(bundleData.bytes),
        bundleData.length
                                      );

}

RCT_EXPORT_METHOD(stopProcessingThread) {
  hermesworker::stopProcessingThread();
}

RCT_EXPORT_METHOD(enqueueItem:(NSString *)item
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        //if not running, lets start it
        if (!hermesworker::isProcessingThreadRunning()) {
            hermesworker::startProcessingThread(nullptr, 0);
        }
        try {
            std::string cppString = [item UTF8String];
            hermesworker::enqueueItem(cppString, 
                [resolve, reject](bool success, const std::string result) {
                    dispatch_async(dispatch_get_main_queue(), ^{
                        if (success) {
                            NSString *nsResult = [NSString stringWithUTF8String:result.c_str()];
                            if (!nsResult) {
                                reject(@"ENCODING_ERROR", @"Failed to decode result string", nil);
                                return;
                            }
                            resolve(nsResult);
                        } else {
                            NSString *errorMessage = [NSString stringWithUTF8String:result.c_str()];
                            reject(@"PROCESSING_ERROR", errorMessage, nil);
                        }
                    });
                }
            );
        } catch (const std::exception& e) {
            dispatch_async(dispatch_get_main_queue(), ^{
                reject(@"ENQUEUE_ERROR", @"Failed to enqueue item", nil);
            });
        }
    });
}

// Don't compile this code when we build for the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule: (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeHermesWorkerSpecJSI>(params);
}
#endif

@end

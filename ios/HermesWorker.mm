#import "HermesWorker.h"

@implementation HermesWorker
RCT_EXPORT_MODULE()

// New methods
RCT_EXPORT_METHOD(startProcessingThread) {
  if (hermesworker::isProcessingThreadRunning()) {
    NSLog(@"Processing thread already running");
    return;
  }
  hermesworker::startProcessingThread();
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
            hermesworker::startProcessingThread();
        }
        try {
            std::string cppString = [item UTF8String];
            hermesworker::enqueueItem(cppString, 
                [resolve, reject](bool success, const std::string& result) {
                    dispatch_async(dispatch_get_main_queue(), ^{
                        if (success) {
                            NSString *nsResult = [NSString stringWithUTF8String:result.c_str()];
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

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule: (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeHermesWorkerSpecJSI>(params);
}

@end

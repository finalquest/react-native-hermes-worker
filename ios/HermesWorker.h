#ifdef __cplusplus
#import "react-native-hermes-worker.h"
#endif

#if RCT_NEW_ARCH_ENABLED
#import "generated/RNHermesWorkerSpec/RNHermesWorkerSpec.h"
#else
#import <React/RCTBridgeModule.h>
#endif

@interface HermesWorker : NSObject
#if RCT_NEW_ARCH_ENABLED
<NativeHermesWorkerSpec>
#else
<RCTBridgeModule>
#endif
@end


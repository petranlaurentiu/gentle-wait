//
//  GentleWaitModule.m
//  GentleWait iOS Native Module Bridge
//
//  Objective-C bridge file for React Native
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(GentleWaitModule, NSObject)

// Family Controls Authorization
RCT_EXTERN_METHOD(isFamilyControlsAuthorized:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(requestFamilyControlsAuthorization:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

// Selected Apps Management
RCT_EXTERN_METHOD(setSelectedApps:(NSArray<NSString *> *)bundleIds
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getSelectedApps:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

// Pending Interception
RCT_EXTERN_METHOD(getPendingInterception:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setPendingInterception:(NSString *)bundleId
                  label:(NSString *)label
                  timestamp:(double)timestamp
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(markAppHandled:(NSString *)bundleId
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

// App Launch
RCT_EXTERN_METHOD(launchApp:(NSString *)bundleId
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

// Utility Methods
RCT_EXTERN_METHOD(clearPendingInterception:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end

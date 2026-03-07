//
//  GentleWaitModule.swift
//  GentleWait iOS Native Module
//
//  Provides Family Controls and DeviceActivity integration for app interception
//

import Foundation
import React
import FamilyControls
import ManagedSettings
import DeviceActivity

@objc(GentleWaitModule)
class GentleWaitModule: NSObject {
  
  private let authCenter = AuthorizationCenter.shared
  private let userDefaults = UserDefaults.standard
  
  // Keys for UserDefaults
  private let selectedAppsKey = "selected_apps"
  private let pendingAppBundleIdKey = "pending_app_bundle_id"
  private let pendingAppLabelKey = "pending_app_label"
  private let pendingAppTsKey = "pending_app_ts"
  
  // MARK: - Family Controls Authorization
  
  @objc
  func isFamilyControlsAuthorized(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      let status = self.authCenter.authorizationStatus
      let isAuthorized = status == .approved
      resolve(isAuthorized)
    }
  }
  
  @objc
  func requestFamilyControlsAuthorization(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    Task {
      do {
        try await authCenter.requestAuthorization(for: .individual)
        let isAuthorized = authCenter.authorizationStatus == .approved
        DispatchQueue.main.async {
          resolve(isAuthorized)
        }
      } catch {
        DispatchQueue.main.async {
          reject("AUTHORIZATION_FAILED", "Failed to request Family Controls authorization: \(error.localizedDescription)", error)
        }
      }
    }
  }
  
  // MARK: - Selected Apps Management
  
  @objc
  func setSelectedApps(_ bundleIds: [String], resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    do {
      let jsonData = try JSONSerialization.data(withJSONObject: bundleIds, options: [])
      if let jsonString = String(data: jsonData, encoding: .utf8) {
        userDefaults.set(jsonString, forKey: selectedAppsKey)
        userDefaults.synchronize()
        NSLog("[GentleWait] Saved selected apps: \(bundleIds)")
        resolve(true)
      } else {
        reject("SERIALIZATION_FAILED", "Failed to serialize bundle IDs", nil)
      }
    } catch {
      reject("SERIALIZATION_FAILED", "Failed to serialize bundle IDs: \(error.localizedDescription)", error)
    }
  }
  
  @objc
  func getSelectedApps(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    if let jsonString = userDefaults.string(forKey: selectedAppsKey) {
      resolve(jsonString)
    } else {
      resolve("[]")
    }
  }
  
  // MARK: - Pending Interception
  
  @objc
  func getPendingInterception(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard let bundleId = userDefaults.string(forKey: pendingAppBundleIdKey),
          let label = userDefaults.string(forKey: pendingAppLabelKey),
          let ts = userDefaults.object(forKey: pendingAppTsKey) as? Double,
          ts > 0 else {
      resolve(NSNull())
      return
    }
    
    let result: [String: Any] = [
      "appPackage": bundleId,
      "appLabel": label,
      "ts": ts
    ]
    
    resolve(result)
  }
  
  @objc
  func setPendingInterception(_ bundleId: String, label: String, timestamp: Double, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    userDefaults.set(bundleId, forKey: pendingAppBundleIdKey)
    userDefaults.set(label, forKey: pendingAppLabelKey)
    userDefaults.set(timestamp, forKey: pendingAppTsKey)
    userDefaults.synchronize()
    
    NSLog("[GentleWait] Set pending interception: \(bundleId) - \(label)")
    resolve(true)
  }
  
  @objc
  func markAppHandled(_ bundleId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // Clear pending interception
    let pendingBundleId = userDefaults.string(forKey: pendingAppBundleIdKey)
    
    if pendingBundleId == bundleId {
      userDefaults.removeObject(forKey: pendingAppBundleIdKey)
      userDefaults.removeObject(forKey: pendingAppLabelKey)
      userDefaults.removeObject(forKey: pendingAppTsKey)
    }
    
    // Mark app as handled with timestamp
    let handledKey = "handled_\(bundleId)"
    let currentTime = Date().timeIntervalSince1970 * 1000 // milliseconds
    userDefaults.set(currentTime, forKey: handledKey)
    userDefaults.synchronize()
    
    NSLog("[GentleWait] Marked app as handled: \(bundleId)")
    resolve(true)
  }
  
  // MARK: - App Launch
  
  @objc
  func launchApp(_ bundleId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // iOS doesn't allow direct app launching by bundle ID from third-party apps
    // This is a limitation of iOS security model
    // Best we can do is open a URL scheme if we know it
    
    // For now, we'll just mark it as not supported
    reject("NOT_SUPPORTED", "Direct app launching is not supported on iOS", nil)
  }
  
  // MARK: - Utility Methods
  
  @objc
  func clearPendingInterception(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    userDefaults.removeObject(forKey: pendingAppBundleIdKey)
    userDefaults.removeObject(forKey: pendingAppLabelKey)
    userDefaults.removeObject(forKey: pendingAppTsKey)
    userDefaults.synchronize()
    resolve(true)
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
}

package com.screensharing;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

/**
 * 屏幕捕获原生模块
 * 处理 Android MediaProjection API
 */
@ReactModule(name = ScreenCaptureModule.NAME)
public class ScreenCaptureModule extends ReactContextBaseJavaModule {
    public static final String NAME = "ScreenCaptureModule";
    private static final String TAG = "ScreenCaptureModule";
    private static final int REQUEST_SCREEN_CAPTURE = 1001;

    private final ReactApplicationContext reactContext;
    private MediaProjectionManager projectionManager;
    private Promise screenCapturePromise;

    private final ActivityEventListener activityEventListener = new BaseActivityEventListener() {
        @Override
        public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
            if (requestCode == REQUEST_SCREEN_CAPTURE) {
                if (screenCapturePromise != null) {
                    if (resultCode == Activity.RESULT_OK) {
                        Log.d(TAG, "屏幕捕获权限已授予");
                        screenCapturePromise.resolve(true);
                    } else {
                        Log.d(TAG, "屏幕捕获权限被拒绝");
                        screenCapturePromise.resolve(false);
                    }
                    screenCapturePromise = null;
                }
            }
        }
    };

    public ScreenCaptureModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        reactContext.addActivityEventListener(activityEventListener);
        
        projectionManager = (MediaProjectionManager) reactContext
                .getSystemService(Context.MEDIA_PROJECTION_SERVICE);
    }

    @Override
    @NonNull
    public String getName() {
        return NAME;
    }

    /**
     * 请求屏幕捕获权限
     * 
     * @param promise 异步 Promise
     */
    @ReactMethod
    public void requestScreenCapturePermission(Promise promise) {
        Activity currentActivity = getCurrentActivity();
        
        if (currentActivity == null) {
            promise.reject("ERROR", "当前 Activity 不可用");
            return;
        }

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
            promise.reject("ERROR", "需要 Android 5.0 或更高版本");
            return;
        }

        if (projectionManager == null) {
            promise.reject("ERROR", "MediaProjectionManager 不可用");
            return;
        }

        screenCapturePromise = promise;
        
        try {
            Intent captureIntent = projectionManager.createScreenCaptureIntent();
            currentActivity.startActivityForResult(captureIntent, REQUEST_SCREEN_CAPTURE);
            Log.d(TAG, "已启动屏幕捕获权限请求");
        } catch (Exception e) {
            Log.e(TAG, "启动屏幕捕获权限请求失败", e);
            screenCapturePromise = null;
            promise.reject("ERROR", "启动屏幕捕获权限请求失败: " + e.getMessage());
        }
    }

    /**
     * 检查是否支持屏幕捕获
     * 
     * @param promise 异步 Promise
     */
    @ReactMethod
    public void isScreenCaptureSupported(Promise promise) {
        promise.resolve(Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP);
    }

    /**
     * 获取 Android API 版本
     * 
     * @param promise 异步 Promise
     */
    @ReactMethod
    public void getApiLevel(Promise promise) {
        promise.resolve(Build.VERSION.SDK_INT);
    }
}

package com.speechtotext.audiomodule;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class AudioCaptureModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "AudioCaptureModule";
    private static final int REQUEST_MEDIA_PROJECTION = 1001;
    private static final String TAG = "AudioCaptureModule";

    private MediaProjectionManager mediaProjectionManager;
    private MediaProjection mediaProjection;
    private Promise requestPromise;
    private AudioCaptureService audioCaptureService;
    private boolean isCapturing = false;

    // Activity event listener to handle permission results
    private final ActivityEventListener activityEventListener = new BaseActivityEventListener() {
        @Override
        public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
            if (requestCode == REQUEST_MEDIA_PROJECTION) {
                if (resultCode == Activity.RESULT_OK && data != null) {
                    // User granted permission for media projection
                    startAudioCapture(resultCode, data);
                    if (requestPromise != null) {
                        requestPromise.resolve(true);
                        requestPromise = null;
                    }
                } else {
                    // User denied permission
                    if (requestPromise != null) {
                        requestPromise.reject("USER_DENIED", "User denied screen capture permission");
                        requestPromise = null;
                    }
                }
            }
        }
    };

    public AudioCaptureModule(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addActivityEventListener(activityEventListener);
        mediaProjectionManager = (MediaProjectionManager) reactContext.getSystemService(Context.MEDIA_PROJECTION_SERVICE);
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void requestAudioCapturePermission(Promise promise) {
        Activity currentActivity = getCurrentActivity();

        if (currentActivity == null) {
            promise.reject("ACTIVITY_NOT_FOUND", "Activity is not available");
            return;
        }

        // Store the promise to resolve/reject in the activity result callback
        requestPromise = promise;

        // Request media projection permission
        Intent captureIntent = mediaProjectionManager.createScreenCaptureIntent();
        currentActivity.startActivityForResult(captureIntent, REQUEST_MEDIA_PROJECTION);
    }

    private void startAudioCapture(int resultCode, Intent data) {
        try {
            // Create the media projection
            mediaProjection = mediaProjectionManager.getMediaProjection(resultCode, data);
            if (mediaProjection == null) {
                Log.e(TAG, "Failed to create media projection");
                return;
            }

            // Start the audio capture service
            Context context = getReactApplicationContext();
            Intent serviceIntent = new Intent(context, AudioCaptureService.class);
            serviceIntent.putExtra("resultCode", resultCode);
            serviceIntent.putExtra("data", data);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }

            isCapturing = true;
            sendEvent("onAudioCaptureStart", null);
        } catch (Exception e) {
            Log.e(TAG, "Error starting audio capture: " + e.getMessage());
            sendEvent("onAudioCaptureError", e.getMessage());
        }
    }

    @ReactMethod
    public void stopAudioCapture(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            Intent serviceIntent = new Intent(context, AudioCaptureService.class);
            context.stopService(serviceIntent);

            if (mediaProjection != null) {
                mediaProjection.stop();
                mediaProjection = null;
            }

            isCapturing = false;
            sendEvent("onAudioCaptureStop", null);
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error stopping audio capture: " + e.getMessage());
            promise.reject("STOP_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void isCapturing(Promise promise) {
        promise.resolve(isCapturing);
    }

    // Send events to JavaScript
    private void sendEvent(String eventName, @Nullable Object params) {
        getReactApplicationContext()
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
    }
}

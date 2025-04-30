package com.speechtotext.audiomodule;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.os.IBinder;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.ArrayList;
import java.util.Locale;

public class AudioCaptureService extends Service {
    private static final String TAG = "AudioCaptureService";
    private static final int NOTIFICATION_ID = 123456;
    private static final String CHANNEL_ID = "AudioCaptureChannel";

    private MediaProjection mediaProjection;
    private AudioRecord audioRecord;
    private SpeechRecognizer speechRecognizer;
    private boolean isCapturing = false;
    private String selectedLanguage = "en-US";
    
    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            stopSelf();
            return START_NOT_STICKY;
        }

        // Get the language from intent if provided
        if (intent.hasExtra("language")) {
            selectedLanguage = intent.getStringExtra("language");
        }

        // Initialize the media projection
        int resultCode = intent.getIntExtra("resultCode", -1);
        Intent data = intent.getParcelableExtra("data");

        if (resultCode != -1 && data != null) {
            MediaProjectionManager projectionManager = 
                    (MediaProjectionManager) getSystemService(Context.MEDIA_PROJECTION_SERVICE);
            mediaProjection = projectionManager.getMediaProjection(resultCode, data);

            startForeground(NOTIFICATION_ID, createNotification());
            startAudioCapture();
            return START_STICKY;
        } else {
            stopSelf();
            return START_NOT_STICKY;
        }
    }

    private void startAudioCapture() {
        if (mediaProjection == null) {
            Log.e(TAG, "Media projection is null");
            stopSelf();
            return;
        }

        try {
            // Initialize speech recognizer
            initializeSpeechRecognizer();
            
            // Start continuous recognition
            startContinuousRecognition();
            
            isCapturing = true;
            sendEvent("onAudioCaptureStarted", null);
        } catch (Exception e) {
            Log.e(TAG, "Error starting audio capture: " + e.getMessage());
            sendEvent("onAudioCaptureError", e.getMessage());
            stopSelf();
        }
    }

    private void initializeSpeechRecognizer() {
        if (SpeechRecognizer.isRecognitionAvailable(this)) {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this);
            speechRecognizer.setRecognitionListener(new RecognitionListener() {
                @Override
                public void onReadyForSpeech(android.os.Bundle bundle) {
                    sendEvent("onReadyForSpeech", null);
                }

                @Override
                public void onBeginningOfSpeech() {
                    sendEvent("onBeginningOfSpeech", null);
                }

                @Override
                public void onRmsChanged(float v) {
                    // Optionally send volume level
                }

                @Override
                public void onBufferReceived(byte[] bytes) {
                    // Not used
                }

                @Override
                public void onEndOfSpeech() {
                    // When speech input ends, restart listening for continuous recognition
                    startContinuousRecognition();
                }

                @Override
                public void onError(int i) {
                    WritableMap params = Arguments.createMap();
                    params.putInt("error", i);
                    sendEvent("onSpeechError", params);
                    
                    // Restart recognition after error
                    startContinuousRecognition();
                }

                @Override
                public void onResults(android.os.Bundle bundle) {
                    ArrayList<String> results = bundle.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    if (results != null && !results.isEmpty()) {
                        WritableMap params = Arguments.createMap();
                        params.putString("transcript", results.get(0));
                        params.putBoolean("isFinal", true);
                        sendEvent("onTranscriptResult", params);
                    }
                    
                    // Restart listening
                    startContinuousRecognition();
                }

                @Override
                public void onPartialResults(android.os.Bundle bundle) {
                    ArrayList<String> results = bundle.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    if (results != null && !results.isEmpty()) {
                        WritableMap params = Arguments.createMap();
                        params.putString("transcript", results.get(0));
                        params.putBoolean("isFinal", false);
                        sendEvent("onTranscriptResult", params);
                    }
                }

                @Override
                public void onEvent(int i, android.os.Bundle bundle) {
                    // Not used
                }
            });
        } else {
            Log.e(TAG, "Speech recognition not available on this device");
            sendEvent("onAudioCaptureError", "Speech recognition not available on this device");
            stopSelf();
        }
    }

    private void startContinuousRecognition() {
        if (speechRecognizer != null) {
            try {
                Intent recognizerIntent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                recognizerIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                
                // Set language based on selected option
                if ("auto".equals(selectedLanguage)) {
                    recognizerIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                } else if (selectedLanguage.startsWith("es")) {
                    recognizerIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "es-ES");
                    recognizerIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "es-ES");
                } else {
                    // Default to English
                    recognizerIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-US");
                    recognizerIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "en-US");
                }
                
                recognizerIntent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
                recognizerIntent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
                speechRecognizer.startListening(recognizerIntent);
            } catch (Exception e) {
                Log.e(TAG, "Error starting recognition: " + e.getMessage());
            }
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopAudioCapture();
    }

    private void stopAudioCapture() {
        if (speechRecognizer != null) {
            speechRecognizer.stopListening();
            speechRecognizer.cancel();
            speechRecognizer.destroy();
            speechRecognizer = null;
        }

        if (audioRecord != null) {
            if (audioRecord.getRecordingState() == AudioRecord.RECORDSTATE_RECORDING) {
                audioRecord.stop();
            }
            audioRecord.release();
            audioRecord = null;
        }

        if (mediaProjection != null) {
            mediaProjection.stop();
            mediaProjection = null;
        }

        isCapturing = false;
        sendEvent("onAudioCaptureStopped", null);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "Audio Capture";
            String description = "Audio capture for speech recognition";
            int importance = NotificationManager.IMPORTANCE_LOW;
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, name, importance);
            channel.setDescription(description);

            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    private Notification createNotification() {
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Meeting Transcription")
                .setContentText("Capturing audio for meeting transcription")
                .setSmallIcon(android.R.drawable.ic_btn_speak_now)
                .setPriority(NotificationCompat.PRIORITY_LOW);

        return builder.build();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    // Send events to React Native
    private void sendEvent(String eventName, @Nullable Object params) {
        try {
            ReactInstanceManager reactInstanceManager = 
                    ((ReactApplication) getApplication()).getReactNativeHost().getReactInstanceManager();
            ReactContext reactContext = reactInstanceManager.getCurrentReactContext();

            if (reactContext != null) {
                reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit(eventName, params);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error sending event: " + e.getMessage());
        }
    }

    // Helper method to change language
    public void setLanguage(String language) {
        this.selectedLanguage = language;
        // If currently running, restart with new language
        if (isCapturing && speechRecognizer != null) {
            speechRecognizer.stopListening();
            startContinuousRecognition();
        }
    }
}

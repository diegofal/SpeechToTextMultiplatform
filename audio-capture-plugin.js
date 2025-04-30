// Audio Capture Plugin for Expo Config
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function audioCapturePlugin(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];
    
    // Ensure we have the permissions necessary for audio capture
    const permissions = [
      'android.permission.RECORD_AUDIO',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION'
    ];
    
    if (!androidManifest.manifest['uses-permission']) {
      androidManifest.manifest['uses-permission'] = [];
    }
    
    // Add each permission if it doesn't exist
    permissions.forEach(permission => {
      if (!androidManifest.manifest['uses-permission'].some(item => item.$['android:name'] === permission)) {
        androidManifest.manifest['uses-permission'].push({
          $: {
            'android:name': permission
          }
        });
      }
    });
    
    // Add the service if it doesn't exist
    if (!mainApplication['service']) {
      mainApplication['service'] = [];
    }
    
    const serviceExists = mainApplication['service'].some(
      service => service.$['android:name'] === '.audiomodule.AudioCaptureService'
    );
    
    if (!serviceExists) {
      mainApplication['service'].push({
        $: {
          'android:name': '.audiomodule.AudioCaptureService',
          'android:exported': 'false',
          'android:foregroundServiceType': 'mediaProjection'
        }
      });
    }
    
    return config;
  });
};

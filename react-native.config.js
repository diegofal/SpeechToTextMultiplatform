module.exports = {
  dependencies: {
    'audio-capture-module': {
      root: __dirname,
      platforms: {
        android: {
          sourceDir: './android',
          packageImportPath: 'import com.speechtotext.audiomodule.AudioCapturePackage;',
          packageInstance: 'new AudioCapturePackage()'
        }
      }
    }
  }
};

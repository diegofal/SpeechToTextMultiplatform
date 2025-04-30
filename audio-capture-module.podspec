require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'audio-capture-module'
  s.version        = package['version']
  s.summary        = package['description'] || 'Native audio capture module for React Native'
  s.description    = package['description'] || 'Native audio capture module for React Native'
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage'] || 'https://github.com/author/react-native-audio-capture-module'
  s.platform       = :ios, '13.0'
  s.swift_version  = '5.0'
  s.source         = { git: 'https://github.com/author/react-native-audio-capture-module.git', tag: "#{s.version}" }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
  
  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.requires_arc = true
end

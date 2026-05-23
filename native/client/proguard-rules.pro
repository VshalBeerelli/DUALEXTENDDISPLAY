# AeroDisplay Proguard Keep Rules
# Prevents obfuscation/pruning of critical JNI and hardware MediaCodec callbacks.

-keepattributes Signature,InnerClasses,SourceFile,LineNumberTable

# Preserve native JNI library references and matching methods
-keepclasseswithmembers class * {
    native <methods>;
}

# Keep the Android NDK runtime bridge references
-keep class com.aerodisplay.client.HardwareDecoder {
    *;
}
-keep class com.aerodisplay.client.GpuRenderer {
    *;
}

# Preserve Android framework codecs
-keep class android.media.MediaCodec { *; }
-keep class android.media.MediaFormat { *; }
-keep class android.view.Surface { *; }

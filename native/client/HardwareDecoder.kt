/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Android NDK and SDK Mobile Hardware H.264/H.265 MediaCodec Decoder.
 */

package com.duetcast.client.decoder

import android.media.MediaCodec
import android.media.MediaFormat
import android.view.Surface
import java.nio.ByteBuffer

class AndroidHardwareDecoder {
    private var mediaCodec: MediaCodec? = null
    private var isInitialized = false

    // Initialize Android's hardware decoder pipeline
    @Synchronized
    fun initializeDecoder(surface: Surface, width: Int, height: Int, isH265: Boolean): Boolean {
        try {
            val mimeType = if (isH265) MediaFormat.MIMETYPE_VIDEO_HEVC else MediaFormat.MIMETYPE_VIDEO_AVC
            val format = MediaFormat.createVideoFormat(mimeType, width, height)
            
            // Set high performance low-latency configuration tags
            format.setInteger(MediaFormat.KEY_COLOR_FORMAT, 21) // COLOR_FormatYUV420SemiPlanar
            format.setInteger(MediaFormat.KEY_LATENCY, 1)        // Enforce ultra low-delay decoding
            format.setInteger(MediaFormat.KEY_PRIORITY, 0)       // Maximum real-time priority rank

            mediaCodec = MediaCodec.createDecoderByType(mimeType)
            mediaCodec?.configure(format, surface, null, 0)
            mediaCodec?.start()

            isInitialized = true
            return true
        } catch (e: Exception) {
            e.printStackTrace()
            return false
        }
    }

    // Puts the compressed frame chunk straight into the GPU pipeline
    fun queueEncodedNALSlice(sliceBytes: ByteArray, timestampUs: Long) {
        if (!isInitialized) return
        val codec = mediaCodec ?: return

        try {
            val inputBufferIndex = codec.dequeueInputBuffer(1000) // 1ms wait ceiling
            if (inputBufferIndex >= 0) {
                // Fetch input buffer address via NDK native pointers
                val inputBuffer = codec.getInputBuffer(inputBufferIndex) ?: return
                inputBuffer.clear()
                inputBuffer.put(sliceBytes)
                
                codec.queueInputBuffer(
                    inputBufferIndex, 
                    0, 
                    sliceBytes.size, 
                    timestampUs, 
                    0
                )
            }

            // Flush completed textures straight onto rendering surface overlays
            val bufferInfo = MediaCodec.BufferInfo()
            var outputBufferIndex = codec.dequeueOutputBuffer(bufferInfo, 0)
            while (outputBufferIndex >= 0) {
                // Pass true to tell MediaCodec to immediately render this texture into the EGL window context
                codec.releaseOutputBuffer(outputBufferIndex, true)
                outputBufferIndex = codec.dequeueOutputBuffer(bufferInfo, 0)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @Synchronized
    fun release() {
        if (isInitialized) {
            mediaCodec?.stop()
            mediaCodec?.release()
            mediaCodec = null
            isInitialized = false
        }
    }
}

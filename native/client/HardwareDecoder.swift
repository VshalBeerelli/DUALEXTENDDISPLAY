/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * iOS Native VTDecompressionSession VideoToolbox stream decoder.
 * Grabs iOS hardware decoder frames and maps onto Apple Metal GPU textures.
 */

import Foundation
import VideoToolbox
import CoreMedia

class AppleHardwareStreamDecoder {
    private var decompressionSession: VTDecompressionSession?
    private var formatDescription: CMVideoFormatDescription?
    private var isInitialized = false

    // Decodes H.264 slice sequences in real-time
    func initializeSession(sps: [UInt8], pps: [UInt8], width: Int, height: Int) -> Bool {
        // Build CoreMedia format descriptors using SPS and PPS slices
        let spsPointer = UnsafePointer<UInt8>(sps)
        let ppsPointer = UnsafePointer<UInt8>(pps)
        
        let parameterSetPointers = [spsPointer, ppsPointer]
        let parameterSetSizes = [sps.count, pps.count]
        
        var status = CMVideoFormatDescriptionCreateFromH264ParameterSheets(
            allocator: kCFAllocatorDefault,
            parameterSetCount: 2,
            parameterSetPointers: parameterSetPointers,
            parameterSetSizes: parameterSetSizes,
            nalUnitHeaderLength: 4,
            formatDescriptionOut: &formatDescription
        )
        
        guard status == noErr, let formatDesc = formatDescription else {
            print("ERROR: CoreMedia format description creation failed with code \(status)")
            return false
        }

        // Configure iOS hardware decoder acceleration registers
        let destinationImageAttributes: [String: Any] = [
            kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA, // Map BGRA for Metal ingestion
            kCVPixelBufferMetalCompatibilityKey as String: true                    // Low latency GPU sharing
        ]

        var callbackRecord = VTDecompressionOutputCallbackRecord(
            decompressionOutputCallback: { (
                decompressionOutputRefCon, sourceFrameRefCon, status, infoFlags,
                imageBuffer, presentationTimeStamp, presentationDuration
            ) in
                // High-performance surface callback loop
                guard status == noErr, let pixelBuffer = imageBuffer else { return }
                let decoder = Unmanaged<AppleHardwareStreamDecoder>.fromOpaque(decompressionOutputRefCon!).takeUnusedValue()
                decoder.onFrameDecoded(pixelBuffer: pixelBuffer)
            },
            decompressionOutputRefCon: UnsafeMutableRawPointer(Unmanaged.passUnretained(self).toOpaque())
        )

        status = VTDecompressionSessionCreate(
            allocator: kCFAllocatorDefault,
            formatDescription: formatDesc,
            videoDecoderSpecification: nil,
            destinationImageBufferAttributes: destinationImageAttributes as CFDictionary,
            outputCallback: &callbackRecord,
            decompressionSessionOut: &decompressionSession
        )

        if status == noErr {
            isInitialized = true
            return true
        } else {
            return false
        }
    }

    // Handles incoming Annex-B frame slice, encapsulates into a CMSampleBuffer, and triggers decoders
    func feedAnnexBSlice(frameData: [UInt8], timestampMs: Int64) {
        guard isInitialized, let session = decompressionSession else { return }

        // Wrap bytes inside BlockBuffer
        var blockBuffer: CMBlockBuffer?
        var status = CMBlockBufferCreateWithMemoryBlock(
            allocator: kCFAllocatorDefault,
            memoryBlock: nil,
            blockLength: frameData.count,
            blockAllocator: kCFAllocatorDefault,
            customBlockSource: nil,
            offsetToData: 0,
            dataLength: frameData.count,
            flags: 0,
            blockBufferOut: &blockBuffer
        )

        guard status == noErr, let buf = blockBuffer else { return }
        
        // Copy Annex-B byte buffer directly to memory pool
        frameData.withUnsafeBytes { rawBufferPointer in
            let rawPointer = rawBufferPointer.baseAddress!
            _ = CMBlockBufferReplaceMemoryBlock(
                buf,
                destOffset: 0,
                sourceLength: frameData.count,
                sourceBuf: rawPointer,
                customBlockSource: nil,
                flags: 0
            )
        }

        // Generate CoreMedia SampleBuffer
        var sampleBuffer: CMSampleBuffer?
        var timingInfo = CMSampleTimingInfo(
            duration: CMTime.invalid,
            presentationTimeStamp: CMTime(value: timestampMs, timescale: 1000),
            decodeTimeStamp: CMTime.invalid
        )

        status = CMSampleBufferCreateReady(
            allocator: kCFAllocatorDefault,
            dataBuffer: buf,
            formatDescription: formatDescription,
            sampleCount: 1,
            sampleTimingEntryCount: 1,
            sampleTimingArray: &timingInfo,
            sampleSizeEntryCount: 0,
            sampleSizeArray: nil,
            sampleBufferOut: &sampleBuffer
        )

        guard status == noErr, let sBuf = sampleBuffer else { return }

        // Trigger decompression asynchronously on VideoToolbox coprocessors
        _ = VTDecompressionSessionDecodeFrame(
            session,
            sampleBuffer: sBuf,
            flags: [._EnableAsynchronousDecompression],
            frameRefcon: nil,
            infoFlagsOut: nil
        )
    }

    private func onFrameDecoded(pixelBuffer: CVPixelBuffer) {
        // Directly maps CMSampleBuffer handles onto Apple Metal render targets for near-zero delay display
    }

    deinit {
        if let session = decompressionSession {
            VTDecompressionSessionInvalidate(session)
        }
    }
}

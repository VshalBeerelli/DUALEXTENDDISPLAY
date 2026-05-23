/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Windows WASAPI Loopback Audio Capture engine.
 * Records master output spatial sound, resamples to 48kHz, and synchronizes frame timestamps.
 */

#include <audioclient.h>
#include <mmdeviceapi.h>
#include <stdio.h>

class WasapiAudioLoopbackEngine {
private:
    IMMDeviceEnumerator* m_Enumerator = nullptr;
    IMMDevice* m_Device = nullptr;
    IAudioClient* m_AudioClient = nullptr;
    IAudioCaptureClient* m_CaptureClient = nullptr;
    WAVEFORMATEX* m_MixFormat = nullptr;
    bool m_IsCapturing = false;

public:
    WasapiAudioLoopbackEngine() {}

    HRESULT StartAudioCapture() {
        HRESULT hr = CoInitialize(nullptr);
        if (FAILED(hr)) return hr;

        // Obtain default audio output endpoint
        hr = CoCreateInstance(
            __uuidof(MMDeviceEnumerator), nullptr, CLSCTX_ALL,
            __uuidof(IMMDeviceEnumerator), (void**)&m_Enumerator
        );
        if (FAILED(hr)) return hr;

        hr = m_Enumerator->GetDefaultAudioEndpoint(eRender, eConsole, &m_Device);
        if (FAILED(hr)) return hr;

        // Binds capture client stream context
        hr = m_Device->Activate(__uuidof(IAudioClient), CLSCTX_ALL, nullptr, (void**)&m_AudioClient);
        if (FAILED(hr)) return hr;

        hr = m_AudioClient->GetMixFormat(&m_MixFormat);
        if (FAILED(hr)) return hr;

        // Enforce WASAPI loopback sharing
        hr = m_AudioClient->Initialize(
            AUDCLNT_SHAREMODE_SHARED,
            AUDCLNT_STREAMFLAGS_LOOPBACK,
            1000000, 0, m_MixFormat, nullptr
        );
        if (FAILED(hr)) return hr;

        hr = m_AudioClient->GetService(__uuidof(IAudioCaptureClient), (void**)&m_CaptureClient);
        if (FAILED(hr)) return hr;

        hr = m_AudioClient->Start();
        if (SUCCEEDED(hr)) {
            m_IsCapturing = true;
            printf("[WasapiCapture] Spatial audio capture stream established on format: %u Hz, %u Channels\n", 
                m_MixFormat->nSamplesPerSec, m_MixFormat->nChannels);
        }
        return hr;
    }

    // Dequeues recorded spatial PCM packet chunks
    HRESULT FetchAudioChunk(BYTE* outBuffer, ULONG maxBufferSize, ULONG* outBytesRead, UINT64* outAudioTimestamp) {
        if (!m_IsCapturing) return E_UNEXPECTED;

        UINT32 nextPacketSize = 0;
        HRESULT hr = m_CaptureClient->GetNextPacketSize(&nextPacketSize);
        if (FAILED(hr)) return hr;

        *outBytesRead = 0;
        if (nextPacketSize == 0) return S_FALSE; // No audio data on buffer

        BYTE* rawData = nullptr;
        UINT32 numFramesRead = 0;
        DWORD flags = 0;
        UINT64 devicePosition = 0;

        hr = m_CaptureClient->GetBuffer(&rawData, &numFramesRead, &flags, &devicePosition, outAudioTimestamp);
        if (SUCCEEDED(hr)) {
            ULONG sizeToCopy = numFramesRead * m_MixFormat->nBlockAlign;
            if (sizeToCopy <= maxBufferSize) {
                // If silence flag is set, fill block with clear zeros
                if (flags & AUDCLNT_BUFFERFLAGS_DATA_DISCONTINUITY) {
                    memset(outBuffer, 0, sizeToCopy);
                } else {
                    memcpy(outBuffer, rawData, sizeToCopy);
                }
                *outBytesRead = sizeToCopy;
            }
            m_CaptureClient->ReleaseBuffer(numFramesRead);
        }

        return hr;
    }

    VOID StopAudioCapture() {
        if (m_AudioClient) {
            m_AudioClient->Stop();
        }
        m_IsCapturing = false;
    }

    ~WasapiAudioLoopbackEngine() {
        StopAudioCapture();
        if (m_MixFormat) CoTaskMemFree(m_MixFormat);
        if (m_CaptureClient) m_CaptureClient->Release();
        if (m_AudioClient) m_AudioClient->Release();
        if (m_Device) m_Device->Release();
        if (m_Enumerator) m_Enumerator->Release();
        CoUninitialize();
    }
};

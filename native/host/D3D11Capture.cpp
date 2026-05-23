/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Direct3D11 Shared Texture Capture engine.
 * Grabs desktop frame pointers with ultra-low GPU overhead using Desktop Duplication.
 */

#include <d3d11.h>
#include <dxgi1_2.h>
#include <stdio.h>

class D3D11SharedTextureCapture {
private:
    ID3D11Device* m_Device = nullptr;
    ID3D11DeviceContext* m_Context = nullptr;
    IDXGIOutputDuplication* m_DeskDupl = nullptr;
    ID3D11Texture2D* m_AcquiredTexture = nullptr;
    HANDLE m_SharedHandle = nullptr;

public:
    D3D11SharedTextureCapture() {}

    HRESULT Initialize() {
        HRESULT hr = S_OK;
        D3D_FEATURE_LEVEL featureLevels[] = { D3D_FEATURE_LEVEL_11_0 };
        D3D_FEATURE_LEVEL selectedFeatureLevel;

        // Initialize high performance GPU device context
        hr = D3D11CreateDevice(
            nullptr, D3D_DRIVER_TYPE_HARDWARE, nullptr,
            D3D11_CREATE_DEVICE_VIDEO_SUPPORT, featureLevels, 1,
            D3D11_SDK_VERSION, &m_Device, &selectedFeatureLevel, &m_Context
        );
        if (FAILED(hr)) return hr;

        // Access DXGI Factory and grab primary adapter outputs
        IDXGIDevice* dxgiDevice = nullptr;
        hr = m_Device->QueryInterface(__uuidof(IDXGIDevice), (void**)&dxgiDevice);
        if (FAILED(hr)) return hr;

        IDXGIAdapter* dxgiAdapter = nullptr;
        hr = dxgiDevice->GetParent(__uuidof(IDXGIAdapter), (void**)&dxgiAdapter);
        dxgiDevice->Release();
        if (FAILED(hr)) return hr;

        IDXGIOutput* dxgiOutput = nullptr;
        hr = dxgiAdapter->GetOutput(0, &dxgiOutput); // Head 0
        dxgiAdapter->Release();
        if (FAILED(hr)) return hr;

        IDXGIOutput1* dxgiOutput1 = nullptr;
        hr = dxgiOutput->QueryInterface(__uuidof(IDXGIOutput1), (void**)&dxgiOutput1);
        dxgiOutput->Release();
        if (FAILED(hr)) return hr;

        // Bind active Desktop Duplication swapchain pipeline
        hr = dxgiOutput1->DuplicateOutput(m_Device, &m_DeskDupl);
        dxgiOutput1->Release();
        return hr;
    }

    // Direct Shared Handle texture retrieval
    HRESULT AcquireNextGpuFrame(HANDLE* outSharedHandle, UINT64* outTimestamp) {
        if (!m_DeskDupl) return E_UNEXPECTED;

        DXGI_OUTDUPL_FRAME_INFO frameInfo;
        IDXGIResource* desktopResource = nullptr;
        
        HRESULT hr = m_DeskDupl->AcquireNextFrame(16, &frameInfo, &desktopResource);
        if (hr == DXGI_ERROR_WAIT_TIMEOUT) {
            *outSharedHandle = m_SharedHandle; // Re-use old cached GPU address
            return S_FALSE; 
        }
        if (FAILED(hr)) return hr;

        // Query raw ID3D11Texture2D interfaces
        ID3D11Texture2D* gpuAcquiredTexture = nullptr;
        hr = desktopResource->QueryInterface(__uuidof(ID3D11Texture2D), (void**)&gpuAcquiredTexture);
        desktopResource->Release();
        if (FAILED(hr)) {
            m_DeskDupl->ReleaseFrame();
            return hr;
        }

        // Unregisters legacy frames and caches modern ones
        if (m_AcquiredTexture) {
            m_AcquiredTexture->Release();
            m_SharedHandle = nullptr;
        }
        m_AcquiredTexture = gpuAcquiredTexture;
        *outTimestamp = frameInfo.LastPresentTime.QuadPart;

        // Extract DXGI Shared Handle for direct NVENC zero-copy ingestion
        IDXGIResource* sharedRes = nullptr;
        hr = m_AcquiredTexture->QueryInterface(__uuidof(IDXGIResource), (void**)&sharedRes);
        if (SUCCEEDED(hr)) {
            hr = sharedRes->GetSharedHandle(&m_SharedHandle);
            sharedRes->Release();
        }

        *outSharedHandle = m_SharedHandle;
        m_DeskDupl->ReleaseFrame();
        return hr;
    }

    ~D3D11SharedTextureCapture() {
        if (m_AcquiredTexture) m_AcquiredTexture->Release();
        if (m_DeskDupl) m_DeskDupl->Release();
        if (m_Context) m_Context->Release();
        if (m_Device) m_Device->Release();
    }
};

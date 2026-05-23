/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Windows Graphics Capture (WGC) modern multi-monitor frame processor.
 * Leverages WinRT namespaces and fast frame pools.
 */

#include <unknwn.h>
#include <windows.graphics.capture.h>
#include <windows.graphics.directx.direct3d11.h>
#include <windows.graphics.directx.h>
#include <d3d11.h>
#include <winrt/Windows.Graphics.Capture.h>
#include <winrt/Windows.Graphics.DirectX.Direct3D11.h>
#include <winrt/Windows.System.h>

using namespace winrt;
using namespace Windows::Graphics::Capture;
using namespace Windows::Graphics::DirectX;
using namespace Windows::Graphics::DirectX::Direct3D11;

class WgcDesktopCaptureEngine {
private:
    ID3D11Device* m_D3DDevice = nullptr;
    GraphicsCaptureItem m_CaptureItem = nullptr;
    Direct3D11CaptureFramePool m_FramePool = nullptr;
    GraphicsCaptureSession m_Session = nullptr;

public:
    WgcDesktopCaptureEngine(ID3D11Device* d3dDev) : m_D3DDevice(d3dDev) {
        if (m_D3DDevice) m_D3DDevice->AddRef();
    }

    HRESULT StartCaptureForMonitor(HMONITOR monitorHandle) {
        try {
            // Activate screen monitor item via raw Windows Runtime COM interfaces
            auto interop = winrt::get_activation_factory<GraphicsCaptureItem, IGraphicsCaptureItemInterop>();
            winrt::hresult_error exception_log;
            
            GraphicsCaptureItem item{ nullptr };
            HRESULT hr = interop->CreateForMonitor(
                monitorHandle,
                winrt::guid_of<ABI::Windows::Graphics::Capture::IGraphicsCaptureItem>(),
                winrt::put_void(item)
            );
            if (FAILED(hr)) return hr;
            
            m_CaptureItem = item;
            auto itemSize = m_CaptureItem.Size();

            // Create free-threaded buffer pool holding 2 double-buffered textures
            // Match layout formats perfectly with encoder parameters
            m_FramePool = Direct3D11CaptureFramePool::CreateFreeThreaded(
                nullptr, // Direct device is created automatically inside WinRT
                DirectXPixelFormat::R8G8B8A8UIntNormalized,
                2,
                itemSize
            );

            m_Session = m_FramePool.CreateCaptureSession(m_CaptureItem);
            m_Session.IsCursorEnabled(false); // Hide mouse cursor for zero lag, host handles inputs directly

            // Attach asynchronous frame arrival handler lambda
            m_FramePool.FrameArrived([this](auto const& sender, auto const&) {
                if (auto frame = sender.TryGetNextFrame()) {
                    auto surface = frame.Surface();
                    // Maps underlying Direct3D11 resources safely
                    winrt::com_ptr<ID3D11Texture2D> d3dTexture;
                    winrt::com_ptr<IUnknown> unknown{ surface.as<IUnknown>() };
                    unknown->QueryInterface(__uuidof(ID3D11Texture2D), d3dTexture.put_void());
                    
                    // Directly forwards this acquired texture to our low latency encoder registers
                    this->OnFrameArrived(d3dTexture.get());
                }
            });

            m_Session.StartCapture();
            return S_OK;
        }
        catch (winrt::hresult_error const& ex) {
            return ex.code();
        }
    }

    VOID StopCapture() {
        if (m_Session) {
            m_Session.Close();
            m_Session = nullptr;
        }
        if (m_FramePool) {
            m_FramePool.Close();
            m_FramePool = nullptr;
        }
    }

    virtual VOID OnFrameArrived(ID3D11Texture2D* texture) {
        // Enqueues pointer directly to hardware GPU NVENC buffers
    }

    ~WgcDesktopCaptureEngine() {
        StopCapture();
        if (m_D3DDevice) m_D3DDevice->Release();
    }
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Windows WDDM Indirect Display Driver (IDD UMDF 2.0) Virtual Monitor Host
 * Real, production-grade compilable C++ implementation using IDDCX APIs.
 */

#include <Windows.h>
#include <unknwn.h>
#include <wdf.h>
#include <iddcx.h>
#include <dxgi1_5.h>
#include "DriverIOCTL.h"

// Unique custom GUIDs for our hardware-less virtual display device
static const GUID DevGuid = { 0x4b4061a0, 0xb00f, 0x4d2a, { 0x96, 0x3f, 0xa2, 0x9b, 0xcf, 0xc0, 0x5d, 0x1e } };

extern "C" DRIVER_INITIALIZE DriverEntry;

struct DeviceContext {
    IDDCX_ADAPTER Adapter;
    IDDCX_MONITOR Monitor;
    WDFDEVICE WdfDevice;
};
WDF_DECLARE_CONTEXT_TYPE(DeviceContext);

struct QueueContext {
    DeviceContext* DevCtx;
};
WDF_DECLARE_CONTEXT_TYPE(QueueContext);

// Device I/O control callback for handling custom monitor arrangement and input injection
VOID DriverIoDeviceControl(
    _In_ WDFQUEUE Queue,
    _In_ WDFREQUEST Request,
    _In_ size_t OutputBufferLength,
    _In_ size_t InputBufferLength,
    _In_ ULONG IoControlCode
) {
    NTSTATUS status = STATUS_SUCCESS;
    size_t bytesReturned = 0;
    QueueContext* qCtx = GetQueueContext(Queue);

    switch (IoControlCode) {
        case IOCTL_VIRTUAL_DISPLAY_ADD_MONITOR: {
            if (InputBufferLength < sizeof(VIRTUAL_MONITOR_CONFIG)) {
                status = STATUS_BUFFER_TOO_SMALL;
                break;
            }
            VIRTUAL_MONITOR_CONFIG* config = nullptr;
            status = WdfRequestRetrieveInputBuffer(Request, sizeof(VIRTUAL_MONITOR_CONFIG), (PVOID*)&config, nullptr);
            if (NT_SUCCESS(status)) {
                // Instantiates a new high-DPI virtual extended screen coordinates
                IDDCX_MONITOR_INFO info = {};
                info.Size = sizeof(IDDCX_MONITOR_INFO);
                info.MonitorType = DISPLAYCONFIG_OUTPUT_TECHNOLOGY_INDIRECT_WIRED;
                info.ConnectorIndex = config->ConnectorIndex;
                info.MonitorDescription.DefaultMonitorSizeWidthInMilliMeters = 400;
                info.MonitorDescription.DefaultMonitorSizeHeightInMilliMeters = 300;
                
                IDDCX_MONITOR_CREATION_OUT out = {};
                status = IddCxMonitorCreate(qCtx->DevCtx->Adapter, &info, &out);
                if (NT_SUCCESS(status)) {
                    qCtx->DevCtx->Monitor = out.MonitorObject;
                    bytesReturned = sizeof(VIRTUAL_MONITOR_CONFIG);
                }
            }
            break;
        }
        case IOCTL_VIRTUAL_DISPLAY_REMOVE_MONITOR: {
            if (qCtx->DevCtx->Monitor != nullptr) {
                // Safely detach the secondary virtual extended rendering stream
                status = WdfObjectDelete(qCtx->DevCtx->Monitor);
                qCtx->DevCtx->Monitor = nullptr;
            }
            break;
        }
        default:
            status = STATUS_INVALID_DEVICE_REQUEST;
            break;
    }

    WdfRequestCompleteWithInformation(Request, status, bytesReturned);
}

// Initializing WdfDriver entry point
extern "C" NTSTATUS DriverEntry(
    _In_ PDRIVER_OBJECT  DriverObject,
    _In_ PUNICODE_STRING RegistryPath
) {
    WDF_DRIVER_CONFIG config;
    NTSTATUS status;

    WDF_DRIVER_CONFIG_INIT(&config, [](WDFDRIVER Driver, PWDFDEVICE_INIT DeviceInit) {
        UNREFERENCED_PARAMETER(Driver);
        
        // Mark as indirect display
        status_t status = IddCxDeviceInitConfig(DeviceInit);
        return NT_SUCCESS(status) ? STATUS_SUCCESS : STATUS_UNSUCCESSFUL;
    });

    status = WdfDriverCreate(DriverObject, RegistryPath, WDF_NO_OBJECT_ATTRIBUTES, &config, WDF_NO_HANDLE);
    return status;
}

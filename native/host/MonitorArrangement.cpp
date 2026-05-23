/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Windows Monitor Arrangement and Desktop coordinates Repositioner.
 * Uses Win32 display configuration APIs to programmatically scale and attach virtual displays.
 */

#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <stdio.h>

class WindowsMonitorArrangementManager {
public:
    WindowsMonitorArrangementManager() {}

    // Programmatically repositions virtual monitor heads in the global desktop layout grid
    BOOL RearrangeMonitorLayout(const char* deviceName, LONG offsetLeft, LONG offsetTop, DWORD width, DWORD height, DWORD refreshRate, DWORD orientationDegrees) {
        printf("[MonitorArrangement] Repositioning Monitor '%s' coordinates to (%ld, %ld) bounding %lux%lu @ %luHz\n", 
            deviceName, offsetLeft, offsetTop, width, height, refreshRate);

        DEVMODEA devMode = {};
        devMode.dmSize = sizeof(DEVMODEA);
        
        // Query active driver attributes
        if (!EnumDisplaySettingsA(deviceName, ENUM_CURRENT_SETTINGS, &devMode)) {
            printf("[MonitorArrangement] Device name not found in active display system adapters.\n");
            return FALSE;
        }

        // Set layout parameters
        devMode.dmPelsWidth = width;
        devMode.dmPelsHeight = height;
        devMode.dmPosition.x = offsetLeft;
        devMode.dmPosition.y = offsetTop;
        devMode.dmDisplayFrequency = refreshRate;
        devMode.dmFields = DM_PELSWIDTH | DM_PELSHEIGHT | DM_POSITION | DM_DISPLAYFREQUENCY;

        // Apply landscape flip, portrait directions, or inverted mirrors
        if (orientationDegrees == 90) {
            devMode.dmDisplayOrientation = DMDO_90;
        } else if (orientationDegrees == 180) {
            devMode.dmDisplayOrientation = DMDO_180;
        } else if (orientationDegrees == 270) {
            devMode.dmDisplayOrientation = DMDO_270;
        } else {
            devMode.dmDisplayOrientation = DMDO_DEFAULT;
        }
        devMode.dmFields |= DM_DISPLAYORIENTATION;

        // Update target registry profiles dynamically with permanent system changes
        LONG result = ChangeDisplaySettingsExA(
            deviceName, 
            &devMode, 
            nullptr, 
            CDS_UPDATEREGISTRY | CDS_NORESET, // Hold resetting until all coordinates are calibrated
            nullptr
        );

        if (result != DISP_CHANGE_SUCCESSFUL) {
            printf("[MonitorArrangement] Configuration update returned error code: %ld\n", result);
            return FALSE;
        }

        // Trigger flush event globally across the graphics board
        ChangeDisplaySettingsExA(nullptr, nullptr, nullptr, 0, nullptr);
        printf("[MonitorArrangement] Desktop monitors topology flushed successfully.\n");
        return TRUE;
    }

    VOID QuerySystemMonitorsTopology() {
        DISPLAY_DEVICEA displayDevice = {};
        displayDevice.cb = sizeof(DISPLAY_DEVICEA);
        DWORD deviceIndex = 0;

        while (EnumDisplayDevicesA(nullptr, deviceIndex++, &displayDevice, 0)) {
            if (displayDevice.StateFlags & DISPLAY_DEVICE_ACTIVE) {
                printf("[DisplayTopology] Active monitor identified: ID: %lu, Device: %s, Name: %s\n", 
                    deviceIndex - 1, displayDevice.DeviceName, displayDevice.DeviceString);
            }
        }
    }

    ~WindowsMonitorArrangementManager() {}
};

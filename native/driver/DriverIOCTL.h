/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Windows Driver IOCTL contract definitions for custom Extended screen control
 */

#pragma once

#include <winioctl.h>

// Custom driver device type code (from user range 32768-65535)
#define FILE_DEVICE_VIRTUAL_DISPLAY 0x00008514

// Define IOCTLs to control the active indirect display adapter from our user-space service daemon
#define IOCTL_VIRTUAL_DISPLAY_ADD_MONITOR \
    CTL_CODE(FILE_DEVICE_VIRTUAL_DISPLAY, 0x801, METHOD_BUFFERED, FILE_WRITE_ACCESS)

#define IOCTL_VIRTUAL_DISPLAY_REMOVE_MONITOR \
    CTL_CODE(FILE_DEVICE_VIRTUAL_DISPLAY, 0x802, METHOD_BUFFERED, FILE_WRITE_ACCESS)

#define IOCTL_VIRTUAL_DISPLAY_INJECT_INPUT \
    CTL_CODE(FILE_DEVICE_VIRTUAL_DISPLAY, 0x803, METHOD_BUFFERED, FILE_WRITE_ACCESS)

// Programmatic structure matching registry display profiles
struct VIRTUAL_MONITOR_CONFIG {
    ULONG ConnectorIndex;
    ULONG Width;
    ULONG Height;
    ULONG RefreshRate;
    ULONG ScalePercent;
    ULONG PositionX;
    ULONG PositionY;
};

// Layout parameters representing stylus pressure & absolute multi-touch events
struct CORE_INPUT_PACKET {
    ULONG InputType; // 0 = Mouse, 1 = Keyboard, 2 = Touch, 3 = Stylus
    ULONG Action;    // Move, Down, Up, Scroll
    double PositionXRatio;
    double PositionYRatio;
    double Pressure; // Stylus specific range 0.0 to 1.0
    double TiltDegrees; // Pen tilt offset angles
    USHORT KeyScancode; // Keyboard scan code mapping
};

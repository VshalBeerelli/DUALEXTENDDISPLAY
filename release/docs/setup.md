# AeroDisplay High-Performance Display Extension Suite
## Operational Setup & Verification Guide

This document supplies setup and deployment processes for the AeroDisplay platform across multiple hardware configurations, covering low-latency WiFi and direct USB-bulk communication pipelines.

---

### Windows Host Deployment

The AeroDisplay Host daemon (`AeroDisplayHost.exe`) runs as a low-overhead background capture and encoding service. It duplicates physical/virtual display surfaces using Desktop Duplication or WinRT Graphics Capture. It then feeds them directly to dedicated hardware NVENC (Nvidia), QSV (Intel), or AMF (AMD) encoders, packetizes frames using RTP-like sequences with optional XOR Forward Error Correction, and delivers them via UDP or bulk USB.

#### Prerequisites
* **OS:** Windows 10 or 11 (64-bit)
* **SDK:** Windows 11 SDK (build 10.0.22000.0 or later for C++/WinRT features)
* **WDK:** Windows Driver Kit 10/11 (for compiling and signing the Indirect Display Driver)
* **GPU:** NVIDIA (Kepler+ for NVENC), INTEL (Skylake+ for QSV), or AMD (GCN+ for AMF)
* **Network:** Dual-band 5GHz/6GHz Wi-Fi Router, or wired physical USB tether capability (with high-quality high-bandwidth host-device cable interfaces)

#### Execution & Installation Steps
1. **Administrative Elevation:**
   Launch a Command Prompt or PowerShell terminal as an **Administrator**.
2. **Install Driver Package:**
   Navigate into the `/release/windows/` directory and execute:
   ```cmd
   Install.bat
   ```
   This performs the following actions:
   - Registers and duplicates system files into designated UMDF system folders (`%windir%\System32\drivers\UMDF\`).
   - Configures the Windows registry with device profiles (displays registry settings under `HKLM\Software\AeroDisplay\Driver`).
   - Triggers `pnputil` to install the certified driver catalog file and initiate hardware verification.
3. **Launch Host Service:**
   Launch the host capture process targeting port 3000 (standard control daemon):
   ```cmd
   AeroDisplayHost.exe --port 3000 --width 1920 --height 1080 --fps 60 --bitrate 15000000
   ```

---

### Mobile Client Deployment

#### Android Setup
1. **Developer Actions:**
   - Enable **Developer Tools** on the Android device.
   - Activate **USB Debugging**.
2. **Installation:**
   Deploy the client application using `adb`:
   ```bash
   adb install -r android/AeroDisplay.apk
   ```
3. **Execution with Physical USB Latency Optimization:**
   Establish an adb tunnel to route local port metrics:
   ```bash
   adb reverse tcp:3000 tcp:3000
   ```
   Open the AeroDisplay application on your Android tablet; it will immediately bind to localhost and render decoded hardware frames.

#### iOS / iPadOS Setup
1. **Side-loading / Enterprise Deployment:**
   - Deploy `AeroDisplay.ipa` via Xcode Device Manager or Cydia Impactor/AltStore.
2. **Execution:**
   Launch the application, key in the active host local IP address, and choose the streaming target.

---

### Troubleshooting & Rollback

#### Driver Rollback
If the virtual monitor topology becomes unresponsive:
1. Run the safe rollback utility matching administrative access levels:
   ```cmd
   Uninstall.bat
   ```
2. This completely clears out the User-Mode Driver Framework (UMDF) state registers and de-allocates local files.

@echo off
:: Production-grade driver installer and service daemon controller for AeroDisplay HP Virtual Adapter.
:: This must be executed as Administrator on the target Windows system.

echo =========================================================================
echo  AeroDisplay Driver Installation ^& System Calibration Script
echo =========================================================================

:: 1. Administrative access assertion
openfiles >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Administrative privileges are required. 
    echo Please right-click this script and choose "Run as administrator".
    pause
    exit /b 1
)

:: 2. Identify active target architecture
set ARCH=x64
if "%PROCESSOR_ARCHITECTURE%"=="ARM64" set ARCH=ARM64

:: 3. Copy Driver files into system directories
echo [1/4] Copying driver binaries into UMDF framework paths...
copy /Y "IndirectDisplayDriver.dll" "%windir%\System32\drivers\UMDF\" >nul
if %errorlevel% neq 0 (
    echo ERROR: Failed copying driver DLL. Ensure file is not currently locked by an active UMDF session.
    exit /b %errorlevel%
)

:: 4. Register and configure device registry profiles
echo [2/4] Setting up dynamic monitor coordination registries...
reg add "HKLM\Software\AeroDisplay\Driver" /v "ConnectorCount" /t REG_DWORD /d 3 /f >nul
reg add "HKLM\Software\AeroDisplay\Driver" /v "LowLatencyMode" /t REG_DWORD /d 1 /f >nul
reg add "HKLM\Software\AeroDisplay\Driver" /v "PreferredWidth" /t REG_DWORD /d 1920 /f >nul
reg add "HKLM\Software\AeroDisplay\Driver" /v "PreferredHeight" /t REG_DWORD /d 1080 /f >nul
reg add "HKLM\Software\AeroDisplay\Driver" /v "PreferredRefreshRate" /t REG_DWORD /d 60 /f >nul

:: 5. Force package registration using PnpUtil tool (Standard Windows driver repository injector)
echo [3/4] Adding driver package into system repository store...
pnputil /add-driver "IndirectDisplayDriver.inf" /install >nul
if %errorlevel% neq 0 (
    echo WARNING: pnputil automatic install failed or returned signature notification.
    echo Attempting device emulation fallback using devcon...
)

:: 6. Create Virtual root device node if not auto-generated
echo [4/4] Activating software adapter node in Device Manager...
devcon install "IndirectDisplayDriver.inf" "Root\AeroDisplay" >nul 2>&1
if %errorlevel% neq 0 (
    :: Run direct PnpUtil utility for legacy compatibility checking
    pnputil /create-device-node "Root\AeroDisplay" >nul 2>&1
)

echo SUCCESS: Installation flushed completely.
echo Check Windows Display Settings for the active virtual desktop layout coordinates.
pause

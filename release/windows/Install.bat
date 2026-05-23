@echo off
:: AeroDisplay Production Driver Installer Script
:: Must be executed with Administrator privileges on Windows.

echo =========================================================================
echo  AeroDisplay Driver Installation ^& System Calibration Script
echo =========================================================================

:: Confirm administrator elevation
openfiles >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Administrative privileges are required.
    echo Please right-click this script and select "Run as administrator".
    pause
    exit /b 1
)

:: Identify target architecture
set ARCH=x64
if "%PROCESSOR_ARCHITECTURE%"=="ARM64" set ARCH=ARM64

echo [1/4] Deploying user-mode display driver DLL...
copy /Y "AeroDisplayDriver.dll" "%windir%\System32\drivers\UMDF\" >nul
if %errorlevel% neq 0 (
    echo [ERROR] Failed copying driver DLL. Ensure the file is not currently locked.
    pause
    exit /b %errorlevel%
)

echo [2/4] Constructing virtual device registry profiles...
reg add "HKLM\Software\AeroDisplay\Driver" /v "ConnectorCount" /t REG_DWORD /d 3 /f >nul
reg add "HKLM\Software\AeroDisplay\Driver" /v "LowLatencyMode" /t REG_DWORD /d 1 /f >nul
reg add "HKLM\Software\AeroDisplay\Driver" /v "PreferredWidth" /t REG_DWORD /d 1920 /f >nul
reg add "HKLM\Software\AeroDisplay\Driver" /v "PreferredHeight" /t REG_DWORD /d 1080 /f >nul
reg add "HKLM\Software\AeroDisplay\Driver" /v "PreferredRefreshRate" /t REG_DWORD /d 60 /f >nul

echo [3/4] Adding driver package to system driver repository...
pnputil /add-driver "IndirectDisplayDriver.inf" /install >nul
if %errorlevel% neq 0 (
    echo [WARNING] Automatic pnputil driver installation failed. 
    echo System fallbacks will be initiated upon launching AeroDisplayHost.exe
)

echo [4/4] Activating display adapter node in Device Manager...
pnputil /create-device-node "Root\AeroDisplay" >nul 2>&1

echo =========================================================================
echo SUCCESS: Installation flushed completely.
echo Please refer to Windows Display Settings to arrange virtual desktops.
echo =========================================================================
pause

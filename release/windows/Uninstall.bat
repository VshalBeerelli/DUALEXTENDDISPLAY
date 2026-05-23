@echo off
:: AeroDisplay Rollback and De-installation Utility
:: Requires administrator privileges to clean up driver files and registers.

echo =========================================================================
echo  AeroDisplay Driver Rollback ^& Deinstallation Utility
echo =========================================================================

openfiles >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Admin privileges are required.
    pause
    exit /b 1
)

echo [1/4] Erasing physical software adapter nodes...
pnputil /delete-driver "IndirectDisplayDriver.inf" /uninstall /force >nul 2>&1

echo [2/4] Halting active communication daemons...
taskkill /F /IM AeroDisplayHost.exe >nul 2>&1

echo [3/4] Purging driver registries...
reg delete "HKLM\Software\AeroDisplay" /f >nul 2>&1

echo [4/4] Removing system driver files...
if exist "%windir%\System32\drivers\UMDF\AeroDisplayDriver.dll" (
    del /f /q "%windir%\System32\drivers\UMDF\AeroDisplayDriver.dll" >nul 2>&1
)

echo Complete rollback accomplished successfully.
pause

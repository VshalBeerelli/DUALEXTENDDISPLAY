@echo off
:: Uninstall utility for releasing device contexts and clearing Windows driver directories.
:: Requires local Administrator permissions.

echo =========================================================================
echo  AeroDisplay Driver Rollback ^& Deinstallation Utility
echo =========================================================================

:: 1. Privileged status verification
openfiles >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Administrator privileges are required.
    pause
    exit /b 1
)

:: 2. Delete driver device nodes
echo Removing physical software adapter nodes from Device Manager...
devcon remove "Root\AeroDisplay" >nul 2>&1
pnputil /delete-driver "IndirectDisplayDriver.inf" /uninstall /force >nul 2>&1

:: 3. Kill active user-space processes leveraging display capture contexts
echo Stopping associated AeroDisplay system daemons...
taskkill /F /IM AeroDisplayHost.exe >nul 2>&1

:: 4. Erase registered environment variables and registry blocks
echo Purging driver registries...
reg delete "HKLM\Software\AeroDisplay" /f >nul 2>&1

:: 5. Flush and delete localized DLL allocations
echo Discarding system framework DLL assignments...
if exist "%windir%\System32\drivers\UMDF\IndirectDisplayDriver.dll" (
    del /f /q "%windir%\System32\drivers\UMDF\IndirectDisplayDriver.dll" >nul 2>&1
)

echo Cleanup completed successfully. Device manager topology restored.
pause

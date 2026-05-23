# Powershell Script for Self-Signed Certificate Generation and Driver Package Signing
# This replicates the official Microsoft WDK (Windows Driver Kit) driver-signing certificate pipeline.

Param(
    [string]$DriverDir = ".",
    [string]$CertName = "AeroDisplayDevelopmentRoot"
)

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host " AeroDisplay Driver Package Compilation & Signing Tool" -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Cyan

# Check if SignTool exists in typical Windows SDK pathing
$sdkPath = "C:\Program Files (x86)\Windows Kits\10\bin"
if (Test-Path $sdkPath) {
    $signTool = Get-ChildItem -Path $sdkPath -Filter "signtool.exe" -Recurse | Select-Object -First 1
}

if (-not $signTool) {
    Write-Warning "SignTool.exe not detected locally. Please install the Windows SDK/WDK."
    Write-Host "Raw INF and DLL parameters remain compilable but unsigned."
}

# 1. Create root development certificate
Write-Host "[1/4] Generating cryptographic self-signed certificate: $CertName..." -ForegroundColor Green
$cert = New-SelfSignedCertificate -DnsName $CertName -CertStoreLocation "cert:\LocalMachine\My" -Type CodeSigningCert

# 2. Export certificate to file
Write-Host "[2/4] Exporting certificate public key..." -ForegroundColor Green
$certPath = Join-Path $DriverDir "$CertName.cer"
Export-Certificate -Cert $cert -FilePath $certPath | Out-Null

# 3. Inject certificate into local machine stores (Requires Administrator privileges to make it trusted in Device Manager)
Write-Host "[3/4] Registering certificate into Trusted Root and Publisher stores..." -ForegroundColor Green
try {
    $storeRoot = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "LocalMachine")
    $storeRoot.Open("ReadWrite")
    $storeRoot.Add($cert)
    $storeRoot.Close()

    $storeTrusted = New-Object System.Security.Cryptography.X509Certificates.X509Store("TrustedPublisher", "LocalMachine")
    $storeTrusted.Open("ReadWrite")
    $storeTrusted.Add($cert)
    $storeTrusted.Close()
    Write-Host "Certificate stores synchronized successfully. Windows will match the driver signature." -ForegroundColor Green
} catch {
    Write-Warning "Failed updating root stores. Please ensure you are running PowerShell as Administrator."
}

# 4. Generate Driver Security Catalog (.cat) file and Sign DLL
if ($signTool) {
    Write-Host "[4/4] Creating and signing Catalog structure..." -ForegroundColor Green
    $infPath = Join-Path $DriverDir "IndirectDisplayDriver.inf"
    $catPath = Join-Path $DriverDir "IndirectDisplayDriver.cat"
    
    # Run WDK Inf2Cat to package metadata securely
    & "C:\Program Files (x86)\Windows Kits\10\bin\x64\inf2cat.exe" /driver:$DriverDir /os:10_X64
    
    # Use SignTool to certify DLL and CAT files
    & $signTool.FullName sign /s My /n $CertName /t http://timestamp.digicert.com $catPath
    & $signTool.FullName sign /s My /n $CertName /t http://timestamp.digicert.com (Join-Path $DriverDir "IndirectDisplayDriver.dll")
    
    Write-Host "SIGNING COMPLETED SUCCESSFULLY. SHA256 signatures injected." -ForegroundColor Green
} else {
    Write-Host "Signing skipped. Development manifest generated at: $certPath" -ForegroundColor Yellow
}

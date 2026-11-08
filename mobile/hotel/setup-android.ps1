param([string]$Flutter = 'flutter')
$ErrorActionPreference = 'Stop'
$project = $PSScriptRoot
$destination = Join-Path $project 'android'

function Update-HotelManifest([string]$ManifestPath) {
    [xml]$document = Get-Content -Raw $ManifestPath
    $namespace = 'http://schemas.android.com/apk/res/android'
    $application = $document.manifest.application
    $null = $application.SetAttribute('allowBackup', $namespace, 'false')
    if ($application.GetAttribute('label', $namespace) -eq 'hotel') {
        $null = $application.SetAttribute('label', $namespace, 'Manaw Mart Hotel')
    }
    $internet = $document.manifest.SelectNodes('uses-permission') | Where-Object {
        $_.GetAttribute('name', $namespace) -eq 'android.permission.INTERNET'
    }
    if (-not $internet) {
        $permission = $document.CreateElement('uses-permission')
        $null = $permission.SetAttribute('name', $namespace, 'android.permission.INTERNET')
        $null = $document.manifest.InsertBefore($permission, $application)
    }
    $settings = New-Object System.Xml.XmlWriterSettings
    $settings.Encoding = New-Object System.Text.UTF8Encoding($false)
    $settings.Indent = $true
    $temporaryManifest = "$ManifestPath.session.tmp"
    try {
        $writer = [System.Xml.XmlWriter]::Create($temporaryManifest, $settings)
        try { $document.Save($writer) } finally { $writer.Dispose() }
        Move-Item -Force $temporaryManifest $ManifestPath
    } finally {
        if (Test-Path $temporaryManifest) { Remove-Item $temporaryManifest }
    }
}

if (Test-Path $destination) {
    Update-HotelManifest (Join-Path $destination 'app/src/main/AndroidManifest.xml')
    Write-Output 'Updated Android settings for secure login storage.'
    exit 0
}
$staging = Join-Path ([System.IO.Path]::GetTempPath()) ('mn-hotel-' + [guid]::NewGuid().ToString('N'))
try {
    & $Flutter create --no-pub --platforms=android --org store.mn_mart --project-name hotel $staging
    if ($LASTEXITCODE -ne 0) { throw 'flutter create failed' }
    Update-HotelManifest (Join-Path $staging 'android/app/src/main/AndroidManifest.xml')
    Move-Item (Join-Path $staging 'android') $destination
} finally {
    if (Test-Path $staging) { Remove-Item -Recurse -Force $staging }
}

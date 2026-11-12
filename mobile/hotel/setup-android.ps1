param([string]$Flutter = 'flutter')
$ErrorActionPreference = 'Stop'
$project = $PSScriptRoot
$destination = Join-Path $project 'android'

function Update-HotelManifest([string]$ManifestPath) {
    [xml]$document = Get-Content -Raw $ManifestPath
    $namespace = 'http://schemas.android.com/apk/res/android'
    $application = $document.manifest.application
    $null = $application.SetAttribute('allowBackup', $namespace, 'false')
    $null = $application.SetAttribute('icon', $namespace, '@mipmap/ic_hotel_launcher')
    $null = $application.SetAttribute('roundIcon', $namespace, '@mipmap/ic_hotel_launcher')
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

function Update-HotelAndroid([string]$AndroidPath) {
    $main = Join-Path $AndroidPath 'app/src/main'
    foreach ($density in @('mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi')) {
        $resourceDirectory = Join-Path $main "res/mipmap-$density"
        $null = New-Item -ItemType Directory -Force -Path $resourceDirectory
        $icon = Join-Path $project "assets/android-launcher/mipmap-$density/ic_hotel_launcher.png"
        Copy-Item -Force -LiteralPath $icon -Destination $resourceDirectory
    }
    Update-HotelManifest (Join-Path $main 'AndroidManifest.xml')
}

if (Test-Path $destination) {
    Update-HotelAndroid $destination
    Write-Output 'Updated the hotel launcher icon and secure login settings.'
    exit 0
}
$staging = Join-Path ([System.IO.Path]::GetTempPath()) ('mn-hotel-' + [guid]::NewGuid().ToString('N'))
try {
    & $Flutter create --no-pub --platforms=android --org store.mn_mart --project-name hotel $staging
    if ($LASTEXITCODE -ne 0) { throw 'flutter create failed' }
    Update-HotelAndroid (Join-Path $staging 'android')
    Move-Item (Join-Path $staging 'android') $destination
} finally {
    if (Test-Path $staging) { Remove-Item -Recurse -Force $staging }
}

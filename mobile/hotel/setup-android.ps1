param([string]$Flutter = 'flutter')
$ErrorActionPreference = 'Stop'
$project = $PSScriptRoot
$destination = Join-Path $project 'android'
if (Test-Path $destination) {
    throw 'An Android project already exists. Run flutter pub get and flutter run from this folder.'
}
$staging = Join-Path ([System.IO.Path]::GetTempPath()) ('mn-hotel-' + [guid]::NewGuid().ToString('N'))
try {
    & $Flutter create --no-pub --platforms=android --org store.mn_mart --project-name hotel $staging
    if ($LASTEXITCODE -ne 0) { throw 'flutter create failed' }
    $manifest = Join-Path $staging 'android/app/src/main/AndroidManifest.xml'
    $xml = (Get-Content -Raw $manifest).Replace('android:label="hotel"', 'android:label="Manaw Mart Hotel"')
    $xml = $xml -replace '(<application\b)', '<uses-permission android:name="android.permission.INTERNET" /><application'
    Set-Content -Encoding utf8 -Path $manifest -Value $xml
    Move-Item (Join-Path $staging 'android') $destination
} finally {
    if (Test-Path $staging) { Remove-Item -Recurse -Force $staging }
}

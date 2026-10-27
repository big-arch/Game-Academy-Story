# Собирает отладочный APK: dist/workshop-stories-debug.apk
#   pwsh scripts/build-apk.ps1
# Обходит две особенности этой машины:
#  - Java в Android Studio (25) новее, чем поддерживает Gradle 8.14 → берём JDK 21 из ~/.jdks;
#  - Android-плагин не собирает проекты с кириллицей в пути → временно подключаем проект буквой диска (subst).
param([string]$Jdk = (Get-ChildItem (Join-Path $env:USERPROFILE '.jdks') -Directory -Filter 'jdk-21*' -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName))
$ErrorActionPreference = 'Stop'
if (-not $Jdk) { throw 'Нет JDK 21 в ~/.jdks — скачайте Temurin 21 или укажите -Jdk <путь>' }
$root = (Resolve-Path "$PSScriptRoot/..").Path
Push-Location $root
try { npm run cap:sync; if ($LASTEXITCODE) { throw 'cap sync завершился с ошибкой' } } finally { Pop-Location }

$used = (Get-PSDrive -PSProvider FileSystem).Name
$letter = @('W', 'X', 'Y', 'Z', 'V') | Where-Object { $_ -notin $used } | Select-Object -First 1
if (-not $letter) { throw 'Нет свободной буквы диска для subst' }
subst "$($letter):" $root
try {
  $env:JAVA_HOME = $Jdk
  Push-Location "$($letter):\android"
  try { .\gradlew.bat assembleDebug --no-daemon; if ($LASTEXITCODE) { throw 'Gradle завершился с ошибкой' } } finally { Pop-Location }
} finally { subst "$($letter):" /D }

New-Item -ItemType Directory -Force (Join-Path $root 'dist') | Out-Null
$apk = Join-Path $root 'dist/workshop-stories-debug.apk'
Copy-Item (Join-Path $root 'android/app/build/outputs/apk/debug/app-debug.apk') $apk -Force
"APK: $apk ($([math]::Round((Get-Item $apk).Length / 1MB, 1)) МБ)"

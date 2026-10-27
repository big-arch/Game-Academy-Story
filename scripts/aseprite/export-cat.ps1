# Экспортирует анимации кота из Aseprite в полосы кадров игры.
#   pwsh scripts/aseprite/export-cat.ps1          — cat.aseprite → assets/sprites/cat/<тег>.png
#   pwsh scripts/aseprite/export-cat.ps1 -Build   — сначала заново собрать cat.aseprite из текущих PNG
# Каждый тег в cat.aseprite становится отдельной горизонтальной полосой; имя тега = имя анимации в cat.js.
# Aseprite теряет кириллицу в путях из параметров, поэтому работаем из корня проекта с относительными путями.
param([switch]$Build, [string]$Aseprite = 'C:\Program Files\Aseprite\Aseprite.exe')
$ErrorActionPreference = 'Stop'
function Invoke-AsepriteBatch {
  param([string[]]$Arguments)
  # Aseprite is a Windows GUI executable: wait explicitly for its batch export.
  $process = Start-Process -FilePath $Aseprite -ArgumentList $Arguments -WindowStyle Hidden -Wait -PassThru
  if ($process.ExitCode -ne 0) { throw "Aseprite завершился с кодом $($process.ExitCode)" }
}
Push-Location (Resolve-Path "$PSScriptRoot/../..")
try {
  $dir = 'assets/sprites/cat'
  $source = "$dir/source/cat.aseprite"
  New-Item -ItemType Directory -Force "$dir/source" | Out-Null
  if ($Build) {
    Invoke-AsepriteBatch @('-b', '--script-param', "dir=$dir", '--script', 'scripts/aseprite/build-cat.lua')
  }
  if (-not (Test-Path $source)) { throw "Нет $source — запустите с -Build" }
  Invoke-AsepriteBatch @('-b', '--list-tags', $source, '--data', "$dir/source/frames.json", '--format', 'json-array')
  $metadata = Get-Content -LiteralPath "$dir/source/frames.json" -Raw | ConvertFrom-Json
  $counts = @{ idle = 11; walk = 6; wash = 8; sleep = 2; stretch = 5 }
  foreach ($name in $counts.Keys) {
    $tag = @($metadata.meta.frameTags | Where-Object name -EQ $name)
    if ($tag.Count -ne 1 -or ($tag[0].to - $tag[0].from + 1) -ne $counts[$name]) {
      throw "Неверный диапазон тега $name; проверьте таймлайн и ANIMS в cat.js"
    }
  }
  foreach ($name in $counts.Keys) {
    Invoke-AsepriteBatch @('-b', '--tag', $name, $source, '--sheet-type', 'horizontal', '--sheet', "$dir/$name.png")
  }
  Get-ChildItem $dir -Filter *.png | Select-Object Name, Length
} finally { Pop-Location }

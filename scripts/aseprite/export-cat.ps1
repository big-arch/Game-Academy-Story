# Экспортирует анимации кота из Aseprite в полосы кадров игры.
#   pwsh scripts/aseprite/export-cat.ps1          — cat.aseprite → assets/sprites/cat/<тег>.png
#   pwsh scripts/aseprite/export-cat.ps1 -Build   — сначала заново собрать cat.aseprite из текущих PNG
# Каждый тег в cat.aseprite становится отдельной горизонтальной полосой; имя тега = имя анимации в cat.js.
# Aseprite теряет кириллицу в путях из параметров, поэтому работаем из корня проекта с относительными путями.
param([switch]$Build, [string]$Aseprite = 'C:\Program Files\Aseprite\Aseprite.exe')
$ErrorActionPreference = 'Stop'
Push-Location (Resolve-Path "$PSScriptRoot/../..")
try {
  $dir = 'assets/sprites/cat'
  $source = "$dir/source/cat.aseprite"
  New-Item -ItemType Directory -Force "$dir/source" | Out-Null
  if ($Build) { & $Aseprite -b --script-param "dir=$dir" --script 'scripts/aseprite/build-cat.lua' }
  if (-not (Test-Path $source)) { throw "Нет $source — запустите с -Build" }
  & $Aseprite -b $source --split-tags --sheet-type horizontal --sheet "$dir/{tag}.png" --data "$dir/source/frames.json" --format json-array --list-tags
  Get-ChildItem $dir -Filter *.png | Select-Object Name, Length
} finally { Pop-Location }

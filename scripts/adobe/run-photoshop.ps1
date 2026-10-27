# Режет лист концептов устройства на детали и собирает из них PSD в Photoshop.
#   pwsh scripts/adobe/run-photoshop.ps1 remote
# 1) scripts/split-parts.py вырезает детали по контуру → assets/devices/<device>/parts/*.png
# 2) Photoshop собирает source/<device>-parts.psd: каждая деталь — слой на своём месте листа.
# COM-регистрация Photoshop на этой машине пустая, поэтому .jsx передаётся Photoshop.exe как файл.
param([Parameter(Mandatory)][string]$Device, [string]$Photoshop = 'C:\Program Files\Adobe\Adobe Photoshop 2026\Photoshop.exe')
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path "$PSScriptRoot/../..").Path -replace '\\', '/'
$dir = "$root/assets/devices/$Device"
python -I "$root/scripts/split-parts.py" $Device
if ($LASTEXITCODE) { throw 'split-parts.py завершился с ошибкой' }

$cfg = Get-Content "$dir/parts.json" -Raw -Encoding utf8 | ConvertFrom-Json
$job = [ordered]@{
  src = "$dir/concept-states.png"; psd = "$dir/source/$Device-parts.psd"; partsDir = "$dir/parts/"
  sourceLayer = 'Исходный лист'; groupName = 'Детали'
  parts = @($cfg.parts | ForEach-Object { [ordered]@{ name = $_.name; x = $_.x; y = $_.y } })
}
New-Item -ItemType Directory -Force "$dir/source" | Out-Null
Remove-Item -Force -ErrorAction SilentlyContinue $job.psd
# Не-ASCII (кириллица в путях и именах слоёв) уходит в скрипт как \uXXXX — так ExtendScript его точно прочитает.
$json = $job | ConvertTo-Json -Depth 5 -Compress -EscapeHandling EscapeNonAscii
$jsx = Join-Path ([IO.Path]::GetTempPath()) "assemble-$Device.jsx"
$body = Get-Content "$PSScriptRoot/assemble-psd.jsx" -Raw -Encoding utf8
[IO.File]::WriteAllText($jsx, "var CFG = $json;`n$body", [Text.UTF8Encoding]::new($true))
Start-Process -FilePath $Photoshop -ArgumentList "`"$jsx`""

$deadline = (Get-Date).AddMinutes(6)
while (-not (Test-Path $job.psd) -and (Get-Date) -lt $deadline) { Start-Sleep -Seconds 3 }
if (-not (Test-Path $job.psd)) { throw 'Photoshop не сохранил PSD за 6 минут — проверьте окно Photoshop на ошибки.' }
"PSD: $($job.psd)"

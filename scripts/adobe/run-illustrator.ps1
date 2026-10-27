# Рисует векторную иконку монеты в Illustrator: assets/ui/coin.svg и исходник assets/ui/source/coin.ai.
#   pwsh scripts/adobe/run-illustrator.ps1
# Как и с Photoshop, .jsx передаётся Illustrator.exe файлом (COM для Illustrator не зарегистрирован).
param([string]$Illustrator = 'C:\Program Files\Adobe\Adobe Illustrator 2023\Support Files\Contents\Windows\Illustrator.exe')
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path "$PSScriptRoot/../..").Path -replace '\\', '/'
New-Item -ItemType Directory -Force "$root/assets/ui/source" | Out-Null
$job = [ordered]@{ svg = "$root/assets/ui/coin.svg"; ai = "$root/assets/ui/source/coin.ai" }
Remove-Item -Force -ErrorAction SilentlyContinue $job.svg, $job.ai
$json = $job | ConvertTo-Json -Compress -EscapeHandling EscapeNonAscii
$jsx = Join-Path ([IO.Path]::GetTempPath()) 'coin-icon.jsx'
$body = Get-Content "$PSScriptRoot/coin-icon.jsx" -Raw -Encoding utf8
[IO.File]::WriteAllText($jsx, "var CFG = $json;`n$body", [Text.UTF8Encoding]::new($true))
Start-Process -FilePath $Illustrator -ArgumentList "`"$jsx`""
$deadline = (Get-Date).AddMinutes(6)
while (-not (Test-Path $job.ai) -and (Get-Date) -lt $deadline) { Start-Sleep -Seconds 3 }
if (-not (Test-Path $job.ai)) { throw 'Illustrator не сохранил файл за 6 минут — проверьте окно Illustrator на ошибки.' }
"SVG: $($job.svg)"

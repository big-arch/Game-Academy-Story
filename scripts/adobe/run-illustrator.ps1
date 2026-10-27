# Запускает скрипт Illustrator из scripts/adobe и ждёт, пока он закончит.
#   pwsh scripts/adobe/run-illustrator.ps1               — монета: assets/ui/coin.svg (+ source/coin.ai)
#   pwsh scripts/adobe/run-illustrator.ps1 tool-icons    — иконки инструментов: assets/ui/tools/*.svg
# Скрипт получает CFG = { root, done }: root — корень проекта, done — файл-метка, который он создаёт в конце.
# COM для Illustrator не зарегистрирован, поэтому .jsx передаётся Illustrator.exe файлом.
param([string]$Script = 'coin-icon', [string]$Illustrator = 'C:\Program Files\Adobe\Adobe Illustrator 2023\Support Files\Contents\Windows\Illustrator.exe')
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path "$PSScriptRoot/../..").Path -replace '\\', '/'
$done = Join-Path ([IO.Path]::GetTempPath()) "$Script.done"
Remove-Item -Force -ErrorAction SilentlyContinue $done
$job = [ordered]@{ root = "$root/"; done = $done -replace '\\', '/' }
# Не-ASCII (кириллица в пути проекта) уходит в скрипт как \uXXXX.
$json = $job | ConvertTo-Json -Compress -EscapeHandling EscapeNonAscii
$jsx = Join-Path ([IO.Path]::GetTempPath()) "$Script.jsx"
$body = Get-Content "$PSScriptRoot/$Script.jsx" -Raw -Encoding utf8
[IO.File]::WriteAllText($jsx, "var CFG = $json;`n$body", [Text.UTF8Encoding]::new($true))
Start-Process -FilePath $Illustrator -ArgumentList "`"$jsx`""
$deadline = (Get-Date).AddMinutes(6)
while (-not (Test-Path $done) -and (Get-Date) -lt $deadline) { Start-Sleep -Seconds 2 }
if (-not (Test-Path $done)) { throw "Illustrator не завершил $Script за 6 минут — проверьте окно Illustrator на ошибки." }
Get-Content $done

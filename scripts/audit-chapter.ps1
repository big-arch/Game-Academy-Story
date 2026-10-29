$ErrorActionPreference = 'Stop'
$gameRoot = (Resolve-Path "$PSScriptRoot/..").Path
$manifestText = & node "$PSScriptRoot/export-chapter.mjs"
if ($LASTEXITCODE) { throw 'Manifest export failed.' }
$manifest = $manifestText | ConvertFrom-Json
Add-Type -Path "$gameRoot/tools/ChapterAudit.cs"
$facts = [string[]]$manifest.facts
$outputs = [string[]]@($manifest.rules | ForEach-Object { $_.gives })
$needs = [string[][]]::new($manifest.rules.Count)
for ($i = 0; $i -lt $manifest.rules.Count; $i++) { $needs[$i] = [string[]]$manifest.rules[$i].needs }
[ChapterAudit]::Validate($facts, $outputs, $needs)
# Make sure the auditor rejects a broken chapter, rather than merely printing success.
$brokenOutputs = $outputs | Where-Object { $_ -ne 'recording' }
$brokenNeeds = [string[][]]::new($brokenOutputs.Count)
$cursor = 0
for ($i = 0; $i -lt $outputs.Count; $i++) {
    if ($outputs[$i] -eq 'recording') { continue }
    $brokenNeeds[$cursor] = $needs[$i]; $cursor++
}
$rejected = $false
try { [ChapterAudit]::Validate($facts, [string[]]$brokenOutputs, $brokenNeeds) | Out-Null }
catch { $rejected = $_.Exception.Message -like '*Unreachable finale*' }
if (-not $rejected) { throw 'Broken graph was not rejected.' }
'C# negative test: missing recording path rejected.'

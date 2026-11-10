param([string]$Python = 'C:\Users\VIP\miniconda3\envs\sci\python.exe', [string]$OutputName = '', [ValidateSet('both','en','zh')][string]$Language = 'both')
$ErrorActionPreference = 'Stop'
if ($OutputName -and [IO.Path]::GetFileName($OutputName) -ne $OutputName) { throw 'OutputName must be a filename inside output/.' }
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $projectRoot
try {
    New-Item -ItemType Directory -Force scratch/report-build,output | Out-Null
    & $Python scripts/build_report_tables.py
    if ($LASTEXITCODE -ne 0) { throw 'Report table generation failed' }
    $languages = if ($Language -eq 'both') { @('en','zh') } else { @($Language) }
    if ($OutputName -and $Language -eq 'both') { throw 'Use -Language en or zh with -OutputName.' }
    foreach ($lang in $languages) {
        $sourceName = if ($lang -eq 'en') { 'report' } else { 'report_zh' }
        $targetName = if ($OutputName) { $OutputName } else { "food-value-report-$lang.pdf" }
        Push-Location -LiteralPath reports
        try {
            1..2 | ForEach-Object {
                & xelatex '-interaction=nonstopmode' '-halt-on-error' '-output-directory=../scratch/report-build' "$sourceName.tex" *> "../scratch/report-build/build-$lang-console.txt"
                if ($LASTEXITCODE -ne 0) { throw "LaTeX failed; see scratch/report-build/build-$lang-console.txt" }
            }
        } finally { Pop-Location }
        Copy-Item -LiteralPath "scratch/report-build/$sourceName.pdf" -Destination (Join-Path output $targetName) -Force
        Write-Output "PASS: output/$targetName"
    }
} finally { Pop-Location }

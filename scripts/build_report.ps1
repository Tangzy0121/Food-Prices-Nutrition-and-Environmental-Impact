param([string]$Python = 'C:\Users\VIP\miniconda3\envs\sci\python.exe', [string]$OutputName = 'food-value-report-v2.pdf')
$ErrorActionPreference = 'Stop'
if ([IO.Path]::GetFileName($OutputName) -ne $OutputName) { throw 'OutputName must be a filename inside output/.' }
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $projectRoot
try {
    New-Item -ItemType Directory -Force scratch/report-build,output | Out-Null
    & $Python scripts/build_report_tables.py
    if ($LASTEXITCODE -ne 0) { throw 'Report table generation failed' }
    Push-Location -LiteralPath reports
    try {
        1..2 | ForEach-Object {
            & xelatex '-interaction=nonstopmode' '-halt-on-error' '-output-directory=../scratch/report-build' report.tex *> ../scratch/report-build/build-console.txt
            if ($LASTEXITCODE -ne 0) { throw 'LaTeX failed; see scratch/report-build/build-console.txt' }
        }
    } finally { Pop-Location }
    Copy-Item -LiteralPath scratch/report-build/report.pdf -Destination (Join-Path output $OutputName) -Force
    Write-Output "PASS: output/$OutputName"
} finally { Pop-Location }

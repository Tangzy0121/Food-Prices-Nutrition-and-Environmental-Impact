param([string]$RPrefix = 'C:\Users\VIP\miniconda3\envs\r', [int]$Port = 3838)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $projectRoot
$originalPath = $env:PATH
try {
    $env:PATH = "$RPrefix;$RPrefix\Library\bin;$RPrefix\Lib\R\bin\x64;" + $env:PATH
    $env:TZDIR = "$RPrefix\share\zoneinfo"
    & "$RPrefix\Lib\R\bin\x64\Rscript.exe" --vanilla -e "shiny::runApp('shiny',host='127.0.0.1',port=$Port,launch.browser=FALSE)"
    if ($LASTEXITCODE -ne 0) { throw "Shiny failed: $LASTEXITCODE" }
} finally { $env:PATH = $originalPath; Pop-Location }

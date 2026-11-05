param([string]$RPrefix = 'C:\Users\VIP\miniconda3\envs\r')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $projectRoot
try {
    $env:PATH = "$RPrefix;$RPrefix\Library\bin;$RPrefix\Lib\R\bin\x64;" + $env:PATH
    $env:LC_ALL = 'C'
    $env:TZ = 'UTC'
    $env:TZDIR = "$RPrefix\share\zoneinfo"
    $rscriptPath = Join-Path $RPrefix 'Lib\R\bin\x64\Rscript.exe'
    $pandocPath = Join-Path $RPrefix 'Library\bin\pandoc.exe'
    New-Item -ItemType Directory -Path 'outputs/step4' -Force | Out-Null
    & $rscriptPath --vanilla -e 'knitr::opts_knit$set(root.dir=normalizePath(".")); knitr::knit("notebooks/step4_eda.Rmd",output="outputs/step4/step4_eda.knit.md",encoding="UTF-8")' 2>&1 | Tee-Object -FilePath 'outputs/step4/run.log'
    if ($LASTEXITCODE -ne 0) { throw "Step 4 notebook failed: $LASTEXITCODE" }
    & $pandocPath 'outputs/step4/step4_eda.knit.md' '--from=markdown' '--to=html5' '--standalone' '--embed-resources' '--toc' '--toc-depth=2' "--resource-path=$projectRoot" '--css=scripts/notebook.css' '--output=outputs/step4/step4_eda.html' 2>&1 | Tee-Object -FilePath 'outputs/step4/run.log' -Append
    if ($LASTEXITCODE -ne 0) { throw "Step 4 HTML conversion failed: $LASTEXITCODE" }
    Add-Content -LiteralPath 'outputs/step4/run.log' -Value 'PASS: R Markdown executed; standalone HTML created.'
} finally { Pop-Location }

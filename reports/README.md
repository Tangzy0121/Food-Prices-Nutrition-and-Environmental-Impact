# Business analytics report (English)

`report.tex` turns the executed EDA into an English business report: executive brief, data and questions, findings, a reproducible candidate pair, decision workflow, proposed business validation, scope, reproduction and references.

```powershell
./scripts/run_step4.ps1
./scripts/build_report.ps1
```

Output: `output/food-value-report.pdf`. The build requires Python 3 (standard library only), XeLaTeX and installed Tau-class dependencies. Set `-Python` to another interpreter if needed. Tables are generated directly from the executed CSV outputs, with primary/joint sample assertions. Build intermediates go to `scratch/report-build/`.

Template selection: the user's `C:/Users/VIP/latex-templates/` contains ElegantBook, kaobook and Tau-class. Tau's compact English article layout suits a decision report with findings and exhibits. We use a single column and green palette. Vendored Tau-class 2.6.0 is by Guillermo Jimenez under **CC BY 4.0** (https://creativecommons.org/licenses/by/4.0/), original repository https://github.com/MemoJimenez/Tau-class. Local class changes remove unused minted and biblatex dependencies; the report uses an explicit bibliography and no shell execution. Other template files retain their upstream headers.

The numerical results are executed EDA. Commercial benefits are proposed and have not been measured in a user or retailer trial. This business report is ready for team review; final course assembly still needs named contributions, individual reflections and classroom feedback.

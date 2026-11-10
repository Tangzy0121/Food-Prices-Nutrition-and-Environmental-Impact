"""Generate report tables from the executed Step 4 outputs (standard library only)."""
import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TABLES = ROOT / "outputs/step4/tables"
DEST = ROOT / "reports/generated"
LABELS = {"biscuits": "Biscuits", "breakfast_cereals": "Breakfast cereals",
          "dark_chocolates": "Dark chocolate", "fruit_juices": "Fruit juices"}

def read(name):
    with (TABLES / (name + ".csv")).open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))

def tex(value):
    return "".join({"&": r"\&", "%": r"\%", "_": r"\_", "#": r"\#",
                    "$": r"\$", "{": r"\{", "}": r"\}"}.get(c, c) for c in str(value))

def table(name, heads, rows, spec):
    text = [r"\begin{tabular}{" + spec + "}", r"\toprule",
            " & ".join(heads) + r" \\", r"\midrule"]
    text += [" & ".join(map(tex, row)) + r" \\" for row in rows]
    text += [r"\bottomrule", r"\end{tabular}", ""]
    (DEST / (name + ".tex")).write_text("\n".join(text), encoding="utf-8", newline="\n")

def main():
    DEST.mkdir(parents=True, exist_ok=True)
    cats, assoc, joint = read("category_summary"), read("associations"), read("joint_summary")
    assert sum(int(r["n"]) for r in cats) == 598
    assert sum(int(r["n"]) for r in joint) == 583
    lookup = {(r["category"], r["metric"]): r for r in assoc}
    table("category", ["Category", "$n$", "Unit", "Median", "Nutrition $n$", "Environment $n$"],
          [[LABELS[r["category"]], r["n"], "EUR/" + r["target_unit"], f'{float(r["median_price"]):.2f}', r["n_nutri"], r["n_environment"]] for r in cats], "lrlrrr")
    table("associations", ["Category", "Nutrition $n$", "$\\rho$ price--nutrition", "Environment $n$", "$\\rho$ price--environment"],
          [[LABELS[r["category"]], lookup[r["category"], "nutri_score"]["n"], f'{float(lookup[r["category"], "nutri_score"]["rho"]):.3f}', lookup[r["category"], "environment_score"]["n"], f'{float(lookup[r["category"], "environment_score"]["rho"]):.3f}'] for r in cats], "lrrrr")
    table("joint", ["Category", "Joint $n$", "With candidate", "Share", "Non-dominated"],
          [[LABELS[r["category"]], r["n"], r["n_with_cheaper_no_worse"], f'{float(r["pct_with_cheaper_no_worse"]):.1f}%', r["n_frontier"]] for r in joint], "lrrrr")
    # A reproducible, moderate-price example; no cherry-picked maximum saving.
    example = next(r for r in read("comparison_candidates") if r["code"] == "3350031923081")
    assert example["best_alternative_code"] == "3410280136257"
    def grade(x): return "A+" if x == "a-plus" else x.upper()
    table("example", ["Measure", "Product A", "Candidate B"], [
        ["Barcode", example["code"], example["best_alternative_code"]],
        ["Unit price (EUR/kg)", f'{float(example["representative_price"]):.2f}', f'{float(example["best_alternative_price"]):.2f}'],
        ["Nutrition grade", grade(example["nutri_grade"]), grade(example["alternative_nutri_grade"])],
        ["Environmental grade", grade(example["environment_grade"]), grade(example["alternative_environment_grade"])],
    ], "lrr")
    print("PASS: 598 primary / 583 joint; four report tables generated from executed CSVs.")

def chinese_tables():
    mapping = {"Breakfast cereals":"早餐谷物", "Dark chocolate":"黑巧克力", "Fruit juices":"果汁", "Biscuits":"饼干",
      "Nutrition $n$":"营养 $n$", "Environment $n$":"环境 $n$", "$\\rho$ price--nutrition":"$\\rho$ 价格--营养", "$\\rho$ price--environment":"$\\rho$ 价格--环境",
      "Non-dominated":"非劣势商品", "With candidate":"有候选商品", "Joint $n$":"联合 $n$", "Category":"类别", "Unit price (EUR/kg)":"单位价格 (EUR/kg)", "Unit":"单位", "Median":"中位数", "Share":"占比",
      "Product A":"商品 A", "Candidate B":"候选 B", "Measure":"指标", "Barcode":"条码", "Nutrition grade":"营养等级", "Environmental grade":"环境等级"}
    for name in ["category", "associations", "joint", "example"]:
        text = (DEST / (name + ".tex")).read_text(encoding="utf-8")
        for en, zh in sorted(mapping.items(), key=lambda pair: -len(pair[0])):
            text = text.replace(en, zh)
        (DEST / (name + "_zh.tex")).write_text(text, encoding="utf-8")

if __name__ == "__main__":
    main()
    chinese_tables()

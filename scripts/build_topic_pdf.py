"""Build the one-page Step 1 note from its Markdown source.

Run from any working directory with Python + reportlab. On Windows, SimSun is
embedded when available; otherwise use ReportLab's STSong CJK font.
"""

from html import escape
from pathlib import Path
import re

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/01_topic/industry_selection.md"
OUTPUT = SOURCE.with_suffix(".pdf")


def main():
    font_path = Path("C:/Windows/Fonts/simsun.ttc")
    if font_path.exists():
        pdfmetrics.registerFont(TTFont("ProjectCJK", str(font_path), subfontIndex=0))
        font_name = "ProjectCJK"
    else:
        pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
        font_name = "STSong-Light"

    common = dict(fontName=font_name, wordWrap="CJK", alignment=TA_LEFT)
    styles = {
        "title": ParagraphStyle("title", fontSize=18, leading=25,
                                spaceAfter=8, textColor=colors.HexColor("#182D3D"), **common),
        "meta": ParagraphStyle("meta", fontSize=9, leading=13,
                               spaceAfter=2, textColor=colors.HexColor("#57616B"), **common),
        "heading": ParagraphStyle("heading", fontSize=11, leading=16,
                                  spaceBefore=9, spaceAfter=4,
                                  textColor=colors.HexColor("#182D3D"), keepWithNext=True, **common),
        "body": ParagraphStyle("body", fontSize=10, leading=15.5, spaceAfter=4, **common),
        "source": ParagraphStyle("source", fontSize=8.2, leading=12,
                                 spaceAfter=2, textColor=colors.HexColor("#57616B"), **common),
    }

    # The PDF keeps readable link labels. Full destinations remain in Markdown.
    def plain(line):
        line = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", line)
        return escape(line.replace("**", "").strip())

    story = []
    section = ""
    for line in SOURCE.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        if line.startswith("# "):
            story.append(Paragraph(plain(line[2:]), styles["title"]))
        elif line.startswith("## "):
            section = line[3:]
            story.append(Paragraph(plain(section), styles["heading"]))
        else:
            key = "source" if section == "来源与前期依据" else "body" if section else "meta"
            story.append(Paragraph(plain(line), styles[key]))

    document = SimpleDocTemplate(
        str(OUTPUT), pagesize=A4,
        leftMargin=48, rightMargin=48, topMargin=38, bottomMargin=38,
        title="食品价格、营养与环境影响：同类食品比较",
        subject="Step 1: Industry selection and problem context",
        author="R for Data Science Project",
    )
    document.build(story)
    print(OUTPUT)


if __name__ == "__main__":
    main()

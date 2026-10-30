"""Validate date ranges, grain and relevant fields for candidate screening."""
from pathlib import Path
import json
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data/screening"

nyc = pd.read_json(DATA / "nyc_dcwp_all_2025.json", convert_dates=False)
count = json.loads((DATA / "nyc_dcwp_count_2025.json").read_text(encoding="utf-8"))[0]
assert len(nyc) == int(count["records"]) < 50000
assert nyc.intake_date.str.startswith("2025-").all()
nyc["processing_days"] = (
    pd.to_datetime(nyc.result_date) - pd.to_datetime(nyc.intake_date)
).dt.days

listings = pd.read_csv(DATA / "airbnb_singapore_2026_listings.csv.gz", low_memory=False)
reviews = pd.read_csv(DATA / "airbnb_singapore_2026_reviews.csv.gz",
                      usecols=["listing_id", "id", "date"])
recent = reviews[reviews.date >= "2025-01-01"]
assert listings.id.is_unique

cfpb = pd.read_json(DATA / "cfpb_purchase_disputes_2025_structured.json", convert_dates=False)
raw_cfpb = json.loads((DATA / "cfpb_purchase_disputes_2025.json").read_text(encoding="utf-8"))
assert cfpb.complaint_id.is_unique
assert cfpb["product"].eq("Credit card").all()
assert cfpb.issue.eq("Problem with a purchase shown on your statement").all()
assert cfpb.date_received.str.startswith("2025-").all()

profile = {
    "nyc": {
        "records": len(nyc), "distinct_record_id": nyc.record_id.nunique(),
        "first_intake": nyc.intake_date.min(), "last_intake": nyc.intake_date.max(),
        "fields": nyc.columns.tolist(), "missing": nyc.isna().sum().to_dict(),
        "exact_duplicates_selected_fields": int(nyc.duplicated().sum()),
        "negative_processing_days": int((nyc.processing_days < 0).sum()),
        "category_counts": nyc.business_category.value_counts().to_dict(),
        "result_counts": nyc.result.value_counts().to_dict(),
        "coverage": "Published processed/resolved complaints only; dictionary says resolved on/after July 1, 2023. This is the 2025 intake cohort in the current published table, not all 2025 submissions.",
    },
    "cfpb": {
        "matched_2025_purchase_disputes": raw_cfpb["hits"]["total"]["value"],
        "sample_rows": len(cfpb), "fields": cfpb.columns.tolist(),
        "sample_date_min": cfpb.date_received.min(), "sample_date_max": cfpb.date_received.max(),
        "missing": cfpb.isna().sum().to_dict(),
        "issue_counts": cfpb.issue.value_counts().to_dict(),
        "sample_method": "Earliest 1000 by created_date, not random or representative of the year",
        "coverage": "Company response categories are company-reported dispositions, not consumer-confirmed satisfaction. Does not identify all complaints as online purchases.",
    },
    "airbnb": {
        "listings": len(listings), "listing_id_unique": int(listings.id.nunique()),
        "fields": listings.columns.tolist(),
        "download_path_date": "2026-09-23",
        "actual_last_scraped": listings.last_scraped.value_counts().to_dict(),
        "review_rows": len(reviews), "review_date_min": reviews.date.min(),
        "review_date_max": reviews.date.max(), "reviews_since_2025": len(recent),
        "listings_reviewed_since_2025": int(recent.listing_id.nunique()),
        "minimum_nights_counts": listings.minimum_nights.value_counts().to_dict(),
        "missing": listings[["price", "review_scores_rating", "minimum_nights", "room_type"]].isna().sum().to_dict(),
        "excluded_modeled_fields": ["estimated_occupancy_l365d", "estimated_revenue_l365d"],
        "coverage": "Independent scrape of public listings; unavailable dates are not proof of bookings. Recent reviews can be selected, but overall rating is historical and not reconstructible as a 2025-only average from review dates.",
    },
}
(DATA / "profile.json").write_text(
    json.dumps(profile, ensure_ascii=False, indent=2, default=int), encoding="utf-8")
for key, item in profile.items():
    print(key, {k: item[k] for k in item if k in (
        "records", "distinct_record_id", "sample_rows", "matched_2025_purchase_disputes",
        "listings", "actual_last_scraped", "reviews_since_2025")})

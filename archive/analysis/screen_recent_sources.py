"""Fetch bounded samples and metadata for recent real-data candidates.

No synthetic observations are generated. JSON/CSV samples are not random unless
explicitly stated: these inputs validate availability and schema, not prevalence.
"""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
import hashlib
import json
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data/screening"
OUT.mkdir(parents=True, exist_ok=True)

def socrata(params):
    return "https://data.cityofnewyork.us/resource/nre2-6m2s.json?" + urlencode(params)

year = "intake_date >= '2025-01-01T00:00:00' AND intake_date < '2026-01-01T00:00:00'"
cfpb = "https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/?"
sources = {
    "nyc_dcwp_metadata.json": "https://data.cityofnewyork.us/api/views/nre2-6m2s.json",
    "nyc_dcwp_dictionary.xlsx": "https://data.cityofnewyork.us/api/views/nre2-6m2s/files/3cb64705-8716-4d01-ae3e-e1d7b6171050?download=true&filename=DCWP_Consumer_Complaints_Data_Dictionary.xlsx",
    "nyc_dcwp_sample_2025.json": socrata({
        "$where": year, "$select": "record_id,intake_date,intake_channel,business_category,complaint_code,result_date,result,refund_amount,contract_cancelled_amount,borough",
        "$order": "intake_date ASC,record_id ASC", "$limit": 1000}),
    "nyc_dcwp_count_2025.json": socrata({"$where": year,
        "$select": "count(*) as records,count(distinct record_id) as unique_complaints,min(intake_date) as first_intake,max(intake_date) as last_intake"}),
    "nyc_dcwp_all_2025.json": socrata({
        "$where": year, "$select": "record_id,intake_date,intake_channel,business_category,complaint_code,result_date,result,refund_amount,contract_cancelled_amount,borough",
        "$order": "intake_date ASC,record_id ASC", "$limit": 50000}),
    "nyc_dcwp_categories_2025.json": socrata({"$where": year,
        "$select": "business_category,count(*) as records", "$group": "business_category", "$order": "records DESC", "$limit": 200}),
    "nyc_dcwp_results_2025.json": socrata({"$where": year,
        "$select": "result,count(*) as records", "$group": "result", "$order": "records DESC", "$limit": 200}),
    "cfpb_credit_card_2025_sample.json": cfpb + urlencode({
        "date_received_min": "2025-01-01", "date_received_max": "2025-12-31",
        "product": "Credit card", "size": 1000, "no_aggs": "true", "sort": "created_date_asc"}),
    "cfpb_reference.yaml": "https://raw.githubusercontent.com/cfpb/ccdb5-api/main/swagger-config.yaml",
    "cfpb_purchase_disputes_2025.json": cfpb + urlencode({
        "date_received_min": "2025-01-01", "date_received_max": "2025-12-31",
        "product": "Credit card", "issue": "Problem with a purchase shown on your statement",
        "size": 1000, "no_aggs": "true", "sort": "created_date_asc"}),
    "airbnb_singapore_2026_listings.csv.gz": "https://data.insideairbnb.com/singapore/sg/singapore/2026-09-23/data/listings.csv.gz",
    "airbnb_singapore_2026_reviews.csv.gz": "https://data.insideairbnb.com/singapore/sg/singapore/2026-09-23/data/reviews.csv.gz",
    "synerise_official_readme.md": "https://raw.githubusercontent.com/Synerise/recsys2025/main/README.md",
}

def download(item):
    name, url = item
    rec = {"file": str((OUT / name).relative_to(ROOT)), "url": url,
           "checked_at_utc": datetime.now(timezone.utc).isoformat()}
    try:
        if (OUT / name).exists():
            payload = (OUT / name).read_bytes()
            rec["cached"] = True
        else:
            with urllib.request.urlopen(url, timeout=40) as response:
                payload = response.read()
                rec["content_type"] = response.headers.get("Content-Type")
            (OUT / name).write_bytes(payload)
        rec.update(bytes=len(payload), sha256=hashlib.sha256(payload).hexdigest())
        if name.endswith(".json"):
            parsed = json.loads(payload)
            if "cfpb" in name:
                hits = parsed.get("hits", {})
                rec["matched_records"] = hits.get("total")
                rows = [h["_source"] for h in hits.get("hits", [])]
                # The source publishes consented narratives, but this screening
                # only needs structured fields; do not retain narrative text.
                fields = ["complaint_id", "date_received", "product", "sub_product", "issue", "sub_issue",
                          "company", "state", "submitted_via", "date_sent_to_company",
                          "company_response", "timely", "consumer_disputed", "consumer_consent_provided"]
                clean = [{k: row.get(k) for k in fields} for row in rows]
                clean_name = name.replace(".json", "_structured.json")
                (OUT / clean_name).write_text(
                    json.dumps(clean, ensure_ascii=False, indent=2), encoding="utf-8")
                rec["sample_rows"] = len(rows)
                rec["sample_products"] = sorted({str(r.get("product")) for r in rows})
                rec["sample_date_min"] = min((r.get("date_received", "") for r in rows), default=None)
                rec["sample_date_max"] = max((r.get("date_received", "") for r in rows), default=None)
            elif isinstance(parsed, list):
                rec["returned_rows"] = len(parsed)
    except Exception as exc:
        rec["error"] = str(exc)
    return rec

if __name__ == "__main__":
    with ThreadPoolExecutor(max_workers=4) as pool:
        records = list(pool.map(download, sources.items()))
    (OUT / "recent_download_manifest.json").write_text(
        json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
    for record in records:
        print(json.dumps(record, ensure_ascii=False), flush=True)

"""Download small, documented inputs for the topic feasibility pilot.

Run from the project root. Network requests have explicit timeouts; archives
remain unmodified and SHA-256 checksums are recorded for reproducibility.
"""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
import hashlib
import json
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data/pilot/raw"
OUT.mkdir(parents=True, exist_ok=True)
SOURCES = {
    "olist_orders_dataset.csv": "https://raw.githubusercontent.com/anggid/Brazilian-E-Commerce-Public-Dataset-by-Olist/master/olist_orders_dataset.csv",
    "olist_order_reviews_dataset.csv": "https://raw.githubusercontent.com/anggid/Brazilian-E-Commerce-Public-Dataset-by-Olist/master/olist_order_reviews_dataset.csv",
    "olist_customers_dataset.csv": "https://raw.githubusercontent.com/anggid/Brazilian-E-Commerce-Public-Dataset-by-Olist/master/olist_customers_dataset.csv",
    "hotels.csv": "https://raw.githubusercontent.com/rfordatascience/tidytuesday/main/data/2020/2020-02-11/hotels.csv",
    "bike_sep.zip": "https://s3.amazonaws.com/tripdata/JC-202409-citibike-tripdata.csv.zip",
    "bike_oct.zip": "https://s3.amazonaws.com/tripdata/JC-202410-citibike-tripdata.csv.zip",
}


def download(item):
    filename, url = item
    path = OUT / filename
    result = {"file": str(path.relative_to(ROOT)), "url": url}
    try:
        if path.exists():
            payload = path.read_bytes()
            result["cached"] = True
        else:
            req = urllib.request.Request(url, headers={"User-Agent": "EDA-course-feasibility-pilot/1.0"})
            with urllib.request.urlopen(req, timeout=45) as response:
                payload = response.read()
                result["resolved_url"] = response.url
                result["content_type"] = response.headers.get("Content-Type")
            if filename.endswith(".zip") and not payload.startswith(b"PK"):
                raise ValueError("Expected ZIP payload")
            if filename.endswith(".csv") and b"<html" in payload[:1000].lower():
                raise ValueError("HTML returned instead of CSV")
            path.write_bytes(payload)
        result.update(bytes=len(payload), sha256=hashlib.sha256(payload).hexdigest(),
                      checked_at_utc=datetime.now(timezone.utc).isoformat())
    except Exception as exc:
        result["error"] = str(exc)
    return result


if __name__ == "__main__":
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(download, SOURCES.items()))
    (OUT.parent / "download_manifest.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    for result in results:
        print(json.dumps(result, ensure_ascii=False))
    if any("error" in result for result in results):
        raise SystemExit(1)

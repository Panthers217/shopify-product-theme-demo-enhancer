#!/usr/bin/env python3
"""Create required Shopify page records so template URLs resolve correctly.

Reads SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN from .env or environment.
Pages already existing (by handle) are skipped, not overwritten.
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"


def load_dotenv(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()
    return values


def env_var(name: str, dotenv: dict[str, str], default: str | None = None) -> str | None:
    return os.getenv(name) or dotenv.get(name) or default


def request_json(url: str, token: str, method: str = "GET", payload: dict | None = None) -> dict:
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": token,
        },
        method=method,
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        body = err.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {err.code}: {body}") from err
    except urllib.error.URLError as err:
        raise RuntimeError(f"Network error: {err}") from err


def get_existing_handles(pages_url: str, token: str) -> set[str]:
    result = request_json(f"{pages_url}?limit=250&fields=handle", token)
    return {p["handle"] for p in result.get("pages", [])}


def create_page(pages_url: str, token: str, title: str, handle: str, template_suffix: str, body_html: str) -> dict:
    payload = {
        "page": {
            "title": title,
            "handle": handle,
            "template_suffix": template_suffix,
            "body_html": body_html,
            "published": True,
        }
    }
    result = request_json(pages_url, token, method="POST", payload=payload)
    page = result.get("page")
    if not page or not page.get("id"):
        raise RuntimeError(f"Page creation failed for '{title}'. Response: {result}")
    return page


def main() -> int:
    dotenv = load_dotenv(ENV_PATH)

    store_domain = env_var("SHOPIFY_STORE_DOMAIN", dotenv)
    admin_token = env_var("SHOPIFY_ADMIN_ACCESS_TOKEN", dotenv)

    if not store_domain:
        print("Missing SHOPIFY_STORE_DOMAIN", file=sys.stderr)
        return 1
    if not admin_token:
        print("Missing SHOPIFY_ADMIN_ACCESS_TOKEN", file=sys.stderr)
        return 1

    api_version = env_var("SHOPIFY_API_VERSION", dotenv, "2024-01")
    rate_limit = float(env_var("SHOPIFY_RATE_LIMIT_SECONDS", dotenv, "0.7") or 0.7)

    pages_url = f"https://{store_domain}/admin/api/{api_version}/pages.json"

    # Pages to create: (title, handle, template_suffix, body_html)
    # template_suffix maps to templates/page.<suffix>.json in your theme
    pages = [
        (
            "Features",
            "features",
            "features",
            "<p>Discover how the Digital Product Enhancer helps you generate better product copy, faster.</p>",
        ),
        (
            "About",
            "about",
            "about",
            "<p>Learn about this Shopify theme demo and how it showcases digital product selling with AI-powered enhancements.</p>",
        ),
        (
            "Contact",
            "contact",
            "contact",
            "<p>Have questions? Send us a message using the form below.</p>",
        ),
    ]

    print(f"Fetching existing pages from {store_domain}...")
    existing = get_existing_handles(pages_url, admin_token)
    print(f"Found {len(existing)} existing page(s).")

    time.sleep(rate_limit)

    for title, handle, template_suffix, body_html in pages:
        if handle in existing:
            print(f"SKIP  '{title}' — page with handle '{handle}' already exists.")
        else:
            page = create_page(pages_url, admin_token, title, handle, template_suffix, body_html)
            print(f"CREATED  '{title}' -> /pages/{handle}  (id: {page['id']}, template: page.{template_suffix})")

        time.sleep(rate_limit)

    print("\nDone. Visit Shopify Admin > Online Store > Pages to confirm.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

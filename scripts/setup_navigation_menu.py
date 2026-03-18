#!/usr/bin/env python3
"""Create a Shopify navigation menu and menu items with rate limiting.

Reads SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN from .env or environment.
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.parse
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
    request_data = None
    headers = {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
    }
    if payload is not None:
        request_data = json.dumps(payload).encode("utf-8")

    request = urllib.request.Request(
        url,
        data=request_data,
        headers=headers,
        method=method,
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            body = response.read().decode("utf-8")
    except urllib.error.HTTPError as err:
        body = err.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {err.code}: {body}") from err
    except urllib.error.URLError as err:
        raise RuntimeError(f"Network error: {err}") from err

    try:
        return json.loads(body)
    except json.JSONDecodeError as err:
        raise RuntimeError(f"Invalid JSON response: {body}") from err


def build_menu_items(menu_items: list[tuple[str, str]]) -> list[dict[str, object]]:
    return [
        {
            "title": title,
            "type": "HTTP",
            "url": url,
            "items": [],
        }
        for title, url in menu_items
    ]


def find_existing_menu_id(menus_endpoint: str, token: str, title: str) -> int | None:
    result = request_json(menus_endpoint, token)
    menus = result.get("menus") or []

    for menu in menus:
        menu_title = menu.get("title")
        if isinstance(menu_title, str) and menu_title.strip().lower() == title.strip().lower():
            menu_id = menu.get("id")
            if isinstance(menu_id, int):
                return menu_id

    return None


def upsert_menu(
    menus_endpoint: str,
    token: str,
    title: str,
    handle: str,
    menu_items: list[tuple[str, str]],
    rate_limit_seconds: float,
) -> int:
    menu_id = find_existing_menu_id(menus_endpoint, token, title)
    if rate_limit_seconds > 0:
        time.sleep(rate_limit_seconds)

    payload = {
        "menu": {
            "title": title,
            "handle": handle,
            "items": build_menu_items(menu_items),
        }
    }

    if menu_id is None:
        raise RuntimeError(
            f"Menu named '{title}' was not found. Create it in Shopify Admin first, then rerun this script."
        )

    encoded_id = urllib.parse.quote(str(menu_id), safe="")
    update_endpoint = f"{menus_endpoint.rsplit('.', 1)[0]}/{encoded_id}.json"
    result = request_json(update_endpoint, token, method="PUT", payload=payload)
    menu = result.get("menu") or {}
    updated_menu_id = menu.get("id")
    if not isinstance(updated_menu_id, int):
        raise RuntimeError(f"Menu id not returned after update. Full response: {result}")
    print(f"Updated existing menu with id: {updated_menu_id}")
    return updated_menu_id


def main() -> int:
    dotenv = load_dotenv(ENV_PATH)

    store_domain = env_var("SHOPIFY_STORE_DOMAIN", dotenv)
    admin_token = env_var("SHOPIFY_ADMIN_ACCESS_TOKEN", dotenv)

    if not store_domain:
        print("Missing SHOPIFY_STORE_DOMAIN in environment or .env", file=sys.stderr)
        return 1
    if not admin_token:
        print("Missing SHOPIFY_ADMIN_ACCESS_TOKEN in environment or .env", file=sys.stderr)
        return 1

    api_version = env_var("SHOPIFY_API_VERSION", dotenv, "2024-01")
    rate_limit_seconds_raw = env_var("SHOPIFY_RATE_LIMIT_SECONDS", dotenv, "0.7")

    try:
        rate_limit_seconds = float(rate_limit_seconds_raw) if rate_limit_seconds_raw else 0.7
    except ValueError:
        print("SHOPIFY_RATE_LIMIT_SECONDS must be numeric.", file=sys.stderr)
        return 1

    menus_endpoint = f"https://{store_domain}/admin/api/{api_version}/menus.json"

    menu_title = "product enhancer theme menu"
    menu_handle = "product-enhancer-theme-menu"
    menu_items = [
        ("Home", "/"),
        ("Shop", "/collections/all"),
        ("Features", "/pages/features"),
        ("About", "/pages/about"),
        ("Contact", "/pages/contact"),
        ("Blog", "/blogs/news"),
    ]

    print(f"Updating menu '{menu_title}' on {store_domain}...")
    menu_id = upsert_menu(
        menus_endpoint,
        admin_token,
        menu_title,
        menu_handle,
        menu_items,
        rate_limit_seconds,
    )
    print(f"Menu ready with id: {menu_id}")

    print("Navigation setup complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

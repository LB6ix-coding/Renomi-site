"""Tell Bing (and the other IndexNow engines: Yandex, Seznam, Naver) which marktic.fi pages are new or changed.
ChatGPT search leans on Bing's index, so a page Bing knows is a page ChatGPT can find.

Usage: python indexnow.py changed <file> ...   -> submit those pages (only if they are in sitemap.xml)
       python indexnow.py all                  -> submit every URL in sitemap.xml
Only URLs listed in sitemap.xml are ever sent, so noindex pages (demos, client previews) never are."""
import json
import re
import sys
import urllib.request
from pathlib import Path

HOST = "marktic.fi"
ROOT = Path(__file__).resolve().parents[2]
KEY_FILES = [p for p in ROOT.glob("*.txt") if re.fullmatch(r"[0-9a-f]{32}", p.stem)]


def sitemap_urls() -> list[str]:
    return re.findall(r"<loc>([^<]+)</loc>", (ROOT / "sitemap.xml").read_text(encoding="utf-8"))


def url_for(path: str) -> str:
    p = path.lstrip("./")
    if p == "index.html":
        return f"https://{HOST}/"
    if p.endswith("/index.html"):
        return f"https://{HOST}/{p[:-len('index.html')]}"
    # Cloudflare Pages serves /x.html as /x (and redirects the .html address there)
    return f"https://{HOST}/{p[:-len('.html')] if p.endswith('.html') else p}"


def main(argv: list[str]) -> int:
    if len(KEY_FILES) != 1:
        print(f"expected one 32-hex key file in the site root, found {len(KEY_FILES)}")
        return 1
    key = KEY_FILES[0].stem
    allowed = sitemap_urls()
    if argv[:1] == ["all"] or "sitemap.xml" in argv[1:]:
        urls = allowed
    else:
        urls = sorted({url_for(f) for f in argv[1:] if f.endswith(".html")} & set(allowed))
    if not urls:
        print("indexnow: no sitemap pages changed; nothing to submit")
        return 0
    body = json.dumps({"host": HOST, "key": key, "keyLocation": f"https://{HOST}/{key}.txt",
                       "urlList": urls[:10000]}).encode()
    req = urllib.request.Request("https://api.indexnow.org/indexnow", data=body, method="POST",
                                 headers={"Content-Type": "application/json; charset=utf-8"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print(f"indexnow: HTTP {r.status}, {len(urls)} URL(s) submitted")
            for u in urls:
                print("  ", u)
            return 0
    except urllib.error.HTTPError as e:
        # 403 = key file not reachable yet, 422 = a URL not on this host, 429 = too many submissions
        print(f"indexnow: HTTP {e.code} {e.reason}: {e.read()[:200]!r}")
        return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

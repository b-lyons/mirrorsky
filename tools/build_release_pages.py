#!/usr/bin/env python3
"""Build releases/<slug>.html from the live Bandcamp catalog.

Every release page is generated from Bandcamp's own data, so track titles,
track ids and durations never have to be typed by hand. To add a release:

  1. Put its cover art at images/releases/<slug>.jpg
  2. Add a line to RELEASES below (the slug is the last part of the
     Bandcamp URL, e.g. mirrorsky.bandcamp.com/album/north-star -> north-star)
  3. Run:  python3 tools/build_release_pages.py
  4. Add the matching card to index.html by hand

Needs network access; only uses the standard library.
"""

import datetime
import html
import json
import os
import re
import sys
import urllib.request

LABEL = "https://mirrorsky.bandcamp.com"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# slug, kind ("album" or "track"), card theme, Bandcamp player link colour.
# Themes match the .release-page--* rules in css/styles.css.
RELEASES = [
    ("pig-tongue-and-blood-cake", "track", "pink", "e0348a"),
    ("impale-my-heart-with-a-marshmallow-stick", "track", "cyan", "1fa8c4"),
    ("north-star", "album", "yellow", "f2b53c"),
    ("birdcode-exe", "album", "purple", "8c4dff"),
    ("angel-wings", "album", "cyan", "1fa8c4"),
]


def esc(s):
    return html.escape(s, quote=True)


def mmss(sec):
    sec = int(round(sec or 0))
    return f"{sec // 60}:{sec % 60:02d}"


def fetch_tralbum(slug, kind):
    """Pull the release's data-tralbum blob off its Bandcamp page."""
    url = f"{LABEL}/{kind}/{slug}"
    req = urllib.request.Request(url, headers={"User-Agent": "mirrorsky-release-page-builder"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        page = resp.read().decode("utf-8", "replace")
    m = re.search(r'data-tralbum="([^"]+)"', page)
    if not m:
        sys.exit(f"no release data found on {url} — did the slug or Bandcamp's markup change?")
    return json.loads(html.unescape(m.group(1)))


def clean_track_title(title, artist):
    """Bandcamp singles store the title as 'Artist - Title'; strip that back down."""
    prefix = f"{artist} - "
    return title[len(prefix):] if title.startswith(prefix) else title


def load(slug, kind, theme, linkcol):
    d = fetch_tralbum(slug, kind)
    artist = d["artist"]
    tracks = [
        {
            "n": t["track_num"] or 1,
            "title": clean_track_title(t["title"], artist),
            "id": t["id"],
            "dur": t.get("duration"),
        }
        for t in d["trackinfo"]
    ]
    return {
        "slug": slug,
        "title": d["current"]["title"],
        "artist": artist,
        "theme": theme,
        "linkcol": linkcol,
        "is_album": kind == "album",
        "id": d["id"],
        "date": datetime.datetime.strptime(d["current"]["release_date"], "%d %b %Y %H:%M:%S %Z"),
        "tracks": tracks,
        "bc_url": f"{LABEL}/{kind}/{slug}",
        "cover": f"images/releases/{slug}.jpg",
        "total": sum(t["dur"] or 0 for t in tracks),
    }


def catalog_line(r):
    bits = ["DIGITAL ALBUM" if r["is_album"] else "DIGITAL TRACK"]
    if r["is_album"]:
        bits.append(f"{len(r['tracks'])} TRACKS")
    bits.append(r["date"].strftime("%b %Y").upper())
    return " · ".join(bits)


def embed_url(r, track_id=None):
    """A Bandcamp player. Pass a track id for a single track, omit it for the release."""
    what = f"track={track_id}" if track_id else f"{'album' if r['is_album'] else 'track'}={r['id']}"
    return (f"https://bandcamp.com/EmbeddedPlayer/{what}/size=small/bgcol=ffffff/"
            f"linkcol={r['linkcol']}/artwork=none/transparent=true/")


HEADER = """    <header class="site-header">
      <a href="../index.html" class="brand">MirrorSky</a>
      <nav class="main-nav" aria-label="Primary">
        <a href="../index.html#releases" class="pill-link">Releases</a>
        <a href="../index.html#roster" class="pill-link">Roster</a>
        <a href="../index.html#merch" class="pill-link">Merch</a>
        <a href="../index.html#demos" class="pill-link pill-link--accent">Demos</a>
      </nav>
    </header>"""

FOOTER = """    <footer class="site-footer">
      <span>MirrorSky Productions · London, UK</span>
      <div class="footer-links">
        <a href="https://mirrorsky.bandcamp.com" target="_blank" rel="noopener">Bandcamp</a>
        <a href="../index.html#releases">All releases</a>
      </div>
    </footer>"""


def render(r, catalog):
    tracks_html = []
    for t in r["tracks"]:
        player_title = f"Play {t['title']} by {r['artist']} — Bandcamp player"
        tracks_html.append(f"""          <li class="track-row">
            <span class="track-num" aria-hidden="true">{t['n']:02d}</span>
            <iframe class="track-embed" style="border:0;" src="{embed_url(r, t['id'])}" seamless loading="lazy" title="{esc(player_title)}"></iframe>
            <span class="track-dur">{mmss(t['dur'])}</span>
          </li>""")

    others = sorted((o for o in catalog if o["slug"] != r["slug"]),
                    key=lambda o: o["date"], reverse=True)
    more_html = "\n".join(
        f"""          <a href="{o['slug']}.html" class="more-release-link">
            <span class="more-release-title">{esc(o['title'])}</span>
            <span class="more-release-artist">{esc(o['artist'])}</span>
          </a>"""
        for o in others
    )

    facts = [f"Released {r['date'].strftime('%-d %B %Y')}"]
    facts.append(f"{len(r['tracks'])} tracks · {mmss(r['total'])}" if r["is_album"]
                 else f"Single · {mmss(r['total'])}")
    facts_html = "<br>\n            ".join(esc(f) for f in facts)

    # A single is already playable in the hero — no tracklist worth printing.
    hint = "Hit play on any track — or play the whole release above."
    tracklist_section = "" if len(r["tracks"]) == 1 else f"""        <div class="tracklist-head">
          <h2 class="tracklist-title">Tracks</h2>
          <span class="tracklist-hint">{esc(hint)}</span>
        </div>

        <ol class="tracklist">
{chr(10).join(tracks_html)}
        </ol>
"""

    desc = (f"{r['title']} by {r['artist']} on MirrorSky Productions — play every track."
            if r["is_album"] else
            f"{r['title']} by {r['artist']} — a single on MirrorSky Productions.")

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{esc(r['title'])} — {esc(r['artist'])} — MirrorSky Productions</title>
  <meta name="description" content="{esc(desc)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/styles.css">
</head>
<body>
  <a href="#top" class="skip-link">Skip to main content</a>

  <div class="page release-page release-page--{r['theme']}">
    <div class="glitter-layer" aria-hidden="true"></div>
    <div class="sheen-layer" aria-hidden="true"></div>
    <div class="blob blob--pink" aria-hidden="true"></div>
    <div class="blob blob--cyan" aria-hidden="true"></div>
    <div class="blob blob--yellow" aria-hidden="true"></div>

{HEADER}

    <main id="top">
      <section class="section" aria-labelledby="release-heading">
        <a href="../index.html#releases" class="back-link">← All releases</a>

        <div class="release-hero">
          <div class="release-hero-cover">
            <img src="../{r['cover']}" alt="{esc(r['title'])} cover art" width="700" height="700">
            <div class="sheen" aria-hidden="true"></div>
          </div>

          <div class="release-hero-meta">
            <span class="release-hero-catalog">{catalog_line(r)}</span>
            <h1 id="release-heading" class="release-hero-title">{esc(r['title'])}</h1>
            <span class="release-hero-artist">{esc(r['artist'])}</span>
            <p class="release-hero-facts">
            {facts_html}
            </p>

            <div class="whole-release">
              <h2>{'Play the whole release' if r['is_album'] else 'Play'}</h2>
              <iframe class="bc-embed" style="border:0;" src="{embed_url(r)}" seamless title="{esc(r['title'])} by {esc(r['artist'])} — Bandcamp player"></iframe>
            </div>

            <a href="{r['bc_url']}" target="_blank" rel="noopener" class="btn btn--pink">Buy on Bandcamp ↗</a>
          </div>
        </div>

{tracklist_section}
        <h2 class="tracklist-title more-title">More from MirrorSky</h2>
        <div class="more-releases">
{more_html}
        </div>
      </section>
    </main>

{FOOTER}
  </div>
</body>
</html>
"""


def main():
    catalog = []
    for slug, kind, theme, linkcol in RELEASES:
        print(f"fetching {slug} ...")
        catalog.append(load(slug, kind, theme, linkcol))

    out_dir = os.path.join(ROOT, "releases")
    os.makedirs(out_dir, exist_ok=True)
    for r in catalog:
        if not os.path.exists(os.path.join(ROOT, r["cover"])):
            print(f"  warning: missing cover art {r['cover']}")
        path = os.path.join(out_dir, f"{r['slug']}.html")
        with open(path, "w") as f:
            f.write(render(r, catalog))
        print(f"wrote releases/{r['slug']}.html ({len(r['tracks'])} tracks)")


if __name__ == "__main__":
    main()

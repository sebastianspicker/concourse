# Design preview: Concourse 2026 ("Meridian")

> **Superseded.** This mockup documents the earlier "Meridian" exploration. The
> client now implements the "Stage" direction described in
> [DESIGN.md](../DESIGN.md); the static demo is the current reference.

An isolated visual-design mockup, not part of the production app, build, or
static-demo pipeline. It uses only fictional `example` pack content and makes no
network calls.

## Open

~~~bash
python3 -m http.server 8091 --bind 127.0.0.1
# → http://127.0.0.1:8091/
~~~

Or open `index.html` directly in a browser. The hosted copy lives at
<https://sebastianspicker.github.io/concourse-campus-kit/design-preview/>.

## What to try

- The "Data state · simulated" switcher (top right): Live, Cached, Degraded,
  Offline, Empty, and Error. It shows the freshness-first state language.
- The appearance toggle (sun icon), or Settings → Appearance: light, dark, and
  high contrast.
- Events: search, sort, and open a row for the detail sheet.
- Resize below 820 px for the mobile shell with bottom tab bar.

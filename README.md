# AI Governance Lab website

Static site for the AI Governance Lab (Stanford). The structure follows
[stanforddpl.org](https://stanforddpl.org) — Stanford's Democracy and
Polarization Lab — with a full-bleed hero, a single scrolling homepage, and
publication and news lists driven by data files.

## How the seven tabs are arranged

Five tabs are sections of the homepage that the nav scrolls to; two are their
own pages.

| Tab | Where it lives |
| --- | --- |
| Home | `index.html`, the `#home` hero |
| People | `index.html`, the `#people` section |
| News | `index.html`, the `#news` section |
| Events | `index.html`, the `#events` section |
| Research | `research.html` |
| Teaching | `teaching.html` |
| Stay in Touch | `index.html`, the `#substack` section |

The nav is generated from `_data/nav.yml`, so the tabs exist in exactly one
place. A tab with `section: true` scrolls to a homepage section whose HTML `id`
must match the tab's `id`; without it, the tab loads a page.

The homepage's sections run in the same order as the tabs, so the highlighted
tab moves left to right as you scroll. If you reorder a section tab in
`_data/nav.yml`, move its `<section>` in `index.html` to match — and check the
`band` / `band band-alt` classes still alternate down the page.

## Structure

Content is kept separately from markup, so most edits mean changing a data file
rather than touching HTML.

**Edit these to change content:**

- `_data/people.yml` — everyone in the People section (name, role, group, photo, link)
- `_data/people_groups.yml` — the People subsections and their order
- `_data/research.yml` — publications on the Research page
- `_data/news.yml` — items in the News section
- `_data/events.yml` — items in the Events section
- `_data/courses.yml` — courses on the Teaching page
- `_data/nav.yml` — the top-nav tabs
- `_data/substack.yml` — the latest Substack posts (generated, see below)
- `index.html`, `research.html`, `teaching.html` — page prose

**Edit these to change how it looks:**

- `_layouts/default.html` — the page shell every page renders through
- `_includes/head.html` — `<head>`, fonts, favicon, the pre-paint theme script
- `_includes/nav.html` — nav bar, mobile menu, light/dark toggle
- `_includes/footer.html` — footer
- `assets/css/style.css` — all styling (Stanford cardinal, light/dark)
- `assets/js/theme.js` — light/dark toggle, mobile menu, scroll highlighting
- `assets/js/events.js` — the Events calendars, and hiding past events
- `assets/img/` — member photos, the hero image, and the favicon
- `assets/img/substack/` — post cover images (generated, see below)
- `script/update-substack.rb` — refreshes `_data/substack.yml` from the RSS feed

## Filling in real content

### The hero photo

The photo behind the lab name is `assets/img/coda.jpg`. To change it, drop a
landscape image at least 1600px wide into `assets/img/` and point `hero_image`
in `_config.yml` at it:

```yaml
hero_image: /assets/img/coda.jpg
```

A dark scrim goes over the photo automatically, weighted toward the middle
where the lab name sits, so white type stays readable over bright glass or
sky. A photo that is very bright straight through the middle will still fight
the text.

### The favicon

The tab icon is `assets/img/favicon.png`, a 168px square, linked from
`_includes/head.html` as both the favicon and the iOS home-screen icon. To
change it, replace that file. Browsers cache favicons hard, so if a new one
has to show up right away, rename the file and update the two `<link>` tags in
`_includes/head.html` to match.

### Adding or editing a person

Open `_data/people.yml` and copy an existing block:

```yaml
- name: Jane Doe
  last_name: Doe         # each group is alphabetized by this
  role: Postdoctoral Scholar
  group: postdocs        # faculty | postdocs | members | alumni
  photo: jane-doe.jpg    # file in assets/img/; omit for a blank circle
  url: https://example.edu/people/jane-doe
```

`last_name` is required: each group is sorted by it, so the order of the file
itself doesn't matter and adding someone never means resorting by hand.

Prefix `name` with "Dr." for someone who holds a doctorate but whose `role`
doesn't already name a professorship. Rob and Nate are listed plainly because
"Professor of Law" carries the credential on its own; a postdoc's title
doesn't, so Roberta is "Dr. Roberta Fischli". Leave `last_name` unprefixed —
it's what the sorting uses.

`role` is whatever should appear under the name. For the co-directors that's
their full endowed chair rather than "Co-Director" — the group heading above
the cards already says that, so the card doesn't repeat it. Their cards are
wider than the members' to fit a chair title; see `.people-grid-faculty` in
`assets/css/style.css`.

The exception is a group in `_data/people_groups.yml` marked `order: listed`,
which keeps the order the people appear in `_data/people.yml`. The faculty
directors use it, since their order is a deliberate choice rather than a
convention — to reorder them, move the blocks in `_data/people.yml`.

`url` makes the whole card a link to that person's faculty or personal page,
with a light red highlight on hover. Leave it out and the card renders as plain
text instead.

Headshots are pre-cropped to a square (at least 360px) with the face centered
and filling a bit under half the frame, so every avatar circle reads at the
same scale. Crop a new photo the same way before adding it; `photo_position:
top` is a fallback for an uncropped portrait whose head gets cut off.

Moving someone to `group: alumni` moves them to a "Lab Alumni" section, which
stays hidden while it's empty.

### Adding a publication

Copy a block in `_data/research.yml`. Newest first — the file's order is the
page's order.

```yaml
- title: "The paper's title"
  authors: ["Jane Doe", "John Roe"]
  year: 2026
  venue: "Journal Name"      # or "Working paper"; omit if neither
  details: "12(3): 145–170"  # volume/issue/pages, or a status note
  links:
    pdf: "https://example.org/paper.pdf"
    doi: "https://doi.org/..."
```

`links` also accepts `url`, `code`, and `data`. Each one renders as a small
button; leave out the ones that don't apply.

### Adding a news item

Copy a block in `_data/news.yml`. Newest first. `summary` is optional — use it
to say why the item matters to the lab when the headline doesn't mention us.

```yaml
- date: 2026-08-14
  outlet: "The New York Times"
  title: "The headline of the story"
  summary: "What the story means for the lab."
  url: "https://example.com/story"
```

### Adding an event

Copy a block in `_data/events.yml`, in any order — the section sorts by date
and hides events once their day has passed. Everything but `date` and `title`
is optional.

`host` sets the event's color on the calendar and its line in the key: `lab`
(the default), `hai`, `sls`, or `related` for someone else's event on the lab's
subject matter. The colors live in `style.css` as `--host-*`.

For an event that runs more than one day, add `end_date`. It's marked on every
day it runs and stays listed until the last one.

```yaml
- date: 2026-10-08
  title: "Workshop: Auditing frontier models"
  host: lab
  time: "12:00–1:30 pm"
  location: "Encina Hall, Stanford"
  summary: "A half-day session on what third-party audits can establish."
  url: "https://example.com/register"
```

The two small calendars (this month and next) are drawn in the browser by
`assets/js/events.js`, which also drops events that have passed since the last
build and holds back anything after the end of next month, so the list covers
the same two months as the calendars. Events further out can be added any time;
they appear on their own once they come within range. Without JavaScript the
full list still shows, as of the last build. The key under the heading only
lists hosts that have an event on the list.

### Adding a course

Copy a block in `_data/courses.yml`. `instructors`, `head_cas`, and `cas` are
optional lists of names; each renders as its own labelled line under the course
title. A name that matches someone in `_data/people.yml` is bolded, so lab
members stand out from the rest of the teaching team — spell them exactly as
People does.

### Refreshing the Substack posts

The bottom of the homepage lists the five most recent newsletter posts, under
the subscribe box. They come from `_data/substack.yml`, which is generated from
the Substack RSS feed. To pull in new posts, run:

```sh
ruby script/update-substack.rb
```

then commit the changed `_data/substack.yml` along with anything that changed
under `assets/img/substack/` — each post's cover image is downloaded there
rather than hotlinked, and covers for posts that have dropped off the list are
deleted on each run. Bylines come from Substack's post API rather than the
feed, which names only a post's first author, so co-authors and guests show up
too. The script needs nothing but Ruby — no `bundle`, no gems —
and it reads the newsletter address from `substack_url` in `_config.yml`. If
`jekyll serve` is running while you refresh, restart it: its file watcher does
not notice the cover directory being replaced, and you will keep seeing the old
images.

This is a manual step on purpose. GitHub Pages builds the site with no network
access, so the feed cannot be read at build time, Substack blocks automated
clients such as CI runners from fetching the feed at all, and doing it in the
browser would put a third-party request on every page load. Re-run it whenever
you want the homepage to catch up; nothing breaks if it goes a while between
runs, the list just shows older posts. To list more or fewer than five, change
`POST_COUNT` at the top of the script and re-run it.

### Contact email and link previews

The lab's address, `contact_email` in `_config.yml`, is linked from the Stay in
Touch section and the footer.

Link previews (what Slack, LinkedIn, or X show when someone pastes the URL) and
`/sitemap.xml` come from the `jekyll-seo-tag` and `jekyll-sitemap` plugins,
listed under `plugins:` in `_config.yml`. Each page's `title` and `description`
front matter feed the preview; the image is `assets/img/og.jpg`, a 1200×630
crop of the hero photo. Replace that file to change the preview image.

### Editing page prose

The About paragraphs and the Substack blurb are in `index.html`; everything
above the `---` line at the top of each page is configuration, everything below
is content.

### Editing without a terminal

All of the above are plain text files. You can edit them directly on GitHub —
open the file, click the pencil icon, make the change, and click "Commit
changes." The site rebuilds and republishes itself within a minute or two.

## Working on it locally

One-time setup:

```bash
bundle install
```

Then, to preview with live reload on every save:

```bash
bundle exec jekyll serve
```

and open http://localhost:4000/ — `baseurl` is empty because the site is served
at a custom domain root, so there is no path prefix (see the `baseurl` note in
`_config.yml`).

## Design notes

- Type is **Public Sans** (the US Web Design System's typeface) for text and
  **Newsreader** for headings, both from Google Fonts and loaded in
  `_includes/head.html`.
- The accent is Stanford cardinal `#8c1515`, which is also DPL's.
- Sections alternate white and `#f7f5f2` instead of being boxed in cards.
- The hero uses a fixed-attachment parallax only on wide, non-touch screens and
  only when the visitor hasn't asked for reduced motion.
- The footer's copyright year comes from the build time, so it can't go stale.
- Light/dark is set before first paint by an inline script in `head.html`, so
  the page never flashes the wrong theme.

## Repository

This site lives at [`stanford-developers/aigovlab`](https://github.com/stanford-developers/aigovlab)
under the Stanford Developers GitHub organization. It moved there from
`aigovlab/lab-website`; GitHub redirects the old URL, but the remote here
points at the new location. The site itself is served from the custom domain
(see Deployment).

It was seeded from `dazzap9/ai-governance-lab`, which is kept as an `upstream`
remote (fetch-only) in case we want to pull in changes from that copy:

```bash
git fetch upstream          # see what changed over there
git merge upstream/main     # only if you actually want those changes
```

Day-to-day, just push to `origin` as normal:

```bash
git add .
git commit -m "Describe your change"
git push
```

## Deployment

The site is deployed with GitHub Pages from the `main` branch, root folder
(Settings → Pages). Every push to `main` republishes it automatically; it
usually goes live within a minute or two.

Live URL: https://aigovlab.stanford.edu/

The custom domain is set by the `CNAME` file at the repo root (mirrored in
Settings → Pages). `stanford-developers.github.io/aigovlab` redirects to it.
Deleting `CNAME` would move the site back to that project path and require
setting `baseurl` in `_config.yml` back to `/aigovlab`.

GitHub Pages builds the site with Jekyll natively — there is no GitHub Actions
workflow to maintain. The `Gemfile` pins the `github-pages` gem so a local
preview uses the same Jekyll version (3.10) that GitHub builds with, rather than
drifting from production.

# CLAUDE.md

## Local server

After changing any file while `bundle exec jekyll serve` is running, stop the
server, delete `_site/`, and start it again before checking the page. The
`github-pages` gem enables the Primer theme by default, and its
`assets/css/style.scss` builds to the same path as our `assets/css/style.css`.
An auto-regeneration can write Primer's version last and leave the page
unstyled. A clean build doesn't hit this, and the deployed site isn't affected.

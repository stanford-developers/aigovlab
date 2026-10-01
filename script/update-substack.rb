#!/usr/bin/env ruby
# frozen_string_literal: true

# Refreshes _data/substack.yml from the lab's Substack RSS feed.
#
#   ruby script/update-substack.rb
#
# The homepage renders whatever is in that file, so the posts it lists only
# change when someone runs this and commits the result. That is deliberate:
# GitHub Pages builds with a fixed plugin set and no network access, so the
# feed cannot be read at build time, and reading it from the browser would put
# a third-party request on every page load. Committing the data keeps the
# published page self-contained and reviewable.
#
# Only the standard library is used, so this runs with plain `ruby` — no
# bundle, no gems.

require "net/http"
require "uri"
require "rexml/document"
require "yaml"
require "cgi"
require "time"
require "fileutils"
require "json"

ROOT = File.expand_path("..", __dir__)
CONFIG = File.join(ROOT, "_config.yml")
OUTPUT = File.join(ROOT, "_data", "substack.yml")

# Cover images are downloaded here rather than hotlinked from Substack's CDN,
# so the homepage stays self-contained and does not hand every visitor off to a
# third party to draw itself. Files no longer referenced are pruned on each run.
IMAGE_DIR = File.join(ROOT, "assets", "img", "substack")
IMAGE_PATH = "/assets/img/substack"

# How many posts the homepage lists. This is the only edit needed to show more
# or fewer; the template loops over whatever ends up in the file.
POST_COUNT = 5

# Substack serves the feed to a request that identifies itself; the bare
# default Ruby user agent gets turned away.
USER_AGENT = "aigovlab-website-feed-fetcher (+https://aigovlab.stanford.edu)"

# The newsletter URL lives in _config.yml so the site and this script cannot
# drift apart. YAML.load_file is enough — the config is plain scalars.
def substack_url
  base = YAML.load_file(CONFIG)["substack_url"]
  abort "No `substack_url` in _config.yml" if base.nil? || base.empty?

  base
end

def feed_url
  URI.join(substack_url, "feed")
end

def fetch(uri, redirects_left = 5)
  abort "Too many redirects fetching #{uri}" if redirects_left.zero?

  response = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https") do |http|
    http.request(Net::HTTP::Get.new(uri, "User-Agent" => USER_AGENT))
  end

  case response
  when Net::HTTPSuccess then response
  when Net::HTTPRedirection then fetch(URI.join(uri, response["location"]), redirects_left - 1)
  else abort "Request for #{uri} failed: #{response.code} #{response.message}"
  end
end

# Feed fields arrive as CDATA and may carry HTML (Substack puts the post
# subtitle in <description>, sometimes wrapped in a tag). Strip the markup,
# unescape the entities, and collapse whitespace so each value stays a single
# readable line of YAML.
def plain_text(node)
  return nil if node.nil?

  text = node.texts.map(&:value).join
  CGI.unescape_html(text.gsub(%r{<[^>]+>}, " ")).gsub(/\s+/, " ").strip
end

# pubDate is RFC 822. Store it as a plain date so Liquid's `date` filter can
# format it the same way the news and events lists do.
def published_date(node)
  raw = plain_text(node)
  return nil if raw.nil? || raw.empty?

  Time.rfc2822(raw).strftime("%Y-%m-%d")
rescue ArgumentError
  abort "Could not read the publication date #{raw.inspect}"
end

# Substack's CDN takes Cloudinary-style transforms in the URL, so ask it for a
# card-sized crop instead of downloading the 2000px original. These are the
# same numbers Substack's own archive uses for its post thumbnails: a 3:2 crop
# at twice the displayed size, and `g_auto` so the crop keeps the salient part
# of the picture. Without `g_auto` a portrait cover gets cut through its middle
# and lands on the page as an unreadable detail. Covers posted as bare S3 links
# carry no signature to transform and come down at full size; CSS crops those
# to the same shape, though only from the center.
CARD_TRANSFORM = "w_424,h_282,c_fill,g_auto"

# Post URLs end in a slug (.../p/a-congress-of-robert-reichs), which makes a
# stable, readable filename for that post's cover.
def slug_for(item)
  link = plain_text(item.elements["link"]).to_s
  File.basename(URI.parse(link).path)
end

def card_sized(url)
  url.sub(%r{(/image/fetch/\$s_![^!]+!,)}) { "#{Regexp.last_match(1)}#{CARD_TRANSFORM}," }
end

# The extension comes from what the server actually sends, not from the URL:
# asking the CDN for a transform returns a JPEG even when the original — whose
# address is embedded in the request path — was a PNG.
EXTENSIONS = { "image/jpeg" => ".jpg", "image/png" => ".png", "image/webp" => ".webp",
               "image/gif" => ".gif" }.freeze

# The post slug names the file, so re-running overwrites the same cover rather
# than accumulating one copy per fetch.
def download_cover(url, slug)
  return nil if url.nil? || url.empty?

  response = fetch(URI.parse(card_sized(url)))
  extension = EXTENSIONS[response["content-type"].to_s.split(";").first]

  if extension.nil?
    warn "  skipped the cover for #{slug}: unexpected type #{response["content-type"].inspect}"
    return nil
  end

  FileUtils.mkdir_p(IMAGE_DIR)
  File.binwrite(File.join(IMAGE_DIR, "#{slug}#{extension}"), response.body)

  "#{IMAGE_PATH}/#{slug}#{extension}"
end

# The feed's <dc:creator> names only a post's first author, so co-authors and
# guest bylines would silently go missing. Substack's post API lists them all,
# in the order the post shows them. Falls back to the feed's author if the API
# returns no bylines.
def byline_names(slug)
  body = fetch(URI.join(substack_url, "api/v1/posts/#{slug}")).body
  JSON.parse(body).fetch("publishedBylines", []).filter_map { |byline| byline["name"] }
rescue JSON::ParserError
  warn "  could not read the bylines for #{slug}; using the feed's author"
  []
end

# Joined the way Substack writes them: "A", "A and B", "A, B, and C".
def byline(names)
  return names.first if names.length < 2
  return names.join(" and ") if names.length == 2

  "#{names[0..-2].join(', ')}, and #{names.last}"
end

# Covers from posts that have dropped off the list would otherwise sit in the
# repo forever.
def prune_covers(keep)
  return unless Dir.exist?(IMAGE_DIR)

  Dir.children(IMAGE_DIR).each do |file|
    next if keep.include?("#{IMAGE_PATH}/#{file}")

    File.delete(File.join(IMAGE_DIR, file))
    puts "  removed stale cover #{file}"
  end
end

def posts_from(xml)
  REXML::Document.new(xml).elements.to_a("rss/channel/item").first(POST_COUNT).map do |item|
    {
      # Keys are ordered the way the template reads them.
      "title" => plain_text(item.elements["title"]),
      "url" => plain_text(item.elements["link"]),
      "date" => published_date(item.elements["pubDate"]),
      "summary" => plain_text(item.elements["description"]),
      "author" => byline(byline_names(slug_for(item))) || plain_text(item.elements["dc:creator"]),
      # <enclosure> is where Substack puts the post's cover image. Posts
      # published without one simply render as a card with no picture.
      "image" => download_cover(item.elements["enclosure"]&.attributes&.[]("url"), slug_for(item))
    }.reject { |_, value| value.nil? || value.empty? }
  end
end

posts = posts_from(fetch(feed_url).body)
prune_covers(posts.map { |post| post["image"] }.compact)

# Better to keep the last good list on the page than to blank the section out
# because the feed came back empty.
abort "The feed returned no posts; leaving _data/substack.yml as it is." if posts.empty?

header = <<~YAML
  # The most recent posts from the lab's Substack, listed at the bottom of the
  # homepage. Generated — do not edit by hand. To refresh, run:
  #
  #   ruby script/update-substack.rb
  #
  # Last fetched #{Time.now.strftime('%Y-%m-%d')}.
YAML

File.write(OUTPUT, header + posts.to_yaml)

puts "Wrote #{posts.length} post#{"s" unless posts.length == 1} to _data/substack.yml:"
posts.each { |post| puts "  #{post["date"]}  #{post["title"]}" }

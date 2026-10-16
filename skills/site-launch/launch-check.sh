#!/usr/bin/env bash
# Live pre-launch check of a public site. Reads only what any visitor or
# crawler can see; prints PASS / FAIL / WARN per check and exits 1 on any FAIL.
# Usage: bash launch-check.sh https://example.com
set -u
url="${1:?usage: launch-check.sh https://example.com}"
url="${url%/}"
host=$(sed -E 's#^https?://##; s#/.*##' <<<"$url")
bare=${host#www.}
fails=0; warns=0
pass() { echo "PASS  $*"; }
fail() { echo "FAIL  $*"; fails=$((fails + 1)); }
warn() { echo "WARN  $*"; warns=$((warns + 1)); }
c() { curl -sS --max-time 20 "$@"; }

# Status line and final URL after redirects.
final() { c -o /dev/null -L -w '%{http_code} %{url_effective}' "$1" 2>/dev/null; }
code() { c -o /dev/null -w '%{http_code}' "$1" 2>/dev/null; }

# 1. One canonical host over HTTPS.
read -r st canon <<<"$(final "$url/")"
[ "$st" = 200 ] && pass "home page 200 at $canon" || fail "home page returns $st"
case "$canon" in https://*) pass "final URL is HTTPS" ;; *) fail "final URL is not HTTPS: $canon" ;; esac
chost=$(sed -E 's#^https?://##; s#/.*##' <<<"$canon")
for v in "http://$bare/" "http://www.$bare/" "https://$bare/" "https://www.$bare/"; do
  read -r s f <<<"$(final "$v")"
  fh=$(sed -E 's#^https?://##; s#/.*##' <<<"$f")
  if [ "$s" = 000 ]; then warn "$v does not resolve or answer (fine only if that host is not used)"
  elif [ "$fh" = "$chost" ] && [[ "$f" == https://* ]]; then pass "$v -> $f"
  else fail "$v ends at $f ($s), not at https://$chost"; fi
done
first=$(c -o /dev/null -w '%{http_code}' "http://$chost/" 2>/dev/null)
[[ "$first" =~ ^30[178]$ ]] && pass "http redirect is permanent ($first)" || warn "http://$chost/ first answer is $first, expected 301/308"

# True when a robots.txt group for * or Googlebot carries "Disallow: /".
blocked_for_all() {
  # Lower-cased first: mawk has no IGNORECASE.
  awk '{ $0 = tolower($0); sub(/#.*/, ""); gsub(/\r/, "") }
    /^[ \t]*user-agent:/ { if (!inua) hit=0; inua=1; a=$0; sub(/^[^:]*:[ \t]*/, "", a); sub(/[ \t]+$/, "", a); if (a=="*" || a=="googlebot") hit=1; next }
    /^[ \t]*$/ { next }
    { inua=0 }
    hit && /^[ \t]*disallow:[ \t]*\/[ \t]*$/ { found=1 }
    END { exit !found }'
}

home=$(c -L "$canon")

# 2. Indexable: robots, meta robots, sitemap, canonical.
robots=$(c "https://$chost/robots.txt"); rc=$(code "https://$chost/robots.txt")
if [ "$rc" != 200 ]; then warn "robots.txt returns $rc"
elif blocked_for_all <<<"$robots"; then fail "robots.txt blocks the whole site for * or Googlebot (staging leftover?)"
else pass "robots.txt 200, no site-wide Disallow"; fi
grep -qiE '<meta[^>]+name=["'"'"']robots["'"'"'][^>]+noindex' <<<"$home" && fail "home page has meta robots noindex" || pass "no meta noindex on home"
c -sI -L "$canon" | grep -qi '^x-robots-tag:.*noindex' && fail "X-Robots-Tag noindex header" || pass "no X-Robots-Tag noindex"
sm=$(grep -iE '^sitemap:' <<<"$robots" | head -1 | sed -E 's/^[Ss]itemap:[[:space:]]*//' | tr -d '\r')
sm=${sm:-https://$chost/sitemap.xml}
smc=$(code "$sm")
if [ "$smc" = 200 ]; then
  locs=$(c "$sm" | grep -o '<loc>[^<]*' | sed 's/<loc>//')
  pass "sitemap $sm 200 ($(grep -c . <<<"$locs") <loc> entries)"
  foreign=$(grep -v "^https://$chost" <<<"$locs" | grep . | head -3)
  [ -z "$foreign" ] || fail "sitemap lists URLs off https://$chost, e.g. $(head -1 <<<"$foreign")"
else fail "sitemap $sm returns $smc"; fi
grep -qiE '<link[^>]+rel=["'"'"']canonical' <<<"$home" && pass "canonical link present" || warn "no rel=canonical on home"

# 3. Page basics.
t=$(grep -oiE '<title>[^<]*' <<<"$home" | head -1 | sed -E 's/<title>//I')
[ -n "$t" ] && pass "title: $t" || fail "no <title>"
grep -qiE '<meta[^>]+name=["'"'"']description' <<<"$home" && pass "meta description present" || warn "no meta description"
grep -qiE '<html[^>]+lang=' <<<"$home" && pass "html lang set" || warn "no <html lang>"
grep -qiE 'property=["'"'"']og:image' <<<"$home" && pass "og:image present" || warn "no og:image (ugly link previews)"
grep -qiE 'name=["'"'"']viewport' <<<"$home" && pass "viewport meta present" || fail "no viewport meta (broken on phones)"
fc=$(code "https://$chost/favicon.ico")
[ "$fc" = 200 ] || grep -qiE 'rel=["'"'"'][^"'"'"']*icon' <<<"$home" && pass "favicon found" || warn "no favicon"
nf=$(code "https://$chost/this-page-should-not-exist-$RANDOM")
[ "$nf" = 404 ] && pass "missing page returns 404" || fail "missing page returns $nf (soft 404)"

# 4. Analytics tag (presence only; the skill proves an event arrives).
if grep -qiE 'googletagmanager|gtag\(|plausible|umami|posthog|cloudflareinsights|yandex.*metri|mc\.yandex|fathom|clarity\.ms' <<<"$home"
then pass "analytics snippet found in HTML"; else warn "no known analytics snippet in home HTML"; fi

# 5. Security headers worth having.
hdr=$(c -sI -L "$canon")
grep -qi '^strict-transport-security' <<<"$hdr" && pass "HSTS header" || warn "no HSTS header"

echo
echo "fails: $fails  warns: $warns"
[ "$fails" -eq 0 ]

#!/usr/bin/env bash
# Cloudflare token probe: what each token can do, WITHOUT printing values.
#
# Usage:
#   ACCOUNT=<account_id> SITE_DOMAIN=<example.com> \
#     bash probe-cloudflare.sh CLOUDFLARE_DEPLOY_TOKEN CLOUDFLARE_API_TOKEN ...
# Arguments are environment variable NAMES, not values. In GitHub Actions the
# variables are filled from secrets in the step's `env:` block (see the
# "Running the probe in CI" paragraph in SKILL.md).
#
# Prints, per token, the value's shape and alive / account / D1 / Workers /
# zone / analytics as "yes" or "no (code N)". Every request is read-only;
# nothing is written to production. The token value is never printed: the
# diagnosis describes CAPABILITIES, not content.
#
# Asymmetry: a successful read does not prove Edit permission, a failed one
# disproves it. "Workers: no" = deploying with this token is certainly impossible.
# Requires: bash, curl, jq, GNU date (as on GitHub's ubuntu runners).
set -u
API=https://api.cloudflare.com/client/v4
: "${ACCOUNT:?set ACCOUNT=<account_id>}"
: "${SITE_DOMAIN:?set SITE_DOMAIN=<domain>}"

probe() {
  local url="$1" tok="$2" resp ok code
  if ! resp=$(curl -sS --max-time 20 "$url" -H "Authorization: Bearer $tok" 2>&1); then
    echo "no (network)"; return
  fi
  ok=$(printf '%s' "$resp" | jq -r '.success // false' 2>/dev/null || echo false)
  if [ "$ok" = "true" ]; then echo "yes"; return; fi
  code=$(printf '%s' "$resp" | jq -r '[.errors[]?.code] | first // "?"' 2>/dev/null || echo '?')
  echo "no (code $code)"
}

# The zone is a special case: /zones?name= answers success:true with an EMPTY
# list when the token cannot see the zone. The first run printed "zone: yes"
# for a token that saw no zone, right next to "analytics: no (cannot see the
# zone)". So here "yes" = the zone is in the answer, not "the request passed".
probe_zone() {
  local tok="$1" resp n code
  if ! resp=$(curl -sS --max-time 20 "$API/zones?name=$SITE_DOMAIN" \
      -H "Authorization: Bearer $tok" 2>&1); then
    echo "no (network)"; return
  fi
  n=$(printf '%s' "$resp" | jq -r '.result // [] | length' 2>/dev/null || echo 0)
  if [ "$n" -gt 0 ]; then echo "yes"; return; fi
  code=$(printf '%s' "$resp" | jq -r '[.errors[]?.code] | first // "not in list"' 2>/dev/null || echo '?')
  echo "no ($code)"
}

# Anyone with Zone:Read can list the zone; only Zone Analytics:Read reads the
# statistics, so this is a separate request, the same one a watchdog makes.
probe_analytics() {
  local tok="$1" zid resp
  zid=$(curl -sS --max-time 20 "$API/zones?name=$SITE_DOMAIN" \
    -H "Authorization: Bearer $tok" 2>/dev/null | jq -r '.result[0].id // empty' 2>/dev/null)
  if [ -z "$zid" ]; then echo "no (cannot see the zone)"; return; fi
  resp=$(curl -sS --max-time 20 "$API/graphql" \
    -H "Authorization: Bearer $tok" -H 'Content-Type: application/json' \
    --data "$(jq -n --arg z "$zid" --arg d "$(date -u -d '2 days ago' +%F)" \
      '{query: "query($zoneTag: string!, $d: Date!) { viewer { zones(filter: {zoneTag: $zoneTag}) { httpRequests1dGroups(limit: 1, filter: {date: $d}) { sum { requests } } } } }",
        variables: {zoneTag: $z, d: $d}}')" 2>/dev/null || echo '{}')
  if [ "$(printf '%s' "$resp" | jq '.errors // [] | length' 2>/dev/null)" != "0" ]; then
    echo "no (no Analytics:Read)"
  else
    echo "yes"
  fi
}

# Value shape: length and characters outside [A-Za-z0-9_-], WITHOUT content.
# A stray newline or space from a phone paste gives "Authentication error
# [code: 10000]" on a freshly created token, the same code as a dead one.
# Here it shows as "1 stray" instead of a mystery. Working Cloudflare tokens
# come in different lengths (40 and 53 have both been seen), so the length is
# printed as a fact and no threshold is applied.
probe_shape() {
  local tok="$1" n ws
  n=${#tok}
  ws=$(printf '%s' "$tok" | tr -d 'A-Za-z0-9_-' | wc -c | tr -d ' ')
  if [ "$ws" -eq 0 ]; then echo "$n chars, clean"; return; fi
  echo "$n chars, $ws STRAY (space/newline/quote: paste it again)"
}

# Account: does the token see OUR account_id? A token created under another
# account, or with "Account Resources: <another account>", is alive and even
# lists accounts, but not ours, and every request against ours returns 10000.
probe_account() {
  local tok="$1" resp n hit code
  if ! resp=$(curl -sS --max-time 20 "$API/accounts" -H "Authorization: Bearer $tok" 2>&1); then
    echo "no (network)"; return
  fi
  if [ "$(printf '%s' "$resp" | jq -r '.success // false' 2>/dev/null)" != "true" ]; then
    code=$(printf '%s' "$resp" | jq -r '[.errors[]?.code] | first // "?"' 2>/dev/null || echo '?')
    echo "no (code $code)"; return
  fi
  n=$(printf '%s' "$resp" | jq -r '.result | length')
  hit=$(printf '%s' "$resp" | jq -r --arg a "$ACCOUNT" '[.result[]?.id] | index($a) // "no"')
  if [ "$hit" != "no" ]; then echo "yes"; else echo "no (sees $n others)"; fi
}

echo "What each token can do (values are NOT printed):"
echo
for name in "$@"; do
  tok="${!name:-}"
  if [ -z "$tok" ]; then
    printf '%-28s NO SECRET\n' "$name"; continue
  fi
  printf '%-28s shape: %s\n' "$name" "$(probe_shape "$tok")"
  printf '%-28s alive: %-14s account: %-20s D1: %-14s Workers: %-14s zone: %-14s analytics: %s\n' \
    "" \
    "$(probe "$API/user/tokens/verify" "$tok")" \
    "$(probe_account "$tok")" \
    "$(probe "$API/accounts/$ACCOUNT/d1/database" "$tok")" \
    "$(probe "$API/accounts/$ACCOUNT/workers/scripts" "$tok")" \
    "$(probe_zone "$tok")" \
    "$(probe_analytics "$tok")"
done
echo
echo "How to read it:"
echo "  A deploy needs D1=yes AND Workers=yes. A cron, D1=yes. A watchdog, analytics=yes."
echo "  \"alive: yes, D1: no (code 10000)\" = the token exists but lacks this permission."
echo "  \"shape: ... STRAY\" or \"account: no\" = pasted with a stray character, or the token is on another account."
echo "  The check is read-only: Edit permission is not proven, but its ABSENCE is."

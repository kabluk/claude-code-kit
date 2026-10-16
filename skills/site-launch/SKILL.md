---
name: site-launch
description: 'Launch checklist for a new public site or web service, proven against the live URL: one canonical HTTPS host, indexable (robots, sitemap, no noindex), page basics, analytics that actually receives an event, Search Console, legal pages, forms and email, monitoring. Use before announcing or opening a site to traffic, when moving a site to a new domain or host, when "nothing shows up in Google" or analytics is empty after launch, and for the day-7 check after launch.'
---

# Site launch

A site "goes live" many times before anyone can find it: staging
`Disallow: /` shipped to production, a sitemap full of preview URLs, an
analytics tag that never sent an event, a soft 404 on every typo. Each is
invisible from the browser and costs weeks of indexing. The rule here: a
launch item is done when the **live** site proves it, never when the config
says so (same spirit as `gate`).

## Steps

1. **Run the live check.** `bash .claude/skills/site-launch/launch-check.sh https://<domain>`
   (in the kit: `skills/site-launch/launch-check.sh`). It checks host and
   HTTPS redirects, robots, meta / header noindex, sitemap, canonical, title,
   description, viewport, og:image, favicon, 404 status, an analytics
   snippet, HSTS. Done when it exits 0, and every WARN left is either fixed or
   written down in step 7 with a reason.
2. **Prove analytics receives data.** A snippet in the HTML is not data.
   Open the site, act as a visitor (a page view plus the one key event: sign-up,
   click to buy, form send), and see it in the tool's realtime view or API.
   Done when the event is seen there, with its name and time.
   EU visitors with cookie-based analytics need a consent banner; a cookieless
   tool (Plausible, Umami, Cloudflare Web Analytics) avoids it.
3. **Register with search engines.** Google Search Console (domain property,
   DNS TXT verification) and Bing Webmaster Tools; submit the sitemap; for a
   Russian-language audience, Yandex Webmaster too. DNS records and console
   logins are owner buttons: load `secrets-and-buttons`, hand over the exact
   record and a direct link as the first line, and continue with what does
   not wait on it. Done when the console shows the sitemap as read, or the
   owner step is handed over and logged in step 7.
4. **Legal pages that match what the site does.** Privacy policy whenever
   analytics, forms, accounts or email exist; terms when anything is sold or
   an account is created; an imprint (Impressum) for a German audience;
   refund terms where payments run. Each linked from the footer of every page.
   Done when each needed page answers 200 and the footer links are on the
   home page HTML.
5. **Every way in and out works.** Submit each form and see the message
   arrive where it should; when the site sends email, the sending domain has
   SPF, DKIM and DMARC (`dig TXT <domain>`, `dig TXT _dmarc.<domain>`) and a
   test message lands in an inbox, not spam; checkout runs once end to end in
   test mode. Done when each path has a received result, not a 200.
6. **Speed and errors on a phone.** PageSpeed Insights or Lighthouse, mobile,
   on the home page and the main template page; the browser console is free
   of errors. Add an uptime monitor on the home page (UptimeRobot, Better
   Stack or the host's own). Done when the mobile scores are written down and
   the monitor has sent one check.
7. **Write the launch record.** `docs/project/LAUNCH.md` (or the research
   folder in a workshop repo): the date, the check output, the event seen in
   analytics, each owner button and its state, every accepted WARN with a
   reason. Done when the next session can see what was proven without
   re-running anything.

## After launch

- **Day 1:** run `launch-check.sh` again on production; URL Inspection in
  Search Console on the home page says "URL is on Google" or "can be indexed".
- **Day 7:** Search Console → Pages: indexed count grows, and every "not
  indexed" reason is understood; analytics shows real visitors, not only you.
  An empty week is a finding to chase, not a wait.

## Proof table

| Claim | Proof |
|---|---|
| "the site is live" | `launch-check.sh` exit 0 on the production URL |
| "analytics works" | the test event seen in realtime, with name and time |
| "Google can index it" | Search Console: sitemap read, URL Inspection on the home page |
| "the form works" | the message received at its destination |
| "email is set up" | SPF, DKIM, DMARC records present and a test message in an inbox |

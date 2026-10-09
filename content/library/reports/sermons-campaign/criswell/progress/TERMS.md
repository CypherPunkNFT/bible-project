# W. A. Criswell sermons: terms read before acquiring (2026-10-08)

Source: the W. A. Criswell Sermon Library, https://wacriswell.com/ (WordPress on WP Engine, behind Cloudflare).
Owner approval for this acquisition: 2026-10-08, private noncommercial Bible-study library.

## robots.txt (https://wacriswell.com/robots.txt, read 2026-10-08, HTTP 200)

```
User-agent: *
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php
Crawl-delay: 10

Sitemap: https://wacriswell.com/wp-sitemap.xml
```

Automated retrieval is allowed for everything except `/wp-admin/`. The sermon pages (`/sermons/<year>/<slug>/`)
are not disallowed. The site asks for **10 seconds between requests**, so the fetcher waits at least 10 s
between every request (stricter than the 2 s floor in the task), with the honest User-Agent
`BibleProject-library/1.0 (private noncommercial study)`, and stops on HTTP 429/403/503 or any challenge page.

## Terms of use / copyright notice

The site publishes **no terms-of-use page and no copyright or licence notice**. Checked:

- Sermon page footer (https://wacriswell.com/sermons/1978/the-smiting-of-the-angel-of-god/): only
  "USEFUL LINKS ... Privacy Policy ... site by simply – Dallas Website Design". No copyright line, no "all rights reserved", no licence.
- The site's page sitemap (https://wacriswell.com/wp-sitemap-posts-page-1.xml) lists no terms, copyright, or legal page;
  the only legal page is the Privacy Policy.
- Privacy Policy (https://wacriswell.com/privacy-policy/), the only legal text on the site. It concerns visitor data and
  names the owner of the site:

  > "• protect and defend the rights or property of the W. A. Criswell Foundation, or visitors to wacriswell.com"

  > "By using our website, you consent to the collection and use of information by the W. A> Criswell Sermon Library as specified above."

- "Got Questions?" page (https://wacriswell.com/about-dr-criswell/got-questions/): no usage terms.

## What we conclude and how we hold the files

- No licence is granted, so the default copyright rules apply: the transcripts are treated as **all rights reserved**
  (presumably by the W. A. Criswell Foundation, which runs the site). Rights category recorded: `restricted-license`.
- Each sermon page is saved once, as published, for **private noncommercial reading only**:
  `publicHostingAllowed: false`, `publicFullTextIndexAllowed: false`. Nothing is republished, and nothing goes into model training.
- `policyUrl` in each provenance file points at https://wacriswell.com/privacy-policy/ (the site's only legal page);
  this file records the robots.txt and the absence of any licence.
- Enumeration came from the site's own sitemap only: https://wacriswell.com/wp-sitemap.xml lists
  `wp-sitemap-posts-sermons-1.xml` (2000 URLs), `-2.xml` (2000) and `-3.xml` (93) = 4,093 English sermon pages.
  No web searching was used.

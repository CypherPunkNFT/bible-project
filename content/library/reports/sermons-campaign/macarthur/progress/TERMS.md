# Grace to You (gty.org): terms check for the John MacArthur sermon run

Checked 2026-10-08 (server time 2026-10-09 01:22 UTC). Saved copies are in [terms/](terms/):
[robots.txt](terms/robots.txt), [about-copyright.html](terms/about-copyright.html),
[about-terms.html](terms/about-terms.html).

## Verdict: STOP. No sermons downloaded.

The site's robots.txt blocks every automated client except three named search/social crawlers.
Our client identifies itself honestly as "BibleProject-library/1.0 (private noncommercial study)",
so it falls under the catch-all rule, which disallows the whole site (`/`). That covers the sitemap,
the sermon library pages and any API the pages call. The task rules say to honour robots.txt and to
stop if automated retrieval is forbidden, so nothing was fetched beyond robots.txt and the two policy
pages (plus one 404 page from a wrong guess at the copyright URL). Impersonating Googlebot or Bingbot
to get around this was not considered acceptable.

## robots.txt — https://www.gty.org/robots.txt (fetched 200, 408 bytes)

```
# Enables Googlebot
User-agent: Googlebot
Disallow:

# Allow Bingbot
User-agent: Bingbot
Disallow:

# Block Adsbot
User-agent: AdsBot-Google
Disallow: /

User-agent: meta-externalagent
Allow: /                    # Allow everything
Disallow: /private/         # Disallow a specific directory

# Example 3: Block all crawlers except AdsBot (AdsBot crawlers must be named explicitly)
User-agent: *
Disallow: /
```

No Crawl-delay is given. The `User-agent: *` / `Disallow: /` group is the one that applies to us.

## Copyright Policy — https://www.gty.org/about?tab=copyright

The policy is generous about *using* transcripts, but says nothing that overrides robots.txt:

> "The following stipulations govern content on gty.org and on other Grace to You media channels for questions of usage, copyright, and permissions."

> "We are happy to allow you permission to use content from the Library section of our website under the following guidelines. … Provide the content for free. Do not monetize the content using ads, affiliate links, or any other means. Make no changes to the content. Credit the content to John MacArthur or Grace to You. Cite the copyright information (e.g., "Copyright 2007, Grace to You. All rights reserved. Used by permission."). Cite the source by providing the Web address (e.g., "gty.org")."

> "Using GTY Web Transcripts — Since many of our transcripts have not been subjected to our editorial process, usage permission is extended as follows: You may use any transcript from the Sermon Series section in accordance with the guidelines stated above. If you desire to use transcripts that are not in the Sermon Series section, send us an email (letters@gty.org) to request specific permission. You may not reproduce sermon transcripts in any print format (e.g., books, magazines, newsletters, or pamphlets)."

> "You may link to and share media produced by Grace to You, but you may not post that media on your website or host them on your media channel."

> "Grace to You and John MacArthur reserve all copyright protections under applicable law and we reserve the right to revoke or modify these permissions at any time."

## Terms & Conditions — https://www.gty.org/about?tab=terms

No clause about robots, scraping, crawling or automated access. Relevant line:

> "We have the right, but not the obligation, to monitor any activity and content associated with the website. We may investigate any reported violation of these Terms and Conditions … which may include … suspending, or terminating your access …"

## What would make the run possible

Written permission from Grace to You for bulk retrieval (their own policy names letters@gty.org as
the contact for transcript permissions), or a bulk export they provide. If permission is granted, the
rights label for held copies would be "restricted-license": free, unchanged, credited, private
noncommercial reading, no public hosting, no print reproduction.

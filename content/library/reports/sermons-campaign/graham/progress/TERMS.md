# Billy Graham sermons: terms read before acquiring (2026-10-08)

## billygraham.org (and static.billygraham.org, decisionmagazine.com)

**robots.txt** (https://billygraham.org/robots.txt, read 2026-10-08):

```
User-agent: *
Allow: /
...
# AI training and model-development crawlers
User-agent: GPTBot / ClaudeBot / anthropic-ai / Google-Extended / CCBot / ... 
Disallow: /
```

General crawling is allowed. Only AI-training crawlers are disallowed. Our client is not a training
crawler. It used the honest User-Agent `BibleProject-library/1.0 (private noncommercial study)`,
left at least 2.5 s between requests to the same host, and the files are kept for private study only.
Nothing goes into model training.

`decisionmagazine.com` now redirects to `https://billygraham.org/decision-magazine`, so the same
robots and terms apply. `static.billygraham.org` (the PDF host) has the same owner and policy.

**Copyright page** (https://billygraham.org/copyright):

> "All materials on this website are © ℗ 2015 Billy Graham Evangelistic Association unless otherwise
> noted. Compliance with copyright restrictions requires that no portion of this site (written, audio,
> or visual) may be reproduced in any form without written permission of Billy Graham Evangelistic
> Association ..."
>
> "The limitation on reproduction, however, does not prohibit personal use. You are more than welcome
> to view and print portions of this website for your own personal use. Please keep in mind that
> 'personal use' does not include large groups of people or the sale of our materials."

**Legal Permissions page** (https://billygraham.org/legal-permissions):

> "What IS covered by General Permission: Personal use – Viewing, listening to, quoting, and printing
> Copyrighted Material from this website and BGEA's publications, for your personal use. 'Personal
> use' does not include making multiple copies for distribution to others or the sale of our
> Copyrighted Material."
>
> NOT covered (needs written permission): "Reproducing/posting Copyrighted Material posted on our
> websites on your website. Provide link instead using Linking guidelines below." ... "Any
> photos/images, audio, or video." ... "Any commercial use".
>
> "Linking: You are welcome to create a link to any of our websites from yours provided the link
> clearly indicates that it leads to a BGEA website, opens in a new window, and is not used either to
> promote a non-BGEA service, product, or event, or as an endorsement by BGEA."

There is no separate terms-of-use page. https://billygraham.org/terms-of-use returns the site's
"This page doesn't exist" page. The sitemap lists only `/copyright`, `/legal-permissions`,
`/privacy-policy` and `/online-training-terms-and-conditions`. That last page covers the online
training courses, not this content. **Nothing found forbids automated retrieval.**

**What this means for us:** keeping private copies for one person's study is "personal use", so it
is allowed. Re-hosting or posting the text is **not** allowed. The site may link to the original
BGEA page, and the link must say it goes to a BGEA site and open in a new window. Hence
`rightsCategory: restricted-license`, `useScope: private-noncommercial-reading`,
`publicHostingAllowed: false`, `publicFullTextIndexAllowed: false`, and
`policyUrl: https://billygraham.org/legal-permissions` (the copyright page is
https://billygraham.org/copyright). We did not download any audio or video: those are excluded
even from General Permission, and the brief asks for real text only.

## Wheaton College, Billy Graham Center Archives: blocked, so we stopped

- `https://www.wheaton.edu/robots.txt` and `https://www.wheaton.edu/grahamsermons` returned
  **HTTP 403** to our honest User-Agent on the first request (2026-10-08).
- `https://archives.wheaton.edu/robots.txt` returned a Cloudflare Turnstile **"Verify you're
  human"** page.
- We stopped there, per the rules. Nothing further was requested from either Wheaton host.
- Background, from web search results we did not verify further: in 2019 BGEA moved the Graham
  materials, including the sermon manuscripts, from Wheaton to Charlotte. The Wheaton digital copies
  went back to BGEA after June 1, 2021. Wheaton keeps only Collection 15 (Papers of Billy Graham)
  and Collection 74 (Ephemera).

## Billy Graham Archive and Research Center (billygrahamarchivecenter.com)

- robots.txt: `User-agent: * / Allow: /`.
- Its online collections guide (https://billygrahamarchivecenter.com/collections-guide/) describes
  only whole collections. For example, CN 1 "Billy Graham Manuscripts and Transcripts" holds the
  original sermon manuscripts, the bound Hour of Decision sermons and the bound Crusade transcripts.
  There is no list of individual sermons online, so there was no per-sermon metadata to collect there.

## Wayback Machine (web.archive.org)

We used the CDX index API a few times, read-only, to look for other `Billy-Graham-Sermon-*.pdf`
file names. It found none, and no files were taken from the Wayback Machine.

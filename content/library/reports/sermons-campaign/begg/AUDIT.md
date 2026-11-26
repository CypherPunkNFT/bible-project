# Audit: 60 random new Begg placements against the held page (2026-11-26)

Sample: 60 of the 1,248 new sermons placed on a passage, drawn with `random.seed(20261126)` by
[progress/audit.py](progress/audit.py). For each, the held page's *visible* scripture line (what a reader sees, not the
`scripture_ref` meta the parser reads) is set beside the placed verse ids turned back into book, chapter and verse with
the audit's own book list. One-range lines are compared by the script; the 3 lines with two passages or a range across
chapters were read by hand.

**Result: 60 of 60 correct, 0 errors** (57 compared automatically, 3 read by hand: all three match).

| Work | Page shows | Placed as | Verdict |
|---|---|---|---|
| work-sermons-begg-2734 | Acts 1:6–8 | Acts 1:6–8 | match |
| work-sermons-begg-2551 | 1 Timothy 1:15 | 1 Timothy 1:15 | match |
| work-sermons-begg-0178 | Romans 12:3–8 | Romans 12:3–8 | match |
| work-sermons-begg-1037 | Colossians 1:24–29 | Colossians 1:24–29 | match |
| work-sermons-begg-1627 | Romans 12:1–2 | Romans 12:1–2 | match |
| work-sermons-begg-1799 | 1 Corinthians 15:51–57 | 1 Corinthians 15:51–57 | match |
| work-sermons-begg-1412 | Matthew 14:13–21 | Matthew 14:13–21 | match |
| work-sermons-begg-1641 | Daniel 4:1–18 | Daniel 4:1–18 | match |
| work-sermons-begg-1102 | Colossians 4:15–18 | Colossians 4:15–18 | match |
| work-sermons-begg-2319 | Luke 21:32 | Luke 21:32 | match |
| work-sermons-begg-1899 | Luke 2:34–35 | Luke 2:34–35 | match |
| work-sermons-begg-1494 | Hebrews 11:1–40 , Isaiah 55:1–13 | Hebrews 11:1–40; Isaiah 55:1–13 | match (read by hand) |
| work-sermons-begg-3195 | Psalm 90:1–17 | Psalm 90:1–17 | match |
| work-sermons-begg-1153 | John 2:1–11 | John 2:1–11 | match |
| work-sermons-begg-3135 | Luke 4:14–30 | Luke 4:14–30 | match |
| work-sermons-begg-3308 | Matthew 16:13–20 | Matthew 16:13–20 | match |
| work-sermons-begg-2312 | Luke 21:5 | Luke 21:5 | match |
| work-sermons-begg-2196 | Isaiah 42:1–4 | Isaiah 42:1–4 | match |
| work-sermons-begg-2089 | Acts 16:13–15 | Acts 16:13–15 | match |
| work-sermons-begg-2096 | Luke 6:1–11 | Luke 6:1–11 | match |
| work-sermons-begg-1353 | 2 Thessalonians 2:1–2 | 2 Thessalonians 2:1–2 | match |
| work-sermons-begg-2853 | Matthew 1:18–25 | Matthew 1:18–25 | match |
| work-sermons-begg-1019 | Colossians 1:1–2 | Colossians 1:1–2 | match |
| work-sermons-begg-3329 | Ephesians 6:21–22 | Ephesians 6:21–22 | match |
| work-sermons-begg-1450 | Mark 5:19 | Mark 5:19 | match |
| work-sermons-begg-1105 | Ephesians 5:3 | Ephesians 5:3 | match |
| work-sermons-begg-1962 | Luke 15:11–32 | Luke 15:11–32 | match |
| work-sermons-begg-3651 | Jude 1:3–4 | Jude 1:3–4 | match |
| work-sermons-begg-2231 | Hebrews 10:14 | Hebrews 10:14 | match |
| work-sermons-begg-1543 | Luke 12:13–21 | Luke 12:13–21 | match |
| work-sermons-begg-3061 | Acts 9:31 | Acts 9:31 | match |
| work-sermons-begg-2077 | John 3:19 | John 3:19 | match |
| work-sermons-begg-1552 | Psalm 8:1 | Psalm 8:1 | match |
| work-sermons-begg-0509 | Ephesians 2:1–10 | Ephesians 2:1–10 | match |
| work-sermons-begg-2380 | Acts 17:32 | Acts 17:32 | match |
| work-sermons-begg-1646 | Daniel 6:1–9 | Daniel 6:1–9 | match |
| work-sermons-begg-0169 | Mark 10:17–31 | Mark 10:17–31 | match |
| work-sermons-begg-1287 | John 16:5–15 | John 16:5–15 | match |
| work-sermons-begg-2651 | Hebrews 10:23 | Hebrews 10:23 | match |
| work-sermons-begg-1863 | Matthew 21:1–11 | Matthew 21:1–11 | match |
| work-sermons-begg-1301 | Luke 2:8–20 | Luke 2:8–20 | match |
| work-sermons-begg-1168 | Psalm 146:1–10 | Psalm 146:1–10 | match |
| work-sermons-begg-1173 | Hebrews 13:4 | Hebrews 13:4 | match |
| work-sermons-begg-1380 | 2 Corinthians 2:14–17 | 2 Corinthians 2:14–17 | match |
| work-sermons-begg-1881 | Genesis 37:1–43:34 | Genesis 37:1–43:34 | match (read by hand) |
| work-sermons-begg-2689 | Mark 3:20–30 | Mark 3:20–30 | match |
| work-sermons-begg-1858 | John 14:15–24 | John 14:15–24 | match |
| work-sermons-begg-2273 | Luke 20:27 | Luke 20:27 | match |
| work-sermons-begg-3806 | 2 Timothy 4:1–5 | 2 Timothy 4:1–5 | match |
| work-sermons-begg-3331 | Ephesians 6:23–24 | Ephesians 6:23–24 | match |
| work-sermons-begg-2616 | Mark 14:22–31 | Mark 14:22–31 | match |
| work-sermons-begg-2483 | Luke 9:28–36 | Luke 9:28–36 | match |
| work-sermons-begg-1066 | Hosea 14:1 | Hosea 14:1 | match |
| work-sermons-begg-2507 | 1 Corinthians 15:1–26 | 1 Corinthians 15:1–26 | match |
| work-sermons-begg-3062 | Jeremiah 9:23–24 | Jeremiah 9:23–24 | match |
| work-sermons-begg-0101 | 1 Corinthians 2:1–5 | 1 Corinthians 2:1–5 | match |
| work-sermons-begg-2869 | 2 Timothy 4:1–8 | 2 Timothy 4:1–8 | match |
| work-sermons-begg-1174 | Hebrews 13:5–6 | Hebrews 13:5–6 | match |
| work-sermons-begg-3538 | 1 Peter 3:18 , Mark 8:27–33 | 1 Peter 3:18; Mark 8:27–33 | match (read by hand) |
| work-sermons-begg-3633 | Revelation 7:1–12 | Revelation 7:1–12 | match |

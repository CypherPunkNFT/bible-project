// Outside links whose host's terms ask the link to say where it leads. The Billy Graham Evangelistic Association's
// Legal Permissions (https://billygraham.org/legal-permissions, Linking) welcome links "provided the link clearly
// indicates that it leads to a BGEA website, opens in a new window" and implies no endorsement, so every link to
// billygraham.org or one of its subdomains (static., media.) names it in its own words and opens a new tab (source
// permissions register, content/library/reports/source-permissions-20261127/REPORT.md, bucket 2). The app keeps a copy
// (App/src/lib/link-destination.ts).

/** Whether a link leads to a BGEA website: billygraham.org or a subdomain of it, over http or https. */
export function leadsToBgea(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const { protocol, hostname } = new URL(url);
    const host = hostname.toLowerCase().replace(/\.$/, "");
    return (protocol === "https:" || protocol === "http:") && (host === "billygraham.org" || host.endsWith(".billygraham.org"));
  } catch {
    return false; // not a web address at all, so not a BGEA website
  }
}

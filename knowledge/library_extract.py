"""Offline extraction of held texts; no downloads, OCR, inference or source mutation."""
import hashlib
import json
import re
import zipfile
from pathlib import Path, PurePosixPath
from bs4 import BeautifulSoup
from lxml import etree

VERSION = "library-text-2"


def sha256(file):
    with Path(file).open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def decode(data):
    if data.startswith((b"\xff\xfe", b"\xfe\xff")):
        return data.decode("utf-16")
    for encoding in ("utf-8-sig", "cp1252"):
        try:
            return data.decode(encoding)
        except UnicodeError:
            pass
    return data.decode("utf-8", errors="replace")


def html_text(data):
    soup = BeautifulSoup(data, "html.parser")
    for node in soup(["script", "style", "nav", "noscript"]):
        node.decompose()
    return (soup.body or soup).get_text("\n", strip=True)


def xml_text(data):
    parser = etree.XMLParser(resolve_entities=False, no_network=True, recover=True, huge_tree=True)
    root = etree.fromstring(data, parser)
    if root is None:
        raise ValueError("XML contains no readable root")
    # Preserve all body text and footnotes. Encoded editorial gaps stay explicit.
    for element in root.iter():
        if not isinstance(element.tag, str):
            continue
        name = etree.QName(element).localname.lower()
        if name == "gap":
            element.text = " [Editorial gap: " + (element.get("reason") or "unspecified") + "] "
        elif name in ("pb", "page"):
            element.text = "\n[Source page " + (element.get("n") or element.get("number") or "unlabeled") + "]\n"
        elif name in ("p", "div", "div1", "div2", "head", "title", "l", "br", "lb", "para"):
            element.tail = "\n" + (element.tail or "")
        elif name == "word":
            element.tail = " " + (element.tail or "")
        elif name == "line":
            element.tail = "\n" + (element.tail or "")
    return "".join(root.itertext()).strip()


def extract(file, declared_format=""):
    suffix = file.suffix.lower()
    with file.open("rb") as stream:
        magic = stream.read(8)
    if suffix == ".pdf" or declared_format == "pdf" or magic.startswith(b"%PDF-"):
        import pymupdf as fitz
        with fitz.open(file) as document:
            for number, page in enumerate(document, 1):
                yield {"locator": f"PDF page {number}", "text": page.get_text("text", sort=True), "page": number}
    elif suffix == ".epub" or declared_format == "epub":
        with zipfile.ZipFile(file) as archive:
            parser = etree.XMLParser(resolve_entities=False, no_network=True)
            container = etree.fromstring(archive.read("META-INF/container.xml"), parser)
            opf = container.xpath("//*[local-name()='rootfile']/@full-path")[0]
            package = etree.fromstring(archive.read(opf), parser)
            manifest = {x.get("id"): x for x in package.xpath("//*[local-name()='manifest']/*")}
            ordered = [manifest[x.get("idref")] for x in package.xpath("//*[local-name()='spine']/*")]
            ordered.extend(x for x in manifest.values() if x not in ordered and x.get("media-type") in ("application/xhtml+xml", "text/html"))
            seen = set()
            for index, item in enumerate(ordered, 1):
                from urllib.parse import unquote
                import posixpath
                target = posixpath.normpath(str(PurePosixPath(opf).parent / unquote(item.get("href").split("#")[0])))
                if target in seen:
                    continue
                seen.add(target)
                yield {"locator": f"EPUB section {index}: {target}", "text": html_text(archive.read(target))}
    else:
        data = file.read_bytes()
        if suffix in (".xml",) or declared_format in ("xml", "tei") or data.lstrip().startswith(b"<?xml"):
            text = xml_text(data)
        elif suffix in (".html", ".htm", ".xhtml") or declared_format == "html" or re.search(br"<(?:html|!doctype html)\b", data[:1000], re.I):
            text = html_text(data)
        elif suffix == ".json":
            value = json.loads(decode(data))
            text = json.dumps(value, ensure_ascii=False, indent=2)
        else:
            text = decode(data)
        yield {"locator": file.name, "text": text}


def derivative_blocks(file, derivative):
    """Reuse repaired text with its existing page markers; never invent pagination."""
    page_file = derivative.get("pageText")
    if page_file:
        for row in json.loads(Path(page_file).read_text("utf-8-sig")):
            yield {"locator": f"PDF page {row['page']}", "page": row["page"], "text": row["text"]}
        return
    text = decode(file.read_bytes())
    markers = list(re.finditer(r"(?im)^(?:[-=]+ PDF PAGE (\d+) [-=]+|\[PDF page (\d+)\])[ \t]*\r?$", text))
    if markers:
        if text[:markers[0].start()].strip():
            yield {"locator": "Derivative preamble", "text": text[:markers[0].start()]}
        for i, match in enumerate(markers):
            number = int(match.group(1) or match.group(2))
            end = markers[i+1].start() if i+1 < len(markers) else len(text)
            yield {"locator": f"PDF page {number}", "page": number, "text": text[match.end():end]}
    else:
        yield {"locator": "Existing transcription: " + file.name, "text": text}


def extraction_cache(config, file, original_hash, declared_format="", derivative=None):
    selected = Path(derivative["path"]) if derivative else file
    selected_hash = sha256(selected) if derivative else original_hash
    if derivative and derivative.get("sha256") and selected_hash != derivative["sha256"]:
        raise ValueError(f"Derivative checksum mismatch: {selected}")
    page_hash = sha256(derivative["pageText"]) if derivative and derivative.get("pageText") else ""
    if page_hash and derivative.get("pageTextSha256") and page_hash != derivative["pageTextSha256"]:
        raise ValueError("Repaired page text checksum mismatch")
    key = hashlib.sha256((VERSION + original_hash + selected_hash + page_hash + declared_format).encode()).hexdigest()
    cache = config["state_dir"] / "extracted-library" / (key + ".jsonl")
    if cache.exists():
        return cache, selected, selected_hash
    cache.parent.mkdir(parents=True, exist_ok=True)
    temporary = cache.with_suffix(".tmp")
    with temporary.open("w", encoding="utf-8") as stream:
        blocks = derivative_blocks(selected, derivative) if derivative else extract(selected, declared_format)
        for block in blocks:
            stream.write(json.dumps(block, ensure_ascii=False) + "\n")
    temporary.replace(cache)
    return cache, selected, selected_hash

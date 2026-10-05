import argparse
import json
import sys
from .settings import load


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description="Independent Bible Project knowledge system")
    parser.add_argument("--config")
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("build", help="Index all current sources into a verified SQLite/FTS5 snapshot")
    commands.add_parser("status", help="Report corpus and vector coverage")
    commands.add_parser("encoder", help="Run the Bible-only local embedding service")
    embed = commands.add_parser("embed", help="Resume local semantic indexing")
    embed.add_argument("--limit", type=int, default=0)
    embed.add_argument("--batch-size", type=int)
    search = commands.add_parser("search")
    search.add_argument("query")
    search.add_argument("--mode", choices=("lexical", "semantic", "hybrid"), default="hybrid")
    search.add_argument("--kind", default="")
    search.add_argument("--edition", default="")
    search.add_argument("--language", default="")
    search.add_argument("--book", default="")
    search.add_argument("--limit", type=int, default=10)
    serve = commands.add_parser("serve")
    serve.add_argument("--port", type=int)
    commands.add_parser("verify", help="Validate corpus, provenance and vector parity")
    args = parser.parse_args()
    config = load(args.config)
    if args.command == "build":
        from .ingest import build
        build(config)
    elif args.command == "embed":
        from .vectors import embed_all
        embed_all(config, args.limit, args.batch_size)
    elif args.command == "serve":
        from .server import serve
        serve(config, args.port)
    elif args.command == "encoder":
        from .encoder import serve_encoder
        serve_encoder(config)
    else:
        from .retrieval import search, status, verify
        result = search(config, args.query, args.mode, args.limit, kind=args.kind, edition=args.edition, language=args.language, book=args.book) if args.command == "search" else verify(config) if args.command == "verify" else status(config)
        print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

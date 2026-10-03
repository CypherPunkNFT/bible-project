import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Page not found</p>
      <h1 className="mt-2 font-serif text-4xl font-semibold">Nothing is written here.</h1>
      <p className="mt-4">
        <Link to="/library" className="underline">
          Back to the library
        </Link>
      </p>
    </div>
  );
}

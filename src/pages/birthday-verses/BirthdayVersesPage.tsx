// Birthday verses (docs/features/birthday-verses/design.md): a verse for every date of the year at
// /birthday-verses/<month>-<day>, a page for each month, and the hub. A date or month written another way ("mar-16",
// "03-16", "16-march", "Mar") opens at its one official address; anything else opens the hub with a note.
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { datePath, dateFromSlug, monthFromSlug, monthPath } from "./dates";
import { DatePage } from "./DatePage";
import { Hub } from "./Hub";
import { MonthPage } from "./MonthPage";
import "./birthday-verses.css";

const NOT_FOUND = "We couldn't find that date. Choose a month and a day below.";

function SlugRoute() {
  const { slug = "" } = useParams();
  const month = monthFromSlug(slug);
  if (month) {
    const official = monthPath(month);
    return official.endsWith(`/${slug}`) ? <MonthPage month={month} /> : <Navigate to={official} replace />;
  }
  const date = dateFromSlug(slug);
  if (!date) return <Hub notice={NOT_FOUND} />;
  const official = datePath(date);
  return official.endsWith(`/${slug}`) ? <DatePage date={date} /> : <Navigate to={official} replace />;
}

export default function BirthdayVersesPage() {
  return (
    <Routes>
      <Route index element={<Hub />} />
      <Route path=":slug" element={<SlugRoute />} />
      <Route path="*" element={<Hub notice={NOT_FOUND} />} />
    </Routes>
  );
}

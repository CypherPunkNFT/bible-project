// Shareable verse cards (docs/features/verse-cards/design.md): the start page at /verse-cards and a card page for each
// verse at /verse-cards/<key>. The pictures are drawn on the visitor's device by the shared generator (src/lib/verse-card/).
import { Route, Routes } from "react-router-dom";
import { CardPage } from "./CardPage";
import { StartPage } from "./StartPage";
import "./verse-cards.css";

export default function VerseCardsPage() {
  return (
    <Routes>
      <Route index element={<StartPage />} />
      <Route path=":key" element={<CardPage />} />
      <Route path="*" element={<StartPage notice="We couldn't find that verse. Type it below, or choose one." />} />
    </Routes>
  );
}

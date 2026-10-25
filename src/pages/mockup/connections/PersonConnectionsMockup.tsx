// /people_mockup/:id/connections (local preview only): a person's connections as a sub-page of their own page, beside
// the ruler, apostle and prophet pages. The trail leads back to the person; Moses's goes to his mock-up page, whose
// section 03 "Around him" shows the same connections by category and relationship.
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { personIdOf, slugOf } from "@/lib/people-slugs";
import { useCachedLoad } from "@/lib/people-pages";
import { loadPeople } from "@/lib/study";
import { ConnectionsField } from "./ConnectionsEntityMockup";

const MOCKED_PAGES = new Set(["moses-exo-2-10"]);

export default function PersonConnectionsMockup() {
  const { id: segment = "" } = useParams();
  const id = personIdOf(segment);
  const people = useCachedLoad("people", loadPeople);
  const name = people.status === "ready" ? people.value.find((p) => p.id === id)?.n : undefined;
  const page = MOCKED_PAGES.has(id) ? `/people_mockup/${slugOf(id) ?? id}` : `/people/${slugOf(id) ?? id}`;
  const back = <Link to={page}><ArrowLeft size={13} aria-hidden />{name ?? "Their page"}</Link>;
  return <ConnectionsField key={id} kind="p" id={id} back={back} />;
}

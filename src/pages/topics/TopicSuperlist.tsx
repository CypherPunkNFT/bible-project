import { ArrowLeft, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { categoryStyle, groupIcon, TOPIC_SECTIONS } from "@/lib/topic-style";
import { categoryUrl, topicUrl, type TopicIndex, type TopicSubcategory } from "@/lib/topics";
import { formatNumber } from "@/lib/utils";
import { tint } from "./topics-shared";
import "./topic-superlist.css";

/** One group: its line, its count, and (opened) every topic in it, A to Z. */
function Group({ group, index, open, onToggle }: { group: TopicSubcategory; index: TopicIndex; open: boolean; onToggle: () => void }) {
  const Icon = groupIcon(group.id);
  const topics = [...group.topics].sort((a, b) => (index.topics[a]?.title ?? a).replace(/^The /, "").localeCompare((index.topics[b]?.title ?? b).replace(/^The /, "")));
  return (
    <li className="superlist-group">
      <button type="button" aria-expanded={open} onClick={onToggle}>
        <Icon size={16} strokeWidth={1.6} aria-hidden />
        <span className="superlist-group-title">{group.title}</span>
        <span className="superlist-count">{formatNumber(group.topics.length)} topics</span>
        <span className="superlist-description">{group.description}</span>
        <ChevronDown size={15} className="superlist-chevron" aria-hidden />
      </button>
      {open && <ol className="superlist-topics">{topics.map((id) => index.topics[id] && <li key={id}><Link to={topicUrl(id)}>{index.topics[id].title}</Link></li>)}</ol>}
    </li>
  );
}

/** Every section, every family card and every group, on one page, for review (local mock; not linked from the site). */
export function TopicSuperlist({ index }: { index: TopicIndex }) {
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const families = new Map(index.categories.map((family) => [family.id, family]));
  const allGroups = index.categories.flatMap((family) => family.subcategories.map((group) => group.id));
  const toggle = (id: string) => setOpened((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  return (
    <div className="superlist mx-auto max-w-6xl px-4 sm:px-6">
      <div className="topics-topline"><Link to="/topics"><ArrowLeft size={15} aria-hidden />Topics</Link><span>Mock · topic superlist</span></div>
      <header className="superlist-intro">
        <h1>Topic superlist</h1>
        <p>{TOPIC_SECTIONS.length} sections · {index.categories.length} cards · {allGroups.length} groups · {formatNumber(Object.keys(index.topics).length)} topics. Open a group to see its topics.</p>
        <div className="superlist-actions">
          <button type="button" onClick={() => setOpened(new Set(allGroups))}>Open every group</button>
          <button type="button" onClick={() => setOpened(new Set())}>Close all</button>
        </div>
      </header>
      {TOPIC_SECTIONS.map((section, s) => {
        const cards = section.categories.flatMap((id) => families.get(id) ?? []);
        const count = cards.reduce((n, family) => n + family.subcategories.reduce((m, group) => m + group.topics.length, 0), 0);
        return (
          <section key={section.id} className="superlist-section" aria-labelledby={`superlist-${section.id}`}>
            <h2 id={`superlist-${section.id}`}><span>{String(s + 1).padStart(2, "0")}</span>{section.title}<small>{cards.length} cards · {formatNumber(count)} topics</small></h2>
            <p className="superlist-section-description">{section.description}</p>
            {cards.map((family) => {
              const { Icon } = categoryStyle(family.id);
              const total = family.subcategories.reduce((n, group) => n + group.topics.length, 0);
              return (
                <article key={family.id} className="superlist-family" style={tint(family.id)}>
                  <h3><Icon size={20} strokeWidth={1.5} aria-hidden /><Link to={categoryUrl(family.id)}>{family.title}</Link><small>{formatNumber(total)} topics · {family.subcategories.length} {family.subcategories.length === 1 ? "group" : "groups"}</small></h3>
                  <p>{family.description}</p>
                  <ul>{family.subcategories.map((group) => <Group key={group.id} group={group} index={index} open={opened.has(group.id)} onToggle={() => toggle(group.id)} />)}</ul>
                </article>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}

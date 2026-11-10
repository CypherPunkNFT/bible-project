// The puzzle's parts (design §11.2): the emoji row, the hints opened so far, and the two ways to answer — four choice
// buttons (keys 1–4) or a search box over the game's own list of stories (the WAI-ARIA combobox pattern).
import { useEffect, useId, useMemo, useState, type KeyboardEvent } from "react";
import { useCatalog } from "@/lib/catalog";
import { bookByCode } from "@/lib/refs";
import { isSearchable, suggest, type SearchEntry } from "./answer-match";
import { missingEmoji } from "./emoji-support";
import { booksOf } from "./passage";
import type { EmojiInfo, Story } from "./types";

export function EmojiRow({ story, emoji, shown, large = false }: { story: Story; emoji: Record<string, EmojiInfo>; shown?: number; large?: boolean }) {
  const list = story.emoji.slice(0, shown ?? story.emoji.length).map(([char]) => char);
  const key = list.join(" ");
  const missing = useMemo(() => missingEmoji(key ? key.split(" ") : []), [key]);
  const name = (char: string) => emoji[char]?.name ?? "emoji";
  return (
    <div className={`es-row${large ? " es-row-large" : ""}${list.length > 4 ? " es-row-many" : ""}`} role="group" aria-label={`Clues: ${list.map(name).join(", ")}`} translate="no">
      {list.map((char, index) => (
        <span key={`${index}-${char}`} className="es-tile" role="img" aria-label={name(char)}>
          {missing.has(char)
            ? <><span className="es-glyph es-glyph-empty" aria-hidden="true" /><small className="es-missing" aria-hidden="true">{name(char)}</small></>
            : <span className="es-glyph" aria-hidden="true">{char}</span>}
        </span>
      ))}
    </div>
  );
}

/** The passage words under each emoji: hint 2, and the reveal's key. */
export function ClueWords({ story }: { story: Story }) {
  return (
    <ul className="es-words">
      {story.emoji.map(([char, word], index) => (
        <li key={`${index}-${char}`}><span aria-hidden="true">{char}</span> {word}</li>
      ))}
    </ul>
  );
}

export function Hints({ story, opened }: { story: Story; opened: number }) {
  const catalog = useCatalog();
  if (!opened) return null;
  const books = booksOf(story.ref).map((code) => bookByCode(catalog, code)?.name ?? code);
  return (
    <ol className="es-hints" aria-label="Hints">
      <li><strong>Where:</strong> {books.join(" and ")} · {story.testament === "old" ? "Old Testament" : "New Testament"}</li>
      {opened >= 2 && <li><strong>The pictures:</strong> <ClueWords story={story} /></li>}
      {opened >= 3 && <li><strong>Who:</strong> {story.who}</li>}
    </ol>
  );
}

const isTyping = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement && (target.isContentEditable || !!target.closest("input, textarea, select"));

export function Choices({ ids, byId, onPick, tried = [], close = [], disabled = false }: {
  ids: readonly string[];
  byId: ReadonlyMap<string, Story>;
  onPick: (id: string) => void;
  tried?: readonly string[];
  /** Tried stories that share a person with the answer (§6.4): marked in amber, in words. */
  close?: readonly string[];
  disabled?: boolean;
}) {
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (disabled || event.repeat || event.altKey || event.ctrlKey || event.metaKey || isTyping(event.target)) return;
      const id = ids[Number(event.key) - 1];
      if (id && !tried.includes(id)) onPick(id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ids, onPick, tried, disabled]);
  return (
    <div className="es-choices" role="group" aria-label="Choose the story">
      {ids.map((id, index) => (
        <button key={id} type="button" className="es-choice" disabled={disabled || tried.includes(id)} onClick={() => onPick(id)}>
          <span className="es-choice-key" aria-hidden="true">{index + 1}</span>
          <span>{byId.get(id)?.title}</span>
          {tried.includes(id) && (close.includes(id)
            ? <span className="es-choice-note is-close">Right person, different story</span>
            : <span className="es-choice-note">Not this one</span>)}
        </button>
      ))}
    </div>
  );
}

export function TypeAnswer({ index, onGuess, tried = [], disabled = false }: {
  index: readonly SearchEntry[];
  onGuess: (id: string) => void;
  tried?: readonly string[];
  disabled?: boolean;
}) {
  const id = useId();
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [picked, setPicked] = useState<Story | null>(null);
  const [note, setNote] = useState("");
  const suggestions = useMemo(() => suggest(index, text), [index, text]);
  const choose = (story: Story) => {
    setPicked(story);
    setText(story.title);
    setOpen(false);
    setActive(-1);
    setNote(tried.includes(story.id) ? "Already tried: pick another story." : "");
  };
  const submit = () => {
    if (!picked) return;
    if (tried.includes(picked.id)) {
      setNote("Already tried: pick another story.");
      return;
    }
    onGuess(picked.id);
    setText("");
    setPicked(null);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((current) => (suggestions.length ? (current + step + suggestions.length) % suggestions.length : -1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (picked && !open) submit();
      else if (open && active >= 0 && suggestions[active]) choose(suggestions[active].story);
      else if (suggestions[0]?.score === 100) choose(suggestions[0].story);
      else setOpen(true);
    } else if (event.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  };
  const listId = `${id}-list`;
  const typed = isSearchable(text);
  const showList = open && !picked && suggestions.length > 0;
  return (
    <div className="es-type">
      <label htmlFor={`${id}-input`}>Which story is it?</label>
      <div className="es-type-row">
        <input
          id={`${id}-input`}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={showList && active >= 0 ? `${id}-option-${active}` : undefined}
          value={text}
          disabled={disabled}
          placeholder="Type a story, a person or a place"
          onChange={(event) => {
            setText(event.target.value);
            setPicked(null);
            setNote("");
            setOpen(true);
            setActive(-1);
          }}
          onKeyDown={onKeyDown}
        />
        <button type="button" className="es-primary" disabled={disabled || !picked} onClick={submit}>Guess</button>
      </div>
      <ul id={listId} role="listbox" aria-label="Stories" className="es-options" hidden={!showList}>
        {suggestions.map((suggestion, position) => (
          <li
            key={suggestion.story.id}
            id={`${id}-option-${position}`}
            role="option"
            aria-selected={position === active}
            className={position === active ? "is-active" : undefined}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => choose(suggestion.story)}
          >
            {suggestion.story.title}
          </li>
        ))}
      </ul>
      <p className="es-type-note" aria-live="polite">
        {note || (typed && !picked && !suggestions.length ? "No story by that name in this game. Try a person or a place." : "")}
      </p>
    </div>
  );
}

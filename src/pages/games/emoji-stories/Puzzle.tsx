// The puzzle's parts (design §11.2, redesigned from the visual audit): the emoji dealt in on soft tiles with their
// passage words appearing under them in place, the hints opened so far as plain lines, and the two ways to answer:
// four answer cards (keys 1–4) that stay on screen and settle right, wrong or faded once picked, or a search box over
// the game's own list of stories (the WAI-ARIA combobox pattern).
import { useEffect, useId, useMemo, useState, type CSSProperties, type KeyboardEvent } from "react";
import { useCatalog } from "@/lib/catalog";
import { bookByCode } from "@/lib/refs";
import { AnswerCard } from "../kit";
import { isSearchable, suggest, type SearchEntry } from "./answer-match";
import { missingEmoji } from "./emoji-support";
import { booksOf } from "./passage";
import { choiceState } from "./rules";
import type { EmojiInfo, Story } from "./types";

export function EmojiRow({ story, emoji, shown, large = false, words = false }: {
  story: Story;
  emoji: Record<string, EmojiInfo>;
  /** How many clues are showing (the room); the rest are kept as empty places so the row never changes size. */
  shown?: number;
  large?: boolean;
  /** Show each emoji's passage word under its tile (hint 2 and the reveal). */
  words?: boolean;
}) {
  const count = shown ?? story.emoji.length;
  const list = story.emoji.slice(0, count).map(([char]) => char);
  const key = list.join(" ");
  const missing = useMemo(() => missingEmoji(key ? key.split(" ") : []), [key]);
  const name = (char: string) => emoji[char]?.name ?? "emoji";
  const style = { "--es-n": story.emoji.length } as CSSProperties;
  return (
    <div className="es-row-box" style={style}>
      <div className={`es-row${large ? " es-row-large" : ""}${words ? " has-words" : ""}`} role="group" aria-label={`Clues: ${list.map(name).join(", ")}`} translate="no">
        {story.emoji.map(([char, word], index) => index < count ? (
          <span key={`${index}-${char}`} className="es-tile" role="img" aria-label={name(char)} style={{ "--es-i": index } as CSSProperties}>
            {missing.has(char)
              ? <><span className="es-glyph es-glyph-empty" aria-hidden="true" /><small className="es-missing" aria-hidden="true">{name(char)}</small></>
              : <span className="es-glyph" aria-hidden="true">{char}</span>}
            <span className="es-word" aria-hidden={!words || undefined}>{words ? word : ""}</span>
          </span>
        ) : (
          <span key={`${index}-wait`} className="es-tile es-tile-wait" aria-hidden="true"><span className="es-glyph es-glyph-wait" /><span className="es-word" /></span>
        ))}
      </div>
    </div>
  );
}

/** The passage words beside each emoji, for a reveal shown without its row (the round-end fold-outs). */
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
      {opened >= 2 && <li><strong>The pictures:</strong> each word is now under its picture.</li>}
      {opened >= 3 && <li><strong>Who:</strong> {story.who}</li>}
    </ol>
  );
}

const isTyping = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement && (target.isContentEditable || !!target.closest("input, textarea, select"));

export function Choices({ ids, byId, onPick, tried = [], close = [], disabled = false, answer, pick = null, revealed = false }: {
  ids: readonly string[];
  byId: ReadonlyMap<string, Story>;
  onPick: (id: string) => void;
  tried?: readonly string[];
  /** Tried stories that share a person with the answer (§6.4): marked in amber, in words. */
  close?: readonly string[];
  disabled?: boolean;
  /** The answer's id, the pick and whether the puzzle is revealed: the cards stay on screen and settle in place. */
  answer?: string;
  pick?: string | null;
  revealed?: boolean;
}) {
  const locked = disabled || revealed;
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (locked || event.repeat || event.altKey || event.ctrlKey || event.metaKey || isTyping(event.target)) return;
      const id = ids[Number(event.key) - 1];
      if (id && !tried.includes(id)) onPick(id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ids, onPick, tried, locked]);
  return (
    <div className={`es-choices${revealed ? " is-revealed" : ""}`} role="group" aria-label="Choose the story">
      {ids.map((id, index) => {
        const state = choiceState(id, answer ?? "", pick, revealed, tried);
        const isClose = tried.includes(id) && close.includes(id);
        return (
          <AnswerCard key={id} index={index} state={state} className={`es-choice${isClose ? " is-close" : ""}${id === pick ? " is-picked" : ""}`}
            disabled={locked || tried.includes(id)} onClick={() => { if (!locked && !tried.includes(id)) onPick(id); }}>
            <span className="es-choice-key" aria-hidden="true">{index + 1}</span>
            <span className="es-choice-title">{byId.get(id)?.title}</span>
            {tried.includes(id) && !revealed && (isClose
              ? <span className="es-choice-note is-close">Right person, different story</span>
              : <span className="es-choice-note">Not this one</span>)}
          </AnswerCard>
        );
      })}
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

// The kit's cards and bands on the page: the answer card's states and marks, the flip card hiding its back until it
// turns, the feedback band's live verdict and focus, the celebration's burst and its absence under reduced motion,
// the options fold, the confirm dialog, and scrolling to the top only when the screen changes.
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { createRef, useRef, useState } from "react";
import { AnswerCard } from "./AnswerCard";
import { Confetti, HopWave } from "./Celebration";
import { ConfirmDialog } from "./ConfirmDialog";
import { FeedbackBand } from "./FeedbackBand";
import { FlipCard } from "./FlipCard";
import { MoreOptions } from "./MoreOptions";
import { useScrollTopOn } from "./scroll";

describe("AnswerCard", () => {
  it("is a button that deals in at its index, is pressed when selected, and marks right and wrong", () => {
    const onClick = vi.fn();
    const { rerender } = render(<AnswerCard index={2} onClick={onClick}>Deborah</AnswerCard>);
    const card = screen.getByRole("button", { name: "Deborah" });
    expect(card).toHaveAttribute("type", "button");
    expect(card.style.getPropertyValue("--kit-i")).toBe("2");
    expect(card).toHaveAttribute("data-state", "idle");
    expect(card).not.toHaveAttribute("aria-pressed");
    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(<AnswerCard index={2} state="selected">Deborah</AnswerCard>);
    expect(card).toHaveAttribute("aria-pressed", "true");
    expect(card).toHaveClass("is-selected");
    rerender(<AnswerCard index={2} state="right">Deborah</AnswerCard>);
    expect(card).toHaveClass("is-right");
    expect(card.querySelector(".kit-card__mark")?.textContent).toBe("✓");
    rerender(<AnswerCard index={2} state="wrong" wrongMark="×">Deborah</AnswerCard>);
    expect(card).toHaveClass("is-wrong");
    expect(card.querySelector(".kit-card__mark")?.textContent).toBe("×");
    rerender(<AnswerCard index={2} state="faded">Deborah</AnswerCard>);
    expect(card).toHaveClass("is-faded");
    expect(card.querySelector(".kit-card__mark")).toBeNull();
  });
  it("draws a plain card when not interactive, forwards its ref and passes other props through", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<><AnswerCard interactive={false}>A question</AnswerCard><AnswerCard ref={ref} className="mine" aria-label="Pick">B</AnswerCard></>);
    expect(screen.queryByRole("button", { name: "A question" })).toBeNull();
    expect(screen.getByText("A question").closest(".kit-card")).toHaveClass("kit-card--still");
    expect(ref.current).toBe(screen.getByRole("button", { name: "Pick" }));
    expect(ref.current).toHaveClass("mine");
  });
});

describe("FlipCard", () => {
  it("keeps the back's words out of the page until it turns, then hides the front from readers", () => {
    const { rerender } = render(<FlipCard flipped={false} front="?" back="Moses" tone="right" axis="x" />);
    const card = screen.getByText("?").closest(".kit-flip")!;
    expect(card).toHaveClass("kit-flip--x");
    expect(card).toHaveAttribute("data-flipped", "false");
    expect(screen.queryByText("Moses")).toBeNull();
    expect(card.querySelector(".kit-flip__back")).toHaveClass("is-right");
    rerender(<FlipCard flipped front="?" back="Moses" tone="right" axis="x" />);
    expect(card).toHaveClass("is-flipped");
    expect(screen.getByText("Moses")).toBeInTheDocument();
    expect(card.querySelector(".kit-flip__front")).toHaveAttribute("aria-hidden", "true");
    expect(card.querySelector(".kit-flip__back")).not.toHaveAttribute("aria-hidden");
  });
});

describe("FeedbackBand", () => {
  it("keeps its live region in the page while closed, shows the verdict and moves focus to Next when it opens", () => {
    const { rerender } = render(<FeedbackBand open={false} verdict={<>Right!</>} action={<button type="button">Next</button>}>The verse</FeedbackBand>);
    const status = screen.getByRole("status", { hidden: true });
    expect(status).toBeEmptyDOMElement();
    expect(screen.queryByRole("button", { name: "Next" })).toBeNull();
    rerender(<FeedbackBand open tone="right" verdict={<>Right!</>} action={<button type="button">Next</button>}>The verse</FeedbackBand>);
    expect(status).toHaveTextContent("Right!");
    expect(status.closest(".kit-band")).toHaveClass("is-right", "kit-band--narrow");
    expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
    expect(screen.getByText("The verse")).toBeInTheDocument();
  });
  it("does not steal focus on a redraw, and can be told not to at all", () => {
    const { rerender } = render(<FeedbackBand open verdict="Not quite" action={<button type="button">Next</button>} pinned="always" />);
    expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
    (document.activeElement as HTMLElement).blur();
    rerender(<FeedbackBand open verdict="Still not" action={<button type="button">Next</button>} pinned="always" />);
    expect(screen.getByRole("button", { name: "Next" })).not.toHaveFocus();
    expect(screen.getByRole("status").closest(".kit-band")).toHaveClass("kit-band--always");
    rerender(<FeedbackBand open={false} verdict="x" action={<button type="button">Next</button>} />);
    rerender(<FeedbackBand open focusAction={false} verdict="x" action={<button type="button">Next</button>} />);
    expect(screen.getByRole("button", { name: "Next" })).not.toHaveFocus();
  });
});

describe("celebration", () => {
  it("hops its children only when told", () => {
    const { container, rerender } = render(<HopWave when={false}><span>a</span></HopWave>);
    expect(container.firstElementChild).toHaveAttribute("data-hop", "false");
    expect(container.querySelector(".kit-hop")).toBeNull();
    rerender(<HopWave when><span>a</span></HopWave>);
    expect(container.querySelector(".kit-hop")).not.toBeNull();
  });
  it("bursts once when switched on and clears after the burst", () => {
    vi.useFakeTimers();
    const { container, rerender } = render(<Confetti when={false} count={6} ms={500} />);
    expect(container.querySelector(".kit-confetti")).toBeNull();
    rerender(<Confetti when count={6} ms={500} />);
    expect(container.querySelectorAll(".kit-confetti__piece")).toHaveLength(6);
    expect(container.querySelector(".kit-confetti")).toHaveAttribute("aria-hidden", "true");
    rerender(<Confetti when count={6} ms={500} />); // a redraw does not burst again
    expect(container.querySelector(".kit-confetti")).toHaveAttribute("data-burst", "1");
    act(() => { vi.advanceTimersByTime(600); });
    expect(container.querySelector(".kit-confetti")).toBeNull();
    vi.useRealTimers();
  });
  it("draws no pieces under reduced motion", () => {
    const saved = window.matchMedia;
    window.matchMedia = ((query: string) => ({ ...saved(query), matches: query.includes("reduce") })) as typeof window.matchMedia;
    const { container } = render(<Confetti when count={6} />);
    expect(container.querySelector(".kit-confetti")).toBeNull();
    window.matchMedia = saved;
  });
});

describe("MoreOptions", () => {
  it("folds its settings behind one row, closed by default", () => {
    const { container, rerender } = render(<MoreOptions><label>Rounds</label></MoreOptions>);
    const details = container.querySelector("details")!;
    expect(details.open).toBe(false);
    expect(screen.getByText("More options").tagName).toBe("SUMMARY");
    rerender(<MoreOptions defaultOpen summary="Settings"><label>Rounds</label></MoreOptions>);
    expect(container.querySelector("details")!.open).toBe(true);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });
});

describe("ConfirmDialog", () => {
  it("opens as a dialog with the game's words, confirms, cancels on Escape and gives focus back", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    function Host() {
      const [open, setOpen] = useState(false);
      return <>
        <button type="button" onClick={() => setOpen(true)}>Leave</button>
        <ConfirmDialog open={open} title="Leave this round?" confirmLabel="Leave round" danger onConfirm={onConfirm} onCancel={() => { onCancel(); setOpen(false); }}>
          <p>Your score is kept.</p>
        </ConfirmDialog>
      </>;
    }
    render(<Host />);
    expect(screen.queryByRole("dialog")).toBeNull();
    const opener = screen.getByRole("button", { name: "Leave" });
    opener.focus();
    fireEvent.click(opener);
    const dialog = screen.getByRole("dialog", { name: "Leave this round?" });
    expect(dialog).toHaveAttribute("open");
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "Leave round" })).toHaveClass("is-danger");
    fireEvent.click(screen.getByRole("button", { name: "Leave round" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(opener).toHaveFocus();
  });
});

describe("useScrollTopOn", () => {
  it("scrolls to the top when the key changes, not on the first mount", () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const { rerender } = renderHook(({ key }) => useScrollTopOn(key), { initialProps: { key: "setup" } });
    expect(scrollTo).not.toHaveBeenCalled();
    rerender({ key: "setup" });
    expect(scrollTo).not.toHaveBeenCalled();
    rerender({ key: "round" });
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
    scrollTo.mockRestore();
  });
  it("scrolls a game's own layer when given one", () => {
    const { result, rerender } = renderHook(({ key }) => {
      const layer = useRef<HTMLElement | null>(document.createElement("div"));
      layer.current!.scrollTo = vi.fn();
      useScrollTopOn(key, layer);
      return layer;
    }, { initialProps: { key: 1 } });
    rerender({ key: 2 });
    expect(result.current.current!.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
  });
});

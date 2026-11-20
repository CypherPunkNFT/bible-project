// DeferredSection: a part of a page mounted only when it comes near the screen (2026-11-19: Hymns, Close to home, the
// Teachers maps). jsdom's IntersectionObserver is a stub that never reports (src/test/setup.ts), like a section far below.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DeferredSection } from "./DeferredSection";

afterEach(cleanup);

describe("DeferredSection", () => {
  it("holds a placeholder of the given height until it comes near the screen", () => {
    const { container } = render(<DeferredSection minHeight="640px"><p>Inside</p></DeferredSection>);
    expect(screen.queryByText("Inside")).toBeNull();
    const holder = container.firstElementChild as HTMLElement;
    expect(holder.dataset.deferred).toBe("true");
    expect(holder.style.minHeight).toBe("640px");
  });

  it("mounts at once when eager (a jump link to it), and stays mounted", () => {
    const { rerender } = render(<DeferredSection eager><p>Inside</p></DeferredSection>);
    expect(screen.getByText("Inside")).toBeInTheDocument();
    rerender(<DeferredSection eager={false}><p>Inside</p></DeferredSection>);
    expect(screen.getByText("Inside")).toBeInTheDocument();
  });

  it("mounts at once where the browser has no IntersectionObserver", () => {
    const stub = Object.getOwnPropertyDescriptor(globalThis, "IntersectionObserver")!;
    delete (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;
    try {
      render(<DeferredSection><p>Inside</p></DeferredSection>);
      expect(screen.getByText("Inside")).toBeInTheDocument();
    } finally {
      Object.defineProperty(globalThis, "IntersectionObserver", stub);
    }
  });
});

import "@testing-library/jest-dom/vitest";

// jsdom has no layout, no WebGL and no observers. These stubs let components mount; real layout,
// scrolling, the masonry and the glitch canvas are covered by the browser checks in e2e/.

class NoopObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): [] {
    return [];
  }
}

for (const name of ["ResizeObserver", "IntersectionObserver"]) {
  Object.defineProperty(globalThis, name, { writable: true, configurable: true, value: NoopObserver });
}

Object.defineProperty(window, "matchMedia", {
  writable: true,
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// No WebGL in jsdom: getContext answers null, exactly like a device without it.
Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { writable: true, configurable: true, value: () => null });
Object.defineProperty(window, "scrollTo", { writable: true, configurable: true, value: () => {} });

// jsdom's Range has no geometry; the decrypt effect measures title lines with it. Zero boxes, like an element.
Object.defineProperty(Range.prototype, "getBoundingClientRect", {
  writable: true,
  configurable: true,
  value: () => new DOMRect(0, 0, 0, 0),
});

import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { languageReloads, setSiteLanguage, siteLanguage } from "./language";
import { useAsync } from "./useAsync";

function Shown({ failAfterChange }: { failAfterChange?: boolean }) {
  const state = useAsync(
    () => (failAfterChange && siteLanguage() !== "en" ? Promise.reject(new Error("no copy")) : Promise.resolve(`words in ${siteLanguage()}`)),
    "same-key",
  );
  return <p>{state.status === "ready" ? state.value : state.status}</p>;
}

describe("useAsync and a change of language", () => {
  it("reads the content again in the new language, keeping the old words on screen meanwhile", async () => {
    setSiteLanguage("en");
    render(<Shown />);
    expect(await screen.findByText("words in en")).toBeTruthy();
    act(() => setSiteLanguage("es"));
    expect(screen.queryByText("loading")).toBeNull(); // no loading frame for a change of language alone
    await act(() => languageReloads());
    expect(screen.getByText("words in es")).toBeTruthy();
    act(() => setSiteLanguage("en"));
  });

  it("keeps what is shown when the new language's copy fails", async () => {
    setSiteLanguage("en");
    render(<Shown failAfterChange />);
    expect(await screen.findByText("words in en")).toBeTruthy();
    act(() => setSiteLanguage("es"));
    await act(() => languageReloads());
    expect(screen.getByText("words in en")).toBeTruthy();
    act(() => setSiteLanguage("en"));
  });
});

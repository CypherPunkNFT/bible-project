// The four whole-page options of the test page, in the order the floating switcher shows them (owner, 2026-10-22:
// option A is the page as it was; make B, C and D).
import type { ComponentType } from "react";
import type { OptionProps } from "./host";
import { OptionA, OptionB } from "./OptionsAB";
import { OptionC } from "./OptionC";
import { OptionD } from "./OptionD";

export interface PageOption { id: string; name: string; Page: ComponentType<OptionProps> }

export const OPTIONS: PageOption[] = [
  { id: "a", name: "As it is", Page: OptionA },
  { id: "b", name: "One sentence", Page: OptionB },
  { id: "c", name: "House style", Page: OptionC },
  { id: "d", name: "Side by side", Page: OptionD },
];

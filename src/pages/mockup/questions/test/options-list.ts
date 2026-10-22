// The whole-page options of the test page, in the order the floating switcher shows them. One for now (owner,
// 2026-10-22: the house style with the as-is answer panel is A; B, C and D removed); variations come once A is approved.
import type { ComponentType } from "react";
import type { OptionProps } from "./host";
import { OptionA } from "./OptionA";

export interface PageOption { id: string; name: string; Page: ComponentType<OptionProps> }

export const OPTIONS: PageOption[] = [
  { id: "a", name: "House style", Page: OptionA },
];

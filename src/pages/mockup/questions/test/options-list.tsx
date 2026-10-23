// The whole-page options of the test page, in the order the floating switcher shows them: the house-style page (owner,
// 2026-10-22) with each of the four setup bars (SetupBars.tsx), which replaced the bar of four kinds of question.
import type { ComponentType } from "react";
import type { OptionProps } from "./host";
import { OptionA } from "./OptionA";
import { DialsBar, PresetsBar, SentenceBar, SliderBar, type SetupBarProps } from "./SetupBars";

const SETUP_BARS: { id: string; name: string; Bar: ComponentType<SetupBarProps> }[] = [
  { id: "a", name: "Three settings", Bar: DialsBar },
  { id: "b", name: "Ready-made tests", Bar: PresetsBar },
  { id: "c", name: "One sentence", Bar: SentenceBar },
  { id: "d", name: "Slider and bars", Bar: SliderBar },
];

export interface PageOption { id: string; name: string; Page: ComponentType<OptionProps> }

export const OPTIONS: PageOption[] = SETUP_BARS.map(({ id, name, Bar }) => ({ id, name, Page: (props: OptionProps) => <OptionA {...props} Bar={Bar} /> }));

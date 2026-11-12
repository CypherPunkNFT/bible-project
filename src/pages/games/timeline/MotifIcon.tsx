// The faint drawing in a card's corner, one line icon per motif (motif.ts). Decoration only: hidden from readers.
import { Bird, Cross, Crown, Flame, Landmark, Layers, Mountain, Scroll, Star, Sword, Waves, Wheat, type LucideProps } from "lucide-react";
import type { ComponentType } from "react";
import type { Motif } from "./motif";

const ICONS: Record<Motif, ComponentType<LucideProps>> = {
  crown: Crown, scroll: Scroll, waves: Waves, flame: Flame, temple: Landmark, star: Star, cross: Cross, sword: Sword,
  wheat: Wheat, dove: Bird, mountain: Mountain, card: Layers,
};

export function MotifIcon({ motif, className, size = 26 }: { motif: Motif; className?: string; size?: number }) {
  const Icon = ICONS[motif];
  return <Icon size={size} strokeWidth={1.4} aria-hidden="true" className={className} data-motif={motif} />;
}

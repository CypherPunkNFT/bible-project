import { forwardRef, type ComponentProps } from "react";
import { Link } from "react-router-dom";

/**
 * A router link whose state (the back link's "came from") also sits in `data-state`, so the people pages' wipe
 * (usePeoplePageSlide.ts), which navigates in place of the link, can pass it on.
 */
export const SlideLink = forwardRef<HTMLAnchorElement, ComponentProps<typeof Link>>(function SlideLink({ state, ...props }, ref) {
  return <Link ref={ref} state={state} data-state={state === undefined ? undefined : JSON.stringify(state)} {...props} />;
});

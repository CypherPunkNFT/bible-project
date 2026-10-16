/** CSS records the space reclaimed from the landing's vertical gaps, in rem. */
export function reclaimedLandingSpace(element: HTMLElement): number {
  return (parseFloat(getComputedStyle(element).getPropertyValue('--teacher-graph-reclaimed-rem')) || 0)
    * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

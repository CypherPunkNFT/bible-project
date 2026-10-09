export type GroupStatus = 'unengaged' | 'engagedUnreached' | 'noLongerUnreached';

export const groupLabels: Record<GroupStatus, string> = {
  unengaged: 'Unengaged and unreached',
  engagedUnreached: 'Engaged yet unreached',
  noLongerUnreached: 'No longer unreached',
};

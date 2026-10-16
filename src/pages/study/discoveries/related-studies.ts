export const discoveryStudies = [
  { id: 'mesha', route: '/study/mesha-and-the-world-of-moab', title: 'Mesha and the world of Moab', first: 'Mesha and', emphasis: 'the world of Moab.' },
  { id: 'lachish', route: '/study/lachish-under-siege', title: 'Lachish under siege', first: 'Lachish', emphasis: 'under siege.' },
  { id: 'cyrus', route: '/study/cyrus-restoration-and-return', title: 'Cyrus, restoration and return', first: 'Cyrus, restoration', emphasis: 'and return.' },
] as const;
export type DiscoveryStudyId = typeof discoveryStudies[number]['id'];

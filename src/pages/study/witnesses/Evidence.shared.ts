// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import '../manuscripts/manuscripts.css';
import './evidence.css';
export const recordHref = (id: string) => `/study/manuscripts?record=${encodeURIComponent(id)}`;

// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import { formatDate } from "@/lib/site-format";
import './source-overview.css';
export const snapshotDate = (value: string) => formatDate(new Date(value), {year:'numeric',month:'short',day:'numeric'});

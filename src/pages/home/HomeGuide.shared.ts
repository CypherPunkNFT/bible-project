// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import { createContext, type ReactNode } from "react";
import "../contact/contact.css";
import "./home-guide.css";
export const ConvictionsExtra = createContext<ReactNode>(undefined);

import { createContext } from "react";
import type { ThemeContextValue } from "./themeTypes";

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

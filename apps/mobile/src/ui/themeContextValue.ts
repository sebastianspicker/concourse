/** Creates the internal context channel used by theme hooks and provider. */
import { createContext } from "react";
import type { ThemeContextValue } from "./themeTypes";

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/** Bundled OFL font files keyed by the family names in `fonts.ts` (see assets/fonts for licenses). */
import { FontDisplay, type FontSource } from "expo-font";
import textLight from "../../assets/fonts/ConcourseText-Light.ttf";
import textRegular from "../../assets/fonts/ConcourseText-Regular.ttf";
import textSemibold from "../../assets/fonts/ConcourseText-SemiBold.ttf";
import displayBlack from "../../assets/fonts/Outfit-Black.ttf";
import displayExtraBold from "../../assets/fonts/Outfit-ExtraBold.ttf";

/** Web swaps from the system fallback as soon as a file arrives; native ignores `display`. */
const swap = (asset: number): FontSource => ({ uri: asset, display: FontDisplay.SWAP });

export const fontAssets: Record<string, FontSource> = {
  "Outfit-Black": swap(displayBlack),
  "Outfit-ExtraBold": swap(displayExtraBold),
  "ConcourseText-Light": swap(textLight),
  "ConcourseText-Regular": swap(textRegular),
  "ConcourseText-SemiBold": swap(textSemibold),
};

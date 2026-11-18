import { Geist, Geist_Mono, Instrument_Serif, Noto_Sans_Devanagari, Noto_Sans_Malayalam } from "next/font/google";

export const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
export const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap", preload: false });
export const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});
// Indic faces load only when the page actually renders those glyphs (unicode-range), no preload.
export const notoDeva = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600"],
  variable: "--font-noto-deva",
  display: "swap",
  preload: false,
});
export const notoMlym = Noto_Sans_Malayalam({
  subsets: ["malayalam"],
  weight: ["400", "500", "600"],
  variable: "--font-noto-mlym",
  display: "swap",
  preload: false,
});

export const fontVariables = [geist, geistMono, instrument, notoDeva, notoMlym].map((f) => f.variable).join(" ");

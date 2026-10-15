import { Inter, Space_Grotesk } from "next/font/google";

// Downloaded at build time and served from the same site (context doc §12).
// `latin-ext` is for names like Łukasz or Şahin.
export const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  weight: "700",
  display: "swap",
  variable: "--font-space-grotesk",
});

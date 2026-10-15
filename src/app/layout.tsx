import type { Metadata } from "next";
import { themeScript } from "@/lib/theme";
import { inter, spaceGrotesk } from "./fonts";
import "@/styles/globals.scss";

export const metadata: Metadata = {
  title: "LiftOff Comp",
  description: "Know when you're up.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The theme script sets data-theme before React hydrates.
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

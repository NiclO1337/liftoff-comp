import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LiftOff Comp",
  description: "Know when you're up.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

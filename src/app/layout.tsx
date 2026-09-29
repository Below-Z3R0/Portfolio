import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "../components/hooks/themeProvider";
import "./globals.css";
import { BackgroundFX } from "@/components/atoms/BackgroundFX";
import { domAnimation, LazyMotion } from "../components/animations/Animations";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Emmanuel.dev",
  description: "Created by Emmanuel.dev",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full text-[18px] leading-[145%] tracking-[0.18px] zoom-110 text-foreground bg-background font-display"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          themes={["light", "dark", "rosepine-dark", "rosepine-light"]}
          disableTransitionOnChange
        >
          <LazyMotion features={domAnimation} strict>
            <BackgroundFX />
            {children}
          </LazyMotion>
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CourseProvider } from "./context/CourseContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "RDS4+ | NSU Advising Planner",
  description: "Course registration and advising tool for North South University students. Browse courses, plan your semester.",
  keywords: ["NSU", "North South University", "Course Registration", "Advising", "RDS4"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('rds4plus_theme');var d=s==='dark'||(!s&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100`}>
        <ThemeProvider>
          <CourseProvider>
            {children}
          </CourseProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}

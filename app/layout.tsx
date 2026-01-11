import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CourseProvider } from "./context/CourseContext";

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
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-slate-950 text-slate-100`}>
        <CourseProvider>
          {children}
        </CourseProvider>
      </body>
    </html>
  );
}

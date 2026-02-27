import { Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata = {
  title: "SWE Sim — Software Engineering Workflow Simulator",
  description:
    "Interactive simulation of Agile/Scrum, CI/CD pipelines, and version control — learn how real engineering teams ship software.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${jakarta.variable} ${plexMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}

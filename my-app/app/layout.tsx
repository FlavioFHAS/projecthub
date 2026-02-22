import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ProjectHub - Gerenciamento de Projetos",
  description: "Plataforma completa de gerenciamento de projetos para equipes",
  keywords: ["project management", "gestão de projetos", "colaboração", "equipe"],
  authors: [{ name: "ProjectHub" }],
  openGraph: {
    title: "ProjectHub - Gerenciamento de Projetos",
    description: "Plataforma completa de gerenciamento de projetos para equipes",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "J&E Barber | Barbearia em Palhoça",
  description: "Agende seu horário na J&E Barber. Técnica, estilo e presença em Palhoça, SC.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}

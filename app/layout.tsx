import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BS Barber Classic | Barbearia moderna para o cavalheiro atual",
  description: "Agende seu horário na BS Barber Classic. Cortes, barba, visagismo e cuidados masculinos desde 2016.",
  icons: { icon: "/logo-bs.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}

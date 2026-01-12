import type { Metadata } from "next";
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc-provider";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { DemoBanner } from "@/components/DemoBanner";

export const metadata: Metadata = {
  title: "パーソナライズ食事宅配サービス",
  description: "AIと数理最適化を活用したパーソナライズ食事宅配サービス",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <DemoBanner />
        <TRPCProvider>
          <AuthProvider>
            <FavoritesProvider>
              <CartProvider>{children}</CartProvider>
            </FavoritesProvider>
          </AuthProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}

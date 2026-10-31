import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { SesionProvider } from "@/lib/cuenta/sesion";
import { nombreDeCuentaActual } from "@/lib/supabase/servidor";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WeMeet",
  description: "Encuentra el mejor horario para reunirse, sin cuenta y desde el celular.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} ${jakarta.variable} ${jetbrains.variable}`}>
      <body>
        <SesionProvider nombreInicial={await nombreDeCuentaActual()}>{children}</SesionProvider>
        <Toaster
          position="top-center"
          offset={{ top: "max(1rem, env(safe-area-inset-top))", left: "1rem", right: "1rem" }}
          mobileOffset={{ top: "max(0.75rem, env(safe-area-inset-top))", left: "1rem", right: "1rem" }}
        />
      </body>
    </html>
  );
}

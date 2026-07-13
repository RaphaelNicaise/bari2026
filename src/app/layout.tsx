import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { QueryProvider } from '@/components/providers/query-provider';
import './globals.css';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
});

export const metadata: Metadata = {
  title: 'Bari 2026',
  description: 'Trip planner for Bariloche 2026',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${geist.variable} dark`}>
      <body className="bg-zinc-950 text-zinc-100 antialiased font-sans">
        <QueryProvider>
          <main className="min-h-dvh">{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Lato, Almarai } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "./src/providers/query-provider";
import { AppSidebar } from './src/components/sidebar/app-sidebar';
import { sidebarConfig } from './src/components/sidebar/sidebar.config';

const lato = Lato({
  variable: '--font-lato',
  subsets: ['latin'],
  weight: ['100', '300', '400', '700', '900'],
  display: 'swap',
});

const almarai = Almarai({
  variable: '--font-almarai',
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "TH30 Admin Dashboard",
  description: "Admin dashboard for TH30 management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-primary" suppressHydrationWarning>
      <body
        className={`${lato.variable} ${almarai.variable} antialiased`}
      >
        <QueryProvider>
          <div className="flex h-screen bg-primary">
            <AppSidebar
              groups={sidebarConfig.groups}
              header={sidebarConfig.header}
              footer={sidebarConfig.footer}
            />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}

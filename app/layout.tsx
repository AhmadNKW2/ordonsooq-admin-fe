import type { Metadata } from "next";
import { Lato, Almarai } from "next/font/google";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import "nprogress/nprogress.css";
import { QueryProvider } from "./src/providers/query-provider";
import { LoadingProvider } from "./src/providers/loading-provider";
import { AuthProvider } from "./src/contexts/auth.context";
import { AppSidebar } from './src/components/sidebar/app-sidebar';
import { sidebarConfig } from './src/components/sidebar/sidebar.config';
import { ProtectedRoute } from "./src/components/auth/ProtectedRoute";
import { ToastContainer, Slide } from "react-toastify";

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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${lato.variable} ${almarai.variable} antialiased`}
      >
        <QueryProvider>
          <LoadingProvider>
            <AuthProvider>
              <ProtectedRoute>
                <div className="flex h-screen bg-primary/10">
                  <AppSidebar
                    groups={sidebarConfig.groups}
                    header={sidebarConfig.header}
                    footer={sidebarConfig.footer}
                  />
                  <main className="flex-1 overflow-auto">
                    {children}
                  </main>
                </div>
              </ProtectedRoute>
            </AuthProvider>
          </LoadingProvider>
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
            transition={Slide}
          />
        </QueryProvider>
      </body>
    </html>
  );
}

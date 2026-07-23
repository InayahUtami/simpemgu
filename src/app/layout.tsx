import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIMPEMGU",
  description: "Dashboard Sistem Pemerataan Guru Kota Palembang",
  icons: {
    icon: '/asset/simpemgu.png',
  },
  other: {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/asset/simpemgu.png" type="image/png" />
        <link rel="shortcut icon" href="/asset/simpemgu.png" type="image/png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <script dangerouslySetInnerHTML={{
          __html: `
            // Prevent BFCache (Back-Forward Cache)
            window.addEventListener('pageshow', function(e) {
              if (e.persisted) {
                window.location.reload();
              }
            });
            // Break BFCache on unload
            window.addEventListener('unload', function() {});
          `
        }} />
      </head>
      <body suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}


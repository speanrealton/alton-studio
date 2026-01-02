// src/app/layout.tsx
import './globals.css';
import NotificationListener from '@/components/NotificationListener';
import NotificationToast from '@/components/NotificationToast';
import LanguageProvider from '@/providers/LanguageProvider';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} font-sans antialiased`}>
        <LanguageProvider>
          <NotificationListener />
          <NotificationToast />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
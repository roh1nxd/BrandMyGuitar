import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Brand My Guitar — Your brand, on my guitar.',
  description: 'Place a bid to put your logo on my guitar. Live auction for 7 spots.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${sans.variable} bg-bg text-text font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}

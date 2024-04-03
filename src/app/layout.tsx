export const metadata = {
  title: "Pinecone - Vercel AI SDK Example",
  description: "Pinecone - Vercel AI SDK Example",
};

import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] })
import { ClerkProvider } from '@clerk/nextjs'

import "../global.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>

      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}

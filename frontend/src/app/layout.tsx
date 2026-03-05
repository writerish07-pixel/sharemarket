import './globals.css';

export const metadata = {
  title: 'AI Intraday Trader',
  description: 'Low-latency AI assistant for Indian markets',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

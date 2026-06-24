import './globals.css';

export const metadata = {
  title: 'Synergy Systems Portal',
  description: 'Klantportaal en back-office voor Synergy Systems',
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}

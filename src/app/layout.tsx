import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Snake Game - Classic Arcade Fun',
  description: 'Play the classic Snake game with modern web technologies. Progressive difficulty, smooth controls, and addictive gameplay.',
  keywords: 'snake game, arcade, classic games, browser game',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Orbitron:wght@400;700;900&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white antialiased" style={{ fontFamily: 'Inter, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
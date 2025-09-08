import SnakeGame from '@/components/SnakeGame'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="text-center mb-8">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent mb-4" style={{ fontFamily: 'Orbitron, monospace' }}>
          SNAKE
        </h1>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">
          Classic arcade gameplay with modern polish. Eat food, grow longer, and avoid collisions!
        </p>
      </div>
      
      <div className="w-full max-w-4xl">
        <SnakeGame />
      </div>
      
      <div className="mt-8 text-center text-gray-400">
        <p className="text-sm">
          Use <span className="font-mono bg-gray-700 px-2 py-1 rounded">WASD</span> or 
          <span className="font-mono bg-gray-700 px-2 py-1 rounded ml-1">Arrow Keys</span> to move • 
          <span className="font-mono bg-gray-700 px-2 py-1 rounded ml-1">SPACE</span> to pause
        </p>
      </div>
    </main>
  )
}
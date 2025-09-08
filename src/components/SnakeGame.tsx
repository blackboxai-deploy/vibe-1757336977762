'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// Game constants
const GRID_SIZE = 20
const CELL_SIZE = 24
const INITIAL_SNAKE = [{ x: 10, y: 10 }]
const INITIAL_DIRECTION = { x: 1, y: 0 }
const INITIAL_FOOD = { x: 15, y: 15 }
const INITIAL_SPEED = 150
const SPEED_INCREASE = 15
const MIN_SPEED = 50

// Types
interface Position {
  x: number
  y: number
}

type Direction = Position

type GameState = 'menu' | 'playing' | 'paused' | 'gameOver'

interface GameData {
  snake: Position[]
  direction: Direction
  nextDirection: Direction
  food: Position
  score: number
  level: number
  speed: number
  highScore: number
}

export default function SnakeGame() {
  // Game state
  const [gameState, setGameState] = useState<GameState>('menu')
  const [gameData, setGameData] = useState<GameData>({
    snake: INITIAL_SNAKE,
    direction: INITIAL_DIRECTION,
    nextDirection: INITIAL_DIRECTION,
    food: INITIAL_FOOD,
    score: 0,
    level: 1,
    speed: INITIAL_SPEED,
    highScore: 0
  })

  // Refs for game loop
  const gameLoopRef = useRef<number | undefined>(undefined)
  const lastUpdateTimeRef = useRef<number>(0)
  const audioContextRef = useRef<AudioContext | undefined>(undefined)

  // Initialize audio context and high score on mount
  useEffect(() => {
    // Initialize Web Audio API
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Load high score from localStorage
      const savedHighScore = localStorage.getItem('snake-high-score')
      if (savedHighScore) {
        setGameData(prev => ({ ...prev, highScore: parseInt(savedHighScore, 10) }))
      }
    }
  }, [])

  // Audio functions
  const playSound = (frequency: number, duration: number, type: OscillatorType = 'square') => {
    if (!audioContextRef.current) return
    
    const oscillator = audioContextRef.current.createOscillator()
    const gainNode = audioContextRef.current.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContextRef.current.destination)
    
    oscillator.frequency.value = frequency
    oscillator.type = type
    
    gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration)
    
    oscillator.start(audioContextRef.current.currentTime)
    oscillator.stop(audioContextRef.current.currentTime + duration)
  }

  const playFoodSound = () => playSound(800, 0.1, 'sine')
  const playLevelUpSound = () => {
    playSound(523, 0.15, 'square')
    setTimeout(() => playSound(659, 0.15, 'square'), 150)
    setTimeout(() => playSound(784, 0.2, 'square'), 300)
  }
  const playGameOverSound = () => {
    playSound(200, 0.5, 'sawtooth')
    setTimeout(() => playSound(150, 0.3, 'sawtooth'), 200)
  }

  // Generate random food position
  const generateFood = (snake: Position[]): Position => {
    let newFood: Position
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      }
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y))
    return newFood
  }

  // Check collision with walls or self
  const checkCollision = (head: Position, snake: Position[]): boolean => {
    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true
    }
    // Self collision
    return snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)
  }

  // Game update logic
  const updateGame = useCallback(() => {
    setGameData(prevData => {
      if (gameState !== 'playing') return prevData

      const newSnake = [...prevData.snake]
      const head = { ...newSnake[0] }
      
      // Update direction
      const currentDirection = prevData.nextDirection
      head.x += currentDirection.x
      head.y += currentDirection.y

      // Check collision
      if (checkCollision(head, newSnake)) {
        playGameOverSound()
        setGameState('gameOver')
        
        // Update high score
        if (prevData.score > prevData.highScore) {
          localStorage.setItem('snake-high-score', prevData.score.toString())
          return { ...prevData, highScore: prevData.score }
        }
        return prevData
      }

      newSnake.unshift(head)

      // Check if food eaten
      let newFood = prevData.food
      let newScore = prevData.score
      let newLevel = prevData.level
      let newSpeed = prevData.speed

      if (head.x === prevData.food.x && head.y === prevData.food.y) {
        // Food eaten - don't remove tail, generate new food
        newFood = generateFood(newSnake)
        newScore = prevData.score + (10 * prevData.level)
        playFoodSound()
        
        // Check for level up (every 5 food items)
        if (newScore > 0 && Math.floor(newScore / 50) > prevData.level - 1) {
          newLevel = prevData.level + 1
          newSpeed = Math.max(MIN_SPEED, prevData.speed - SPEED_INCREASE)
          playLevelUpSound()
        }
      } else {
        // No food eaten - remove tail
        newSnake.pop()
      }

      return {
        ...prevData,
        snake: newSnake,
        direction: currentDirection,
        food: newFood,
        score: newScore,
        level: newLevel,
        speed: newSpeed
      }
    })
  }, [gameState])

  // Game loop
  const gameLoop = useCallback((currentTime: number) => {
    if (gameState === 'playing') {
      if (currentTime - lastUpdateTimeRef.current >= gameData.speed) {
        updateGame()
        lastUpdateTimeRef.current = currentTime
      }
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }
  }, [gameState, gameData.speed, updateGame])

  // Start game loop when playing
  useEffect(() => {
    if (gameState === 'playing') {
      lastUpdateTimeRef.current = performance.now()
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    } else {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [gameState, gameLoop])

  // Keyboard input handling
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      e.preventDefault()
      
      if (gameState === 'menu' && (e.code === 'Space' || e.code === 'Enter')) {
        startGame()
        return
      }

      if (gameState === 'gameOver' && (e.code === 'Space' || e.code === 'Enter')) {
        resetGame()
        return
      }

      if (gameState === 'playing' && e.code === 'Space') {
        setGameState('paused')
        return
      }

      if (gameState === 'paused' && e.code === 'Space') {
        setGameState('playing')
        return
      }

      if (gameState === 'playing') {
        setGameData(prev => {
          let newDirection = prev.nextDirection
          
          switch (e.code) {
            case 'ArrowUp':
            case 'KeyW':
              if (prev.direction.y === 0) newDirection = { x: 0, y: -1 }
              break
            case 'ArrowDown':
            case 'KeyS':
              if (prev.direction.y === 0) newDirection = { x: 0, y: 1 }
              break
            case 'ArrowLeft':
            case 'KeyA':
              if (prev.direction.x === 0) newDirection = { x: -1, y: 0 }
              break
            case 'ArrowRight':
            case 'KeyD':
              if (prev.direction.x === 0) newDirection = { x: 1, y: 0 }
              break
          }
          
          return { ...prev, nextDirection: newDirection }
        })
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameState])

  const startGame = () => {
    setGameState('playing')
  }

  const resetGame = () => {
    setGameData(prev => ({
      snake: INITIAL_SNAKE,
      direction: INITIAL_DIRECTION,
      nextDirection: INITIAL_DIRECTION,
      food: generateFood(INITIAL_SNAKE),
      score: 0,
      level: 1,
      speed: INITIAL_SPEED,
      highScore: prev.highScore
    }))
    setGameState('menu')
  }

  // Render game grid
  const renderGrid = () => {
    const cells = []
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        let cellType = 'empty'
        
        // Check if this cell contains snake head
        if (gameData.snake[0]?.x === x && gameData.snake[0]?.y === y) {
          cellType = 'snake-head'
        }
        // Check if this cell contains snake body
        else if (gameData.snake.slice(1).some(segment => segment.x === x && segment.y === y)) {
          cellType = 'snake-body'
        }
        // Check if this cell contains food
        else if (gameData.food.x === x && gameData.food.y === y) {
          cellType = 'food'
        }

        cells.push(
          <div
            key={`${x}-${y}`}
            className={`
              border border-gray-700
              ${cellType === 'empty' ? 'bg-gray-900' : ''}
              ${cellType === 'snake-head' ? 'bg-green-400 shadow-lg shadow-green-400/50' : ''}
              ${cellType === 'snake-body' ? 'bg-green-600' : ''}
              ${cellType === 'food' ? 'bg-red-500 rounded-full shadow-lg shadow-red-500/50 animate-pulse' : ''}
              transition-colors duration-100
            `}
            style={{
              width: `${CELL_SIZE}px`,
              height: `${CELL_SIZE}px`
            }}
          />
        )
      }
    }
    
    return cells
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* HUD */}
      <div className="flex justify-between items-center w-full max-w-[480px] bg-gray-800/50 backdrop-blur-sm rounded-lg p-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>{gameData.score}</div>
          <div className="text-sm text-gray-400">Score</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'Orbitron, monospace' }}>{gameData.level}</div>
          <div className="text-sm text-gray-400">Level</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400" style={{ fontFamily: 'Orbitron, monospace' }}>{gameData.highScore}</div>
          <div className="text-sm text-gray-400">Best</div>
        </div>
      </div>

      {/* Game Container */}
      <div className="relative">
        {/* Game Grid */}
        <div 
          className="grid bg-black border-2 border-green-400 shadow-2xl shadow-green-400/20 rounded-lg overflow-hidden"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
            width: `${GRID_SIZE * CELL_SIZE}px`,
            height: `${GRID_SIZE * CELL_SIZE}px`
          }}
        >
          {renderGrid()}
        </div>

        {/* Game State Overlays */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg">
            <div className="text-center text-white">
              <h2 className="text-3xl font-bold mb-4 text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>READY?</h2>
              <p className="text-gray-300 mb-6">Press SPACE or ENTER to start</p>
              <div className="text-sm text-gray-400">
                <p>Eat red food to grow and score points</p>
                <p>Avoid walls and your own tail</p>
              </div>
            </div>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg">
            <div className="text-center text-white">
              <h2 className="text-3xl font-bold mb-4 text-yellow-400" style={{ fontFamily: 'Orbitron, monospace' }}>PAUSED</h2>
              <p className="text-gray-300">Press SPACE to continue</p>
            </div>
          </div>
        )}

        {gameState === 'gameOver' && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg">
            <div className="text-center text-white">
              <h2 className="text-3xl font-bold mb-4 text-red-400" style={{ fontFamily: 'Orbitron, monospace' }}>GAME OVER</h2>
              <p className="text-2xl font-bold text-green-400 mb-2">Score: {gameData.score}</p>
              {gameData.score === gameData.highScore && gameData.score > 0 && (
                <p className="text-yellow-400 mb-4 font-bold">🎉 NEW HIGH SCORE! 🎉</p>
              )}
              <p className="text-gray-300 mb-4">Press SPACE or ENTER to play again</p>
            </div>
          </div>
        )}
      </div>

      {/* Speed Indicator */}
      {gameState === 'playing' && (
        <div className="text-center">
          <div className="text-sm text-gray-400">
            Speed: {Math.round((INITIAL_SPEED - gameData.speed + MIN_SPEED) / SPEED_INCREASE)}x
          </div>
          <div className="w-32 h-1 bg-gray-700 rounded-full mt-1">
            <div 
              className="h-1 bg-gradient-to-r from-green-400 to-red-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, ((INITIAL_SPEED - gameData.speed) / (INITIAL_SPEED - MIN_SPEED)) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
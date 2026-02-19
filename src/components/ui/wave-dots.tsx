interface WaveDotsProps {
  className?: string
  color?: string
}

export function WaveDots({ className = "", color = "#64748b" }: WaveDotsProps) {
  const cols = 52
  const rows = 22
  const spacingX = 20
  const spacingY = 20
  const width = cols * spacingX
  const height = rows * spacingY

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: cols }).map((_, col) => {
          const x = col * spacingX + spacingX / 2
          const y = row * spacingY + spacingY / 2

          // Diagonal wave — the "crest" moves diagonally across the grid
          const wave = Math.sin((col - row * 1.4) * 0.45)
          // Second wave for depth
          const wave2 = Math.sin((col * 0.3 + row * 0.5) * 0.8) * 0.4

          const combined = (wave + wave2 + 1.4) / 2.8 // normalize ~0..1

          const size = 0.8 + combined * 1.8   // 0.8..2.6px
          const opacity = 0.05 + combined * 0.28 // 0.05..0.33

          return (
            <circle
              key={`${row}-${col}`}
              cx={x}
              cy={y}
              r={size}
              fill={color}
              opacity={opacity}
            />
          )
        })
      )}
    </svg>
  )
}

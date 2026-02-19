interface WaveDotsProps {
  className?: string
  color?: string
  rows?: number
  cols?: number
}

export function WaveDots({
  className = "",
  color = "#C41E3A",
  rows = 14,
  cols = 28,
}: WaveDotsProps) {
  const spacingX = 36
  const spacingY = 28
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

          // Two overlapping sine waves creating a beautiful flowing pattern
          const wave1 = Math.sin((col / cols) * Math.PI * 5 - (row / rows) * Math.PI * 1.5)
          const wave2 = Math.sin((col / cols) * Math.PI * 3 + (row / rows) * Math.PI * 2 + 1)
          const combined = (wave1 * 0.6 + wave2 * 0.4 + 1) / 2 // normalize to 0..1

          const size = 1.5 + combined * 4.5  // 1.5..6 px
          const opacity = 0.12 + combined * 0.55  // 0.12..0.67

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

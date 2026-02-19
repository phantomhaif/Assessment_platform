export function WaveDots({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 800 300"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {Array.from({ length: 18 }).map((_, row) => {
        const cols = 40
        return Array.from({ length: cols }).map((_, col) => {
          const x = (col / (cols - 1)) * 780 + 10
          // Two wave layers with different phases
          const wave1 = Math.sin((col / cols) * Math.PI * 3 - 0.5) * 60
          const wave2 = Math.sin((col / cols) * Math.PI * 2.5 + 1.2) * 40
          const baseY = 80 + row * 9
          const y = baseY + wave1 * 0.3 + wave2 * 0.2

          // Distance from wave peak determines dot size
          const distFromCenter = Math.abs(row - 9) / 9
          const waveInfluence = Math.sin((col / cols) * Math.PI * 2.5 + row * 0.3)
          const size = Math.max(0.8, (1 - distFromCenter * 0.7) * (1 + waveInfluence * 0.4) * 2.8)

          // Opacity based on position
          const opacity = Math.max(0.08, (1 - distFromCenter * 0.6) * 0.22 + waveInfluence * 0.05)

          if (y < 0 || y > 300) return null

          return (
            <circle
              key={`${row}-${col}`}
              cx={x}
              cy={y}
              r={size}
              fill="#94a3b8"
              opacity={opacity}
            />
          )
        })
      })}
    </svg>
  )
}

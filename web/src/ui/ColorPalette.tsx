const PALETTE = [
  { name: 'Brown',     hex: '#4A3B32' },
  { name: 'Pink',      hex: '#FF6B9E' },
  { name: 'Green',     hex: '#00D8A1' },
  { name: 'Yellow',    hex: '#FFC837' },
  { name: 'Blue',      hex: '#36C5F0' },
  { name: 'Purple',    hex: '#8B5CF6' },
  { name: 'Magenta',   hex: '#F472B6' },
  { name: 'White',     hex: '#FFFFFF' },
]

interface ColorPaletteProps {
  selectedColor: string
  onColorChange: (hex: string) => void
}

export function ColorPalette({ selectedColor, onColorChange }: ColorPaletteProps) {
  return (
    <div>
      <div className="palette-grid">
        {PALETTE.map((color) => (
          <button
            key={color.hex}
            id={`color-swatch-${color.name.toLowerCase()}`}
            className={`color-chip ${selectedColor === color.hex ? 'selected' : ''}`}
            style={{ 
              backgroundColor: color.hex, 
              borderColor: color.hex === '#FFFFFF' ? '#E2DDD5' : 'transparent' 
            }}
            onClick={() => onColorChange(color.hex)}
            aria-label={`Colour: ${color.name}`}
            aria-pressed={selectedColor === color.hex}
          />
        ))}
      </div>
    </div>
  )
}

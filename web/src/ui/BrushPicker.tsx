const BRUSH_SIZES = [
  { id: 'sm', size: 12, label: 'Fine'   },
  { id: 'md', size: 30, label: 'Medium' },
  { id: 'lg', size: 60, label: 'Bold'   },
]

interface BrushPickerProps {
  brushSize: number
  onBrushChange: (size: number) => void
}

export function BrushPicker({ brushSize, onBrushChange }: BrushPickerProps) {
  return (
    <div>
      <div className="pill-group">
        {BRUSH_SIZES.map((b) => (
          <button
            key={b.id}
            id={`brush-${b.id}`}
            className={`pill ${brushSize === b.size ? 'selected' : ''}`}
            onClick={() => onBrushChange(b.size)}
            aria-label={`Brush size: ${b.label}`}
            aria-pressed={brushSize === b.size}
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  )
}

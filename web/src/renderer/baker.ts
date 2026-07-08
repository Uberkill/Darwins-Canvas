import type { Decal } from '../types'
import { getDecalDataUrl } from './decals'
import type { DecalStyle } from './decals'

export interface BakedSprites {
  IDLE: string
  SLEEPING: string
  EATING: string
  FIGHTING: string
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous' // To prevent canvas tainting just in case
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Bakes the base body pixels and SVG decals into 4 discrete state frames.
 * Must enforce DPR=1 to avoid Retina mobile memory crash.
 */
export async function bakeCreatureSprites(base64Body: string, decals: Decal[]): Promise<BakedSprites> {
  const bodyImg = await loadImage(base64Body)
  const size = Math.max(bodyImg.width, bodyImg.height)

  const bakeFrame = async (state: 'IDLE' | 'SLEEPING' | 'EATING' | 'FIGHTING'): Promise<string> => {
    const canvas = document.createElement('canvas')
    // Force DPR=1 for baked sprites to save memory
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''

    // Draw base body
    ctx.drawImage(bodyImg, 0, 0, size, size)

    // Sort decals just in case (though array order is z-index)
    for (const decal of decals) {
      let openOrClosed: 'OPEN' | 'CLOSED' = 'OPEN'
      
      // Determine state of decal based on creature state
      if (state === 'SLEEPING') {
        openOrClosed = 'CLOSED'
      } else if (state === 'EATING') {
        openOrClosed = 'OPEN' // Wide open for eating
      } else if (state === 'FIGHTING') {
        openOrClosed = 'OPEN'
      } else {
        // IDLE
        openOrClosed = decal.type === 'MOUTH' ? 'CLOSED' : 'OPEN'
      }

      const svgDataUrl = getDecalDataUrl(decal.style as DecalStyle, openOrClosed)
      const decalImg = await loadImage(svgDataUrl)
      
      ctx.save()
      ctx.translate(decal.x, decal.y)
      ctx.rotate(decal.rotation)
      // The decal's center is drawn at 0,0
      ctx.drawImage(decalImg, -decal.scale / 2, -decal.scale / 2, decal.scale, decal.scale)
      ctx.restore()
    }

    const result = canvas.toDataURL('image/png')
    
    // Explicitly zero buffer to release GPU memory on iOS/Safari
    canvas.width = 0
    canvas.height = 0
    
    return result
  }

  const [IDLE, SLEEPING, EATING, FIGHTING] = await Promise.all([
    bakeFrame('IDLE'),
    bakeFrame('SLEEPING'),
    bakeFrame('EATING'),
    bakeFrame('FIGHTING')
  ])

  return { IDLE, SLEEPING, EATING, FIGHTING }
}

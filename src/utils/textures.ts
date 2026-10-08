export type TextureDirection = 'horizontal' | 'vertical'

export interface TextureOptions {
  seed?: number
  opacity?: number
  direction?: TextureDirection
  backgroundSize?: string
}

export interface TexturePreset {
  category: 'grain' | 'wood'
  blendMode: string
  defaultOpacity: number
  backgroundSize: string
  build: (seed: number, direction: TextureDirection) => string
}

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function buildGrainSvg(seed: number, baseFrequency: number, numOctaves: number): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">`,
    `<filter id="n">`,
    `<feTurbulence type="fractalNoise" baseFrequency="${baseFrequency}" numOctaves="${numOctaves}" seed="${seed}" stitchTiles="stitch"/>`,
    `<feColorMatrix type="saturate" values="0"/>`,
    `<feComponentTransfer>`,
    `<feFuncR type="linear" slope="2.5" intercept="-0.75"/>`,
    `<feFuncG type="linear" slope="2.5" intercept="-0.75"/>`,
    `<feFuncB type="linear" slope="2.5" intercept="-0.75"/>`,
    `</feComponentTransfer>`,
    `</filter>`,
    `<rect width="100%" height="100%" filter="url(#n)"/>`,
    `</svg>`,
  ].join('')
}

function buildWoodSvg(
  seed: number,
  baseFreqX: number,
  baseFreqY: number,
  numOctaves: number,
  contrast: number,
  rBase: number, gBase: number, bBase: number,
  rAmp: number, gAmp: number, bAmp: number,
  direction: TextureDirection,
): string {
  const fx = direction === 'vertical' ? baseFreqY : baseFreqX
  const fy = direction === 'vertical' ? baseFreqX : baseFreqY
  const intercept = 0.5 * (1 - contrast)
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">`,
    `<filter id="w">`,
    `<feTurbulence type="fractalNoise" baseFrequency="${fx} ${fy}" numOctaves="${numOctaves}" seed="${seed}" stitchTiles="stitch"/>`,
    `<feColorMatrix type="saturate" values="0"/>`,
    `<feComponentTransfer>`,
    `<feFuncR type="linear" slope="${contrast}" intercept="${intercept}"/>`,
    `<feFuncG type="linear" slope="${contrast}" intercept="${intercept}"/>`,
    `<feFuncB type="linear" slope="${contrast}" intercept="${intercept}"/>`,
    `</feComponentTransfer>`,
    `<feColorMatrix type="matrix" values="${rAmp} 0 0 0 ${rBase} ${gAmp} 0 0 0 ${gBase} ${bAmp} 0 0 0 ${bBase} 0 0 0 1 0"/>`,
    `</filter>`,
    `<rect width="100%" height="100%" filter="url(#w)"/>`,
    `</svg>`,
  ].join('')
}

export const texturePresets: Record<string, TexturePreset> = {
  grain: {
    category: 'grain',
    blendMode: 'overlay',
    defaultOpacity: 0.8,
    backgroundSize: '200px 200px',
    build: (seed) => svgToDataUri(buildGrainSvg(seed, 0.85, 2)),
  },
  'wood-birch': {
    category: 'wood',
    blendMode: 'multiply',
    defaultOpacity: 0.45,
    backgroundSize: '400px 300px',
    build: (seed, dir) => svgToDataUri(
      buildWoodSvg(seed, 0.015, 0.5, 3, 1.2, 0.88, 0.82, 0.70, 0.10, 0.12, 0.16, dir),
    ),
  },
  'wood-ash': {
    category: 'wood',
    blendMode: 'multiply',
    defaultOpacity: 0.5,
    backgroundSize: '400px 300px',
    build: (seed, dir) => svgToDataUri(
      buildWoodSvg(seed, 0.012, 0.55, 4, 1.35, 0.79, 0.68, 0.50, 0.12, 0.14, 0.16, dir),
    ),
  },
  'wood-pine': {
    category: 'wood',
    blendMode: 'multiply',
    defaultOpacity: 0.5,
    backgroundSize: '400px 300px',
    build: (seed, dir) => svgToDataUri(
      buildWoodSvg(seed, 0.01, 0.4, 3, 1.25, 0.75, 0.60, 0.34, 0.14, 0.16, 0.20, dir),
    ),
  },
  'wood-beech': {
    category: 'wood',
    blendMode: 'multiply',
    defaultOpacity: 0.45,
    backgroundSize: '400px 300px',
    build: (seed, dir) => svgToDataUri(
      buildWoodSvg(seed, 0.02, 0.6, 2, 1.15, 0.76, 0.62, 0.48, 0.08, 0.10, 0.10, dir),
    ),
  },
  'wood-oak-light': {
    category: 'wood',
    blendMode: 'multiply',
    defaultOpacity: 0.55,
    backgroundSize: '400px 300px',
    build: (seed, dir) => svgToDataUri(
      buildWoodSvg(seed, 0.008, 0.65, 4, 1.4, 0.60, 0.43, 0.24, 0.16, 0.18, 0.22, dir),
    ),
  },
}

export function generateTexture(
  preset: string,
  options: TextureOptions = {},
): { dataUri: string; blendMode: string; opacity: number; backgroundSize: string } {
  const config = texturePresets[preset]
  if (!config) {
    console.warn(`[useTexture] Unknown preset: "${preset}"`)
    return { dataUri: '', blendMode: 'normal', opacity: 0, backgroundSize: '0' }
  }

  const seed = options.seed ?? 0
  const direction = options.direction ?? 'horizontal'
  const dataUri = config.build(seed, direction)

  return {
    dataUri,
    blendMode: config.blendMode,
    opacity: options.opacity ?? config.defaultOpacity,
    backgroundSize: options.backgroundSize ?? config.backgroundSize,
  }
}

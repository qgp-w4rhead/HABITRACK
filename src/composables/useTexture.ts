import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { generateTexture, type TextureOptions } from '../utils/textures'

export function useTexture(
  preset: MaybeRefOrGetter<string>,
  options: MaybeRefOrGetter<TextureOptions> = {},
) {
  const textureStyle = computed(() => {
    const p = toValue(preset)
    const opts = toValue(options)
    const { dataUri, blendMode, opacity, backgroundSize } = generateTexture(p, opts)

    if (!dataUri) return {}

    return {
      '--surface-texture': `url("${dataUri}")`,
      '--surface-blend': blendMode,
      '--surface-opacity': String(opacity),
      '--surface-size': backgroundSize,
    } as Record<string, string>
  })

  return { textureStyle }
}

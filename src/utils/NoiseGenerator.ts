import alea from 'alea'
import { createNoise2D } from 'simplex-noise'

export class NoiseGenerator {
  private noise2D: ReturnType<typeof createNoise2D>

  constructor(seed: string = 'forest-walk-seed-42') {
    const prng = alea(seed)
    this.noise2D = createNoise2D(prng)
  }

  /**
   * Get height value at world coordinates using multi-octave noise
   * @param x World X coordinate
   * @param z World Z coordinate
   * @param scale Scale factor for noise (larger = smoother terrain)
   * @param amplitude Height multiplier
   * @returns Height value
   */
  public getHeight(
    x: number,
    z: number,
    scale: number,
    amplitude: number,
  ): number {
    // Multi-octave noise for natural-looking terrain
    let height = 0

    // Large features (hills)
    height += this.noise2D(x / scale, z / scale) * amplitude

    // Medium features (detail)
    height += this.noise2D(x / (scale / 2), z / (scale / 2)) * (amplitude / 2)

    return height
  }

  /**
   * Get density value for tree placement
   * Uses different scale than terrain for variety
   */
  public getTreeDensity(x: number, z: number): number {
    return this.noise2D(x / 30, z / 30)
  }
}

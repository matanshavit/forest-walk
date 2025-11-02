export interface LODConfig {
  // Distance thresholds for LOD levels (in world units)
  highDetailDistance: number // 0 - this distance: LOD 0
  mediumDetailDistance: number // highDetail - this distance: LOD 1
  lowDetailDistance: number // mediumDetail - this distance: LOD 2
  cullDistance: number // beyond this: don't render
}

export const DEFAULT_LOD_CONFIG: LODConfig = {
  highDetailDistance: 25, // Reduced from 30
  mediumDetailDistance: 50, // Reduced from 60
  lowDetailDistance: 80, // Reduced from 100
  cullDistance: 120, // Reduced from 150 - more aggressive
}

export class LODManager {
  private config: LODConfig

  constructor(config: LODConfig = DEFAULT_LOD_CONFIG) {
    this.config = config
  }

  /**
   * Determine LOD level based on distance from camera
   * @returns -1 if should be culled, 0-2 for LOD level
   */
  public getLODLevel(distance: number): number {
    if (distance > this.config.cullDistance) return -1
    if (distance <= this.config.highDetailDistance) return 0
    if (distance <= this.config.mediumDetailDistance) return 1
    if (distance <= this.config.lowDetailDistance) return 2
    return -1
  }

  public setConfig(config: Partial<LODConfig>): void {
    this.config = { ...this.config, ...config }
  }

  public getConfig(): LODConfig {
    return { ...this.config }
  }
}

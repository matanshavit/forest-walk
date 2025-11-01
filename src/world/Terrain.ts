import * as THREE from 'three'
import { NoiseGenerator } from '../utils/NoiseGenerator'
import { TerrainChunk } from './TerrainChunk'
import { TerrainConfig } from './TerrainConfig'

export class Terrain {
  private chunks: Map<string, TerrainChunk> = new Map()
  private noiseGenerator: NoiseGenerator
  private material: THREE.MeshStandardMaterial
  private scene: THREE.Scene
  private lastUpdateTime: number = 0
  private lastPlayerChunk: { x: number; z: number } | null = null
  private onChunkLoadCallback?: (chunkX: number, chunkZ: number) => void
  private onChunkUnloadCallback?: (chunkX: number, chunkZ: number) => void

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.noiseGenerator = new NoiseGenerator()

    // Create shared material (more efficient than per-chunk materials)
    this.material = new THREE.MeshStandardMaterial({
      color: TerrainConfig.MATERIAL_COLOR,
      roughness: 0.8,
      metalness: 0.2,
      flatShading: true, // Fix for chunk seams - prevents normal interpolation at edges
    })
  }

  /**
   * Set callback for when chunks are loaded
   */
  public setOnChunkLoad(
    callback: (chunkX: number, chunkZ: number) => void,
  ): void {
    this.onChunkLoadCallback = callback
  }

  /**
   * Set callback for when chunks are unloaded
   */
  public setOnChunkUnload(
    callback: (chunkX: number, chunkZ: number) => void,
  ): void {
    this.onChunkUnloadCallback = callback
  }

  /**
   * Update visible chunks based on camera position
   * Only updates every UPDATE_INTERVAL ms to avoid performance issues
   */
  public update(cameraPosition: THREE.Vector3, currentTime: number): void {
    // Throttle updates
    if (currentTime - this.lastUpdateTime < TerrainConfig.UPDATE_INTERVAL) {
      return
    }
    this.lastUpdateTime = currentTime

    // Calculate which chunk the camera is in
    const playerChunkX = Math.floor(cameraPosition.x / TerrainConfig.CHUNK_SIZE)
    const playerChunkZ = Math.floor(cameraPosition.z / TerrainConfig.CHUNK_SIZE)

    // Skip if player hasn't moved to a new chunk
    if (
      this.lastPlayerChunk &&
      this.lastPlayerChunk.x === playerChunkX &&
      this.lastPlayerChunk.z === playerChunkZ
    ) {
      return
    }

    this.lastPlayerChunk = { x: playerChunkX, z: playerChunkZ }

    // Determine which chunks should be loaded
    const shouldBeLoaded = new Set<string>()
    const drawDist = TerrainConfig.DRAW_DISTANCE

    for (let x = playerChunkX - drawDist; x <= playerChunkX + drawDist; x++) {
      for (let z = playerChunkZ - drawDist; z <= playerChunkZ + drawDist; z++) {
        shouldBeLoaded.add(this.getChunkKey(x, z))
      }
    }

    // Load new chunks
    for (const key of shouldBeLoaded) {
      if (!this.chunks.has(key)) {
        const [x, z] = key.split(',').map(Number)
        this.loadChunk(x, z)
      }
    }

    // Unload distant chunks
    for (const [key, chunk] of this.chunks) {
      if (!shouldBeLoaded.has(key)) {
        this.unloadChunk(key, chunk)
      }
    }
  }

  /**
   * Get terrain height at world coordinates
   * Used by Forest for tree placement
   */
  public getHeightAt(worldX: number, worldZ: number): number {
    return this.noiseGenerator.getHeight(
      worldX,
      worldZ,
      TerrainConfig.TERRAIN_SCALE,
      TerrainConfig.TERRAIN_HEIGHT,
    )
  }

  private loadChunk(chunkX: number, chunkZ: number): void {
    const chunk = new TerrainChunk(
      chunkX,
      chunkZ,
      this.noiseGenerator,
      this.material,
    )

    this.scene.add(chunk.mesh)
    this.chunks.set(this.getChunkKey(chunkX, chunkZ), chunk)

    // Notify callback
    if (this.onChunkLoadCallback) {
      this.onChunkLoadCallback(chunkX, chunkZ)
    }
  }

  private unloadChunk(key: string, chunk: TerrainChunk): void {
    this.scene.remove(chunk.mesh)
    chunk.dispose() // Critical: prevent memory leaks
    this.chunks.delete(key)

    // Notify callback
    if (this.onChunkUnloadCallback) {
      const [x, z] = key.split(',').map(Number)
      this.onChunkUnloadCallback(x, z)
    }
  }

  private getChunkKey(x: number, z: number): string {
    return `${x},${z}`
  }

  public dispose(): void {
    // Unload all chunks
    for (const [key, chunk] of this.chunks) {
      this.unloadChunk(key, chunk)
    }

    // Dispose shared material
    this.material.dispose()
  }
}

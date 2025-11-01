import * as THREE from 'three'
import type { NoiseGenerator } from '../utils/NoiseGenerator'
import { TerrainConfig } from './TerrainConfig'

export class TerrainChunk {
  public mesh: THREE.Mesh
  public readonly chunkX: number
  public readonly chunkZ: number

  constructor(
    chunkX: number,
    chunkZ: number,
    noiseGenerator: NoiseGenerator,
    sharedMaterial: THREE.Material,
  ) {
    this.chunkX = chunkX
    this.chunkZ = chunkZ

    // Create plane geometry with subdivisions
    const geometry = new THREE.PlaneGeometry(
      TerrainConfig.CHUNK_SIZE,
      TerrainConfig.CHUNK_SIZE,
      TerrainConfig.CHUNK_SEGMENTS,
      TerrainConfig.CHUNK_SEGMENTS,
    )

    // Apply height using noise function with WORLD coordinates
    const positions = geometry.attributes.position
    for (let i = 0; i < positions.count; i++) {
      // Get local vertex position
      const localX = positions.getX(i)
      const localZ = positions.getY(i) // Y in plane geometry is Z in 3D space

      // Convert to world coordinates
      const worldX = localX + chunkX * TerrainConfig.CHUNK_SIZE
      const worldZ = localZ + chunkZ * TerrainConfig.CHUNK_SIZE

      // Get height from noise
      const height = noiseGenerator.getHeight(
        worldX,
        worldZ,
        TerrainConfig.TERRAIN_SCALE,
        TerrainConfig.TERRAIN_HEIGHT,
      )

      // Set Z coordinate (height in 3D space)
      positions.setZ(i, height)
    }

    positions.needsUpdate = true
    geometry.computeVertexNormals() // Recalculate normals for lighting

    // Create mesh
    this.mesh = new THREE.Mesh(geometry, sharedMaterial)

    // Rotate to horizontal orientation
    this.mesh.rotation.x = -Math.PI / 2

    // Position in world space
    this.mesh.position.set(
      chunkX * TerrainConfig.CHUNK_SIZE,
      0,
      chunkZ * TerrainConfig.CHUNK_SIZE,
    )

    this.mesh.receiveShadow = true
  }

  public dispose(): void {
    this.mesh.geometry.dispose()
    // Material is shared, don't dispose here
  }
}

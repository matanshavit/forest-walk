import * as THREE from 'three'
import { FrustumCuller } from '../utils/FrustumCuller'
import { DEFAULT_LOD_CONFIG, LODManager } from '../utils/LODManager'
import { NoiseGenerator } from '../utils/NoiseGenerator'
import { TreeGenerator } from '../utils/TreeGenerator'
import type { Terrain } from '../world/Terrain'
import { TerrainConfig } from '../world/TerrainConfig'

interface TreeInstance {
  position: THREE.Vector3
  rotation: number
  scale: number
  sizeIndex: number // 0=small, 1=medium, 2=large
}

export class Forest {
  // 3 sizes × 3 LOD levels = 9 branch meshes, 9 leaf meshes
  private branchMeshes: THREE.InstancedMesh[][] = [] // [sizeIndex][lodLevel]
  private leavesMeshes: THREE.InstancedMesh[][] = [] // [sizeIndex][lodLevel]
  private noiseGenerator: NoiseGenerator
  private terrain: Terrain
  private scene: THREE.Scene
  private lodManager: LODManager
  private cameraPosition: THREE.Vector3 = new THREE.Vector3()
  private frustumCuller: FrustumCuller

  // Store tree instances per chunk
  private chunkTrees: Map<string, TreeInstance[]> = new Map()

  // Pre-generated tree geometries and materials for all LOD levels
  private treeData: Array<
    Array<{
      branchGeometry: THREE.BufferGeometry
      branchMaterial: THREE.Material
      leavesGeometry: THREE.BufferGeometry
      leavesMaterial: THREE.Material
    }>
  > = [] // [sizeIndex][lodLevel]

  private readonly maxInstancesPerSize = 5000

  constructor(scene: THREE.Scene, terrain: Terrain) {
    this.scene = scene
    this.terrain = terrain
    this.noiseGenerator = new NoiseGenerator()
    this.lodManager = new LODManager(DEFAULT_LOD_CONFIG)
    this.frustumCuller = new FrustumCuller()

    // Create all tree variations with LOD levels
    const treesWithLOD = TreeGenerator.createAllVariationsWithLOD()

    // Pre-generate tree data for all sizes and LOD levels
    for (let sizeIndex = 0; sizeIndex < 3; sizeIndex++) {
      const lodLevels = []

      for (let lodLevel = 0; lodLevel < 3; lodLevel++) {
        const tree = treesWithLOD[sizeIndex][lodLevel]

        const branchGeometry = tree.branchesMesh.geometry
        const branchMaterialSource = tree.branchesMesh.material
        const branchMaterial = Array.isArray(branchMaterialSource)
          ? branchMaterialSource[0].clone()
          : branchMaterialSource.clone()

        const leavesGeometry = tree.leavesMesh.geometry
        const leavesMaterialSource = tree.leavesMesh.material
        const leavesMaterial = Array.isArray(leavesMaterialSource)
          ? leavesMaterialSource[0].clone()
          : leavesMaterialSource.clone()

        lodLevels.push({
          branchGeometry,
          branchMaterial,
          leavesGeometry,
          leavesMaterial,
        })
      }

      this.treeData.push(lodLevels)
    }

    // Create instanced meshes: 3 sizes × 3 LOD levels
    for (let sizeIndex = 0; sizeIndex < 3; sizeIndex++) {
      const branchMeshesForSize: THREE.InstancedMesh[] = []
      const leavesMeshesForSize: THREE.InstancedMesh[] = []

      for (let lodLevel = 0; lodLevel < 3; lodLevel++) {
        const data = this.treeData[sizeIndex][lodLevel]

        const branchMesh = new THREE.InstancedMesh(
          data.branchGeometry,
          data.branchMaterial,
          this.maxInstancesPerSize,
        )
        branchMesh.castShadow = true
        branchMesh.count = 0
        branchMesh.frustumCulled = false // We'll do manual culling
        branchMeshesForSize.push(branchMesh)
        this.scene.add(branchMesh)

        const leavesMesh = new THREE.InstancedMesh(
          data.leavesGeometry,
          data.leavesMaterial,
          this.maxInstancesPerSize,
        )
        leavesMesh.castShadow = true
        leavesMesh.count = 0
        leavesMesh.frustumCulled = false // We'll do manual culling
        leavesMeshesForSize.push(leavesMesh)
        this.scene.add(leavesMesh)
      }

      this.branchMeshes.push(branchMeshesForSize)
      this.leavesMeshes.push(leavesMeshesForSize)
    }
  }

  /**
   * Update LOD levels and frustum culling based on camera
   * Should be called every frame
   */
  public update(camera: THREE.Camera): void {
    this.cameraPosition.copy(camera.position)
    this.frustumCuller.updateFromCamera(camera)
    this.rebuildInstancedMeshes()
  }

  /**
   * Generate trees for a specific chunk
   */
  public generateChunkTrees(chunkX: number, chunkZ: number): void {
    const chunkKey = this.getChunkKey(chunkX, chunkZ)

    // Skip if already generated
    if (this.chunkTrees.has(chunkKey)) {
      return
    }

    const trees: TreeInstance[] = []

    // Calculate world space bounds for this chunk
    const chunkWorldX = chunkX * TerrainConfig.CHUNK_SIZE
    const chunkWorldZ = chunkZ * TerrainConfig.CHUNK_SIZE

    // Grid-based placement within chunk
    const spacing = 3 // Minimum spacing between trees

    for (
      let x = chunkWorldX;
      x < chunkWorldX + TerrainConfig.CHUNK_SIZE;
      x += spacing
    ) {
      for (
        let z = chunkWorldZ;
        z < chunkWorldZ + TerrainConfig.CHUNK_SIZE;
        z += spacing
      ) {
        // Use noise to determine if tree should be placed here
        const density = this.noiseGenerator.getTreeDensity(x, z)

        // Only place trees where density is above threshold
        if (density > 0.2) {
          // Get terrain height at this position
          const terrainHeight = this.terrain.getHeightAt(x, z)

          // Slight random offset within spacing for natural variation
          const offsetX = x + (Math.random() - 0.5) * spacing * 0.5
          const offsetZ = z + (Math.random() - 0.5) * spacing * 0.5

          // Randomly choose tree size with more variation
          const rand = Math.random()
          let sizeIndex: number
          let scale: number

          if (rand < 0.3) {
            // 30% medium trees
            sizeIndex = 0
            scale = 0.1 + Math.random() * 0.05 // 0.1-0.15
          } else if (rand < 0.7) {
            // 40% large trees
            sizeIndex = 1
            scale = 0.15 + Math.random() * 0.08 // 0.15-0.23
          } else {
            // 30% very large trees
            sizeIndex = 2
            scale = 0.23 + Math.random() * 0.07 // 0.23-0.3
          }

          trees.push({
            position: new THREE.Vector3(offsetX, terrainHeight, offsetZ),
            rotation: Math.random() * Math.PI * 2,
            scale,
            sizeIndex,
          })
        }
      }
    }

    // Store trees for this chunk
    this.chunkTrees.set(chunkKey, trees)

    // Update instanced meshes
    this.rebuildInstancedMeshes()
  }

  /**
   * Remove trees for a specific chunk
   */
  public unloadChunkTrees(chunkX: number, chunkZ: number): void {
    const chunkKey = this.getChunkKey(chunkX, chunkZ)

    // Remove trees from storage
    this.chunkTrees.delete(chunkKey)

    // Update instanced meshes
    this.rebuildInstancedMeshes()
  }

  /**
   * Rebuild all instanced meshes with LOD based on camera distance
   */
  private rebuildInstancedMeshes(): void {
    const dummy = new THREE.Object3D()

    // Reset counts for all LOD levels
    const counts = {
      small: [0, 0, 0], // [LOD0, LOD1, LOD2]
      medium: [0, 0, 0],
      large: [0, 0, 0],
    }

    // Collect all trees from all chunks
    const allTrees: TreeInstance[] = []
    for (const trees of this.chunkTrees.values()) {
      allTrees.push(...trees)
    }

    // Place each tree in the appropriate LOD level based on distance
    for (const tree of allTrees) {
      // Calculate distance from camera
      const distance = this.cameraPosition.distanceTo(tree.position)

      // Determine LOD level
      const lodLevel = this.lodManager.getLODLevel(distance)

      // Skip if should be culled
      if (lodLevel === -1) continue

      // Frustum culling: estimate tree bounding radius based on scale
      const boundingRadius = tree.scale * 15 // Approximate tree height/width
      if (!this.frustumCuller.isInFrustum(tree.position, boundingRadius)) {
        continue // Skip trees outside view frustum
      }

      const sizeIndex = tree.sizeIndex
      let currentCount: number

      if (sizeIndex === 0) {
        currentCount = counts.small[lodLevel]
        counts.small[lodLevel]++
      } else if (sizeIndex === 1) {
        currentCount = counts.medium[lodLevel]
        counts.medium[lodLevel]++
      } else {
        currentCount = counts.large[lodLevel]
        counts.large[lodLevel]++
      }

      // Check if we've exceeded max instances
      if (currentCount >= this.maxInstancesPerSize) {
        console.warn(
          `Exceeded max instances for size ${sizeIndex} LOD ${lodLevel}`,
        )
        continue
      }

      // Set transform
      dummy.position.copy(tree.position)
      dummy.rotation.y = tree.rotation
      dummy.scale.setScalar(tree.scale)
      dummy.updateMatrix()

      // Apply to both branches and leaves at this LOD level
      this.branchMeshes[sizeIndex][lodLevel].setMatrixAt(
        currentCount,
        dummy.matrix,
      )
      this.leavesMeshes[sizeIndex][lodLevel].setMatrixAt(
        currentCount,
        dummy.matrix,
      )
    }

    // Update instance counts and mark for update
    for (let sizeIndex = 0; sizeIndex < 3; sizeIndex++) {
      for (let lodLevel = 0; lodLevel < 3; lodLevel++) {
        const count =
          sizeIndex === 0
            ? counts.small[lodLevel]
            : sizeIndex === 1
              ? counts.medium[lodLevel]
              : counts.large[lodLevel]

        this.branchMeshes[sizeIndex][lodLevel].count = count
        this.leavesMeshes[sizeIndex][lodLevel].count = count
        this.branchMeshes[sizeIndex][lodLevel].instanceMatrix.needsUpdate = true
        this.leavesMeshes[sizeIndex][lodLevel].instanceMatrix.needsUpdate = true
      }
    }
  }

  private getChunkKey(x: number, z: number): string {
    return `${x},${z}`
  }

  public getLODManager(): LODManager {
    return this.lodManager
  }

  public dispose(): void {
    // Dispose all meshes at all LOD levels
    for (let sizeIndex = 0; sizeIndex < 3; sizeIndex++) {
      for (let lodLevel = 0; lodLevel < 3; lodLevel++) {
        const branchMesh = this.branchMeshes[sizeIndex][lodLevel]
        const leavesMesh = this.leavesMeshes[sizeIndex][lodLevel]

        this.scene.remove(branchMesh)
        branchMesh.geometry.dispose()
        if (branchMesh.material instanceof THREE.Material) {
          branchMesh.material.dispose()
        }

        this.scene.remove(leavesMesh)
        leavesMesh.geometry.dispose()
        if (leavesMesh.material instanceof THREE.Material) {
          leavesMesh.material.dispose()
        }
      }
    }

    this.chunkTrees.clear()
  }
}

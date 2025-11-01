import * as THREE from 'three'
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
  private branchMeshes: THREE.InstancedMesh[] = []
  private leavesMeshes: THREE.InstancedMesh[] = []
  private noiseGenerator: NoiseGenerator
  private terrain: Terrain
  private scene: THREE.Scene

  // Store tree instances per chunk
  private chunkTrees: Map<string, TreeInstance[]> = new Map()

  // Pre-generated tree geometries and materials
  private treeData: Array<{
    branchGeometry: THREE.BufferGeometry
    branchMaterial: THREE.Material
    leavesGeometry: THREE.BufferGeometry
    leavesMaterial: THREE.Material
  }> = []

  private readonly maxInstancesPerSize = 5000 // Max trees per size category

  constructor(scene: THREE.Scene, terrain: Terrain) {
    this.scene = scene
    this.terrain = terrain
    this.noiseGenerator = new NoiseGenerator() // Same seed as terrain

    // Create three tree variations (small, medium, large)
    const trees = TreeGenerator.createAllVariations()

    // Pre-generate tree data
    for (let i = 0; i < trees.length; i++) {
      const tree = trees[i]

      // Store branch geometry and material
      const branchGeometry = tree.branchesMesh.geometry
      const branchMaterialSource = tree.branchesMesh.material
      const branchMaterial = Array.isArray(branchMaterialSource)
        ? branchMaterialSource[0].clone()
        : branchMaterialSource.clone()

      // Store leaves geometry and material
      const leavesGeometry = tree.leavesMesh.geometry
      const leavesMaterialSource = tree.leavesMesh.material
      const leavesMaterial = Array.isArray(leavesMaterialSource)
        ? leavesMaterialSource[0].clone()
        : leavesMaterialSource.clone()

      this.treeData.push({
        branchGeometry,
        branchMaterial,
        leavesGeometry,
        leavesMaterial,
      })
    }

    // Create instanced meshes with max capacity
    for (let i = 0; i < 3; i++) {
      const data = this.treeData[i]

      const branchMesh = new THREE.InstancedMesh(
        data.branchGeometry,
        data.branchMaterial,
        this.maxInstancesPerSize,
      )
      branchMesh.castShadow = true
      branchMesh.count = 0 // Start with no instances visible
      this.branchMeshes.push(branchMesh)
      this.scene.add(branchMesh)

      const leavesMesh = new THREE.InstancedMesh(
        data.leavesGeometry,
        data.leavesMaterial,
        this.maxInstancesPerSize,
      )
      leavesMesh.castShadow = true
      leavesMesh.count = 0 // Start with no instances visible
      this.leavesMeshes.push(leavesMesh)
      this.scene.add(leavesMesh)
    }
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
   * Rebuild all instanced meshes from current chunk tree data
   */
  private rebuildInstancedMeshes(): void {
    const dummy = new THREE.Object3D()

    // Reset counts
    const counts = { small: 0, medium: 0, large: 0 }

    // Collect all trees from all chunks
    const allTrees: TreeInstance[] = []
    for (const trees of this.chunkTrees.values()) {
      allTrees.push(...trees)
    }

    // Place each tree in the appropriate instanced mesh
    for (const tree of allTrees) {
      const sizeIndex = tree.sizeIndex
      let currentCount: number

      if (sizeIndex === 0) {
        currentCount = counts.small
        counts.small++
      } else if (sizeIndex === 1) {
        currentCount = counts.medium
        counts.medium++
      } else {
        currentCount = counts.large
        counts.large++
      }

      // Check if we've exceeded max instances
      if (currentCount >= this.maxInstancesPerSize) {
        console.warn(
          `Exceeded max instances for size ${sizeIndex}. Increase maxInstancesPerSize.`,
        )
        continue
      }

      // Set transform
      dummy.position.copy(tree.position)
      dummy.rotation.y = tree.rotation
      dummy.scale.setScalar(tree.scale)
      dummy.updateMatrix()

      // Apply to both branches and leaves
      this.branchMeshes[sizeIndex].setMatrixAt(currentCount, dummy.matrix)
      this.leavesMeshes[sizeIndex].setMatrixAt(currentCount, dummy.matrix)
    }

    // Update instance counts and mark for update
    this.branchMeshes[0].count = counts.small
    this.branchMeshes[1].count = counts.medium
    this.branchMeshes[2].count = counts.large
    this.leavesMeshes[0].count = counts.small
    this.leavesMeshes[1].count = counts.medium
    this.leavesMeshes[2].count = counts.large

    // Mark matrices as needing update
    for (const mesh of this.branchMeshes) {
      mesh.instanceMatrix.needsUpdate = true
    }
    for (const mesh of this.leavesMeshes) {
      mesh.instanceMatrix.needsUpdate = true
    }
  }

  private getChunkKey(x: number, z: number): string {
    return `${x},${z}`
  }

  public dispose(): void {
    // Dispose all meshes
    for (const mesh of this.branchMeshes) {
      this.scene.remove(mesh)
      mesh.geometry.dispose()
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose()
      }
    }
    for (const mesh of this.leavesMeshes) {
      this.scene.remove(mesh)
      mesh.geometry.dispose()
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose()
      }
    }

    // Clear chunk data
    this.chunkTrees.clear()
  }
}

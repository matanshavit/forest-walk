import * as THREE from 'three'

export class Forest {
  public instancedMesh: THREE.InstancedMesh
  private treeCount: number = 100

  constructor() {
    // Realistic tree dimensions (0.5m trunk diameter × 12m height)
    // With scale variation, trees will be 9.6m - 14.4m tall
    const geometry = new THREE.BoxGeometry(0.5, 12, 0.5)
    const material = new THREE.MeshStandardMaterial({
      color: 0x228b22, // Forest green
      roughness: 0.7,
      metalness: 0.1,
    })

    this.instancedMesh = new THREE.InstancedMesh(
      geometry,
      material,
      this.treeCount,
    )
    this.instancedMesh.castShadow = true

    // Generate random tree positions
    this.generateTreePositions()
  }

  private generateTreePositions(): void {
    const dummy = new THREE.Object3D()
    const groundSize = 50
    const minSpacing = 2 // Minimum spacing between trees

    for (let i = 0; i < this.treeCount; i++) {
      // Slight scale variation (0.8 to 1.2)
      const scale = 0.8 + Math.random() * 0.4

      // Random position within ground bounds (-25 to 25 on x and z)
      // Y position adjusted for scale so bottom always touches ground
      dummy.position.set(
        Math.random() * (groundSize - minSpacing * 2) -
          groundSize / 2 +
          minSpacing,
        6 * scale, // Half of scaled height so bottom sits on ground
        Math.random() * (groundSize - minSpacing * 2) -
          groundSize / 2 +
          minSpacing,
      )

      // Random rotation around Y axis for variation
      dummy.rotation.y = Math.random() * Math.PI * 2

      // Apply scale (height varies, width stays consistent)
      dummy.scale.set(1, scale, 1)

      dummy.updateMatrix()
      this.instancedMesh.setMatrixAt(i, dummy.matrix)
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true
  }

  public addToScene(scene: THREE.Scene): void {
    scene.add(this.instancedMesh)
  }

  public dispose(): void {
    this.instancedMesh.geometry.dispose()
    if (this.instancedMesh.material instanceof THREE.Material) {
      this.instancedMesh.material.dispose()
    }
  }
}

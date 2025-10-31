import * as THREE from 'three'

export class Tree {
  public mesh: THREE.Mesh

  constructor(position: THREE.Vector3 = new THREE.Vector3(0, 0, 0)) {
    // Create box geometry for tree
    const geometry = new THREE.BoxGeometry(0.5, 2, 0.5)

    // Create green material
    const material = new THREE.MeshStandardMaterial({
      color: 0x228b22, // Forest green
      roughness: 0.7,
      metalness: 0.1,
    })

    this.mesh = new THREE.Mesh(geometry, material)

    // Position: center of box at origin + half height to sit on ground
    this.mesh.position.copy(position)
    this.mesh.position.y += 1

    // Enable shadow casting (for future shadow implementation)
    this.mesh.castShadow = true
  }

  public addToScene(scene: THREE.Scene): void {
    scene.add(this.mesh)
  }

  public dispose(): void {
    this.mesh.geometry.dispose()
    if (this.mesh.material instanceof THREE.Material) {
      this.mesh.material.dispose()
    }
  }
}

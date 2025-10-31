import * as THREE from 'three'

export class Ground {
  public mesh: THREE.Mesh

  constructor() {
    // Create plane geometry (50x50)
    const geometry = new THREE.PlaneGeometry(50, 50)

    // Create brown material for earth
    const material = new THREE.MeshStandardMaterial({
      color: 0x8b4513, // Brown (saddle brown)
      roughness: 0.8,
      metalness: 0.2,
    })

    this.mesh = new THREE.Mesh(geometry, material)

    // Rotate to be horizontal (planes are vertical by default)
    this.mesh.rotation.x = -Math.PI / 2

    // Position at y=0 (ground level)
    this.mesh.position.y = 0

    // Enable shadow receiving (for future shadow implementation)
    this.mesh.receiveShadow = true
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

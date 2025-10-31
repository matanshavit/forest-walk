import * as THREE from 'three'

export class CameraManager {
  public camera: THREE.PerspectiveCamera

  constructor() {
    // Create perspective camera
    this.camera = new THREE.PerspectiveCamera(
      75, // FOV
      window.innerWidth / window.innerHeight, // aspect ratio
      0.1, // near plane
      1000, // far plane
    )

    // Position at eye level (1.6m high), 10 units back from origin
    this.camera.position.set(0, 1.6, 10)

    // Look at the ground (origin)
    this.camera.lookAt(0, 0, 0)
  }

  public resize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
  }
}

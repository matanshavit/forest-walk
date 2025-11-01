import * as THREE from 'three'

export class CameraManager {
  public camera: THREE.PerspectiveCamera
  private baseHeight: number = 1.6 // Eye level height
  private bobAmplitude: number = 0.05 // How much the camera bobs up and down
  private bobFrequency: number = 8.0 // How fast the bob cycles (higher = faster)
  private bobPhase: number = 0 // Current phase of the bob animation

  constructor() {
    // Create perspective camera
    this.camera = new THREE.PerspectiveCamera(
      75, // FOV
      window.innerWidth / window.innerHeight, // aspect ratio
      0.1, // near plane
      500, // far plane - reduced from 1000, fog hides distance anyway
    )

    // Position at eye level (1.6m high), 10 units back from origin
    this.camera.position.set(0, this.baseHeight, 10)

    // Look at the ground (origin)
    this.camera.lookAt(0, 0, 0)
  }

  public updateHeadBob(delta: number, isMoving: boolean): void {
    if (isMoving) {
      // Increment phase based on time and frequency
      this.bobPhase += delta * this.bobFrequency

      // Calculate vertical offset using sine wave for smooth oscillation
      const bobOffset = Math.sin(this.bobPhase) * this.bobAmplitude

      // Apply bob to camera height
      this.camera.position.y = this.baseHeight + bobOffset
    } else {
      // When not moving, smoothly return to base height
      this.bobPhase = 0
      this.camera.position.y = THREE.MathUtils.lerp(
        this.camera.position.y,
        this.baseHeight,
        delta * 5.0,
      )
    }
  }

  public resize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
  }
}

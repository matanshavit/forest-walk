import * as THREE from 'three'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'

export class ControlsManager {
  public controls: PointerLockControls
  private velocity: THREE.Vector3
  private direction: THREE.Vector3
  private keys: { w: boolean; a: boolean; s: boolean; d: boolean }
  private moveSpeed: number = 1.4 // Units per second (realistic human walking speed)
  private dampingFactor: number = 10.0

  constructor(camera: THREE.Camera, scene: THREE.Scene) {
    // Create PointerLockControls
    this.controls = new PointerLockControls(camera, document.body)

    // PointerLockControls requires adding its object to the scene
    scene.add(this.controls.object)

    // Initialize movement vectors
    this.velocity = new THREE.Vector3()
    this.direction = new THREE.Vector3()
    this.keys = { w: false, a: false, s: false, d: false }

    // Setup event listeners
    this.setupPointerLock()
    this.setupKeyboardInput()
  }

  private setupPointerLock(): void {
    // Click to activate pointer lock
    document.addEventListener('click', () => {
      this.controls.lock()
    })

    // Optional: Show/hide instructions based on lock state
    this.controls.addEventListener('lock', () => {
      console.log('Pointer locked - use WASD to move, mouse to look')
    })

    this.controls.addEventListener('unlock', () => {
      console.log('Pointer unlocked - click to re-enable controls')
    })
  }

  private setupKeyboardInput(): void {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case 'w':
          this.keys.w = true
          break
        case 'a':
          this.keys.a = true
          break
        case 's':
          this.keys.s = true
          break
        case 'd':
          this.keys.d = true
          break
        case 'escape':
          this.controls.unlock()
          break
      }
    })

    document.addEventListener('keyup', (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case 'w':
          this.keys.w = false
          break
        case 'a':
          this.keys.a = false
          break
        case 's':
          this.keys.s = false
          break
        case 'd':
          this.keys.d = false
          break
      }
    })
  }

  public update(delta: number): void {
    // Apply damping (smooth deceleration)
    this.velocity.x -= this.velocity.x * this.dampingFactor * delta
    this.velocity.z -= this.velocity.z * this.dampingFactor * delta

    // Calculate movement direction based on pressed keys
    this.direction.set(0, 0, 0)
    if (this.keys.w) this.direction.z -= 1
    if (this.keys.s) this.direction.z += 1
    if (this.keys.a) this.direction.x -= 1
    if (this.keys.d) this.direction.x += 1

    // Normalize direction to prevent faster diagonal movement
    if (this.direction.length() > 0) {
      this.direction.normalize()
      // Add velocity based on direction and speed (acceleration * dampingFactor to reach desired speed)
      this.velocity.x +=
        this.direction.x * this.moveSpeed * this.dampingFactor * delta
      this.velocity.z +=
        this.direction.z * this.moveSpeed * this.dampingFactor * delta
    }

    // Apply movement to camera (only if pointer is locked)
    // Multiply by delta to convert velocity (units/sec) to distance (units)
    if (this.controls.isLocked) {
      this.controls.moveRight(this.velocity.x * delta)
      this.controls.moveForward(-this.velocity.z * delta)
    }
  }

  public isMoving(): boolean {
    // Check if player is moving based on velocity threshold
    const velocityMagnitude = Math.sqrt(
      this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z,
    )
    return velocityMagnitude > 0.1 // Small threshold to avoid head bob when nearly stopped
  }

  public dispose(): void {
    this.controls.dispose()
    // Note: Event listeners are on document, will be cleaned up on page unload
    // For SPA, would need to track and remove handlers explicitly
  }
}

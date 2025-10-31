import type * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

export class ControlsManager {
  public controls: OrbitControls

  constructor(camera: THREE.Camera, canvas: HTMLCanvasElement) {
    this.controls = new OrbitControls(camera, canvas)

    // Configure controls
    this.controls.enableDamping = true // Smooth camera movements
    this.controls.dampingFactor = 0.05
    this.controls.screenSpacePanning = false

    // Limit vertical rotation (don't go below ground)
    this.controls.minPolarAngle = 0
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1 // Slightly above horizon

    // Set zoom limits
    this.controls.minDistance = 2
    this.controls.maxDistance = 50

    // Set target to look at origin (where tree is)
    this.controls.target.set(0, 0, 0)

    this.controls.update()
  }

  public update(): void {
    this.controls.update()
  }

  public dispose(): void {
    this.controls.dispose()
  }
}

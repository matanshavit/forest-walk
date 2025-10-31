import * as THREE from 'three'

export class LightingManager {
  private hemisphereLight: THREE.HemisphereLight
  private directionalLight: THREE.DirectionalLight
  private ambientLight: THREE.AmbientLight

  constructor() {
    // Hemisphere light (sky color, ground color, intensity)
    // Sky = light blue, Ground = brown-ish, moderate intensity
    this.hemisphereLight = new THREE.HemisphereLight(
      0x87ceeb, // Sky color (sky blue)
      0x5c4033, // Ground color (dark brown)
      0.6, // Intensity
    )
    this.hemisphereLight.position.set(0, 50, 0)

    // Directional light (sun-like)
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
    this.directionalLight.position.set(5, 10, 7.5) // From upper-right
    this.directionalLight.castShadow = true // Enable for future shadows

    // Configure shadow properties
    this.directionalLight.shadow.camera.left = -20
    this.directionalLight.shadow.camera.right = 20
    this.directionalLight.shadow.camera.top = 20
    this.directionalLight.shadow.camera.bottom = -20
    this.directionalLight.shadow.camera.near = 0.1
    this.directionalLight.shadow.camera.far = 50
    this.directionalLight.shadow.mapSize.width = 2048
    this.directionalLight.shadow.mapSize.height = 2048

    // Ambient light (overall fill)
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
  }

  public addToScene(scene: THREE.Scene): void {
    scene.add(this.hemisphereLight)
    scene.add(this.directionalLight)
    scene.add(this.ambientLight)
  }

  public dispose(): void {
    this.directionalLight.dispose()
  }
}

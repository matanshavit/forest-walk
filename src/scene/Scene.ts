import * as THREE from 'three'

export class SceneManager {
  public scene: THREE.Scene
  public renderer: THREE.WebGLRenderer
  public canvas: HTMLCanvasElement

  constructor() {
    // Create scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87ceeb) // Sky blue background

    // Create renderer
    this.canvas = document.createElement('canvas')
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Append canvas to body
    document.body.appendChild(this.canvas)
  }

  public resize(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  public render(camera: THREE.Camera): void {
    this.renderer.render(this.scene, camera)
  }

  public dispose(): void {
    this.renderer.dispose()
    this.canvas.remove()
  }
}

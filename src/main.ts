import './style.css'
import { ControlsManager } from './controls/Controls'
import { LightingManager } from './lighting/Lights'
import { Ground } from './objects/Ground'
import { Tree } from './objects/Tree'
import { CameraManager } from './scene/Camera'
import { SceneManager } from './scene/Scene'
import { PerformanceMonitor } from './utils/Performance'

class App {
  private sceneManager: SceneManager
  private cameraManager: CameraManager
  private ground: Ground
  private tree: Tree
  private lightingManager: LightingManager
  private controlsManager: ControlsManager
  private performanceMonitor: PerformanceMonitor
  private animationFrameId: number | null = null

  constructor() {
    this.sceneManager = new SceneManager()
    this.cameraManager = new CameraManager()

    // Create and add ground
    this.ground = new Ground()
    this.ground.addToScene(this.sceneManager.scene)

    // Create and add tree at origin
    this.tree = new Tree()
    this.tree.addToScene(this.sceneManager.scene)

    // Create and add lighting
    this.lightingManager = new LightingManager()
    this.lightingManager.addToScene(this.sceneManager.scene)

    // Create controls
    this.controlsManager = new ControlsManager(
      this.cameraManager.camera,
      this.sceneManager.canvas,
    )

    // Create performance monitor
    this.performanceMonitor = new PerformanceMonitor(this.sceneManager.renderer)

    // Start animation loop
    this.animate()

    // Handle window resize
    window.addEventListener('resize', this.handleResize)
  }

  private handleResize = (): void => {
    this.cameraManager.resize()
    this.sceneManager.resize()
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate)

    // Begin performance monitoring
    this.performanceMonitor.begin()

    // Update controls (needed for damping)
    this.controlsManager.update()

    // Render scene
    this.sceneManager.render(this.cameraManager.camera)

    // End performance monitoring
    this.performanceMonitor.end()
  }

  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
    }
    window.removeEventListener('resize', this.handleResize)
    this.ground.dispose()
    this.tree.dispose()
    this.lightingManager.dispose()
    this.controlsManager.dispose()
    this.performanceMonitor.dispose()
    this.sceneManager.dispose()
  }
}

// Initialize app
const app = new App()

// Cleanup on page unload (optional but good practice)
window.addEventListener('beforeunload', () => {
  app.dispose()
})

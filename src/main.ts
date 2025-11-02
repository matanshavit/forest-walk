import './style.css'
import { ControlsManager } from './controls/Controls'
import { LightingManager } from './lighting/Lights'
import { Forest } from './objects/Forest'
import { CameraManager } from './scene/Camera'
import { SceneManager } from './scene/Scene'
import { LODConfigUI } from './utils/LODConfig'
import { PerformanceMonitor } from './utils/Performance'
import { Terrain } from './world/Terrain'

class App {
  private sceneManager: SceneManager
  private cameraManager: CameraManager
  private terrain: Terrain
  private forest: Forest
  private lightingManager: LightingManager
  private controlsManager: ControlsManager
  private performanceMonitor: PerformanceMonitor
  private lodConfigUI?: LODConfigUI
  private animationFrameId: number | null = null

  constructor() {
    this.sceneManager = new SceneManager()
    this.cameraManager = new CameraManager()

    // Create terrain (procedurally generated infinite world)
    this.terrain = new Terrain(this.sceneManager.scene)

    // Create forest (procedurally generated trees per chunk)
    this.forest = new Forest(this.sceneManager.scene, this.terrain)

    // Wire up terrain chunk callbacks to generate/remove trees
    this.terrain.setOnChunkLoad((chunkX, chunkZ) => {
      this.forest.generateChunkTrees(chunkX, chunkZ)
    })
    this.terrain.setOnChunkUnload((chunkX, chunkZ) => {
      this.forest.unloadChunkTrees(chunkX, chunkZ)
    })

    // Create and add lighting
    this.lightingManager = new LightingManager()
    this.lightingManager.addToScene(this.sceneManager.scene)

    // Create controls
    this.controlsManager = new ControlsManager(
      this.cameraManager.camera,
      this.sceneManager.scene,
    )

    // Create performance monitor
    this.performanceMonitor = new PerformanceMonitor(this.sceneManager.renderer)

    // Create LOD config UI (optional - for tuning)
    this.lodConfigUI = new LODConfigUI(this.forest.getLODManager())

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

    // Get delta time for frame-rate-independent movement
    const delta = this.sceneManager.getDelta()

    // Update controls with delta time (needed for velocity-based movement)
    this.controlsManager.update(delta)

    // Update head bob based on movement state
    this.cameraManager.updateHeadBob(delta, this.controlsManager.isMoving())

    // Update terrain chunks based on camera position
    this.terrain.update(this.cameraManager.camera.position, performance.now())

    // Update forest LOD and frustum culling based on camera
    this.forest.update(this.cameraManager.camera)

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
    this.terrain.dispose()
    this.forest.dispose()
    this.lightingManager.dispose()
    this.controlsManager.dispose()
    this.performanceMonitor.dispose()
    this.lodConfigUI?.dispose()
    this.sceneManager.dispose()
  }
}

// Initialize app
const app = new App()

// Cleanup on page unload (optional but good practice)
window.addEventListener('beforeunload', () => {
  app.dispose()
})

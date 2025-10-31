import Stats from 'stats.js'
import type * as THREE from 'three'
import { ThreePerf } from 'three-perf'

export class PerformanceMonitor {
  private perf: ThreePerf
  private stats: Stats
  private isVisible: boolean = false

  constructor(renderer: THREE.WebGLRenderer) {
    // Create Stats.js instance
    this.stats = new Stats()
    this.stats.showPanel(0) // 0: fps, 1: ms, 2: mb
    this.stats.dom.style.position = 'absolute'
    this.stats.dom.style.left = '0px'
    this.stats.dom.style.top = '0px'
    this.stats.dom.style.display = 'none' // Hide by default
    document.body.appendChild(this.stats.dom)

    // Create ThreePerf instance
    this.perf = new ThreePerf({
      renderer: renderer,
      domElement: document.body,
      anchorX: 'right',
      anchorY: 'top',
      visible: false, // Hide by default
      enabled: true, // Keep performance tracking enabled
    })

    // Explicitly set visibility to ensure it starts hidden
    setTimeout(() => {
      this.perf.visible = false
    }, 0)

    // Add keyboard listener for 'p' key
    window.addEventListener('keydown', this.handleKeyPress)
  }

  private handleKeyPress = (event: KeyboardEvent): void => {
    if (event.key === 'p' || event.key === 'P') {
      this.toggle()
    }
  }

  public toggle(): void {
    this.isVisible = !this.isVisible
    this.stats.dom.style.display = this.isVisible ? 'block' : 'none'
    this.perf.visible = this.isVisible
  }

  public begin(): void {
    this.stats.begin()
    this.perf.begin()
  }

  public end(): void {
    this.stats.end()
    this.perf.end()
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.handleKeyPress)
    this.stats.dom.remove()
    this.perf.dispose()
  }
}

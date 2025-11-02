import type { LODManager } from './LODManager'

export class LODConfigUI {
  private container: HTMLDivElement
  private lodManager: LODManager

  constructor(lodManager: LODManager) {
    this.lodManager = lodManager
    this.container = document.createElement('div')
    this.container.style.cssText = `
      position: fixed;
      top: 60px;
      right: 10px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
      border-radius: 4px;
      display: none;
    `

    this.createUI()
    document.body.appendChild(this.container)

    // Toggle with 'L' key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'l' || e.key === 'L') {
        this.toggle()
      }
    })
  }

  private createUI(): void {
    const config = this.lodManager.getConfig()

    this.container.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold;">LOD Settings (L to toggle)</div>
      <div>
        <label>High Detail: <input type="range" id="highDetail" min="10" max="50" value="${config.highDetailDistance}" /></label>
        <span id="highDetailValue">${config.highDetailDistance}</span>
      </div>
      <div>
        <label>Medium Detail: <input type="range" id="mediumDetail" min="30" max="100" value="${config.mediumDetailDistance}" /></label>
        <span id="mediumDetailValue">${config.mediumDetailDistance}</span>
      </div>
      <div>
        <label>Low Detail: <input type="range" id="lowDetail" min="50" max="150" value="${config.lowDetailDistance}" /></label>
        <span id="lowDetailValue">${config.lowDetailDistance}</span>
      </div>
      <div>
        <label>Cull Distance: <input type="range" id="cullDistance" min="80" max="200" value="${config.cullDistance}" /></label>
        <span id="cullDistanceValue">${config.cullDistance}</span>
      </div>
    `

    // Add event listeners
    const addSliderListener = (
      id: string,
      valueId: string,
      configKey: keyof typeof config,
    ) => {
      const slider = this.container.querySelector(`#${id}`) as HTMLInputElement
      const valueSpan = this.container.querySelector(
        `#${valueId}`,
      ) as HTMLSpanElement

      slider?.addEventListener('input', () => {
        const value = parseFloat(slider.value)
        valueSpan.textContent = value.toString()
        this.lodManager.setConfig({ [configKey]: value })
      })
    }

    addSliderListener('highDetail', 'highDetailValue', 'highDetailDistance')
    addSliderListener(
      'mediumDetail',
      'mediumDetailValue',
      'mediumDetailDistance',
    )
    addSliderListener('lowDetail', 'lowDetailValue', 'lowDetailDistance')
    addSliderListener('cullDistance', 'cullDistanceValue', 'cullDistance')
  }

  public toggle(): void {
    this.container.style.display =
      this.container.style.display === 'none' ? 'block' : 'none'
  }

  public dispose(): void {
    this.container.remove()
  }
}

import './style.css'
import treeLogo from '/tree.svg'

const app = document.querySelector<HTMLDivElement>('#app')
if (app) {
  app.innerHTML = `
    <div>
      <img src="${treeLogo}" class="logo" alt="Tree logo" />
      <h1>Forest Walk</h1>
    </div>
  `
}

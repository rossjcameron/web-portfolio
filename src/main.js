import './styles.css'
import { initAnimations } from './animations.js'

// Shared between GSAP (which animates it on scroll) and the 3D scene (which reads it every frame).
// x/y: fractions of half the viewport; scale: orb diameter as a fraction of the shorter side.
const orbState = { x: 0.45, y: 0, scale: 0, distortion: 0.45, opacity: 1, boost: 0 }

initAnimations(orbState)

// Three.js is the heaviest dependency, so load it after the page content is interactive
const fallBack = () => document.documentElement.classList.add('no-webgl')
import('./scene.js')
  .then(({ createScene }) => createScene(document.querySelector('#webgl'), orbState) || fallBack())
  .catch(fallBack)

import * as THREE from 'three'
import gsap from 'gsap'

/* --------------------------------------------------------------------------
   Shaders: a sphere displaced by 3D simplex noise, with normals recomputed
   per vertex so lighting follows the deformed surface.
   -------------------------------------------------------------------------- */

// 3D simplex noise: Ashima Arts / Stefan Gustavson (MIT licence)
const simplexNoise = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uDistortion;
uniform float uFrequency;
uniform float uSpeed;

varying vec3 vNormal;
varying vec3 vViewDir;
varying float vDisp;

${simplexNoise}

float displacement(vec3 p) {
  float t = uTime * uSpeed;
  float n = snoise(p * uFrequency + vec3(t, t * 0.6, -t * 0.4));
  n += 0.3 * snoise(p * uFrequency * 2.0 + vec3(-t * 0.8, t, t * 0.5));
  return n * uDistortion;
}

vec3 orthogonal(vec3 v) {
  return normalize(abs(v.x) > abs(v.z) ? vec3(-v.y, v.x, 0.0) : vec3(0.0, -v.z, v.y));
}

void main() {
  vec3 dir = normalize(position);
  float d = displacement(dir);
  vec3 displaced = dir * (1.0 + d);

  // Recompute the normal from two nearby displaced points
  float eps = 0.01;
  vec3 tangent = orthogonal(dir);
  vec3 bitangent = normalize(cross(dir, tangent));
  vec3 n1 = normalize(dir + tangent * eps);
  vec3 n2 = normalize(dir + bitangent * eps);
  vec3 p1 = n1 * (1.0 + displacement(n1));
  vec3 p2 = n2 * (1.0 + displacement(n2));
  vec3 newNormal = normalize(cross(p1 - displaced, p2 - displaced));
  if (dot(newNormal, dir) < 0.0) newNormal = -newNormal;

  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  vNormal = normalize(normalMatrix * newNormal);
  vViewDir = normalize(-mvPosition.xyz);
  vDisp = d;
  gl_Position = projectionMatrix * mvPosition;
}
`

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform float uOpacity;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;

varying vec3 vNormal;
varying vec3 vViewDir;
varying float vDisp;

void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(vViewDir);
  float fresnel = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 3.0);

  vec3 L = normalize(vec3(-0.5, 0.8, 0.6));
  float diffuse = clamp(dot(n, L), 0.0, 1.0);
  float spec = pow(clamp(dot(n, normalize(L + v)), 0.0, 1.0), 64.0);

  // Iridescent banding driven by the displacement
  float band = 0.5 + 0.5 * sin(vDisp * 7.0 + n.y * 2.0 + uTime * 0.3);
  vec3 base = mix(uColorA, uColorB, band * 0.85 + diffuse * 0.15);

  vec3 color = base * (0.25 + 0.85 * diffuse);
  color += uColorC * fresnel * 1.4;
  color += vec3(spec * 0.45);

  gl_FragColor = vec4(color, uOpacity);
  #include <colorspace_fragment>
}
`

/* --------------------------------------------------------------------------
   Scene
   -------------------------------------------------------------------------- */

/**
 * Creates the fixed WebGL background. Returns null if WebGL is unavailable so
 * the page can fall back to the CSS orb.
 *
 * `state` is animated by GSAP from scroll (see animations.js); the render loop
 * reads it every frame to position, scale and distort the orb.
 */
export function createScene(canvas, state) {
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: window.devicePixelRatio < 2,
      powerPreference: 'high-performance',
    })
  } catch {
    return null
  }

  const isSmall = window.matchMedia('(max-width: 768px)').matches
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmall ? 1.5 : 2))
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
  camera.position.set(0, 0, 6)

  // Orb
  const uniforms = {
    uTime: { value: 0 },
    uDistortion: { value: 0.3 },
    uFrequency: { value: 1.1 },
    uSpeed: { value: 0.22 },
    uOpacity: { value: 1 },
    uColorA: { value: new THREE.Color('#1a1150') },
    uColorB: { value: new THREE.Color('#7b4dff') },
    uColorC: { value: new THREE.Color('#c6f55a') },
  }

  const orbGeometry = new THREE.IcosahedronGeometry(1, isSmall ? 24 : 48)
  const orbMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
  })
  const orb = new THREE.Mesh(orbGeometry, orbMaterial)
  orb.renderOrder = 1

  // Depth-only pre-pass with the same displacement, so when the orb is
  // translucent you only see its nearest surface, not the folds behind it
  const orbDepth = new THREE.Mesh(
    orbGeometry,
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader: 'void main() { gl_FragColor = vec4(1.0); }',
      colorWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    }),
  )

  const orbSpin = new THREE.Group()
  orbSpin.add(orbDepth, orb)
  const rig = new THREE.Group()
  rig.add(orbSpin)
  scene.add(rig)

  // Drifting particles for depth
  const count = isSmall ? 280 : 650
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const r = 3 + Math.random() * 7
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi) - 4
  }
  const particlesGeometry = new THREE.BufferGeometry()
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const particlesMaterial = new THREE.PointsMaterial({
    color: '#c9c2ff',
    size: 0.028,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  })
  const particles = new THREE.Points(particlesGeometry, particlesMaterial)
  scene.add(particles)

  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 }

  function onPointerMove(event) {
    if (!finePointer.matches) return
    pointer.targetX = (event.clientX / window.innerWidth) * 2 - 1
    pointer.targetY = -((event.clientY / window.innerHeight) * 2 - 1)
  }
  window.addEventListener('pointermove', onPointerMove, { passive: true })

  function visibleSize() {
    const height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z
    return { width: height * camera.aspect, height }
  }

  function resize() {
    const width = canvas.clientWidth || window.innerWidth
    const height = canvas.clientHeight || window.innerHeight
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }
  resize()
  window.addEventListener('resize', resize)

  let elapsed = 1.5 // start part-way through the noise so the first frame is interesting

  function render(_time, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 0.05)
    const moving = !reducedMotion.matches

    if (moving) elapsed += dt * (1 + state.boost * 1.5)
    state.boost += (0 - state.boost) * Math.min(dt * 3, 1)

    pointer.x += (pointer.targetX - pointer.x) * 0.05
    pointer.y += (pointer.targetY - pointer.y) * 0.05

    const view = visibleSize()
    const shortSide = Math.min(view.width, view.height)
    rig.position.set(
      (state.x * view.width) / 2 + pointer.x * 0.12,
      (state.y * view.height) / 2 + pointer.y * 0.08,
      0,
    )
    rig.scale.setScalar(Math.max((state.scale * shortSide) / 2, 0.0001))

    orbSpin.rotation.y = elapsed * 0.08 + pointer.x * 0.35
    orbSpin.rotation.x = -pointer.y * 0.25
    particles.rotation.y = elapsed * 0.012
    particles.rotation.x = pointer.y * 0.04

    uniforms.uTime.value = elapsed
    uniforms.uDistortion.value = state.distortion + state.boost * 0.15
    uniforms.uOpacity.value = state.opacity

    renderer.render(scene, camera)
  }

  // Share GSAP's ticker so scroll tweens and rendering happen in the same frame
  gsap.ticker.add(render)

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) gsap.ticker.remove(render)
    else gsap.ticker.add(render)
  })

  return renderer
}

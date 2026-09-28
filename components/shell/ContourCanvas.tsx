'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { readContourColors, type RGB } from '@/lib/color'
import { THEME_EVENT } from '@/lib/theme'

// kape HeroCanvasV2: two-layer simplex contour field (technique credit: landonorris.com by OFF+BRAND;
// simplex noise by Ashima Arts / Ian McEwan, MIT). noiseGLSL and vert are kape's, verbatim.
const noiseGLSL = `
  vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
  vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
  vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
    vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;
    vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
    float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
    vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;
    vec4 sh=-step(h,vec4(0.));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
    return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }
`

const vert = `
  varying vec2 vUv;
  void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }
`

const frag = `
  uniform float uTime;
  uniform vec2  uMouse;
  uniform float uMousePace;
  uniform float uAspect;
  uniform vec3  uBg;    // Kraft --bg
  uniform vec3  uLine;  // Kraft --amb
  varying vec2 vUv;
  ${noiseGLSL}

  const float SCALE             = 0.72;
  const float NOISE_DETAIL      = 3.0;
  const float DISTORT_SCALE     = 0.55;
  const float DISTORT_INTENSITY = 0.50;
  const float HAIRLINE_PIXELS   = 1.5;
  const float CURSOR_SCALE      = 1.5;
  const float CURSOR_INTENSITY  = 0.05;
  const float LINE_ALPHA        = 0.55; // tuned in Task 11 against both themes
  const vec2  ANISOTROPY        = vec2(1.0, 1.0);

  void main(){
    vec2 uv = vUv;
    uv.x *= uAspect;
    vec2 mouse = uMouse * 0.5 + 0.5;
    mouse.x *= uAspect;
    float cursor = 1.0 - distance(mouse, uv) * CURSOR_SCALE;
    cursor *= uMousePace;
    cursor = clamp(cursor, 0.0, 1.0);

    float noiseDistort = 0.5 + snoise(vec3(uv * DISTORT_SCALE, uTime * 0.1)) * 0.5;
    vec2 warpedUv = (uv + cursor * CURSOR_INTENSITY + noiseDistort * DISTORT_INTENSITY) * SCALE * ANISOTROPY;
    float n = snoise(vec3(warpedUv, uTime));
    float bands = (n * 0.5 + 0.5) * NOISE_DETAIL;

    float contour = fract(bands);
    float dist    = abs(contour - 0.5);
    float w       = fwidth(bands) * HAIRLINE_PIXELS * 0.5;
    float line    = 1.0 - smoothstep(0.0, w, dist);

    vec3 lineCol = uLine + cursor * 0.04;
    gl_FragColor = vec4(mix(uBg, lineCol, line * LINE_ALPHA), 1.0);
  }
`

const FRAME_INTERVAL = 1000 / 30
const DRIFT_PER_SECOND = 0.09
const FOLLOW_PER_SECOND = 4.0
const PACE_PER_SECOND = 8.0
const THEME_PER_SECOND = 7.0

export default function ContourCanvas({ onFail }: { onFail: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    const colors = readContourColors()
    if (!el || !colors) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false })
    } catch {
      onFail()
      return
    }
    const onLost = (e: Event) => {
      e.preventDefault()
      onFail()
    }
    renderer.domElement.addEventListener('webglcontextlost', onLost)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0))
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10)
    cam.position.z = 1

    const bg = new THREE.Vector3(...colors.bg)
    const line = new THREE.Vector3(...colors.line)
    const targetBg = bg.clone()
    const targetLine = line.clone()
    renderer.setClearColor(new THREE.Color(...colors.bg), 1)

    const onTheme = () => {
      const next = readContourColors()
      if (!next) return
      targetBg.set(...(next.bg as RGB))
      targetLine.set(...(next.line as RGB))
    }
    window.addEventListener(THEME_EVENT, onTheme)

    const mouse = new THREE.Vector2(0, 0)
    const geo = new THREE.PlaneGeometry(2, 2)
    const mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: mouse },
        uMousePace: { value: 0 },
        uAspect: { value: window.innerWidth / window.innerHeight },
        uBg: { value: bg },
        uLine: { value: line },
      },
    })
    scene.add(new THREE.Mesh(geo, mat))

    const tgt = { x: 0, y: 0 }
    const cur = { x: 0, y: 0 }
    const onMove = (e: MouseEvent) => {
      tgt.x = (e.clientX / window.innerWidth) * 2 - 1
      tgt.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMove)

    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight)
      mat.uniforms.uAspect.value = window.innerWidth / window.innerHeight
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    let visible = document.visibilityState !== 'hidden'
    const onVisibility = () => {
      const next = document.visibilityState !== 'hidden'
      if (next && !visible) {
        visible = true
        lastTs = performance.now()
        raf = requestAnimationFrame(loop)
      } else visible = next
    }
    document.addEventListener('visibilitychange', onVisibility)

    let time = 0
    let lastTs = performance.now()
    let lastCurX = 0
    let lastCurY = 0
    let pace = 0

    function loop(now: number = performance.now()) {
      if (!visible) return
      raf = requestAnimationFrame(loop)
      if (now - lastTs < FRAME_INTERVAL - 1) return
      const dt = Math.min(0.05, (now - lastTs) / 1000)
      lastTs = now
      time += DRIFT_PER_SECOND * dt

      const followK = 1 - Math.exp(-FOLLOW_PER_SECOND * dt)
      cur.x += (tgt.x - cur.x) * followK
      cur.y += (tgt.y - cur.y) * followK
      mouse.set(cur.x, cur.y)
      const dx = (cur.x - lastCurX) / Math.max(dt, 0.001)
      const dy = (cur.y - lastCurY) / Math.max(dt, 0.001)
      const velRaw = Math.min(1, Math.sqrt(dx * dx + dy * dy) * 0.4)
      pace += (velRaw - pace) * (1 - Math.exp(-PACE_PER_SECOND * dt))
      lastCurX = cur.x
      lastCurY = cur.y

      const themeK = 1 - Math.exp(-THEME_PER_SECOND * dt)
      bg.lerp(targetBg, themeK)
      line.lerp(targetLine, themeK)

      mat.uniforms.uTime.value = time
      mat.uniforms.uMousePace.value = pace
      renderer.render(scene, cam)
    }
    loop()

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
      window.removeEventListener(THEME_EVENT, onTheme)
      renderer.domElement.removeEventListener('webglcontextlost', onLost)
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
      geo.dispose()
      mat.dispose()
    }
  }, [onFail])

  return <div ref={ref} data-contour aria-hidden className="pointer-events-none fixed inset-0 z-0" />
}

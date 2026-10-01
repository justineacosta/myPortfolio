/**
 * The portfolio’s contour shader and timing, shared by the site (components/shell/ContourCanvas.tsx)
 * and the standalone pages (lib/brand/contour.js, spec 2026-10-01-light-backdrop §4.2).
 * No imports, so Node can run it directly. Each renderer adds its own precision line.
 */
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

export const CONTOUR_FRAG = `
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

/** Frame cap and easing rates (per second). */
export const CONTOUR_TIMING = { frameInterval: 1000 / 30, drift: 0.09, follow: 4, pace: 8, theme: 7 }

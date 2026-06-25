/* =============================================================================
 * Global Liquid — fragment shader source (GLSL ES 1.0 / WebGL1)
 * -----------------------------------------------------------------------------
 * A large 3D liquid-energy sculpture, raymarched from animated metaballs fused
 * with smooth-min and heavily displaced by FBM noise. Shaded as a wet, glossy,
 * viscous membrane: strong glossy highlight, bright fresnel rim, deep darks,
 * refraction tint, internal directional flow, and a soft aura that fades to
 * full transparency (no container edge).
 *
 * This is a GLOBAL visual: a single scroll progress (u_scroll, 0..1 across the
 * whole narrative zone) morphs it through stages so it reads as one continuous
 * object that the page content flows out of:
 *   stage A (hero)      — large, centered-right, brightest, full presence
 *   stage B (work)      — drifts left + shrinks slightly, becomes a backdrop
 *   stage C (lab)       — splits into more turbulent energy, lower opacity
 *   stage D (devlog+)   — recedes / dims into a faint background energy
 *
 * Uniforms set from GlobalLiquidScene.tsx:
 *   u_res, u_time, u_pointer(-1..1 smoothed), u_scroll(0..1), u_quality(0/1)
 * ============================================================================= */

export const GLOBAL_LIQUID_FRAG = `
precision highp float;

uniform vec2  u_res;
uniform float u_time;
uniform vec2  u_pointer;
uniform float u_scroll;
uniform float u_quality;

const vec3 CYAN   = vec3(0.373, 0.843, 0.824);
const vec3 TEAL   = vec3(0.235, 0.674, 0.678);
const vec3 VIOLET = vec3(0.541, 0.486, 0.941);
const vec3 SILVER = vec3(0.780, 0.824, 0.878);
const vec3 GOLD   = vec3(0.847, 0.702, 0.404);

float hash(vec3 p){
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise(vec3 x){
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),
                 mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                 mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p){
  float v = 0.0; float a = 0.5;
  for(int i=0;i<4;i++){ v += a*noise(p); p = p*2.02 + 7.1; a *= 0.5; }
  return v;
}

float smin(float a, float b, float k){
  float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0);
  return mix(b, a, h) - k*h*(1.0-h);
}

// scroll-driven shape params
float gTurb;   // turbulence amount (rises with scroll)
float gScale;  // overall radius scale (shrinks a touch with scroll)

float map(vec3 p, float t){
  // global slow rotation for volume
  float c = cos(t*0.09), s = sin(t*0.09);
  p.xz = mat2(c,-s,s,c) * p.xz;
  float c2 = cos(t*0.06), s2 = sin(t*0.06);
  p.xy = mat2(c2,-s2,s2,c2) * p.xy;

  float breath = 0.07 * sin(t*0.4);

  // fused metaballs → one big viscous body
  float d = 1e5;
  d = smin(d, length(p - vec3(sin(t*0.5)*0.28, cos(t*0.44)*0.24, 0.0)) - (0.82+breath)*gScale, 0.55);
  d = smin(d, length(p - vec3(cos(t*0.38)*0.4, sin(t*0.6)*0.3, sin(t*0.4)*0.24)) - 0.52*gScale, 0.55);
  d = smin(d, length(p - vec3(sin(t*0.28)*0.46, cos(t*0.55)*0.2, cos(t*0.46)*0.28)) - 0.46*gScale, 0.5);
  d = smin(d, length(p + vec3(sin(t*0.48)*0.34, cos(t*0.42)*0.34, 0.12)) - 0.42*gScale, 0.5);

  // Viscous liquid surface: a large low-frequency body undulation dominates the
  // silhouette (stays smooth, no rocky edges), with a moderate mid-frequency
  // layer + a soft directional ripple for visible flowing detail on the surface.
  float bigWave = fbm(p*1.15 + vec3(t*0.3, -t*0.2, t*0.14));
  float midWave = fbm(p*2.6 - vec3(t*0.42, 0.05, t*0.24));
  // flowing membrane ripple — sine-based (no high-freq noise), reads as liquid
  float ripple = sin(p.x*5.0 + p.y*3.0 + t*1.4) * sin(p.y*4.0 - p.z*3.0 - t*1.1);
  float disp = bigWave*0.66 + midWave*0.34;
  d += (disp - 0.5) * (0.22 + gTurb*0.12);
  d += ripple * 0.018; // subtle surface flow lines, silhouette stays clean
  return d;
}

vec3 calcNormal(vec3 p, float t){
  vec2 e = vec2(0.0016, 0.0);
  return normalize(vec3(
    map(p+e.xyy,t)-map(p-e.xyy,t),
    map(p+e.yxy,t)-map(p-e.yxy,t),
    map(p+e.yyx,t)-map(p-e.yyx,t)
  ));
}

void main(){
  // scroll-driven global state
  gTurb  = clamp(u_scroll*1.3, 0.0, 1.0);
  gScale = mix(1.06, 0.82, clamp(u_scroll,0.0,1.0));

  float s = clamp(u_scroll, 0.0, 1.0);

  // Global intensity ramp — the liquid stays present across the WHOLE page,
  // just progressively quieter (never 0): it remains a visual motif under every
  // section instead of vanishing after a couple of screens.
  //   hero 1.0 → work 0.75 → lab 0.45 → devlog 0.25 → about/contact 0.12
  float intensity =
      mix(1.0, 0.75, smoothstep(0.0, 0.28, s))
    - mix(0.0, 0.30, smoothstep(0.28, 0.55, s))
    - mix(0.0, 0.20, smoothstep(0.55, 0.78, s))
    - mix(0.0, 0.13, smoothstep(0.78, 1.0, s));
  intensity = clamp(intensity, 0.12, 1.0);

  // Screen-space composition: hold the sculpture firmly on the RIGHT during the
  // hero (so it never sits under the left-side title/CTA), then let it drift
  // gently toward center as the narrative scrolls and it becomes a backdrop.
  float cx = mix(0.42, -0.05, smoothstep(0.05, 0.7, s));
  float cy = mix(0.0, 0.08, smoothstep(0.0, 0.7, s));

  vec2 uv = (gl_FragCoord.xy - 0.5*u_res) / u_res.y;
  uv.x -= cx;
  uv.y -= cy;
  uv += u_pointer * 0.04;

  // CAMERA driven by scroll — the lens orbits + dollies around the sculpture
  // (cinematic). Drift amplitude is kept modest so the body doesn't swing over
  // the hero text; most of the "travel" is yaw + dolly, not lateral slide.
  vec2 drift = vec2(sin(s * 2.6) * 0.5, cos(s * 2.2) * 0.22 - 0.03);
  float dist = 3.0 + 0.55 * sin(s * 3.14159) - 0.4 * smoothstep(0.8, 1.0, s);
  vec3 ro = vec3(drift.x, drift.y, dist);
  vec3 rd = normalize(vec3(uv, -1.5));

  // scroll yaw orbit + pointer tilt combine
  float yaw = s * 0.8 + u_pointer.x * 0.28;
  float pit = u_pointer.y * 0.2;
  float cyaw = cos(yaw), syaw = sin(yaw);
  float cpit = cos(pit), spit = sin(pit);
  ro.xz = mat2(cyaw,-syaw,syaw,cyaw)*ro.xz; rd.xz = mat2(cyaw,-syaw,syaw,cyaw)*rd.xz;
  ro.yz = mat2(cpit,-spit,spit,cpit)*ro.yz; rd.yz = mat2(cpit,-spit,spit,cpit)*rd.yz;

  float t = u_time;
  int STEPS = u_quality > 0.5 ? 72 : 34;

  float dist2 = 0.0;
  float hit = 0.0;
  vec3 p = ro;
  for(int i=0;i<72;i++){
    if(i>=STEPS) break;
    p = ro + rd*dist2;
    float d = map(p, t);
    if(d < 0.0022){ hit = 1.0; break; }
    dist2 += d*0.82;
    if(dist2 > 7.5) break;
  }

  vec3 col = vec3(0.0);
  float alpha = 0.0;

  // volumetric aura — large, soft, fades to nothing (no visible boundary)
  float aura = exp(-length(uv)*2.0);
  vec3 auraCol = mix(TEAL, VIOLET, 0.5+0.5*sin(t*0.3));
  col += auraCol * aura * (0.26 * intensity + 0.04);
  alpha += aura * (0.5 * intensity + 0.06);

  if(hit > 0.5){
    vec3 n = calcNormal(p, t);
    vec3 viewDir = normalize(ro - p);
    vec3 lightDir = normalize(vec3(-0.55 + u_pointer.x*0.7, 0.62 - u_pointer.y*0.55, 0.78));
    vec3 backLight = normalize(vec3(0.5, -0.3, -0.6));

    float diff = clamp(dot(n, lightDir), 0.0, 1.0);
    float back = clamp(dot(n, backLight), 0.0, 1.0);
    float fres = pow(1.0 - clamp(dot(n, viewDir), 0.0, 1.0), 2.4);
    // dual glossy spec = wet liquid look (tight hot core + soft wide sheen)
    float specBase = clamp(dot(reflect(-lightDir, n), viewDir), 0.0, 1.0);
    float spec = pow(specBase, 90.0);
    float spec2 = pow(specBase, 22.0);

    // internal flow — low/mid frequency, reads as moving fluid (no speckle)
    float flow = fbm(p*2.1 + vec3(t*0.5, -t*0.3, t*0.22));
    float flow2 = fbm(p*3.8 - vec3(t*0.42, t*0.18, 0.0));
    // flowing surface streaks — sine-based, follow the body, catch the light
    float streak = sin(p.x*6.0 + p.y*4.0 - t*1.2 + flow*3.0) * 0.5 + 0.5;

    // deep, clean dark glassy base → strong value contrast without grime
    vec3 body = vec3(0.012, 0.022, 0.038);
    // inner dark currents — subtle cyan/violet drift in the shadows so the deep
    // body isn't a flat single tone (reads as volume of moving liquid)
    body += mix(vec3(0.0,0.04,0.06), vec3(0.05,0.02,0.08), flow2) * (1.0 - diff) * 0.6;
    body = mix(body, TEAL*0.9, diff*0.88);
    body = mix(body, VIOLET*0.92, smoothstep(0.4, 0.9, flow)*0.58);
    body = mix(body, vec3(0.78,0.99,0.96), smoothstep(0.68,1.0,flow2)*0.32);
    // bright flowing streaks across the surface (slightly stronger)
    body += CYAN * pow(streak, 3.0) * 0.16;

    // rim + refraction
    vec3 rim = mix(CYAN, VIOLET, 0.5+0.5*sin(t*0.4 + p.y*2.2));
    body += rim * fres * 1.4;
    body += GOLD * fres * back * 0.42;

    // wet glossy highlights — bright tight hotspot + soft sheen
    body += vec3(1.0) * spec * 1.4;
    body += mix(CYAN, vec3(1.0), 0.4) * spec2 * 0.38;

    // inner molten glow
    float coreGlow = exp(-length(p)*1.9);
    body += mix(CYAN, vec3(0.85,1.0,0.97), 0.5) * coreGlow * 0.5;

    col = mix(col, body, 0.95);
    alpha = max(alpha, 0.97);
  }

  // global intensity ramp — the body dims + thins across sections but never
  // disappears (min 0.12), so the liquid stays a motif through the whole page.
  alpha *= intensity;
  col *= intensity;

  // filmic
  col = col / (col + vec3(0.55));
  col = pow(col, vec3(0.82));

  gl_FragColor = vec4(col, alpha);
}
`;

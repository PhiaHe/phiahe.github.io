/* =============================================================================
 * MotionLiquid Reference Shader (EXPERIMENT) — GLSL ES 1.0 / WebGL1
 * -----------------------------------------------------------------------------
 * Ported mechanics from the reference page's fluid (G:\phia-website\motionliquid\
 * index.html), reimplemented in our own code and RECOLORED to Phia Games.
 *
 * What we borrowed (mechanics only, not code/branding/colors):
 *   - a SINGLE displaced blob (length(q)-r + fbm + sine ripple), which is much
 *     cheaper than our 4-metaball smin body → lighter, closer to the reference's
 *     smooth performance;
 *   - scroll-driven CAMERA: the eye drifts + dollies around the blob
 *     (drift = f(scroll), dist = f(scroll)) for a cinematic orbit;
 *   - full-step raymarch (tt += d) with a modest step count;
 *   - fresnel rim + tight spec + iridescent-ish internal variation.
 *
 * What we changed: the reference's acid-green / rainbow palette is replaced with
 * Phia's cyan / teal / violet / subtle-gold on deep blue-black. u_scroll also
 * drives a global intensity so the body stays present (never 0) across sections.
 *
 * Uniforms: u_res, u_time, u_mouse(-1..1 smoothed), u_scroll(0..1), u_quality(0/1)
 * ============================================================================= */

export const MOTION_LIQUID_FRAG = `
precision highp float;

uniform vec2  u_res;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_scroll;
uniform float u_quality;

// Phia cold-sci-fi palette — blue-forward (icy cyan / electric blue / violet),
// only a faint blue-teal, plus tiny gold micro-highlights. Deliberately NOT
// green: TEAL is pulled toward blue so the body never reads as acid/teal-green.
const CYAN   = vec3(0.45, 0.84, 0.95);   // icy cyan (more blue than the old green-cyan)
const TEAL   = vec3(0.16, 0.42, 0.62);   // blue-teal (blue-dominant, low green)
const ELECTRIC = vec3(0.27, 0.55, 1.0);  // electric blue
const VIOLET = vec3(0.55, 0.46, 0.95);   // violet / purple-blue
const NAVY   = vec3(0.03, 0.06, 0.13);   // deep navy core
const GOLD   = vec3(0.85, 0.72, 0.42);   // subtle gold micro-highlight only

float hash(vec3 p){ p = fract(p*0.3183099+0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),
                 mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                 mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p){ float a=0.5, r=0.0; for(int i=0;i<4;i++){ r+=a*noise(p); p*=2.02; a*=0.5; } return r; }
mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }

// Single displaced blob — the reference's core idea, our tuning.
float map(vec3 p){
  float t = u_time*0.22;
  vec3 q = p;
  // mouse + time rotation gives the body its turning motion
  q.xz *= rot(t*0.6 + u_mouse.x*0.9);
  q.xy *= rot(u_mouse.y*0.55);
  float base = length(q) - 1.08;
  float n = fbm(q*1.7 + vec3(0.0, t*1.1, t*0.7));           // big viscous undulation
  float ripple = 0.05*sin(q.x*7.0 + t*4.0)*sin(q.y*6.0 - t*3.0); // flowing membrane
  return (base + (n-0.5)*0.6 + ripple) * 0.55;
}
vec3 norm(vec3 p){
  vec2 e = vec2(0.0018, 0.0);
  return normalize(vec3(
    map(p+e.xyy)-map(p-e.xyy),
    map(p+e.yxy)-map(p-e.yxy),
    map(p+e.yyx)-map(p-e.yyx)));
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*u_res) / min(u_res.x, u_res.y);
  float s = clamp(u_scroll, 0.0, 1.0);

  // Compose the blob further to the RIGHT in the hero (partly off-screen) so it
  // never crowds the left-side copy, drifting toward center as we scroll.
  uv.x -= mix(0.62, -0.02, smoothstep(0.05, 0.7, s));
  uv += u_mouse * 0.03;

  // Scroll-driven CAMERA (reference mechanic): orbit drift + dolly in/out.
  // Base distance pulled back (3.2 → 3.85) to shrink the body ~20% — more
  // restrained, less crowding than before.
  vec2 drift = vec2(sin(s*3.0)*0.6, cos(s*2.4)*0.26 - 0.04);
  float dist = 3.85 + 0.8*sin(s*3.14159) - 0.7*smoothstep(0.82, 1.0, s);
  vec3 ro = vec3(drift.x, drift.y, dist);
  vec3 rd = normalize(vec3(uv, -1.6));

  // intensity ramp — body present across the whole page, never fully gone.
  float intensity = clamp(
      mix(1.0, 0.7, smoothstep(0.0,0.3,s))
    - mix(0.0, 0.3, smoothstep(0.3,0.6,s))
    - mix(0.0, 0.2, smoothstep(0.6,0.85,s)), 0.14, 1.0);

  int STEPS = u_quality > 0.5 ? 64 : 32;
  float tt = 0.0, dmin = 1e3, hit = -1.0;
  for(int i=0;i<64;i++){
    if(i>=STEPS) break;
    vec3 p = ro + rd*tt;
    float d = map(p);
    dmin = min(dmin, d);
    if(d < 0.002){ hit = tt; break; }
    tt += d;
    if(tt > 8.0) break;
  }

  // deep navy base + faint cool blue vignette glow
  vec3 col = NAVY;
  col += 0.03*mix(ELECTRIC, VIOLET, 0.5+0.5*sin(s*3.0+0.5)) * (1.0 - length(uv)*0.7);

  if(hit > 0.0){
    vec3 p = ro + rd*hit;
    vec3 n = norm(p);
    float fre = pow(1.0 - max(dot(n, -rd), 0.0), 2.4);
    float m = fbm(p*1.4 + u_time*0.18);
    // internal currents: electric-blue ↔ violet by internal flow + facing,
    // with a touch of icy cyan. Blue-dominant, violet for depth — no green.
    vec3 inner = mix(ELECTRIC, VIOLET, clamp(m*0.9 + n.y*0.25 + 0.3, 0.0, 1.0));
    inner = mix(inner, CYAN, 0.22);

    vec3 l = normalize(vec3(0.5, 0.8, 0.55));
    float dif = max(dot(n, l), 0.0);
    float spec = pow(max(dot(reflect(-l, n), -rd), 0.0), 42.0);
    float spec2 = pow(max(dot(reflect(-l, n), -rd), 0.0), 14.0);

    col = NAVY * 0.7;                                  // deep navy body
    col += mix(CYAN, ELECTRIC, 0.5) * (fre*1.05 + 0.06); // icy-blue rim light
    col += GOLD * fre * 0.1;                            // tiny gold edge micro-hl
    col += vec3(0.82, 0.93, 1.0) * spec * 0.95;         // cyan-white wet highlight
    col += mix(CYAN, vec3(0.85,0.92,1.0), 0.5) * spec2 * 0.22; // silver-blue sheen
    col += inner * dif * 0.12;                          // violet/blue inner flow
  } else {
    // faint icy-blue halo where the ray nearly grazed the body
    col += mix(CYAN, ELECTRIC, 0.4) * pow(max(0.0, 1.0 - dmin*1.2), 6.0) * 0.16;
  }

  // vignette
  col *= 1.0 - 0.34*pow(length(uv*vec2(0.85,1.0)), 2.2);
  col *= intensity;
  // overall restraint — keep the core premium and not over-bright in the hero
  col *= 0.86;

  // filmic
  col = col / (col + vec3(0.55));
  col = pow(col, vec3(0.83));

  gl_FragColor = vec4(col, 1.0);
}
`;

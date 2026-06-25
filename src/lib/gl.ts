/* =============================================================================
 * Minimal WebGL helpers — no dependencies.
 * Just enough to compile a fullscreen fragment-shader program and run it.
 * Used by LiquidCore. Returns null on any failure so callers can fall back.
 * ============================================================================= */

export interface GLProgram {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  /** Draw the fullscreen triangle. */
  draw: () => void;
  /** Look up (and cache) a uniform location. */
  uniform: (name: string) => WebGLUniformLocation | null;
  dispose: () => void;
}

const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

function compile(
  gl: WebGLRenderingContext,
  type: number,
  src: string
): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    // Surface the error in dev; caller will fall back gracefully.
    console.warn("[LiquidCore] shader compile failed:", gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

/**
 * Create a fullscreen fragment-shader program. The vertex shader draws a single
 * big triangle covering the viewport; all the work happens in the fragment
 * shader. Returns null if WebGL isn't available or the shader fails to build.
 */
export function createFullscreenProgram(
  canvas: HTMLCanvasElement,
  fragSrc: string
): GLProgram | null {
  const gl =
    (canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    }) as WebGLRenderingContext | null) ||
    (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);

  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragSrc);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn("[LiquidCore] program link failed:", gl.getProgramInfoLog(program));
    return null;
  }

  gl.useProgram(program);

  // Fullscreen triangle.
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW
  );
  const loc = gl.getAttribLocation(program, "a_pos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const uniformCache = new Map<string, WebGLUniformLocation | null>();

  return {
    gl,
    program,
    draw: () => gl.drawArrays(gl.TRIANGLES, 0, 3),
    uniform: (name: string) => {
      if (!uniformCache.has(name)) {
        uniformCache.set(name, gl.getUniformLocation(program, name));
      }
      return uniformCache.get(name) ?? null;
    },
    dispose: () => {
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    },
  };
}

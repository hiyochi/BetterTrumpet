import { Mesh, Program, Renderer, Triangle } from "ogl";
import { useEffect, useRef } from "react";
import "./Scanner.css";

const vertex = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uSpeed;
uniform float uSweepSpeed;
uniform float uSweepWidth;
uniform float uSweepFalloff;
uniform float uScale;
uniform float uFrequency;
uniform float uRipple;
uniform float uBandDensity;
uniform float uLineSharpness;
uniform float uGlow;
uniform float uColorSpread;
uniform float uBrightness;
uniform float uContrast;
uniform float uSoftness;
uniform float uVignette;
uniform float uOpacity;
uniform float uScanline;
uniform float uGrain;
uniform float uGrainIntensity;
uniform float uDirection;
uniform vec2 uMouse;
uniform float uMouseEnabled;
uniform float uMouseRadius;
uniform float uMouseStrength;
uniform float uMouseActive;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
out vec4 fragColor;
const float TAU = 6.2831853;

float signalField(vec2 p, float t) {
  float w = sin(p.x * 1.3 + t * 0.7);
  w += sin(p.y * 1.7 - t * 0.52) * 0.8;
  w += sin((p.x + p.y) * 0.9 + t * 0.91) * 0.6;
  w += sin((p.x - p.y) * 1.53 - t * 0.63) * 0.42;
  return w * 0.35;
}

vec3 palette(float f) {
  f = pow(clamp(f, 0.0, 1.0), uContrast);
  vec3 c = mix(uColor1, uColor2, smoothstep(0.08, 0.6, f));
  return mix(c, uColor3, smoothstep(0.68, 1.0, f));
}

float scanBand(float x, float aa, float sharp) {
  float v = mix(0.5, 0.5 + 0.5 * cos(x * TAU), aa);
  return pow(v, sharp);
}

void main() {
  float aspect = iResolution.x / iResolution.y;
  vec2 uv0 = (gl_FragCoord.xy * 2.0 - iResolution.xy) / iResolution.y;
  vec2 p = uv0 / max(uScale, 0.001);
  float t = iTime * uSpeed;
  float mouseBoost = 0.0;
  if (uMouseEnabled > 0.5) {
    vec2 mUv = vec2((uMouse.x * 2.0 - 1.0) * aspect, uMouse.y * 2.0 - 1.0);
    vec2 md = uv0 - mUv;
    float r = max(uMouseRadius, 0.001);
    mouseBoost = exp(-dot(md, md) / (r * r)) * uMouseStrength * uMouseActive;
  }
  float axis = uDirection < 0.5 ? p.y : (uDirection < 1.5 ? p.x : (p.x + p.y) * 0.70710678);
  float sig = signalField(p * uFrequency, t);
  float coord = axis + sig * uRipple;
  float phase = coord / max(uSweepWidth, 0.05) - t * uSweepSpeed;
  float sweep = pow(0.5 + 0.5 * cos(phase * TAU), max(uSweepFalloff, 0.1));
  float lc = coord * uBandDensity;
  float aa = clamp((1.0 / (1.0 + uSoftness * fwidth(lc) * 3.0)) * (1.0 + mouseBoost * 0.6), 0.0, 1.0);
  float bodyBase = clamp(0.5 + 0.5 * sig, 0.0, 1.0);
  float body = bodyBase * bodyBase * uGlow * sweep;
  float sharp = max(uLineSharpness, 0.1);
  float split = uColorSpread * 0.16;
  float fr = clamp(scanBand(lc + split, aa, sharp) * sweep + body, 0.0, 1.0);
  float fg = clamp(scanBand(lc, aa, sharp) * sweep + body, 0.0, 1.0);
  float fb = clamp(scanBand(lc - split, aa, sharp) * sweep + body, 0.0, 1.0);
  vec3 col = vec3(palette(fr).r, palette(fg).g, palette(fb).b);
  float intensity = (fr + fg + fb) * 0.3333333 * uBrightness * (1.0 + mouseBoost * 0.9);
  if (uScanline > 0.5) intensity *= 1.0 - 0.18 * (0.5 + 0.5 * cos(gl_FragCoord.y * 1.7));
  if (uGrain > 0.5) {
    float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + iTime) * 43758.5453);
    intensity += (grain - 0.5) * uGrainIntensity;
  }
  intensity *= clamp(1.0 - uVignette * smoothstep(0.55, 1.65, length(uv0)), 0.0, 1.0);
  float alpha = clamp(intensity * uOpacity, 0.0, 1.0);
  fragColor = vec4(clamp(col, 0.0, 1.0) * alpha, alpha);
}
`;

interface ScannerProps {
  color1?: string;
  color2?: string;
  color3?: string;
  speed?: number;
  sweepSpeed?: number;
  sweepWidth?: number;
  sweepFalloff?: number;
  scale?: number;
  frequency?: number;
  ripple?: number;
  bandDensity?: number;
  lineSharpness?: number;
  glow?: number;
  scanDirection?: "vertical" | "horizontal" | "diagonal";
  colorSpread?: number;
  brightness?: number;
  contrast?: number;
  softness?: number;
  vignette?: number;
  scanline?: boolean;
  grain?: boolean;
  grainIntensity?: number;
  opacity?: number;
  mouseInteraction?: boolean;
  mouseRadius?: number;
  mouseStrength?: number;
  className?: string;
}

type Uniform = { value: number | Float32Array };
type Uniforms = Record<string, Uniform>;
type ScannerContext = { renderer: Renderer; program: Program; mesh: Mesh; renderStatic: () => void };
const contexts = new WeakMap<HTMLDivElement, ScannerContext>();

export default function Scanner({
  color1 = "#2B2145",
  color2 = "#795DB3",
  color3 = "#D9D2EA",
  speed = 0.12,
  sweepSpeed = 0.08,
  sweepWidth = 1.8,
  sweepFalloff = 7,
  scale = 1.4,
  frequency = 1.7,
  ripple = 0.16,
  bandDensity = 8,
  lineSharpness = 4.8,
  glow = 0.16,
  scanDirection = "diagonal",
  colorSpread = 0.34,
  brightness = 0.8,
  contrast = 1.1,
  softness = 1.8,
  vignette = 0.58,
  scanline = false,
  grain = false,
  grainIntensity = 0,
  opacity = 0.11,
  mouseInteraction = true,
  mouseRadius = 0.46,
  mouseStrength = 0.22,
  className = "",
}: ScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseEnabledRef = useRef(mouseInteraction);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new Renderer({
      webgl: 2,
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      dpr: Math.min(window.devicePixelRatio || 1, 1.25),
      powerPreference: "low-power",
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    const canvas = gl.canvas;
    canvas.setAttribute("aria-hidden", "true");
    container.appendChild(canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex,
      fragment,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      cullFace: false,
      uniforms: createUniforms(),
    });
    const mesh = new Mesh(gl, { geometry, program });
    const uniforms = program.uniforms as Uniforms;
    const startedAt = performance.now();
    let raf = 0;
    let lastFrame = 0;
    let isVisible = true;
    let pageVisible = !document.hidden;
    let reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const currentMouse = new Float32Array([0.5, 0.5]);
    const targetMouse = new Float32Array([0.5, 0.5]);
    let mouseActive = 0;
    let targetMouseActive = 0;

    const render = (time: number) => {
      uniforms.iTime.value = (time - startedAt) * 0.001;
      currentMouse[0] += 0.08 * (targetMouse[0] - currentMouse[0]);
      currentMouse[1] += 0.08 * (targetMouse[1] - currentMouse[1]);
      const mouse = uniforms.uMouse.value as Float32Array;
      mouse[0] = currentMouse[0];
      mouse[1] = currentMouse[1];
      mouseActive += 0.08 * (targetMouseActive - mouseActive);
      uniforms.uMouseActive.value = mouseActive;
      renderer.render({ scene: mesh });
    };

    const renderStatic = () => render(startedAt + 1);
    const frame = (time: number) => {
      if (time - lastFrame >= 1000 / 30) {
        lastFrame = time;
        render(time);
      }
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf !== 0) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (reduceMotion) {
        stop();
        renderStatic();
      } else if (isVisible && pageVisible && raf === 0) {
        raf = requestAnimationFrame(frame);
      }
    };

    const setSize = () => {
      const rect = container.getBoundingClientRect();
      renderer.setSize(Math.max(1, Math.floor(rect.width)), Math.max(1, Math.floor(rect.height)));
      const resolution = uniforms.iResolution.value as Float32Array;
      resolution[0] = gl.drawingBufferWidth;
      resolution[1] = gl.drawingBufferHeight;
      renderStatic();
    };
    const onPointerMove = (event: globalThis.PointerEvent) => {
      if (!mouseEnabledRef.current) return;
      const rect = container.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
        targetMouseActive = 0;
        return;
      }
      targetMouse[0] = (event.clientX - rect.left) / rect.width;
      targetMouse[1] = 1 - (event.clientY - rect.top) / rect.height;
      targetMouseActive = 1;
    };
    const onPointerLeave = () => { targetMouseActive = 0; };
    const onVisibilityChange = () => {
      pageVisible = !document.hidden;
      if (pageVisible) start(); else stop();
    };
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = (event: MediaQueryListEvent) => {
      reduceMotion = event.matches;
      start();
    };
    const resizeObserver = new ResizeObserver(setSize);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) start(); else stop();
    });

    contexts.set(container, { renderer, program, mesh, renderStatic });
    resizeObserver.observe(container);
    intersectionObserver.observe(container);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibilityChange);
    motionQuery.addEventListener("change", onMotionChange);
    setSize();
    start();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      motionQuery.removeEventListener("change", onMotionChange);
      contexts.delete(container);
      canvas.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const context = container ? contexts.get(container) : undefined;
    if (!context) return;
    const uniforms = context.program.uniforms as Uniforms;
    setNumberUniforms(uniforms, {
      uSpeed: speed,
      uSweepSpeed: sweepSpeed,
      uSweepWidth: sweepWidth,
      uSweepFalloff: sweepFalloff,
      uScale: scale,
      uFrequency: frequency,
      uRipple: ripple,
      uBandDensity: bandDensity,
      uLineSharpness: lineSharpness,
      uGlow: glow,
      uColorSpread: colorSpread,
      uBrightness: brightness,
      uContrast: contrast,
      uSoftness: softness,
      uVignette: vignette,
      uOpacity: opacity,
      uScanline: scanline ? 1 : 0,
      uGrain: grain ? 1 : 0,
      uGrainIntensity: grainIntensity,
      uDirection: directionToFloat(scanDirection),
      uMouseEnabled: mouseInteraction ? 1 : 0,
      uMouseRadius: mouseRadius,
      uMouseStrength: mouseStrength,
    });
    setColor(uniforms.uColor1.value as Float32Array, color1);
    setColor(uniforms.uColor2.value as Float32Array, color2);
    setColor(uniforms.uColor3.value as Float32Array, color3);
    mouseEnabledRef.current = mouseInteraction;
    context.renderStatic();
  }, [bandDensity, brightness, color1, color2, color3, colorSpread, contrast, frequency, glow, grain, grainIntensity, lineSharpness, mouseInteraction, mouseRadius, mouseStrength, opacity, ripple, scale, scanDirection, scanline, softness, speed, sweepFalloff, sweepSpeed, sweepWidth, vignette]);

  return <div ref={containerRef} className={`scanner ${className}`.trim()} aria-hidden="true" />;
}

function createUniforms(): Uniforms {
  return {
    iTime: { value: 0 },
    iResolution: { value: new Float32Array([1, 1]) },
    uSpeed: { value: 0.12 },
    uSweepSpeed: { value: 0.08 },
    uSweepWidth: { value: 1.8 },
    uSweepFalloff: { value: 7 },
    uScale: { value: 1.4 },
    uFrequency: { value: 1.7 },
    uRipple: { value: 0.16 },
    uBandDensity: { value: 8 },
    uLineSharpness: { value: 4.8 },
    uGlow: { value: 0.16 },
    uColorSpread: { value: 0.34 },
    uBrightness: { value: 0.8 },
    uContrast: { value: 1.1 },
    uSoftness: { value: 1.8 },
    uVignette: { value: 0.58 },
    uOpacity: { value: 0.11 },
    uScanline: { value: 0 },
    uGrain: { value: 0 },
    uGrainIntensity: { value: 0 },
    uDirection: { value: 2 },
    uMouse: { value: new Float32Array([0.5, 0.5]) },
    uMouseEnabled: { value: 1 },
    uMouseRadius: { value: 0.46 },
    uMouseStrength: { value: 0.22 },
    uMouseActive: { value: 0 },
    uColor1: { value: new Float32Array([0.17, 0.13, 0.27]) },
    uColor2: { value: new Float32Array([0.47, 0.36, 0.7]) },
    uColor3: { value: new Float32Array([0.85, 0.82, 0.92]) },
  };
}

function setNumberUniforms(uniforms: Uniforms, values: Record<string, number>) {
  for (const name in values) uniforms[name].value = values[name];
}

function setColor(target: Float32Array, hex: string) {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return;
  target[0] = parseInt(match[1], 16) / 255;
  target[1] = parseInt(match[2], 16) / 255;
  target[2] = parseInt(match[3], 16) / 255;
}

function directionToFloat(direction: ScannerProps["scanDirection"]) {
  return direction === "horizontal" ? 1 : direction === "diagonal" ? 2 : 0;
}

import { useEffect, useRef } from "react";

// Variant 07 — Ink. Ported from BTPAGE dither-lab (keyboard 7 / index 6).
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map(row => row.map(value => (value + 0.5) / 16));

const OFF_TIER = 0.4;
const MAX_COLS = 960;
const MAX_ROWS = 600;
const CELL = 2;
const RGB: [number, number, number] = [210, 202, 255];
const FIELD_OPACITY = 0.78;
const SPEED = 0.021;
const PHASE = 4.6;
const BLOOM = { blur: 6, brightness: 1.55, opacity: 0.52, saturate: 1.45 };

type Hit = { density: number; sparse: number };
type Star = { x: number; y: number; phase: number };

function sample(x: number, y: number, cols: number, rows: number, time: number): Hit | null {
  const progress = x / Math.max(cols - 1, 1);
  const t = time * SPEED + PHASE;
  const breath = Math.sin(t * 0.38) * 0.01;
  const drift = Math.sin(progress * 9.2 + t) * 0.028;
  const top = (0.4 - Math.sin(progress * Math.PI) * (0.24 + breath) + drift) * rows;
  if (y < top || y >= rows) return null;
  return { density: (y - top) / Math.max(rows - top, 1), sparse: 0 };
}

function makeStars(cols: number, rows: number): Star[] {
  const count = Math.max(8, Math.round(cols / 26));
  const stars: Star[] = [];
  for (let index = 0; stars.length < count && index < count * 4; index += 1) {
    const x = (index * 67 + 13) % cols;
    const y = Math.round((((index * 43 + 19) % 83) / 100) * Math.max(rows - 1, 0));
    const hit = sample(x, y, cols, rows, 0);
    if (hit && hit.density > 0.28) stars.push({ x, y, phase: (index * 31) % 19 });
  }
  return stars;
}

export function DitherField({ live = true }: { live?: boolean }) {
  const crispRef = useRef<HTMLCanvasElement>(null);
  const bloomRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = crispRef.current;
    const bloom = bloomRef.current;
    const field = canvas?.parentElement;
    const host = field?.parentElement ?? field;
    if (!(canvas && bloom && field && host)) return;

    const context = canvas.getContext("2d");
    const bloomContext = bloom.getContext("2d");
    if (!(context && bloomContext)) return;

    let frame = 0;
    let timer = 0;
    let visible = false;
    let stars: Star[] = [];
    let imageData: ImageData | null = null;
    let fieldPixels: Uint8ClampedArray | null = null;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    field.style.opacity = String(FIELD_OPACITY);

    const paintPixel = (x: number, y: number, alpha: number) => {
      if (!imageData || x < 0 || y < 0 || x >= imageData.width || y >= imageData.height) return;
      const index = (y * imageData.width + x) * 4;
      const existing = imageData.data[index + 3] / 255;
      const next = alpha + existing * (1 - alpha);
      imageData.data[index] = RGB[0];
      imageData.data[index + 1] = RGB[1];
      imageData.data[index + 2] = RGB[2];
      imageData.data[index + 3] = Math.round(next * 255);
    };

    const paintField = () => {
      if (!imageData) return;
      imageData.data.fill(0);
      const cols = imageData.width;
      const rows = imageData.height;
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const hit = sample(x, y, cols, rows, frame);
          if (!hit) continue;
          const lit = hit.density > BAYER[y & 3][x & 3] + hit.sparse;
          paintPixel(x, y, (lit ? 0.76 : 0.76 * OFF_TIER) * (0.3 + hit.density * 0.7));
        }
      }
      fieldPixels = new Uint8ClampedArray(imageData.data);
    };

    const drawStars = () => {
      if (!imageData || !fieldPixels) return;
      imageData.data.set(fieldPixels);
      for (const star of stars) {
        const twinkle = !live || reducedMotion ? 0.75 : (Math.sin((frame + star.phase) * 0.16) + 1) / 2;
        if (twinkle < 0.55) continue;
        paintPixel(star.x, star.y, twinkle);
        if (twinkle > 0.9) {
          const glint = (twinkle - 0.9) * 6;
          paintPixel(star.x - 1, star.y, glint);
          paintPixel(star.x + 1, star.y, glint);
          paintPixel(star.x, star.y - 1, glint);
          paintPixel(star.x, star.y + 1, glint);
        }
      }
      context.putImageData(imageData, 0, 0);
      bloomContext.clearRect(0, 0, bloom.width, bloom.height);
      bloomContext.drawImage(canvas, 0, 0);
    };

    const resize = () => {
      const bounds = host.getBoundingClientRect();
      const cols = Math.min(MAX_COLS, Math.max(8, Math.round(bounds.width / CELL)));
      const rows = Math.min(MAX_ROWS, Math.max(8, Math.round(bounds.height / CELL)));
      if (cols === canvas.width && rows === canvas.height && imageData && fieldPixels) return;
      canvas.width = bloom.width = cols;
      canvas.height = bloom.height = rows;
      imageData = context.createImageData(cols, rows);
      stars = makeStars(cols, rows);
      paintField();
      drawStars();
    };

    const tick = () => {
      frame += 1;
      paintField();
      drawStars();
      timer = window.setTimeout(tick, 140);
    };

    const start = () => {
      if (!visible) return;
      resize();
      window.clearTimeout(timer);
      if (live && !reducedMotion) timer = window.setTimeout(tick, 140);
    };

    const resizeObserver = new ResizeObserver(() => {
      if (!visible) return;
      const bounds = host.getBoundingClientRect();
      const cols = Math.min(MAX_COLS, Math.max(8, Math.round(bounds.width / CELL)));
      const rows = Math.min(MAX_ROWS, Math.max(8, Math.round(bounds.height / CELL)));
      if (cols === canvas.width && rows === canvas.height) return;
      resize();
    });
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else window.clearTimeout(timer);
    }, { rootMargin: "80px 0px" });

    resizeObserver.observe(host);
    visibilityObserver.observe(host);

    return () => {
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      window.clearTimeout(timer);
    };
  }, [live]);

  return (
    <div className="dither-field" aria-hidden="true">
      <canvas ref={crispRef} className="dither-field-crisp" />
      <canvas
        ref={bloomRef}
        className="dither-field-bloom"
        style={{
          filter: `blur(${BLOOM.blur}px) brightness(${BLOOM.brightness}) saturate(${BLOOM.saturate})`,
          opacity: BLOOM.opacity,
          mixBlendMode: "plus-lighter",
          imageRendering: "auto",
        }}
      />
    </div>
  );
}

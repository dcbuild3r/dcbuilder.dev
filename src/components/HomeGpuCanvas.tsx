"use client";

import { useEffect, useRef, useState } from "react";

const SHADER = /* wgsl */ `
struct Params {
  time: f32,
  aspect: f32,
  pointer: vec2f,
  velocity: vec2f,
  energy: f32,
  theme: f32,
}

@group(0) @binding(0) var<uniform> params: Params;

fn hash21(p: vec2f) -> f32 {
  let q = fract(p * vec2f(123.34, 456.21));
  return fract((q.x + 45.32) * (q.y + 45.32) * (q.x + q.y));
}

fn noise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2f(1.0, 0.0)), u.x),
    mix(hash21(i + vec2f(0.0, 1.0)), hash21(i + vec2f(1.0, 1.0)), u.x),
    u.y
  );
}

fn fbm(input: vec2f) -> f32 {
  var p = input;
  var value = 0.0;
  var amplitude = 0.5;
  for (var octave = 0; octave < 5; octave += 1) {
    value += amplitude * noise(p);
    p = mat2x2f(1.62, 1.18, -1.18, 1.62) * p + vec2f(0.17, 0.31);
    amplitude *= 0.5;
  }
  return value;
}

fn rotate(p: vec2f, angle: f32) -> vec2f {
  let c = cos(angle);
  let s = sin(angle);
  return mat2x2f(c, -s, s, c) * p;
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  var p = uv * 2.0 - 1.0;
  p.x *= params.aspect;

  let pointer = (vec2f(params.pointer.x, params.pointer.y) * 2.0 - 1.0) * vec2f(params.aspect, 1.0);
  let pointerDelta = p - pointer;
  let pointerDistance = length(pointerDelta);
  let speed = min(length(params.velocity) * 2.2, 1.0);
  let velocityDirection = normalize(params.velocity + vec2f(0.0001, 0.0));
  let perpendicular = vec2f(-velocityDirection.y, velocityDirection.x);
  let alongWake = dot(pointerDelta, velocityDirection);
  let acrossWake = dot(pointerDelta, perpendicular);
  let behindPointer = 1.0 - smoothstep(-0.08, 0.48, alongWake);
  let wake = exp(-abs(acrossWake) * 7.5) * exp(-abs(alongWake) * 2.1) * behindPointer * params.energy * speed;
  let swirl = perpendicular * exp(-pointerDistance * 3.4) * params.energy * speed * 0.2;
  let ripple = sin(pointerDistance * 34.0 - params.time * 5.2) * exp(-pointerDistance * 3.7) * params.energy;
  let radial = pointerDelta / max(pointerDistance, 0.025);
  let liquidDisplacement = params.velocity * wake * 0.28 + swirl + radial * ripple * 0.065;
  let pointerPull = (pointer - p) * exp(-pointerDistance * 2.8) * params.energy * 0.12;
  let t = params.time * 0.11;
  let drift = vec2f(
    sin(params.time * 0.24) * 0.42 + sin(params.time * 0.09) * 0.16,
    cos(params.time * 0.19) * 0.26 + sin(params.time * 0.13) * 0.1
  );
  var flow = rotate(p - drift + pointerPull + liquidDisplacement, 0.2 * sin(t * 0.9));

  let warpA = fbm(flow * 1.35 + vec2f(t * 0.21, -t * 0.13));
  let warpB = fbm(flow * 1.7 + vec2f(-t * 0.17, t * 0.19) + warpA);
  flow += (vec2f(warpA, warpB) - 0.5) * 0.58;

  let radius = length(flow * vec2f(0.82, 1.08));
  let angle = atan2(flow.y, flow.x);
  let spiral = angle * 1.75 - radius * 8.2 + t * 1.4 + warpB * 4.3;
  let folds = sin(spiral) * 0.5 + 0.5;
  let turbulent = fbm(flow * 3.7 - vec2f(t * 0.12, t * 0.08));
  let body = max(smoothstep(0.92, 0.16, radius + turbulent * 0.42 - folds * 0.18), wake * 0.72);
  let feather = smoothstep(0.22, 0.82, turbulent + folds * 0.28) * body;

  let paperLight = vec3f(0.955, 0.938, 0.9);
  let paperDark = vec3f(0.045, 0.043, 0.04);
  let paper = mix(paperLight, paperDark, params.theme);
  let soot = mix(vec3f(0.055, 0.048, 0.043), vec3f(0.72, 0.69, 0.63), params.theme);
  let ochre = vec3f(0.67, 0.36, 0.1);
  let vermilion = vec3f(0.64, 0.055, 0.025);

  let redCore = body * smoothstep(0.34, 0.78, folds + turbulent * 0.44) * smoothstep(0.92, 0.14, radius);
  let goldEdge = feather * (1.0 - redCore) * smoothstep(0.23, 0.72, folds);
  let blackWash = body * smoothstep(0.42, 0.82, 1.0 - folds + warpA * 0.25);
  let contour = pow(1.0 - abs(fract((turbulent + folds * 0.48 - radius * 0.18) * 16.0) * 2.0 - 1.0), 18.0) * body;

  var color = paper;
  color = mix(color, ochre, goldEdge * 0.78);
  color = mix(color, vermilion, redCore * 0.92);
  color = mix(color, soot, blackWash * 0.9);
  color = mix(color, soot, contour * 0.46);

  let grain = hash21(uv * vec2f(1900.0, 1100.0) + floor(params.time * 12.0));
  color += (grain - 0.5) * mix(0.035, 0.018, params.theme);
  let paperVignette = smoothstep(1.32, 0.18, length((uv - 0.5) * vec2f(1.0, 0.76)));
  color *= mix(0.94, 1.025, paperVignette);
  return vec4f(color, 1.0);
}
`;

export function HomeGpuCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof navigator === "undefined" || !("gpu" in navigator)) return;

    let disposed = false;
    let isVisible = true;
    let pointer = { x: 0.68, y: 0.42, velocityX: 0, velocityY: 0, energy: 0 };
    let previousPointer = { x: pointer.x, y: pointer.y, time: performance.now() };
    let cleanupGpu: (() => void) | undefined;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onPointerMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      const elapsed = Math.max(event.timeStamp - previousPointer.time, 8);
      const velocityX = Math.max(-1, Math.min(1, ((x - previousPointer.x) / elapsed) * 28));
      const velocityY = Math.max(-1, Math.min(1, ((y - previousPointer.y) / elapsed) * 28));
      pointer = {
        x,
        y,
        velocityX: pointer.velocityX * 0.35 + velocityX * 0.65,
        velocityY: pointer.velocityY * 0.35 + velocityY * 0.65,
        energy: event.pointerType === "touch" ? 0.8 : 1,
      };
      previousPointer = { x, y, time: event.timeStamp };
    };
    const onPointerLeave = () => {
      pointer = { ...pointer, energy: 0 };
    };

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry?.isIntersecting ?? false;
    });
    observer.observe(canvas);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave, { passive: true });

    void (async () => {
      try {
        const { clock, effect, frame, frameLoop, init, surface } = await import("vgpu");
        const gpu = await init();
        if (disposed) {
          gpu.dispose();
          return;
        }

        const output = surface(gpu, canvas, { dpr: [1, 1.5] });
        const getTheme = () => (document.documentElement.classList.contains("dark") ? 1 : 0);
        const field = effect(gpu, SHADER, {
          label: "home-ink-on-paper",
          set: {
            params: {
              time: 0,
              aspect: output.size[0] / Math.max(output.size[1], 1),
              pointer: [pointer.x, pointer.y],
              velocity: [0, 0],
              energy: 0,
              theme: getTheme(),
            },
          },
        });

        const resizeCleanup = output.onResize(({ width, height }) => {
          field.set({ params: { aspect: width / Math.max(height, 1) } });
        });
        const themeObserver = new MutationObserver(() => {
          field.set({ params: { theme: getTheme() } });
        });
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

        if (reduceMotion) {
          frame(gpu, (currentFrame) => currentFrame.pass(output, field));
        }

        const gpuClock = clock(gpu);
        const loop = reduceMotion
          ? undefined
          : frameLoop(gpu, (currentFrame) => {
              if (!isVisible || document.hidden) return;
              pointer.energy *= 0.975;
              pointer.velocityX *= 0.94;
              pointer.velocityY *= 0.94;
              field.set({
                params: {
                  time: gpuClock.time,
                  pointer: [pointer.x, pointer.y],
                  velocity: [pointer.velocityX, pointer.velocityY],
                  energy: pointer.energy,
                },
              });
              currentFrame.pass(output, field);
            });

        setIsReady(true);
        cleanupGpu = () => {
          loop?.stop();
          resizeCleanup();
          themeObserver.disconnect();
          gpu.dispose();
        };
      } catch (error) {
        console.warn("WebGPU hero unavailable; using the static visual fallback.", error);
      }
    })();

    return () => {
      disposed = true;
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      cleanupGpu?.();
    };
  }, []);

  return (
    <div className="home-gpu-field" data-ready={isReady ? "true" : "false"} aria-hidden="true">
      <canvas ref={canvasRef} className="home-gpu-canvas" />
      <div className="home-gpu-fallback" />
    </div>
  );
}

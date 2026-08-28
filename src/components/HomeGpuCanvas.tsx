"use client";

import { useEffect, useRef, useState } from "react";

const SHADER = /* wgsl */ `
struct Params {
  time: f32,
  aspect: f32,
  pointer: vec2f,
  energy: f32,
  theme: f32,
}

@group(0) @binding(0) var<uniform> params: Params;

fn palette(t: f32, theme: f32) -> vec3f {
  let darkA = vec3f(0.035, 0.045, 0.075);
  let darkB = vec3f(0.08, 0.34, 0.38);
  let darkC = vec3f(0.72, 0.24, 0.16);
  let lightA = vec3f(0.965, 0.97, 0.955);
  let lightB = vec3f(0.48, 0.76, 0.72);
  let lightC = vec3f(0.9, 0.46, 0.3);
  let base = mix(lightA, darkA, theme);
  let cool = mix(lightB, darkB, theme);
  let warm = mix(lightC, darkC, theme);
  return mix(mix(base, cool, smoothstep(0.08, 0.7, t)), warm, smoothstep(0.68, 1.0, t));
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  var p = uv * 2.0 - 1.0;
  p.x *= params.aspect;

  let pointer = vec2f(
    (params.pointer.x * 2.0 - 1.0) * params.aspect,
    params.pointer.y * 2.0 - 1.0
  );
  let pointerDistance = distance(p, pointer);
  let pull = exp(-pointerDistance * 2.6) * params.energy;

  let t = params.time * 0.16;
  let waveA = sin(p.x * 2.35 + sin(p.y * 1.65 - t) + t * 1.2);
  let waveB = cos(p.y * 2.7 - cos(p.x * 1.4 + t) - t * 0.75);
  let waveC = sin(length(p - vec2f(0.72, -0.14)) * 4.1 - t * 1.4);
  let field = 0.5 + 0.18 * waveA + 0.16 * waveB + 0.1 * waveC + pull * 0.22;

  let contour = pow(1.0 - abs(fract(field * 5.0) * 2.0 - 1.0), 8.0);
  let halo = exp(-pointerDistance * 3.4) * params.energy;
  var color = palette(clamp(field + halo * 0.16, 0.0, 1.0), params.theme);
  color += contour * mix(vec3f(0.08, 0.12, 0.1), vec3f(0.18, 0.25, 0.22), params.theme) * 0.34;

  let vignette = smoothstep(1.35, 0.18, length((uv - 0.5) * vec2f(1.0, 0.78)));
  color *= mix(0.82, 1.06, vignette);
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
    let pointer = { x: 0.68, y: 0.42, energy: 0 };
    let cleanupGpu: (() => void) | undefined;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onPointerMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointer = {
        x: (event.clientX - bounds.left) / bounds.width,
        y: (event.clientY - bounds.top) / bounds.height,
        energy: event.pointerType === "touch" ? 0.65 : 1,
      };
    };
    const onPointerLeave = () => {
      pointer = { ...pointer, energy: 0 };
    };

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry?.isIntersecting ?? false;
    });
    observer.observe(canvas);
    canvas.addEventListener("pointermove", onPointerMove, { passive: true });
    canvas.addEventListener("pointerleave", onPointerLeave, { passive: true });

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
          label: "home-credible-field",
          set: {
            params: {
              time: 0,
              aspect: output.size[0] / Math.max(output.size[1], 1),
              pointer: [pointer.x, pointer.y],
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
              pointer.energy += (0 - pointer.energy) * 0.018;
              field.set({
                params: {
                  time: gpuClock.time,
                  pointer: [pointer.x, pointer.y],
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
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
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

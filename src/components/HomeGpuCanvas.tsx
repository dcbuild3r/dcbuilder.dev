"use client";

import { useEffect, useRef, useState } from "react";

const SHADER = /* wgsl */ `
struct Params {
  time: f32,
  aspect: f32,
  pointer: vec2f,
  energy: f32,
  theme: f32,
  click: vec2f,
  clickAge: f32,
  press: f32,
}

@group(0) @binding(0) var<uniform> params: Params;

fn palette(t: f32, theme: f32) -> vec3f {
  let darkA = vec3f(0.02, 0.02, 0.022);
  let darkB = vec3f(0.4, 0.05, 0.05);
  let darkC = vec3f(0.6, 0.58, 0.56);
  let lightA = vec3f(0.957, 0.945, 0.918);
  let lightB = vec3f(0.66, 0.65, 0.63);
  let lightC = vec3f(0.8, 0.22, 0.13);
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
  let pull = exp(-pointerDistance * 2.6) * params.energy * (1.0 + params.press * 1.6);

  let t = params.time * 0.2;
  // Domain warp: two rounds of swirling offsets make the bands fold over each other.
  var q = p * 2.1;
  q += 0.42 * vec2f(sin(q.y * 1.7 + t * 1.3), cos(q.x * 1.9 - t * 1.1));
  q += 0.24 * vec2f(cos(q.y * 3.3 - t * 1.7), sin(q.x * 2.9 + t * 1.5));
  let waveA = sin(q.x * 2.35 + sin(q.y * 1.65 - t) + t * 1.2);
  let waveB = cos(q.y * 2.7 - cos(q.x * 1.4 + t) - t * 0.75);
  let waveC = sin(length(q - vec2f(1.5, -0.3)) * 4.1 - t * 1.4);
  let waveD = sin(q.x * 5.3 - q.y * 4.1 + t * 2.1) * cos(q.y * 4.7 + t * 1.6);

  // A click sends one expanding ring; holding and dragging keeps emitting rings from the pointer.
  let clickPos = vec2f((params.click.x * 2.0 - 1.0) * params.aspect, params.click.y * 2.0 - 1.0);
  let clickDistance = distance(p, clickPos);
  let ring = sin((clickDistance - params.clickAge * 0.9) * 16.0)
    * exp(-abs(clickDistance - params.clickAge * 0.9) * 3.2)
    * exp(-params.clickAge * 1.1);
  let drag = sin(pointerDistance * 18.0 - params.time * 7.0) * exp(-pointerDistance * 2.4) * params.press;

  let field = 0.5 + 0.17 * waveA + 0.15 * waveB + 0.09 * waveC + 0.06 * waveD
    + pull * 0.22 + ring * 0.38 + drag * 0.18;

  let contour = pow(1.0 - abs(fract(field * 7.0) * 2.0 - 1.0), 8.0);
  let halo = exp(-pointerDistance * 3.4) * params.energy;
  var color = palette(clamp(field + halo * 0.16, 0.0, 1.0), params.theme);
  color += contour * mix(vec3f(0.1, 0.09, 0.08), vec3f(0.26, 0.22, 0.22), params.theme) * 0.34;

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
    let click = { x: 0.5, y: 0.5, at: -100 };
    let pressed = false;
    let press = 0;
    let now = 0;
    // The hero content sits on top of the canvas, so listen on the whole section.
    const target: HTMLElement = canvas.closest<HTMLElement>(".home-landing") ?? canvas;
    let cleanupGpu: (() => void) | undefined;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onPointerMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      // Energy builds with distance travelled, so a small nudge barely registers and a sweep saturates.
      const travelled = Math.hypot((x - pointer.x) * bounds.width, (y - pointer.y) * bounds.height);
      const cap = event.pointerType === "touch" ? 0.65 : 1;
      pointer = { x, y, energy: Math.min(cap, pointer.energy + travelled / 600) };
    };
    const onPointerLeave = () => {
      pointer = { ...pointer, energy: 0 };
      pressed = false;
    };
    const onPointerDown = (event: PointerEvent) => {
      onPointerMove(event);
      pointer.energy = Math.max(pointer.energy, 0.6);
      pressed = true;
      click = { x: pointer.x, y: pointer.y, at: now };
    };
    const onPointerUp = () => {
      pressed = false;
    };

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry?.isIntersecting ?? false;
    });
    observer.observe(canvas);
    target.addEventListener("pointermove", onPointerMove, { passive: true });
    target.addEventListener("pointerleave", onPointerLeave, { passive: true });
    target.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });

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
              click: [click.x, click.y],
              clickAge: 100,
              press: 0,
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
              now = gpuClock.time;
              if (!pressed) pointer.energy += (0 - pointer.energy) * 0.03;
              press += ((pressed ? 1 : 0) - press) * 0.12;
              field.set({
                params: {
                  time: gpuClock.time,
                  pointer: [pointer.x, pointer.y],
                  energy: pointer.energy,
                  click: [click.x, click.y],
                  clickAge: gpuClock.time - click.at,
                  press,
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
      target.removeEventListener("pointermove", onPointerMove);
      target.removeEventListener("pointerleave", onPointerLeave);
      target.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
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

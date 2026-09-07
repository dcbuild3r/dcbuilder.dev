'use client';

import {
  type PointerEvent as ReactPointerEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type WheelEvent as ReactWheelEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from 'next-themes';

let mermaidRenderQueue = Promise.resolve();

const MIN_SCALE = 0.5;
const MAX_SCALE = 4;
const SCALE_STEP = 0.25;

type MermaidTheme = 'default' | 'dark';
type PanPosition = { x: number; y: number };

function clampScale(scale: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

function queueMermaidRender(id: string, source: string, theme: MermaidTheme) {
  const render = async () => {
    const { default: mermaid } = await import('mermaid');
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme,
      fontFamily: 'var(--font-inter), system-ui, sans-serif',
    });

    return mermaid.render(id, source);
  };

  const result = mermaidRenderQueue.then(render, render);
  mermaidRenderQueue = result.then(
    () => undefined,
    () => undefined
  );

  return result;
}

function MermaidCanvas({
  source,
  theme,
  className,
  onRender,
}: {
  source: string;
  theme: MermaidTheme;
  className: string;
  onRender?: (error: unknown | null, aspectRatio?: number) => void;
}) {
  const reactId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const container = containerRef.current;
    const id = `mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

    void queueMermaidRender(id, source, theme)
      .then(({ svg, bindFunctions }) => {
        if (!active || !container) return;
        container.innerHTML = svg;
        bindFunctions?.(container);
        const viewBox = container.querySelector('svg')?.viewBox.baseVal;
        const aspectRatio = viewBox?.height ? viewBox.width / viewBox.height : undefined;
        onRender?.(null, aspectRatio);
      })
      .catch((error: unknown) => {
        if (!active) return;
        onRender?.(error);
      });

    return () => {
      active = false;
      if (container) container.innerHTML = '';
    };
  }, [onRender, reactId, source, theme]);

  return <div ref={containerRef} className={className} />;
}

function ViewerIcon({ type }: { type: 'close' | 'expand' | 'minus' | 'plus' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {type === 'plus' && (
        <>
          <circle cx="11" cy="11" r="7" />
          <path d="M11 8v6M8 11h6M16 16l5 5" />
        </>
      )}
      {type === 'minus' && (
        <>
          <circle cx="11" cy="11" r="7" />
          <path d="M8 11h6M16 16l5 5" />
        </>
      )}
      {type === 'close' && <path d="M6 6l12 12M18 6 6 18" />}
      {type === 'expand' && (
        <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5M3 8l6-6M21 8l-6-6M21 16l-6 6M3 16l6 6" />
      )}
    </svg>
  );
}

function MermaidDiagramViewer({
  source,
  theme,
  onClose,
}: {
  source: string;
  theme: MermaidTheme;
  onClose: () => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origin: PanPosition;
  } | null>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState<PanPosition>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const resetView = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const zoomBy = useCallback((amount: number) => {
    setScale((currentScale) => clampScale(currentScale + amount));
  }, []);

  const handleModalRender = useCallback((error: unknown | null) => {
    setRenderError(
      error ? (error instanceof Error ? error.message : 'Unable to render this diagram.') : null
    );
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        zoomBy(SCALE_STEP);
        return;
      }

      if (event.key === '-') {
        event.preventDefault();
        zoomBy(-SCALE_STEP);
        return;
      }

      if (event.key === '0') {
        event.preventDefault();
        resetView();
        return;
      }

      const arrowDeltas: Record<string, PanPosition> = {
        ArrowUp: { x: 0, y: 32 },
        ArrowDown: { x: 0, y: -32 },
        ArrowLeft: { x: 32, y: 0 },
        ArrowRight: { x: -32, y: 0 },
      };
      const arrowDelta = arrowDeltas[event.key];
      if (arrowDelta) {
        event.preventDefault();
        setPan((currentPan) => ({
          x: currentPan.x + arrowDelta.x,
          y: currentPan.y + arrowDelta.y,
        }));
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose, resetView, zoomBy]
  );

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    zoomBy(event.deltaY < 0 ? SCALE_STEP : -SCALE_STEP);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: pan,
    };
    setIsPanning(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setPan({
      x: drag.origin.x + event.clientX - drag.startX,
      y: drag.origin.y + event.clientY - drag.startY,
    });
  };

  const finishPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setIsPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return createPortal(
    <div
      ref={dialogRef}
      className="mermaid-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={handleKeyDown}
    >
      <h2 id={titleId} className="sr-only">
        Expanded Mermaid diagram
      </h2>

      <div
        className={`mermaid-modal-viewport${isPanning ? ' is-panning' : ''}`}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPan}
        onPointerCancel={finishPan}
        onDoubleClick={resetView}
        aria-label="Diagram canvas. Drag to pan, scroll to zoom, or use the toolbar controls."
      >
        <div
          className="mermaid-modal-transform"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
          }}
        >
          {renderError ? (
            <p className="mermaid-modal-error">{renderError}</p>
          ) : (
            <MermaidCanvas
              source={source}
              theme={theme}
              className="mermaid-modal-canvas"
              onRender={handleModalRender}
            />
          )}
        </div>
      </div>

      <div className="mermaid-modal-toolbar" aria-label="Diagram controls">
        <button
          type="button"
          onClick={() => zoomBy(-SCALE_STEP)}
          disabled={scale <= MIN_SCALE}
          aria-label="Zoom out"
          title="Zoom out (-)"
        >
          <ViewerIcon type="minus" />
        </button>
        <button
          type="button"
          onClick={resetView}
          className="mermaid-modal-zoom-level"
          aria-label={`Reset zoom and position. Current zoom ${Math.round(scale * 100)} percent`}
          title="Reset view (0)"
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          type="button"
          onClick={() => zoomBy(SCALE_STEP)}
          disabled={scale >= MAX_SCALE}
          aria-label="Zoom in"
          title="Zoom in (+)"
        >
          <ViewerIcon type="plus" />
        </button>
        <span className="mermaid-modal-divider" aria-hidden="true" />
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close expanded diagram"
          title="Close (Escape)"
        >
          <ViewerIcon type="close" />
        </button>
      </div>
    </div>,
    document.body
  );
}

export function MermaidDiagram({ source }: { source: string }) {
  const openerRef = useRef<HTMLButtonElement>(null);
  const { resolvedTheme } = useTheme();
  const theme: MermaidTheme = resolvedTheme === 'dark' ? 'dark' : 'default';
  const renderKey = `${theme}:${source}`;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isWideDiagram, setIsWideDiagram] = useState(false);
  const [renderError, setRenderError] = useState<{
    key: string;
    message: string;
  } | null>(null);

  const handleRender = useCallback(
    (error: unknown | null, aspectRatio?: number) => {
      if (!error) {
        setRenderError(null);
        setIsWideDiagram(typeof aspectRatio === 'number' && aspectRatio >= 1.5);
        return;
      }
      setRenderError({
        key: renderKey,
        message: error instanceof Error ? error.message : 'Unable to render this diagram.',
      });
    },
    [renderKey]
  );

  const closeViewer = useCallback(() => {
    setIsExpanded(false);
    requestAnimationFrame(() => openerRef.current?.focus());
  }, []);

  if (renderError?.key === renderKey) {
    return (
      <figure className="mermaid-diagram mermaid-diagram-error">
        <figcaption>Diagram could not be rendered: {renderError.message}</figcaption>
        <pre>
          <code>{source}</code>
        </pre>
      </figure>
    );
  }

  return (
    <>
      <figure
        className={`mermaid-diagram${isWideDiagram ? ' mermaid-diagram-wide' : ''}`}
        role="group"
        aria-label="Mermaid diagram"
      >
        <MermaidCanvas
          source={source}
          theme={theme}
          className="mermaid-diagram-canvas"
          onRender={handleRender}
        />
        <button
          ref={openerRef}
          type="button"
          className="mermaid-diagram-expand"
          onClick={() => setIsExpanded(true)}
          aria-label="Open diagram in interactive viewer"
          title="Open interactive diagram viewer"
        >
          <span>
            <ViewerIcon type="expand" />
            <span>Expand diagram</span>
          </span>
        </button>
      </figure>

      {isExpanded && <MermaidDiagramViewer source={source} theme={theme} onClose={closeViewer} />}
    </>
  );
}

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

export interface SignaturePadHandle {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: () => string | null;
}

// Pad de firma en canvas. Soporta ratón y táctil.
export const SignaturePad = forwardRef<SignaturePadHandle, { className?: string }>(
  function SignaturePad({ className = "" }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const dirty = useRef(false);
    const last = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current!;
      const ratio = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#1F2937";
    }, []);

    function pos(e: PointerEvent | React.PointerEvent) {
      const rect = canvasRef.current!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function start(e: React.PointerEvent) {
      drawing.current = true;
      last.current = pos(e);
      canvasRef.current!.setPointerCapture(e.pointerId);
    }
    function move(e: React.PointerEvent) {
      if (!drawing.current) return;
      const ctx = canvasRef.current!.getContext("2d")!;
      const p = pos(e);
      ctx.beginPath();
      ctx.moveTo(last.current!.x, last.current!.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last.current = p;
      dirty.current = true;
    }
    function end() {
      drawing.current = false;
      last.current = null;
    }

    useImperativeHandle(ref, () => ({
      clear: () => {
        const canvas = canvasRef.current!;
        canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
        dirty.current = false;
      },
      isEmpty: () => !dirty.current,
      toDataURL: () => (dirty.current ? canvasRef.current!.toDataURL("image/png") : null),
    }));

    return (
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className={`w-full touch-none rounded-xl border border-slate-200 bg-white ${className}`}
        style={{ height: 160 }}
      />
    );
  }
);

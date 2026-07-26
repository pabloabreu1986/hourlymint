import { useEffect, useRef, type CSSProperties } from "react";

interface LiquidHoverProps {
  imageSrc?: string;
  resolution?: number;
  cursorSize?: number;
  intensity?: number;
  fit?: "cover" | "contain";
  style?: CSSProperties;
}

const DEFAULT_IMAGE =
  "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/041b1d75-2371-44dc-4b15-972ecd7b2400/w=800";

export default function LiquidHover({
  imageSrc = DEFAULT_IMAGE,
  resolution = 10,
  cursorSize = 50,
  intensity = 50,
  fit = "cover",
  style,
}: LiquidHoverProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;

    let animationFrame = 0;
    let resizeObserver: ResizeObserver | undefined;
    let lastTime = 0;
    let pointerX = 0.5;
    let pointerY = 0.5;
    let targetX = 0.5;
    let targetY = 0.5;
    let energy = 0;
    let targetEnergy = 0;
    let previousX = 0.5;
    let previousY = 0.5;
    let width = 1;
    let height = 1;
    let dpr = 1;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const updatePointer = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      targetX = (clientX - rect.left) / Math.max(1, rect.width);
      targetY = (clientY - rect.top) / Math.max(1, rect.height);
      const velocity = Math.hypot(targetX - previousX, targetY - previousY);
      targetEnergy = Math.min(1, targetEnergy + velocity * (cursorSize / 2));
      previousX = targetX;
      previousY = targetY;
    };

    const onPointerMove = (event: PointerEvent) => updatePointer(event.clientX, event.clientY);
    const onPointerLeave = () => {
      targetX = 0.5;
      targetY = 0.5;
      targetEnergy = 0;
    };

    const draw = (time: number) => {
      const dt = Math.min(32, time - lastTime || 16);
      lastTime = time;
      pointerX += (targetX - pointerX) * 0.1;
      pointerY += (targetY - pointerY) * 0.1;
      energy += (targetEnergy - energy) * 0.08;
      targetEnergy *= Math.pow(0.94, dt / 16);

      context.clearRect(0, 0, width, height);
      if (image.complete && image.naturalWidth) {
        const imageRatio = image.naturalWidth / image.naturalHeight;
        const frameRatio = width / height;
        const cover = fit === "cover";
        const byWidth = cover ? frameRatio > imageRatio : frameRatio < imageRatio;
        const sourceWidth = byWidth ? image.naturalWidth : image.naturalHeight * frameRatio;
        const sourceHeight = byWidth ? image.naturalWidth / frameRatio : image.naturalHeight;
        const sourceX = (image.naturalWidth - sourceWidth) / 2;
        const sourceY = (image.naturalHeight - sourceHeight) / 2;
        const bands = Math.max(48, Math.round(36 + resolution * 10));
        const bandHeight = height / bands;
        const amplitude = intensity * 0.55 * energy;

        for (let index = 0; index < bands; index++) {
          const y = index * bandHeight;
          const normalizedY = y / height;
          const distance = normalizedY - pointerY;
          const influence = Math.exp(-(distance * distance) / 0.055);
          const wave = Math.sin(normalizedY * 22 + time * 0.008 + pointerX * 5);
          const displacement = amplitude * influence * wave;
          const sourceBandY = sourceY + (normalizedY * sourceHeight);
          const sourceBandHeight = sourceHeight / bands + 1;

          context.drawImage(
            image,
            sourceX,
            sourceBandY,
            sourceWidth,
            sourceBandHeight,
            displacement,
            y,
            width,
            bandHeight + 1,
          );
        }
      }

      animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);
    animationFrame = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [cursorSize, fit, imageSrc, intensity, resolution]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={style}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

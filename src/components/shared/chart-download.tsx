"use client";

import { useRef, useCallback } from "react";
import { Download } from "lucide-react";

interface ChartDownloadProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

function inlineStyles(clone: SVGElement, original: SVGElement) {
  const cloneEls = clone.querySelectorAll("*");
  const origEls = original.querySelectorAll("*");
  for (let i = 0; i < cloneEls.length; i++) {
    const comp = window.getComputedStyle(origEls[i]);
    const el = cloneEls[i] as SVGElement;
    el.setAttribute("fill", comp.fill || "none");
    el.setAttribute("stroke", comp.stroke || "none");
    el.setAttribute("stroke-width", comp.strokeWidth || "0");
    el.setAttribute("font-size", comp.fontSize || "12px");
    el.setAttribute("font-family", "system-ui, sans-serif");
    el.setAttribute("font-weight", comp.fontWeight || "400");
    el.setAttribute("opacity", comp.opacity || "1");
    // Resolve color values
    if (comp.color) el.setAttribute("fill", comp.color);
    if (comp.strokeDasharray && comp.strokeDasharray !== "none") {
      el.setAttribute("stroke-dasharray", comp.strokeDasharray);
    }
  }
}

function drawSvgToCanvas(
  ctx: CanvasRenderingContext2D,
  svg: SVGElement,
  original: SVGElement,
  x: number,
  y: number,
  w: number,
  h: number,
): Promise<void> {
  const clone = svg.cloneNode(true) as SVGElement;
  inlineStyles(clone, original);
  clone.setAttribute("width", String(w));
  clone.setAttribute("height", String(h));
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  const svgData = new XMLSerializer().serializeToString(clone);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, x, y, w, h);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  });
}

export function ChartDownload({ title, children, className }: ChartDownloadProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;
    const svg = container.querySelector("svg");
    if (!svg) return;

    const scale = 2;
    const padding = 24;
    const titleHeight = 32;
    const svgW = svg.clientWidth;
    const svgH = svg.clientHeight;

    // Collect legend items — find small colored dots (inline backgroundColor) + parent text
    const legendItems: { color: string; text: string }[] = [];
    container.querySelectorAll<HTMLElement>("div[style]").forEach((el) => {
      const bg = el.style.backgroundColor;
      if (!bg) return;
      // Small colored elements (<14px) are legend dots
      const rect = el.getBoundingClientRect();
      if (rect.width > 14 || rect.height > 14) return;
      const parent = el.parentElement;
      if (!parent) return;
      const text = parent.textContent?.trim() || "";
      if (text) legendItems.push({ color: bg, text });
    });

    const legendHeight = legendItems.length > 0 ? legendItems.length * 20 + 16 : 0;
    const totalW = svgW + padding * 2;
    const totalH = titleHeight + svgH + legendHeight + padding * 2;

    const canvas = document.createElement("canvas");
    canvas.width = totalW * scale;
    canvas.height = totalH * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(scale, scale);

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, totalW, totalH);

    // Title
    const titleEl = container.querySelector("h3, p.text-xs.font-semibold");
    const titleText = titleEl?.textContent || title || "";
    if (titleText) {
      ctx.fillStyle = "#1a1a1a";
      ctx.font = "bold 13px system-ui, sans-serif";
      ctx.fillText(titleText, padding, padding + 16);
    }

    // SVG chart
    await drawSvgToCanvas(ctx, svg, svg, padding, titleHeight + padding, svgW, svgH);

    // Legend items (below chart)
    if (legendItems.length > 0) {
      const legendY = titleHeight + svgH + padding + 8;
      legendItems.forEach((item, i) => {
        const y = legendY + i * 20;
        // Colored dot
        ctx.beginPath();
        ctx.arc(padding + 6, y + 4, 5, 0, Math.PI * 2);
        ctx.fillStyle = item.color;
        ctx.fill();
        // Text
        ctx.fillStyle = "#555";
        ctx.font = "12px system-ui, sans-serif";
        ctx.fillText(item.text, padding + 18, y + 8);
      });
    }

    // Download
    const link = document.createElement("a");
    link.download = `${(title ?? "chart").replace(/[^a-zA-Z0-9]/g, "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [title]);

  return (
    <div ref={containerRef} className={`group/chart relative ${className ?? ""}`}>
      {children}
      <button
        onClick={handleDownload}
        title="Download chart as PNG"
        className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 border border-border/50 text-muted-foreground opacity-0 group-hover/chart:opacity-100 hover:text-foreground hover:bg-background transition-all z-10"
      >
        <Download className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

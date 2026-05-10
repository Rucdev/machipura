"use client";

import { useEffect, useRef, useState } from "react";

type Place = {
  id: string;
  name: string;
  coordinate: { x: number; y: number };
  category: { id: string; label: string; isStation: boolean };
};
type Path = {
  id: string;
  fromPlaceId: string;
  toPlaceId: string;
  transport: string;
  distanceKm: number;
};
type LogEntry = {
  placeId: string;
  action: string;
  arrivedAt: string;
};

type Props = {
  places: Place[];
  paths: Path[];
  logs: LogEntry[];
};

const PLACE_RADIUS = 10;
const CANVAS_W = 640;
const CANVAS_H = 480;
const BUBBLE_PADDING = 6;
const BUBBLE_MAX_W = 140;
const BUBBLE_FONT = "11px sans-serif";

const PALETTE = [
  "#a16207", "#16a34a", "#2563eb", "#dc2626",
  "#7c3aed", "#0891b2", "#d97706", "#6b7280",
  "#db2777", "#059669",
];

function categoryColor(categoryId: string): string {
  let hash = 0;
  for (let i = 0; i < categoryId.length; i++) {
    hash = (hash * 31 + categoryId.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

const TRANSPORT_COLORS: Record<string, string> = {
  walk: "#9ca3af",
  bicycle: "#16a34a",
  car: "#dc2626",
  train: "#2563eb",
  bus: "#d97706",
};

type Theme = { grid: string; label: string; dimPlace: string; routeLine: string; bubbleBg: string; bubbleBorder: string; bubbleText: string };
const LIGHT: Theme = {
  grid: "#f0f0f0", label: "#1f2937", dimPlace: "#d1d5db",
  routeLine: "#6366f1", bubbleBg: "#ffffff", bubbleBorder: "#6366f1", bubbleText: "#1f2937",
};
const DARK: Theme = {
  grid: "#2d2d2d", label: "#e5e7eb", dimPlace: "#374151",
  routeLine: "#818cf8", bubbleBg: "#1e1b4b", bubbleBorder: "#818cf8", bubbleText: "#e0e7ff",
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split("");
  const lines: string[] = [];
  let line = "";
  for (const ch of words) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxW && line.length > 0) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawBubble(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  text: string,
  theme: Theme,
  index: number,
  total: number,
) {
  ctx.font = BUBBLE_FONT;
  const lines = wrapText(ctx, text, BUBBLE_MAX_W - BUBBLE_PADDING * 2);
  const lineH = 14;
  const bw = BUBBLE_MAX_W;
  const bh = lines.length * lineH + BUBBLE_PADDING * 2;
  const tailH = 8;

  const above = (index / total) < 0.5;
  const bx = Math.max(2, Math.min(CANVAS_W - bw - 2, cx - bw / 2));
  const by = above
    ? cy - PLACE_RADIUS - tailH - bh - 2
    : cy + PLACE_RADIUS + tailH + 2;

  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 4);
  ctx.fillStyle = theme.bubbleBg;
  ctx.fill();
  ctx.strokeStyle = theme.bubbleBorder;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const tailX = Math.min(Math.max(cx, bx + 10), bx + bw - 10);
  ctx.beginPath();
  if (above) {
    ctx.moveTo(tailX - 5, by + bh);
    ctx.lineTo(tailX + 5, by + bh);
    ctx.lineTo(tailX, by + bh + tailH);
  } else {
    ctx.moveTo(tailX - 5, by);
    ctx.lineTo(tailX + 5, by);
    ctx.lineTo(tailX, by - tailH);
  }
  ctx.closePath();
  ctx.fillStyle = theme.bubbleBg;
  ctx.fill();
  ctx.strokeStyle = theme.bubbleBorder;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = theme.bubbleText;
  ctx.textAlign = "left";
  lines.forEach((line, i) => {
    ctx.fillText(line, bx + BUBBLE_PADDING, by + BUBBLE_PADDING + (i + 1) * lineH - 2);
  });
}

function render(
  ctx: CanvasRenderingContext2D,
  places: Place[],
  paths: Path[],
  logs: LogEntry[],
  theme: Theme,
  bgColor: string,
) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.strokeStyle = theme.grid;
  ctx.lineWidth = 1;
  for (let x = 0; x <= CANVAS_W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke(); }
  for (let y = 0; y <= CANVAS_H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke(); }

  const placeById = new Map(places.map((p) => [p.id, p]));
  const visitedIds = new Set(logs.map((l) => l.placeId));

  for (const path of paths) {
    const from = placeById.get(path.fromPlaceId);
    const to = placeById.get(path.toPlaceId);
    if (!from || !to) continue;

    const onRoute = visitedIds.has(path.fromPlaceId) && visitedIds.has(path.toPlaceId);
    const color = onRoute ? (TRANSPORT_COLORS[path.transport] ?? "#9ca3af") : theme.dimPlace;
    ctx.beginPath();
    ctx.moveTo(from.coordinate.x, from.coordinate.y);
    ctx.lineTo(to.coordinate.x, to.coordinate.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = onRoute ? 3 : 1;
    ctx.setLineDash(onRoute ? [] : [4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (logs.length >= 2) {
    ctx.strokeStyle = theme.routeLine;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    const first = placeById.get(logs[0].placeId);
    if (first) ctx.moveTo(first.coordinate.x, first.coordinate.y);
    for (let i = 1; i < logs.length; i++) {
      const p = placeById.get(logs[i].placeId);
      if (p) ctx.lineTo(p.coordinate.x, p.coordinate.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  for (const place of places) {
    const { x, y } = place.coordinate;
    const onRoute = visitedIds.has(place.id);
    const color = onRoute ? categoryColor(place.category.id) : theme.dimPlace;

    ctx.beginPath();
    ctx.arc(x, y, PLACE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = bgColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = "bold 11px sans-serif";
    ctx.fillStyle = onRoute ? theme.label : theme.dimPlace;
    ctx.textAlign = "center";
    ctx.fillText(place.name, x, y - PLACE_RADIUS - 4);
  }

  const midLogs = logs.slice(1, -1);
  midLogs.forEach((log, i) => {
    const place = placeById.get(log.placeId);
    if (!place) return;
    drawBubble(ctx, place.coordinate.x, place.coordinate.y, log.action, theme, i, midLogs.length);
  });

  const startLog = logs[0];
  const startPlace = startLog ? placeById.get(startLog.placeId) : null;
  if (startPlace) {
    ctx.beginPath();
    ctx.arc(startPlace.coordinate.x, startPlace.coordinate.y, PLACE_RADIUS + 5, 0, Math.PI * 2);
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = "bold 10px sans-serif";
    ctx.fillStyle = "#6366f1";
    ctx.textAlign = "center";
    ctx.fillText("▶", startPlace.coordinate.x, startPlace.coordinate.y + 3);
  }

  const goalLog = logs[logs.length - 1];
  const goalPlace = goalLog && goalLog !== startLog ? placeById.get(goalLog.placeId) : null;
  if (goalPlace) {
    ctx.beginPath();
    ctx.arc(goalPlace.coordinate.x, goalPlace.coordinate.y, PLACE_RADIUS + 5, 0, Math.PI * 2);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = "bold 10px sans-serif";
    ctx.fillStyle = "#f59e0b";
    ctx.textAlign = "center";
    ctx.fillText("★", goalPlace.coordinate.x, goalPlace.coordinate.y + 3);
  }
}

export function JourneyCanvas({ places, paths, logs }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const theme = isDark ? DARK : LIGHT;
    const bgColor = isDark ? "#111827" : "#ffffff";
    render(ctx, places, paths, logs, theme, bgColor);
  }, [places, paths, logs, isDark]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      className="border border-gray-200 dark:border-gray-700 rounded w-full"
      style={{ maxWidth: CANVAS_W }}
    />
  );
}

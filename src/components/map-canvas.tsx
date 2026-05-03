"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { CategoryValue } from "@/domain/shared/category";

type Place = {
  id: string;
  name: string;
  coordinate: { x: number; y: number };
  category: { value: CategoryValue };
  businessHours: { openHour: number; openMinute: number; closeHour: number; closeMinute: number };
};
type Path = {
  id: string;
  fromPlaceId: string;
  toPlaceId: string;
  transport: string;
  distanceKm: number;
};

export type CanvasMode = "normal" | "edit";

type Props = {
  places: Place[];
  paths: Path[];
  selectedPlaceId: string | null;
  pendingCoord: { x: number; y: number } | null;
  mode: CanvasMode;
  isOwner: boolean;
  onSelectPlace: (id: string | null) => void;
  onClickEmpty: (x: number, y: number) => void;
  onMovePlace: (id: string, x: number, y: number) => void;
  onConnectPlaces: (fromId: string, toId: string) => void;
};

const PLACE_RADIUS = 10;
const CANVAS_W = 640;
const CANVAS_H = 480;

const CATEGORY_COLORS: Record<CategoryValue, string> = {
  cafe: "#a16207",
  park: "#16a34a",
  station: "#2563eb",
  restaurant: "#dc2626",
  shop: "#7c3aed",
  museum: "#0891b2",
  hotel: "#d97706",
  other: "#6b7280",
};

const TRANSPORT_COLORS: Record<string, string> = {
  walk: "#9ca3af",
  bicycle: "#16a34a",
  car: "#dc2626",
  train: "#2563eb",
  bus: "#d97706",
};

type Theme = { grid: string; pathLabel: string; label: string; pendingFill: string };
const LIGHT: Theme = { grid: "#f0f0f0", pathLabel: "#6b7280", label: "#1f2937", pendingFill: "rgba(99,102,241,0.4)" };
const DARK: Theme  = { grid: "#2d2d2d", pathLabel: "#6b7280", label: "#e5e7eb", pendingFill: "rgba(129,140,248,0.5)" };

function renderCanvas(
  ctx: CanvasRenderingContext2D,
  places: Place[],
  paths: Path[],
  selectedPlaceId: string | null,
  pendingCoord: { x: number; y: number } | null,
  draggingLine: { fromX: number; fromY: number; toX: number; toY: number } | null,
  mode: CanvasMode,
  theme: Theme,
  bgColor: string,
) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // grid
  ctx.strokeStyle = theme.grid;
  ctx.lineWidth = 1;
  for (let x = 0; x <= CANVAS_W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke(); }
  for (let y = 0; y <= CANVAS_H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke(); }

  const placeById = new Map(places.map((p) => [p.id, p]));

  // paths
  for (const path of paths) {
    const from = placeById.get(path.fromPlaceId);
    const to = placeById.get(path.toPlaceId);
    if (!from || !to) continue;
    const color = TRANSPORT_COLORS[path.transport] ?? "#9ca3af";
    ctx.beginPath();
    ctx.moveTo(from.coordinate.x, from.coordinate.y);
    ctx.lineTo(to.coordinate.x, to.coordinate.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    const mx = (from.coordinate.x + to.coordinate.x) / 2;
    const my = (from.coordinate.y + to.coordinate.y) / 2;
    ctx.font = "10px sans-serif";
    ctx.fillStyle = theme.pathLabel;
    ctx.textAlign = "center";
    ctx.fillText(`${path.transport} ${path.distanceKm.toFixed(1)}`, mx, my - 4);
  }

  // dragging line (normal mode: drawing new path)
  if (draggingLine) {
    ctx.beginPath();
    ctx.moveTo(draggingLine.fromX, draggingLine.fromY);
    ctx.lineTo(draggingLine.toX, draggingLine.toY);
    ctx.strokeStyle = "rgba(99,102,241,0.7)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // places
  for (const place of places) {
    const { x, y } = place.coordinate;
    const isSelected = place.id === selectedPlaceId;
    const color = CATEGORY_COLORS[place.category.value];

    if (isSelected) {
      ctx.beginPath();
      ctx.arc(x, y, PLACE_RADIUS + 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(99,102,241,0.2)";
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(x, y, PLACE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = isSelected ? "#6366f1" : bgColor;
    ctx.lineWidth = isSelected ? 2 : 1.5;
    ctx.stroke();

    // 編集モードはアイコン表示
    if (mode === "edit") {
      ctx.font = "bold 9px sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.textAlign = "center";
      ctx.fillText("✎", x, y + 3);
    }

    ctx.font = "bold 11px sans-serif";
    ctx.fillStyle = theme.label;
    ctx.textAlign = "center";
    ctx.fillText(place.name, x, y - PLACE_RADIUS - 4);
  }

  // pending coord
  if (pendingCoord) {
    ctx.beginPath();
    ctx.arc(pendingCoord.x, pendingCoord.y, PLACE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = theme.pendingFill;
    ctx.fill();
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 2]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

export function MapCanvas({
  places,
  paths,
  selectedPlaceId,
  pendingCoord,
  mode,
  isOwner,
  onSelectPlace,
  onClickEmpty,
  onMovePlace,
  onConnectPlaces,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDark, setIsDark] = useState(false);

  // edit mode: drag to move
  const moveDragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const isMovingRef = useRef(false);

  // normal mode: drag from place to place for path
  const pathDragRef = useRef<{ fromId: string; fromX: number; fromY: number } | null>(null);
  const [draggingLine, setDraggingLine] = useState<{ fromX: number; fromY: number; toX: number; toY: number } | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const theme = isDark ? DARK : LIGHT;
  const bgColor = isDark ? "#111827" : "#ffffff";

  const draw = useCallback((overrideLine?: { fromX: number; fromY: number; toX: number; toY: number } | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderCanvas(ctx, places, paths, selectedPlaceId, pendingCoord, overrideLine ?? draggingLine, mode, theme, bgColor);
  }, [places, paths, selectedPlaceId, pendingCoord, draggingLine, mode, theme, bgColor]);

  useEffect(() => { draw(); }, [draw]);

  function hitTest(cx: number, cy: number): Place | null {
    for (let i = places.length - 1; i >= 0; i--) {
      const p = places[i];
      const dx = cx - p.coordinate.x;
      const dy = cy - p.coordinate.y;
      if (Math.sqrt(dx * dx + dy * dy) <= PLACE_RADIUS + 4) return p;
    }
    return null;
  }

  function canvasXY(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: Math.round((e.clientX - rect.left) * (CANVAS_W / rect.width)),
      y: Math.round((e.clientY - rect.top) * (CANVAS_H / rect.height)),
    };
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isOwner) return;
    const { x, y } = canvasXY(e);
    const hit = hitTest(x, y);

    if (mode === "edit") {
      if (hit) {
        moveDragRef.current = { id: hit.id, offsetX: x - hit.coordinate.x, offsetY: y - hit.coordinate.y };
        isMovingRef.current = false;
      }
    } else {
      // normal mode: start drawing path from a place
      if (hit) {
        pathDragRef.current = { fromId: hit.id, fromX: hit.coordinate.x, fromY: hit.coordinate.y };
      }
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const { x, y } = canvasXY(e);

    if (mode === "edit" && moveDragRef.current) {
      isMovingRef.current = true;
      const nx = Math.max(PLACE_RADIUS, Math.min(CANVAS_W - PLACE_RADIUS, x - moveDragRef.current.offsetX));
      const ny = Math.max(PLACE_RADIUS, Math.min(CANVAS_H - PLACE_RADIUS, y - moveDragRef.current.offsetY));
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const movedPlaces = places.map((p) =>
        p.id === moveDragRef.current!.id ? { ...p, coordinate: { x: nx, y: ny } } : p
      );
      renderCanvas(ctx, movedPlaces, paths, moveDragRef.current.id, null, null, mode, theme, bgColor);
      return;
    }

    if (mode === "normal" && pathDragRef.current) {
      const line = { fromX: pathDragRef.current.fromX, fromY: pathDragRef.current.fromY, toX: x, toY: y };
      setDraggingLine(line);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      renderCanvas(ctx, places, paths, selectedPlaceId, pendingCoord, line, mode, theme, bgColor);
    }
  }

  function handleMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    const { x, y } = canvasXY(e);

    if (mode === "edit" && moveDragRef.current) {
      const d = moveDragRef.current;
      moveDragRef.current = null;
      if (isMovingRef.current) {
        const nx = Math.max(PLACE_RADIUS, Math.min(CANVAS_W - PLACE_RADIUS, x - d.offsetX));
        const ny = Math.max(PLACE_RADIUS, Math.min(CANVAS_H - PLACE_RADIUS, y - d.offsetY));
        onMovePlace(d.id, nx, ny);
      }
      isMovingRef.current = false;
      return;
    }

    if (mode === "normal" && pathDragRef.current) {
      const from = pathDragRef.current;
      pathDragRef.current = null;
      setDraggingLine(null);
      const hit = hitTest(x, y);
      if (hit && hit.id !== from.fromId) {
        onConnectPlaces(from.fromId, hit.id);
      }
    }
  }

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (mode === "edit" && isMovingRef.current) return;
    const { x, y } = canvasXY(e);
    const hit = hitTest(x, y);
    if (hit) {
      onSelectPlace(hit.id === selectedPlaceId ? null : hit.id);
    } else {
      onSelectPlace(null);
      if (isOwner && mode === "normal") onClickEmpty(x, y);
    }
  }

  const cursor = mode === "edit" ? "grab" : "crosshair";

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      className="border border-gray-200 dark:border-gray-700 rounded w-full"
      style={{ maxWidth: CANVAS_W, cursor }}
    />
  );
}

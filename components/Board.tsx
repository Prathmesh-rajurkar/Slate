"use client";

import React, { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import { Square, Circle, Triangle, Type, MousePointer2, Minus, Spline, Pen } from "lucide-react";
import { Button } from "@/components/ui/button";

type Tool = "select" | "rectangle" | "circle" | "triangle" | "text" | "line" | "curve" | "polyline";

const Board = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingShape, setDrawingShape] = useState<fabric.Object | null>(null);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [polylinePoints, setPolylinePoints] = useState<fabric.Point[]>([]);

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current && !canvas) {
      const canvasWidth = window.innerWidth - 100;
      const canvasHeight = window.innerHeight - 40;

      const initCanvas = new fabric.Canvas(canvasRef.current, {
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor: "#1a1a1a",
        selection: true,
      });

      // Custom control styling
      fabric.Object.prototype.set({
        borderColor: "#3b82f6",
        cornerColor: "#3b82f6",
        cornerStyle: "circle",
        borderDashArray: [5, 5],
        cornerSize: 10,
        transparentCorners: false,
        borderScaleFactor: 2,
      });

      setCanvas(initCanvas);

      return () => {
        initCanvas.dispose();
      };
    }
  }, []);

  // Handle keyboard shortcuts (Delete key)
  useEffect(() => {
    if (!canvas) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length > 0) {
          activeObjects.forEach((obj) => canvas.remove(obj));
          canvas.discardActiveObject();
          canvas.requestRenderAll();
        }
      }
      // Press Escape to finish polyline
      if (e.key === "Escape" && activeTool === "polyline") {
        if (drawingShape && polylinePoints.length > 1) {
          drawingShape.set({ selectable: true });
          canvas.setActiveObject(drawingShape);
        }
        setActiveTool("select");
        setPolylinePoints([]);
        setDrawingShape(null);
        if (canvas) canvas.defaultCursor = "default";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canvas, activeTool, drawingShape, polylinePoints]);

  // Handle double-click to add text
  useEffect(() => {
    if (!canvas) return;

    const handleDoubleClick = (opt: any) => {
      const pointer = canvas.getPointer(opt.e);
      
      // Check if double-clicked on a shape
      const target = canvas.findTarget(opt.e);
      
      if (target && target.type !== "i-text" && target.type !== "textbox") {
        // Add text inside the shape
        const bounds = target.getBoundingRect();
        const text = new fabric.IText("Text", {
          left: bounds.left + bounds.width / 2,
          top: bounds.top + bounds.height / 2,
          fontSize: 18,
          fill: "#ffffff",
          editable: true,
          selectable: true,
          originX: "center",
          originY: "center",
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        text.selectAll();
        text.enterEditing();
        text.hiddenTextarea?.focus();
      } else if (!target) {
        // Double-click on empty canvas
        const text = new fabric.IText("Type here...", {
          left: pointer.x,
          top: pointer.y,
          fontSize: 20,
          fill: "#ffffff",
          editable: true,
          selectable: true,
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        text.selectAll();
        text.enterEditing();
        text.hiddenTextarea?.focus();
      }
    };

    canvas.on("mouse:dblclick", handleDoubleClick);
    return () => {
      canvas.off("mouse:dblclick", handleDoubleClick);
    };
  }, [canvas]);

  // Handle drawing with mouse drag
  useEffect(() => {
    if (!canvas) return;

    const handleMouseDown = (opt: any) => {
      if (activeTool === "select") return;

      const pointer = canvas.getPointer(opt.e);

      // Handle polyline (multi-segment line with bends)
      if (activeTool === "polyline") {
        const newPoint = new fabric.Point(pointer.x, pointer.y);
        
        if (polylinePoints.length === 0) {
          // First point
          setPolylinePoints([newPoint]);
        } else {
          // Add new point and create/update polyline
          const updatedPoints = [...polylinePoints, newPoint];
          setPolylinePoints(updatedPoints);
          
          // Remove old polyline if exists
          if (drawingShape) {
            canvas.remove(drawingShape);
          }
          
          // Create new polyline
          const line = new fabric.Polyline(updatedPoints, {
            fill: "transparent",
            stroke: "#3b82f6",
            strokeWidth: 2,
            objectCaching: false,
            selectable: false,
          });
          
          canvas.add(line);
          setDrawingShape(line);
          canvas.requestRenderAll();
        }
        return;
      }

      setIsDrawing(true);
      setStartPoint({ x: pointer.x, y: pointer.y });

      let shape: fabric.Object | null = null;

      if (activeTool === "text") {
        const text = new fabric.IText("Type here...", {
          left: pointer.x,
          top: pointer.y,
          fontSize: 20,
          fill: "#ffffff",
          editable: true,
          selectable: true,
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        text.selectAll();
        text.enterEditing();
        text.hiddenTextarea?.focus();
        return;
      }

      switch (activeTool) {
        case "rectangle":
          shape = new fabric.Rect({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: "transparent",
            stroke: "#3b82f6",
            strokeWidth: 2,
            rx: 8,
            ry: 8,
          });
          break;

        case "circle":
          shape = new fabric.Ellipse({
            left: pointer.x,
            top: pointer.y,
            rx: 0,
            ry: 0,
            fill: "transparent",
            stroke: "#3b82f6",
            strokeWidth: 2,
          });
          break;

        case "triangle":
          shape = new fabric.Triangle({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: "transparent",
            stroke: "#3b82f6",
            strokeWidth: 2,
          });
          break;

        case "line":
          shape = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
            stroke: "#3b82f6",
            strokeWidth: 2,
            selectable: true,
          });
          break;

        case "curve":
          shape = new fabric.Path(`M ${pointer.x} ${pointer.y} Q ${pointer.x} ${pointer.y} ${pointer.x} ${pointer.y}`, {
            fill: "transparent",
            stroke: "#3b82f6",
            strokeWidth: 2,
            objectCaching: false,
          });
          break;
      }

      if (shape) {
        canvas.add(shape);
        setDrawingShape(shape);
        canvas.selection = false;
      }
    };

    const handleMouseMove = (opt: any) => {
      if (!isDrawing || !drawingShape) return;

      const pointer = canvas.getPointer(opt.e);
      const width = pointer.x - startPoint.x;
      const height = pointer.y - startPoint.y;

      if (drawingShape instanceof fabric.Rect) {
        drawingShape.set({
          width: Math.abs(width),
          height: Math.abs(height),
          left: width < 0 ? pointer.x : startPoint.x,
          top: height < 0 ? pointer.y : startPoint.y,
        });
      } else if (drawingShape instanceof fabric.Ellipse) {
        drawingShape.set({
          rx: Math.abs(width / 2),
          ry: Math.abs(height / 2),
          left: startPoint.x,
          top: startPoint.y,
        });
      } else if (drawingShape instanceof fabric.Triangle) {
        drawingShape.set({
          width: Math.abs(width),
          height: Math.abs(height),
          left: width < 0 ? pointer.x : startPoint.x,
          top: height < 0 ? pointer.y : startPoint.y,
        });
      } else if (drawingShape instanceof fabric.Line) {
        drawingShape.set({
          x2: pointer.x,
          y2: pointer.y,
        });
      } else if (drawingShape instanceof fabric.Path) {
        // Update curve with control point
        const midX = (startPoint.x + pointer.x) / 2;
        const midY = (startPoint.y + pointer.y) / 2;
        const controlX = midX + (pointer.y - startPoint.y) / 4;
        const controlY = midY - (pointer.x - startPoint.x) / 4;
        
        drawingShape.set({
          path: [
            ["M", startPoint.x, startPoint.y],
            ["Q", controlX, controlY, pointer.x, pointer.y],
          ],
        });
      }

      canvas.requestRenderAll();
    };

    const handleMouseUp = () => {
      if (isDrawing && drawingShape) {
        drawingShape.set({ selectable: true });
        canvas.setActiveObject(drawingShape);
        setIsDrawing(false);
        setDrawingShape(null);
        canvas.selection = true;
        setActiveTool("select");
        canvas.defaultCursor = "default";
      }
    };

    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:up", handleMouseUp);

    return () => {
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:move", handleMouseMove);
      canvas.off("mouse:up", handleMouseUp);
    };
  }, [canvas, activeTool, isDrawing, drawingShape, startPoint, polylinePoints]);

  // Handle polyline completion on tool change
  useEffect(() => {
    if (activeTool !== "polyline" && polylinePoints.length > 0) {
      if (drawingShape && canvas) {
        drawingShape.set({ selectable: true });
        canvas.setActiveObject(drawingShape);
      }
      setPolylinePoints([]);
      setDrawingShape(null);
    }
  }, [activeTool]);

  // Tool definitions
  const tools = [
    { id: "select", icon: <MousePointer2 size={20} />, label: "Select" },
    { id: "rectangle", icon: <Square size={20} />, label: "Rectangle" },
    { id: "circle", icon: <Circle size={20} />, label: "Circle" },
    { id: "triangle", icon: <Triangle size={20} />, label: "Triangle" },
    { id: "line", icon: <Minus size={20} />, label: "Straight Line" },
    { id: "curve", icon: <Spline size={20} />, label: "Curved Line" },
    { id: "polyline", icon: <Pen size={20} />, label: "Line with Bends" },
    { id: "text", icon: <Type size={20} />, label: "Text" },
  ] as const;

  return (
    <div className="flex h-screen bg-zinc-900">
      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center p-5">
        <canvas
          id="board"
          ref={canvasRef}
          className="rounded-lg shadow-2xl border border-zinc-700"
        />
      </div>

      {/* Toolbar - Right Side */}
      <div className="w-20 bg-zinc-800 border-l border-zinc-700 flex flex-col items-center py-6 gap-3">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            onClick={() => {
              setActiveTool(tool.id as Tool);
              if (canvas) {
                canvas.defaultCursor =
                  tool.id === "select" ? "default" : "crosshair";
              }
              // Reset polyline points when switching tools
              if (tool.id !== "polyline") {
                setPolylinePoints([]);
              }
            }}
            className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
              activeTool === tool.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50"
                : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-white"
            }`}
            title={tool.label}
          >
            {tool.icon}
          </Button>
        ))}
        
        {activeTool === "polyline" && polylinePoints.length > 0 && (
          <div className="text-xs text-zinc-400 text-center mt-2 px-2">
            Click to add points
            <br />
            Press ESC to finish
          </div>
        )}
      </div>
    </div>
  );
};

export default Board;
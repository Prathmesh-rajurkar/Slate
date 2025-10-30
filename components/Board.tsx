'use client';
import { Canvas, Rect } from "fabric";
import { Square } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

const Board = () => {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const initCanvas = new Canvas(canvasRef.current, {
        width: 500,
        height: 500,
      });
      initCanvas.backgroundColor = "#fff";
      initCanvas.renderAll();

      setCanvas(initCanvas);

      return () => {
        initCanvas.dispose();
      };
    }
  },[]);

  const addRectangle = () => {
    if (canvas) {
      const rect = new Rect({
        left: 100,
        top: 100,
        fill: 'red',
        width: 50,
        height: 50
      });
      canvas.add(rect);
    }
  }
  return (
    <div className="flex justify-center items-center h-screen">
        <div>
        <button onClick={addRectangle} className="m-3 rounded bg-gray-50 p-2 cursor-pointer shadow-md hover:bg-gray-100 active:scale-95 transition">
            <Square/>
        </button>
        </div>
      <canvas id="board" ref={canvasRef} className="rounded shadow-md" />
    </div>
  );
};

export default Board;

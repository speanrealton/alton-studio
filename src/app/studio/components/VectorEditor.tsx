import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';

type Point = { x: number; y: number; type: 'line' | 'cubic' };
type Props = {
  onClose: () => void;
  onCreatePath: (points: Point[]) => void;
  canvasWidth: number;
  canvasHeight: number;
};

export default function VectorEditor({ onClose, onCreatePath, canvasWidth, canvasHeight }: Props) {
  const [mode, setMode] = useState<'draw' | 'edit'>('draw');
  const [points, setPoints] = useState<Point[]>([]);
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw canvas preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#0f3460';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Draw path
    if (points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        const p = points[i];
        ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw nodes
      points.forEach((p, i) => {
        ctx.fillStyle = i === selectedNodeIndex ? '#ef4444' : '#3b82f6';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  }, [points, selectedNodeIndex]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPoints([...points, { x, y, type: 'line' }]);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'edit' || selectedNodeIndex === null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newPoints = [...points];
    newPoints[selectedNodeIndex] = { ...newPoints[selectedNodeIndex], x, y };
    setPoints(newPoints);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'edit') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicked on a node
    for (let i = 0; i < points.length; i++) {
      const dist = Math.sqrt((points[i].x - x) ** 2 + (points[i].y - y) ** 2);
      if (dist < 8) {
        setSelectedNodeIndex(i);
        return;
      }
    }
    setSelectedNodeIndex(null);
  };

  const handleCanvasMouseUp = () => {
    setSelectedNodeIndex(null);
  };

  const deleteSelectedNode = () => {
    if (selectedNodeIndex !== null) {
      setPoints(points.filter((_, i) => i !== selectedNodeIndex));
      setSelectedNodeIndex(null);
    }
  };

  const addNode = () => {
    if (selectedNodeIndex !== null && selectedNodeIndex < points.length - 1) {
      const p1 = points[selectedNodeIndex];
      const p2 = points[selectedNodeIndex + 1];
      const newPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2, type: 'line' as const };
      setPoints([...points.slice(0, selectedNodeIndex + 1), newPoint, ...points.slice(selectedNodeIndex + 1)]);
      setSelectedNodeIndex(selectedNodeIndex + 1);
    }
  };

  const handleCreate = () => {
    if (points.length < 2) {
      alert('Path must have at least 2 points');
      return;
    }
    onCreatePath(points);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="bg-gray-900 p-6 rounded-lg w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Vector Editor - Path Tool</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('draw')}
            className={`px-4 py-2 rounded ${mode === 'draw' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-400'}`}
          >
            Draw Mode
          </button>
          <button
            onClick={() => setMode('edit')}
            className={`px-4 py-2 rounded ${mode === 'edit' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-400'}`}
          >
            Edit Nodes
          </button>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={Math.min(canvasHeight, 300)}
          onClick={handleCanvasClick}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          className="w-full border border-white/20 rounded mb-4 cursor-crosshair bg-gray-950"
        />

        {/* Node List */}
        {points.length > 0 && (
          <div className="mb-4 p-3 bg-white/5 rounded max-h-32 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Nodes ({points.length})</h3>
            <div className="space-y-1">
              {points.map((p, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedNodeIndex(i)}
                  className={`text-xs p-2 rounded cursor-pointer ${
                    i === selectedNodeIndex ? 'bg-blue-600/50 text-white' : 'bg-white/5 text-gray-400'
                  }`}
                >
                  Node {i + 1}: ({Math.round(p.x)}, {Math.round(p.y)})
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={deleteSelectedNode}
            disabled={selectedNodeIndex === null}
            className="flex-1 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 disabled:opacity-30 text-red-400 rounded flex items-center justify-center gap-2"
          >
            <Minus className="w-4 h-4" />
            Delete Node
          </button>
          <button
            onClick={addNode}
            disabled={selectedNodeIndex === null || selectedNodeIndex === points.length - 1}
            className="flex-1 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 disabled:opacity-30 text-green-400 rounded flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Node
          </button>
          <button
            onClick={() => setPoints([])}
            className="flex-1 px-3 py-2 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 rounded"
          >
            Clear
          </button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-400 mb-4 p-2 bg-white/5 rounded">
          {mode === 'draw' ? 'Click on canvas to add points. Switch to "Edit Nodes" to adjust.' : 'Click on nodes to select. Drag to move. Use buttons to add/delete.'}
        </div>

        {/* Create Button */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={points.length < 2}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-medium"
          >
            Create Path on Canvas
          </button>
        </div>
      </div>
    </div>
  );
}

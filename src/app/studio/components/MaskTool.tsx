import React, { useState } from 'react';

type Props = {
  onApply: (type: 'rect' | 'ellipse' | 'path') => void;
  onClose: () => void;
};

export default function MaskTool({ onApply, onClose }: Props) {
  const [shape, setShape] = useState<'rect' | 'ellipse' | 'path'>('rect');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg shadow-lg w-80">
        <h3 className="font-semibold mb-2">Apply Mask</h3>
        <div className="flex gap-2 mb-4">
          <label className="flex-1 p-2 border rounded cursor-pointer">
            <input type="radio" name="mask" checked={shape==='rect'} onChange={() => setShape('rect')} /> Rectangle
          </label>
          <label className="flex-1 p-2 border rounded cursor-pointer">
            <input type="radio" name="mask" checked={shape==='ellipse'} onChange={() => setShape('ellipse')} /> Ellipse
          </label>
          <label className="flex-1 p-2 border rounded cursor-pointer">
            <input type="radio" name="mask" checked={shape==='path'} onChange={() => setShape('path')} /> Path
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 rounded border" onClick={onClose}>Cancel</button>
          <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={() => onApply(shape)}>Apply</button>
        </div>
      </div>
    </div>
  );
}

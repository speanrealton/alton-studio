// src/app/admin/import-template/page.tsx
'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ImportTemplate() {
  const [file, setFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [category, setCategory] = useState('Business Cards');
  const [width, setWidth] = useState(1000);
  const [height, setHeight] = useState(1000);
  const [preview, setPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const categories = [
    'Business Cards',
    'Social Media',
    'Flyers',
    'Logos',
    'Presentations',
    'Posters',
    'Brochures',
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'image/svg+xml') {
      setFile(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      alert('Please select a valid SVG file');
    }
  };

  const handleUpload = async () => {
    if (!file || !templateName) {
      alert('Please provide a template name and select an SVG file');
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      // Read SVG content
      const svgContent = await file.text();
      
      // Create template object
      const template = {
        id: `custom-${Date.now()}`,
        name: templateName,
        category: category,
        thumbnail: preview, // Use SVG as thumbnail
        size: { width, height },
        svgContent: svgContent,
      };

      // Send to API to save
      const response = await fetch('/api/save-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });

      const data = await response.json();

      if (data.success) {
        setResult({ success: true, message: 'Template saved successfully!' });
        // Reset form
        setFile(null);
        setTemplateName('');
        setPreview('');
      } else {
        setResult({ success: false, message: data.error || 'Failed to save template' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setResult({ success: false, message: 'Upload failed. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-purple-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/templates" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Templates
          </Link>
          <h1 className="text-4xl font-black mb-2">Import SVG Template</h1>
          <p className="text-gray-400">Upload your SVG designs and make them editable templates</p>
        </div>

        {/* Upload Form */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column - Form */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Template Name *</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Modern Business Card"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Width (px)</label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Height (px)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">SVG File *</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".svg,image/svg+xml"
                    onChange={handleFileChange}
                    className="hidden"
                    id="svg-upload"
                  />
                  <label
                    htmlFor="svg-upload"
                    className="flex items-center justify-center gap-3 w-full bg-purple-600/20 border-2 border-dashed border-purple-500/50 rounded-lg px-4 py-8 cursor-pointer hover:bg-purple-600/30 transition-colors"
                  >
                    <Upload className="w-6 h-6" />
                    <span>{file ? file.name : 'Click to upload SVG'}</span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading || !file || !templateName}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 rounded-lg font-bold transition-all shadow-lg"
              >
                {uploading ? 'Uploading...' : 'Upload Template'}
              </button>
            </div>

            {/* Right Column - Preview */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Preview</label>
                <div className="bg-white rounded-lg p-6 min-h-[400px] flex items-center justify-center">
                  {preview ? (
                    <img src={preview} alt="SVG Preview" className="max-w-full max-h-[400px]" />
                  ) : (
                    <div className="text-center text-gray-400">
                      <FileText className="w-16 h-16 mx-auto mb-3 opacity-50" />
                      <p>No file selected</p>
                    </div>
                  )}
                </div>
              </div>

              {result && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${
                  result.success 
                    ? 'bg-green-500/20 border border-green-500/50' 
                    : 'bg-red-500/20 border border-red-500/50'
                }`}>
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                  <span className={result.success ? 'text-green-400' : 'text-red-400'}>
                    {result.message}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            How to use:
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• Export your design from Figma, Illustrator, or Inkscape as SVG</li>
            <li>• Upload the SVG file here with a name and category</li>
            <li>• The template will be available in the templates library</li>
            <li>• Users can edit shapes, colors, and text in the studio</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
//studio/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import * as fabric from 'fabric';
import { storage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { subscribeToCollaborators, subscribeToMessages, broadcastChatMessage, broadcastPresence, unsubscribeFromSession, subscribeToCanvasUpdates, broadcastCanvasUpdate } from '@/lib/collaboration';
import MaskTool from './components/MaskTool';
import VectorEditor from './components/VectorEditor';
import { 
  Download, Save, Undo2, Redo2, Trash2, Home, Sparkles, Search, Loader2, X, 
  Type, Square, Circle, Image as ImageIcon, Minus, Triangle, Star, Pen, 
  Palette, ZoomIn, ZoomOut, RotateCw, FlipHorizontal, FlipVertical, 
  Lock, Unlock, ChevronUp, ChevronDown, Copy, Layers, AlignLeft, AlignCenter, 
  AlignRight, Bold, Italic, Underline, Upload, Grid3x3, Wand2,
  PlusCircle, FileText, Settings, Maximize2, PaintBucket, Filter, Sun, Crop,
  Contrast, Blend, Pentagon, Hexagon, ImagePlus, Group, Ungroup, Magnet,
  MousePointer, Eye, EyeOff, Move, Eraser, Droplet, Strikethrough,
  AlignJustify, MoreHorizontal, Edit3, Sparkle, SaveAll, Plus, MessageCircle, Send, ChevronRight
} from 'lucide-react';

const PROFESSIONAL_FONTS = [
  'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana',
  'Trebuchet MS', 'Impact', 'Comic Sans MS', 'Palatino Linotype', 'Garamond',
  'Bookman', 'Century Gothic', 'Lucida Console', 'Tahoma', 'Calibri',
  'Cambria', 'Consolas', 'Segoe UI', 'Segoe Print', 'Segoe Script',
  // Professional serif fonts
  'Baskerville', 'Bodoni', 'Caslon', 'Didot', 'Ebgaramond', 'Jenson',
  'Sabon', 'Hagin', 'Granjon', 'Hoefler Text', 'Perpetua', 'Bembo',
  'Garamond Premier Pro', 'Adobe Caslon Pro', 'Century Schoolbook',
  // Professional sans-serif fonts
  'Futura', 'Gotham', 'Proxima Nova', 'Montserrat', 'Open Sans', 'Lato',
  'Roboto', 'Source Sans Pro', 'Ubuntu', 'Inter', 'Poppins', 'DM Sans',
  'Public Sans', 'IBM Plex Sans', 'Barlow', 'Raleway', 'Outfit', 'Space Mono',
  'Mulish', 'Nunito', 'Quicksand', 'Rubik', 'Work Sans', 'Manrope',
  'Sora', 'Urbanist', 'Instrument Sans', 'Satoshi', 'Sofia Sans',
  // Professional display fonts
  'Playfair Display', 'Cormorant Garamond', 'Cinzel', 'Crimson Text',
  'Rozha One', 'EB Garamond', 'Libre Baskerville', 'Kaisei Opti',
  'Cardo', 'Frank Ruhl Libre', 'Merriweather', 'Lora', 'PT Serif',
  'Bitter', 'Abril Fatface', 'Righteous', 'Bebas Neue', 'Oswald',
  // Modern professional fonts
  'Syne', 'Cabinet Grotesk', 'Grotesk', 'Clash Display', 'Cera Pro',
  'PP Neue Montreal', 'PP Huntsman', 'Eurostile', 'Optima', 'Univers',
  'Trade Gothic', 'DIN Alternate', 'DIN Next', 'Gill Sans Nova',
  'Whitney', 'Gotham Pro', 'Avenir', 'Museo Sans', 'Akzidenz Grotesk',
  // Elegant and refined fonts
  'Minion Pro', 'Myriad Pro', 'Segoe UI Historic', 'Adobe Devanagari',
  'Copperplate', 'Georgia Pro', 'Palatino', 'Lucida Bright', 'Fira Sans',
  'Karla', 'Lexend', 'Space Grotesk', 'JetBrains Mono', 'Victor Mono',
  'Courier Prime', 'IBM Plex Mono', 'Inconsolata', 'Source Code Pro',
  'Overpass', 'Noto Sans', 'Noto Serif', 'Liberation Sans', 'Liberation Serif',
];

const PAGE_SIZES = {
  'A4 Portrait': { width: 595, height: 842 },
  'A4 Landscape': { width: 842, height: 595 },
  'A3 Portrait': { width: 842, height: 1191 },
  'A3 Landscape': { width: 1191, height: 842 },
  'Letter Portrait': { width: 612, height: 792 },
  'Letter Landscape': { width: 792, height: 612 },
  'Instagram Post': { width: 1080, height: 1080 },
  'Instagram Story': { width: 1080, height: 1920 },
  'Facebook Post': { width: 1200, height: 630 },
  'Twitter Post': { width: 1200, height: 675 },
  'YouTube Thumbnail': { width: 1280, height: 720 },
  'Custom': { width: 800, height: 600 },
};

export default function StudioPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialBgImage = searchParams?.get('bg');
  const templateId = searchParams?.get('templateId');
  const editDesignName = searchParams?.get('edit'); // NEW: Get edit parameter
  
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const pageBoxRef = useRef<HTMLDivElement | null>(null);
  const verticalGuideRef = useRef<HTMLDivElement | null>(null);
  const horizontalGuideRef = useRef<HTMLDivElement | null>(null);
  const [snapGuides, setSnapGuides] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const svgTemplateInputRef = useRef<HTMLInputElement>(null);
  const canvasInstancesRef = useRef({});
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const historyRef = useRef<Array<any>>([]);
  const historyIndexRef = useRef<number>(-1);
  
  // State declarations MUST come before useEffects that reference them
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const [pages, setPages] = useState<Array<{ id: number; canvas: fabric.Canvas | null; name: string; data: unknown }>>([{ id: 1, canvas: null, name: 'Page 1', data: null }]);
  // Keep a ref to pages so asynchronous callbacks always read latest pages
  const pagesRef = useRef(pages);

  // Keep pagesRef in sync whenever pages state changes
  // We intentionally exclude some dependencies to avoid recreating the canvas
  // when toggling transient UI tool state (like selection/drawing).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  // Sync history state with refs whenever it changes
  useEffect(() => {
    historyRef.current = history;
    historyIndexRef.current = historyIndex;
  }, [history, historyIndex]);

  // All state declarations - MUST come before functions that use them
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [isEditingName, setIsEditingName] = useState(false);
  const [showSaveNotif, setShowSaveNotif] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSize, setSelectedSize] = useState('A4 Portrait');
  const [customWidth, setCustomWidth] = useState(800);
  const [customHeight, setCustomHeight] = useState(600);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [showAddPageModal, setShowAddPageModal] = useState(false);
  const [templateData, setTemplateData] = useState<unknown>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [loadingDesign, setLoadingDesign] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  
  // Tool states
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [fillColor, setFillColor] = useState('#3b82f6');
  const [strokeColor, setStrokeColor] = useState('#1e40af');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [opacity, setOpacity] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [drawingMode, setDrawingMode] = useState(false);
  const [eraserMode, setEraserMode] = useState(false);
  const [selectionMode, setSelectionMode] = useState(true);
  const [brushSize, setBrushSize] = useState(5);
  const [activeTab, setActiveTab] = useState('tools');
  const [showLayers, setShowLayers] = useState(false);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [blur, setBlur] = useState(0);
  const [gradientStart, setGradientStart] = useState('#3b82f6');
  const [gradientEnd, setGradientEnd] = useState('#8b5cf6');
  const [shadowColor, setShadowColor] = useState('#000000');
  const [shadowBlur, setShadowBlur] = useState(0);
  const [shadowOffsetX, setShadowOffsetX] = useState(0);
  const [shadowOffsetY, setShadowOffsetY] = useState(0);
  const [gridVisible, setGridVisible] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [lineHeight, setLineHeight] = useState(1.16);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [textStroke, setTextStroke] = useState(false);
  const [textStrokeWidth, setTextStrokeWidth] = useState(1);
  const [textStrokeColor, setTextStrokeColor] = useState('#000000');
  const [borderRadius, setBorderRadius] = useState(0);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showMaskTool, setShowMaskTool] = useState(false);
  const [maskEditing, setMaskEditing] = useState(false);
  const [penMode, setPenMode] = useState(false);
  const penPointsRef = useRef<Array<{ x: number; y: number }>>([]);
  const penModeRef = useRef(false);
  const maskEditorObjRef = useRef<fabric.Object | null>(null);
  const maskTargetRef = useRef<fabric.Object | null>(null);
  const [maskInvert, setMaskInvert] = useState(false);
  const [maskFeather, setMaskFeather] = useState(0);
  const [collaborativeMode, setCollaborativeMode] = useState(false);
  const [collaborationCode, setCollaborationCode] = useState('');
  const [collaboratorsList, setCollaboratorsList] = useState<Array<any>>([]);
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{id: string; user: string; message: string; timestamp: number; color: string}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChatSidebar, setShowChatSidebar] = useState(true);
  const [spaceDown, setSpaceDown] = useState(false);
  const [userUsername, setUserUsername] = useState<string>('Guest');
  const websocketRef = useRef<WebSocket | null>(null);
  const lastSyncRef = useRef<number>(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const presenceChannelRef = useRef<any>(null);
  const messagesChannelRef = useRef<any>(null);
  const canvasChannelRef = useRef<any>(null);
  const currentUserRef = useRef<string>('User-' + Math.random().toString(36).substring(7));

  // Collaborative editing functions
  const generateCollaborationCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setCollaborationCode(code);
    return code;
  };

  const startCollaborativeSession = async () => {
    const code = generateCollaborationCode();
    
    // Subscribe to collaborators
    const presenceChannel = subscribeToCollaborators(code, (collaborators) => {
      setCollaboratorsList(collaborators);
    });
    presenceChannelRef.current = presenceChannel;

    // Subscribe to messages
    const messagesChannel = subscribeToMessages(code, (message) => {
      setChatMessages((prev) => [...prev, message]);
    });
    messagesChannelRef.current = messagesChannel;

    // Subscribe to canvas updates from other collaborators
    const canvasChannel = subscribeToCanvasUpdates(code, (update: any) => {
      console.log('Canvas update received:', update);
      if (update.userId !== currentUserRef.current && update.canvasData) {
        // Apply the received canvas data to our canvas
        applyRemoteCanvasUpdate(update.canvasData, currentPageIndex);
      }
    });
    canvasChannelRef.current = canvasChannel;

    // Broadcast our presence
    const userColor = '#3b82f6';
    await broadcastPresence(presenceChannel, {
      id: currentUserRef.current,
      name: userUsername,
      color: userColor,
      lastSeen: Date.now(),
    });

    setIsCollaborating(true);
    console.log('Collaborative session started with code:', code);
  };

  const joinCollaborativeSession = async (code: string) => {
    if (!code.trim()) {
      alert('Please enter a collaboration code');
      return;
    }

    // Subscribe to collaborators
    const presenceChannel = subscribeToCollaborators(code, (collaborators) => {
      setCollaboratorsList(collaborators);
    });
    presenceChannelRef.current = presenceChannel;

    // Subscribe to messages
    const messagesChannel = subscribeToMessages(code, (message) => {
      setChatMessages((prev) => [...prev, message]);
    });
    messagesChannelRef.current = messagesChannel;

    // Subscribe to canvas updates from other collaborators
    const canvasChannel = subscribeToCanvasUpdates(code, (update: any) => {
      console.log('Canvas update received:', update);
      if (update.userId !== currentUserRef.current && update.canvasData) {
        // Apply the received canvas data to our canvas
        applyRemoteCanvasUpdate(update.canvasData, currentPageIndex);
      }
    });
    canvasChannelRef.current = canvasChannel;

    // Broadcast our presence
    const userColor = '#10b981';
    await broadcastPresence(presenceChannel, {
      id: currentUserRef.current,
      name: userUsername,
      color: userColor,
      lastSeen: Date.now(),
    });

    setCollaborationCode(code);
    setIsCollaborating(true);
    console.log('Joined collaborative session:', code);
  };

  const broadcastCanvasChange = async (data: any) => {
    if (!isCollaborating) return;
    const now = Date.now();
    if (now - lastSyncRef.current < 100) return; // Throttle to 100ms
    lastSyncRef.current = now;
    
    try {
      await broadcastCanvasUpdate(collaborationCode, data, currentUserRef.current);
      console.log('Canvas change broadcasted');
    } catch (error) {
      console.error('Failed to broadcast canvas change:', error);
    }
  };

  const sendChatMessage = async (message: string) => {
    if (!message.trim() || !isCollaborating) return;
    
    // Determine user color based on if they're host or guest
    // Host (first to join) gets blue, guests get green
    const userColor = collaboratorsList.length === 1 ? '#3b82f6' : '#10b981';
    
    const newMessage = {
      id: Date.now().toString(),
      sessionCode: collaborationCode,
      user: userUsername,
      message: message.trim(),
      timestamp: Date.now(),
      color: userColor,
    };

    setChatMessages((prev) => [...prev, newMessage]);
    setChatInput('');
    
    // Broadcast message to all collaborators
    try {
      await broadcastChatMessage(collaborationCode, newMessage);
    } catch (error) {
      console.error('Failed to broadcast message:', error);
    }
  };

  // Apply remote canvas updates from other collaborators
  const applyRemoteCanvasUpdate = (canvasData: any, pageIndex: number) => {
    const canvas = canvasInstancesRef.current[pages[pageIndex]?.id];
    if (!canvas || !canvasData) return;

    try {
      // Load the canvas from JSON to sync objects
      canvas.loadFromJSON(canvasData, () => {
        canvas.renderAll();
        console.log('Canvas updated from remote collaborator');
      });
    } catch (error) {
      console.error('Failed to apply remote canvas update:', error);
    }
  };

  // Auto-scroll to latest chat message
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Cleanup collaboration channels when session ends
  useEffect(() => {
    return () => {
      if (presenceChannelRef.current) {
        unsubscribeFromSession(presenceChannelRef.current);
      }
      if (messagesChannelRef.current) {
        unsubscribeFromSession(messagesChannelRef.current);
      }
      if (canvasChannelRef.current) {
        unsubscribeFromSession(canvasChannelRef.current);
      }
    };
  }, []);

  // Fetch user's username from Supabase
  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single();
          
          if (error) {
            console.error('Error fetching username:', error);
            setUserUsername(user.email?.split('@')[0] || 'Guest');
          } else if (data?.username) {
            setUserUsername(data.username);
          } else {
            setUserUsername(user.email?.split('@')[0] || 'Guest');
          }
        }
      } catch (error) {
        console.error('Failed to fetch username:', error);
      }
    };

    fetchUsername();
  }, []);

  // Helper to get the active canvas instance for the current page
  const getCurrentCanvas = () => {
    const page = pagesRef.current[currentPageIndex];
    if (!page) return null;
    return canvasInstancesRef.current[page.id] || null;
  };

  const startMaskEditing = () => {
    const canvas = getCurrentCanvas();
    if (!canvas) {
      alert('No canvas available');
      return;
    }
    const target: any = canvas.getActiveObject();
    if (!target) {
      alert('Select the object you want to mask first');
      return;
    }

    // Create an editable mask overlay matching the target bbox
    const bbox = target.getBoundingRect();
    const mask = new fabric.Rect({
      left: bbox.left,
      top: bbox.top,
      width: bbox.width,
      height: bbox.height,
      fill: 'rgba(0,0,0,0.2)',
      stroke: 'rgba(59,130,246,0.9)',
      strokeWidth: 2,
      originX: 'left',
      originY: 'top',
      selectable: true,
      hasBorders: true,
      hasControls: true,
      evented: true,
      absolutePositioned: true,
    });

    maskEditorObjRef.current = mask;
    maskTargetRef.current = target;

    // Make the target not selectable while editing mask
    try { target.selectable = false; target.evented = false; } catch {}

    canvas.add(mask);
    canvas.setActiveObject(mask);
    canvas.requestRenderAll();
    setMaskEditing(true);
  };

  const cancelMaskEditing = () => {
    const canvas = getCurrentCanvas();
    if (!canvas) return;
    const mask = maskEditorObjRef.current;
    const target = maskTargetRef.current;
    if (mask) {
      try { canvas.remove(mask); } catch {}
      maskEditorObjRef.current = null;
    }
    if (target) {
      try { target.selectable = true; target.evented = true; } catch {}
      maskTargetRef.current = null;
      canvas.setActiveObject(target);
    }
    canvas.requestRenderAll();
    setMaskEditing(false);
  };

  const applyEditedMask = () => {
    const canvas = getCurrentCanvas();
    if (!canvas) return;
    const mask = maskEditorObjRef.current;
    const target = maskTargetRef.current as any;
    if (!mask || !target) {
      cancelMaskEditing();
      return;
    }

    // Prepare mask for clipPath: make absolute positioned and non-evented
    mask.selectable = false;
    mask.evented = false;
    mask.absolutePositioned = true;

    try {
      // Assign the mask as clipPath on the target
      target.clipPath = mask;
      // Remove the editing mask (it's now the clipPath attached to the object)
      try { canvas.remove(mask); } catch {}
      maskEditorObjRef.current = null;
      // Restore target selection
      target.selectable = true;
      target.evented = true;
      maskTargetRef.current = null;
      canvas.requestRenderAll();
      saveState(canvas);
    } catch (err) {
      console.warn('Failed to apply edited mask:', err);
    }

    setMaskEditing(false);
  };

  const drawPenPreview = (canvas: any) => {
    if (!canvas || penPointsRef.current.length === 0) return;

    // Remove old preview objects (lines and circles)
    const objects = canvas.getObjects();
    const previewObjects = objects.filter((obj: any) => obj.data?.isPenPreview);
    previewObjects.forEach((obj: any) => canvas.remove(obj));

    const points = penPointsRef.current;

    // Draw connecting lines between points
    for (let i = 0; i < points.length - 1; i++) {
      const line = new fabric.Line(
        [points[i].x, points[i].y, points[i + 1].x, points[i + 1].y],
        {
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          selectable: false,
          evented: false,
          excludeFromExport: true,
          data: { isPenPreview: true },
        }
      );
      canvas.add(line);
    }

    // Draw point markers (small circles)
    points.forEach((point, idx) => {
      const circle = new fabric.Circle({
        left: point.x,
        top: point.y,
        radius: 4,
        fill: strokeColor,
        stroke: 'white',
        strokeWidth: 2,
        selectable: false,
        evented: false,
        excludeFromExport: true,
        originX: 'center',
        originY: 'center',
        data: { isPenPreview: true },
      });
      canvas.add(circle);
    });

    canvas.renderAll();
  };

  const finishPenPath = () => {
    const canvas = getCurrentCanvas();
    if (!canvas || penPointsRef.current.length < 2) return;

    try {
      const points = penPointsRef.current;
      let pathString = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        pathString += ` L ${points[i].x} ${points[i].y}`;
      }

      // Remove preview objects
      const objects = canvas.getObjects();
      const previewObjects = objects.filter((obj: any) => obj.data?.isPenPreview);
      previewObjects.forEach((obj: any) => canvas.remove(obj));

      const path = new fabric.Path(pathString, {
        fill: 'transparent',
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        selectable: true,
        evented: true,
      });

      canvas.add(path);
      canvas.setActiveObject(path);
      canvas.renderAll();
      saveState(canvas);
      penPointsRef.current = [];
      setPenMode(false);
    } catch (err) {
      console.warn('Failed to create vector path:', err);
    }
  };
  
  // Sync penModeRef when penMode state changes
  useEffect(() => {
    penModeRef.current = penMode;
  }, [penMode]);

  const currentCanvas = pages[currentPageIndex]?.canvas;

  // Auto-save functionality
  useEffect(() => {
    // Don't start auto-save if we're loading a design
    if (loadingDesign) return;
    
    autoSaveIntervalRef.current = setInterval(() => {
      if (currentCanvas && !loadingDesign) {
        saveToStorage();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [currentCanvas, projectName, pages, loadingDesign]);

  // Periodic cleanup of old designs to prevent storage quota exceeded
  useEffect(() => {
    const cleanupInterval = setInterval(async () => {
      try {
        await storage.cleanupOldDesigns(20); // Keep only 20 most recent designs
      } catch (error) {
        console.error('Cleanup failed:', error);
      }
    }, 5 * 60 * 1000); // Run cleanup every 5 minutes

    return () => clearInterval(cleanupInterval);
  }, []);

  // Add this new useEffect to load design for editing
  useEffect(() => {
    const loadDesignForEditing = async () => {
      if (!editDesignName) return;
      
      setLoadingDesign(true);
      try {
        const result = await storage.get('user-designs', false);
        if (result && result.value) {
          const designs = JSON.parse(result.value);
          const designToEdit = designs.find((d: any) => d.name === decodeURIComponent(editDesignName));
          
          if (designToEdit) {
            // Load project settings
            setProjectName(designToEdit.name);
            setSelectedSize(designToEdit.size || 'A4 Portrait');
            if (designToEdit.customSize) {
              setCustomWidth(designToEdit.customSize.width);
              setCustomHeight(designToEdit.customSize.height);
            }
            setLastSaved(designToEdit.lastModified);
            
            // Load all pages
            if (designToEdit.pages && designToEdit.pages.length > 0) {
              setPages(designToEdit.pages.map((page: any) => ({
                ...page,
                canvas: null // Canvas will be initialized by the canvas effect
              })));
            }
          } else {
            console.error('Design not found:', editDesignName);
          }
        }
      } catch (error) {
        console.error('Failed to load design:', error);
      } finally {
        setLoadingDesign(false);
      }
    };

    loadDesignForEditing();
  }, [editDesignName]);

  const saveToStorage = async () => {
    // Don't save if we're still loading a design
    if (loadingDesign) return;
    
    // Don't save if no canvas exists yet
    if (!currentCanvas) return;
    
    try {
      setIsSaving(true);
      
      // Save current page data first
      saveCurrentPageData();
      
      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get all page data with the latest current page
      const allPagesData = pagesRef.current.map((page, index) => {
        if (index === currentPageIndex && currentCanvas) {
          return {
            ...page,
            data: currentCanvas.toJSON()
          };
        }
        return page;
      });

      // Create thumbnail from current canvas (lightweight version)
      let thumbnail = '';
      if (currentCanvas) {
        const objects = currentCanvas.getObjects();
        const gridObjects = objects.filter((obj: any) => obj.excludeFromExport);
        gridObjects.forEach((obj: any) => { obj.visible = false; });
        
        try {
          // Use JPEG format and even lower multiplier to reduce size
          thumbnail = currentCanvas.toDataURL({
            format: 'jpeg',
            quality: 0.4,
            multiplier: 0.2,
          });
        } catch (thumbnailError) {
          console.warn('Failed to create thumbnail:', thumbnailError);
          thumbnail = ''; // Skip thumbnail if there's an error
        }
        
        gridObjects.forEach((obj: any) => { obj.visible = true; });
        currentCanvas.renderAll();
      }

      const designData = {
        id: Date.now().toString(),
        name: projectName,
        pages: allPagesData,
        size: selectedSize,
        customSize: selectedSize === 'Custom' ? { width: customWidth, height: customHeight } : null,
        thumbnail,
        lastModified: new Date().toISOString(),
        createdAt: lastSaved || new Date().toISOString(),
      };

      // Save to storage with retry logic
      let attempts = 0;
      let savedSuccessfully = false;
      let lastError: any = null;
      
      while (attempts < 3 && !savedSuccessfully) {
        try {
          const existingDesigns = await storage.get('user-designs', false);
          let designs = existingDesigns ? JSON.parse(existingDesigns.value) : [];
          
          // Validate designs is an array
          if (!Array.isArray(designs)) {
            designs = [];
          }
          
          // Check if design already exists and update it
          const existingIndex = designs.findIndex((d: any) => d.name === projectName);
          if (existingIndex >= 0) {
            designs[existingIndex] = designData;
            console.log(`Updated existing design: ${projectName}`);
          } else {
            designs.push(designData);
            console.log(`Created new design: ${projectName}`);
          }
          
          const serialized = JSON.stringify(designs);
          console.log(`Saving ${designs.length} designs, total size: ${serialized.length} bytes`);
          
          await storage.set('user-designs', serialized, false);
          console.log('Designs saved successfully');
          savedSuccessfully = true;
        } catch (storageError) {
          lastError = storageError;
          attempts++;
          console.error(`Save attempt ${attempts} failed:`, storageError);
          if (attempts < 3) {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }
      
      if (!savedSuccessfully) {
        console.error('Failed to save after multiple attempts:', lastError);
        throw new Error(`Failed to save after ${attempts} attempts`);
      }
      
      setLastSaved(new Date().toISOString());
      setShowSaveNotif(true);
      setTimeout(() => setShowSaveNotif(false), 2000);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const saveCurrentPageData = () => {
    // Only save if we have a valid current page index
    if (currentPageIndex === null || currentPageIndex === undefined) return;

    const canvas = getCurrentCanvas();
    if (!canvas || typeof canvas.toJSON !== 'function') return;

    try {
      const json = canvas.toJSON();
      // Update pagesRef directly to ensure latest data is saved
      const newPages = [...pagesRef.current];
      if (newPages[currentPageIndex]) {
        newPages[currentPageIndex] = { ...newPages[currentPageIndex], data: json };
      }
      pagesRef.current = newPages;
      setPages(newPages);
    } catch (error) {
      console.error('Failed to save page data:', error);
    }
  };

  // Initialize canvas
  useEffect(() => {
    // Don't initialize if we're loading a design
    if (loadingDesign) return;
    
    if (!canvasContainerRef.current) return;

    // Save current page data ONLY if canvas exists
    if (currentCanvas && currentPageIndex !== null) {
      saveCurrentPageData();
    }

    const size = templateData?.size || PAGE_SIZES[selectedSize as keyof typeof PAGE_SIZES];
    
    const canvasEl = document.createElement('canvas');
    canvasEl.id = `canvas-page-${pages[currentPageIndex].id}`;
    canvasContainerRef.current.innerHTML = '';
    canvasContainerRef.current.appendChild(canvasEl);

    const fabricCanvas = new fabric.Canvas(canvasEl, {
      width: size.width,
      height: size.height,
      backgroundColor: backgroundColor,
      preserveObjectStacking: true,
      selection: penMode ? false : selectionMode,
    });

    if (gridVisible) {
      addGrid(fabricCanvas, size);
    }

    // Smart snapping and guides (grid + object alignment)
    if (snapGuides || snapToGrid) {
      const SNAP_THRESHOLD = 8; // pixels
      const getRects = (objs: any): Array<{ obj: any; rect: any }> => objs.map((o: any) => ({
        obj: o,
        rect: o.getBoundingRect()
      }));

      const hideGuides = () => {
        if (verticalGuideRef.current) verticalGuideRef.current.style.display = 'none';
        if (horizontalGuideRef.current) horizontalGuideRef.current.style.display = 'none';
      };

      fabricCanvas.on('object:moving', (e: any) => {
        const obj: any = e.target;
        if (!obj) return;

        const all = fabricCanvas.getObjects().filter(o => o !== obj && !(o.excludeFromExport));
        const targets = getRects(all);
        const src = obj.getBoundingRect(true);

        let snapX: number | null = null;
        let snapY: number | null = null;
        let vLine = null;
        let hLine = null;

        // Snap to other objects (edges and centers)
        targets.forEach((t: any) => {
          const r = t.rect;
          const candidatesX = [r.left, r.left + r.width / 2, r.left + r.width];
          const candidatesY = [r.top, r.top + r.height / 2, r.top + r.height];
          const srcX = [src.left, src.left + src.width / 2, src.left + src.width];
          const srcY = [src.top, src.top + src.height / 2, src.top + src.height];

          // X alignments
          srcX.forEach((sx, i) => {
            candidatesX.forEach((cx) => {
              const diff = Math.abs(sx - cx);
              if (diff <= SNAP_THRESHOLD) {
                // compute new left so that the same anchor aligns
                const anchorOffset = sx - obj.left; // offset from left to anchor
                const newLeft = cx - anchorOffset;
                snapX = newLeft;
                vLine = cx;
              }
            });
          });

          // Y alignments
          srcY.forEach((sy, i) => {
            candidatesY.forEach((cy) => {
              const diff = Math.abs(sy - cy);
              if (diff <= SNAP_THRESHOLD) {
                const anchorOffsetY = sy - obj.top;
                const newTop = cy - anchorOffsetY;
                snapY = newTop;
                hLine = cy;
              }
            });
          });
        });

        // Grid snapping (if enabled)
        if (snapToGrid) {
          const gridSize = 20;
          const gx = Math.round(obj.left / gridSize) * gridSize;
          const gy = Math.round(obj.top / gridSize) * gridSize;
          if (Math.abs(gx - obj.left) <= SNAP_THRESHOLD) {
            snapX = gx;
            vLine = gx;
          }
          if (Math.abs(gy - obj.top) <= SNAP_THRESHOLD) {
            snapY = gy;
            hLine = gy;
          }
        }

        // Apply snapping
        if (snapX !== null) obj.left = snapX;
        if (snapY !== null) obj.top = snapY;

        // Show guides
        const pageBox = pageBoxRef.current;
        if (vLine !== null && verticalGuideRef.current && pageBox) {
          verticalGuideRef.current.style.display = 'block';
          verticalGuideRef.current.style.left = `${vLine}px`;
          verticalGuideRef.current.style.top = `0px`;
          verticalGuideRef.current.style.height = `${pageBox.clientHeight}px`;
        } else if (verticalGuideRef.current) {
          verticalGuideRef.current.style.display = 'none';
        }

        if (hLine !== null && horizontalGuideRef.current && pageBox) {
          horizontalGuideRef.current.style.display = 'block';
          horizontalGuideRef.current.style.top = `${hLine}px`;
          horizontalGuideRef.current.style.left = `0px`;
          horizontalGuideRef.current.style.width = `${pageBox.clientWidth}px`;
        } else if (horizontalGuideRef.current) {
          horizontalGuideRef.current.style.display = 'none';
        }

        fabricCanvas.renderAll();
      });

      // Hide guides on drag end or modification
      fabricCanvas.on('mouse:up', hideGuides);
      fabricCanvas.on('object:modified', hideGuides);
    }

    fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
    fabricCanvas.freeDrawingBrush.color = fillColor;
    fabricCanvas.freeDrawingBrush.width = brushSize;

    canvasInstancesRef.current[pages[currentPageIndex].id] = fabricCanvas;

    setPages(prev => {
      const newPages = [...prev];
      newPages[currentPageIndex].canvas = fabricCanvas as any;
      return newPages;
    });

    // Load saved data FIRST before other initializations (read from pagesRef to avoid stale closures)
    const savedData = pagesRef.current[currentPageIndex]?.data;
    const pageMeta = pagesRef.current[currentPageIndex];
    if (savedData) {
      fabricCanvas.loadFromJSON(savedData, () => {
        fabricCanvas.renderAll();

        // Restore history for this page if present, otherwise initialize
        if (pageMeta?.history && Array.isArray(pageMeta.history)) {
          try {
            setHistory(pageMeta.history);
            setHistoryIndex(typeof pageMeta.historyIndex === 'number' ? pageMeta.historyIndex : pageMeta.history.length - 1);
          } catch (err) {
            console.warn('Failed to restore page history:', err);
            setHistory([savedData]);
            setHistoryIndex(0);
          }
        } else {
          // Initialize history with the saved state
          setHistory([savedData]);
          setHistoryIndex(0);
        }

        // Only add initial background/template if NO saved data exists
        // This was causing issues with edit mode
      });
    } else {
      // If there is no saved JSON but we have a stored history for this page,
      // restore it so undo/redo works even on a freshly initialized canvas.
      if (pageMeta?.history && Array.isArray(pageMeta.history)) {
        try {
          setHistory(pageMeta.history);
          setHistoryIndex(typeof pageMeta.historyIndex === 'number' ? pageMeta.historyIndex : pageMeta.history.length - 1);
          // load the last history state into the canvas
          const last = pageMeta.history[pageMeta.historyIndex ?? (pageMeta.history.length - 1)];
          if (last) {
            fabricCanvas.loadFromJSON(last, () => {
              fabricCanvas.renderAll();
            });
          }
        } catch (err) {
          console.warn('Failed to restore history to canvas:', err);
        }
      } else {
      // Only load template or background if no saved data
      if (templateId) {
        // Load template data immediately
        loadTemplateData(fabricCanvas);
      } else if (initialBgImage && !editDesignName) {
        fabric.Image.fromURL(initialBgImage, (img) => {
          img.scaleToWidth(fabricCanvas.width);
          fabricCanvas.add(img);
          (fabricCanvas as any).sendToBack(img);
          fabricCanvas.renderAll();
        }, { crossOrigin: 'anonymous' });
      }
      }

    }

    // Event listeners for real-time updates
    fabricCanvas.on('object:modified', () => {
      saveState(fabricCanvas);
      updatePropertiesFromSelection(fabricCanvas.getActiveObject());
      // Broadcast canvas changes to collaborators
      if (isCollaborating) {
        broadcastCanvasChange(fabricCanvas.toJSON(['objects']));
      }
    });
    
    fabricCanvas.on('object:added', () => {
      saveState(fabricCanvas);
      // Broadcast canvas changes to collaborators
      if (isCollaborating) {
        broadcastCanvasChange(fabricCanvas.toJSON(['objects']));
      }
    });

    fabricCanvas.on('object:rotating', (e) => {
      setRotation(Math.round(e.target.angle));
    });

    fabricCanvas.on('object:scaling', (e) => {
      if ((e.target as any).type === 'i-text') {
        setFontSize(Math.round((e.target as any).fontSize * (e.target as any).scaleX));
      }
    });
    
    fabricCanvas.on('selection:created', (e) => {
      setSelectedObject(e.selected[0]);
      updatePropertiesFromSelection(e.selected[0]);
    });
    
    fabricCanvas.on('selection:updated', (e) => {
      setSelectedObject(e.selected[0]);
      updatePropertiesFromSelection(e.selected[0]);
    });
    
    fabricCanvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });

    // Pen tool: collect points on canvas click when in pen mode
    fabricCanvas.on('mouse:down', (e: any) => {
      if (!penModeRef.current || !e.pointer) return;
      e.e.preventDefault();
      penPointsRef.current.push({ x: e.pointer.x, y: e.pointer.y });
      console.log('Pen point added:', { x: e.pointer.x, y: e.pointer.y }, 'Total points:', penPointsRef.current.length);
      drawPenPreview(fabricCanvas);
    });

    // Finish pen path on double-click or Enter key
    let lastClickTime = 0;
    fabricCanvas.on('mouse:down', (e: any) => {
      if (!penModeRef.current) return;
      const now = Date.now();
      if (now - lastClickTime < 300) {
        finishPenPath();
      }
      lastClickTime = now;
    });

    // Handle Enter key to finish pen drawing
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && penModeRef.current) {
        finishPenPath();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      fabricCanvas.dispose();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPageIndex, gridVisible, selectedSize, backgroundColor, loadingDesign, selectionMode]);

  const addGrid = (canvas, size) => {
    const gridSize = 20;
    for (let i = 0; i < (size.width / gridSize); i++) {
      canvas.add(new fabric.Line([i * gridSize, 0, i * gridSize, size.height], {
        stroke: '#f0f0f0',
        selectable: false,
        evented: false,
        excludeFromExport: true,
      }));
    }
    for (let i = 0; i < (size.height / gridSize); i++) {
      canvas.add(new fabric.Line([0, i * gridSize, size.width, i * gridSize], {
        stroke: '#f0f0f0',
        selectable: false,
        evented: false,
        excludeFromExport: true,
      }));
    }
  };

  // Helper function to load shapes into canvas
  const loadShapesIntoCanvas = (canvas: any, shapes: any[]) => {
    shapes.forEach((shape) => {
      if (shape.type === 'geo') {
        const props = shape.props;
        if (props.geo === 'rectangle') {
          const rect = new fabric.Rect({
            left: shape.x,
            top: shape.y,
            width: props.w,
            height: props.h,
            fill: props.fill === 'solid' ? getColorHex(props.color) : 'transparent',
            stroke: props.fill === 'none' ? getColorHex(props.color) : undefined,
            strokeWidth: props.fill === 'none' ? 2 : 0,
          });
          canvas.add(rect);
        } else if (props.geo === 'ellipse') {
          const ellipse = new fabric.Ellipse({
            left: shape.x,
            top: shape.y,
            rx: props.w / 2,
            ry: props.h / 2,
            fill: props.fill === 'solid' ? getColorHex(props.color) : 'transparent',
            stroke: props.fill === 'none' ? getColorHex(props.color) : undefined,
            strokeWidth: props.fill === 'none' ? 2 : 0,
          });
          canvas.add(ellipse);
        }
      } else if (shape.type === 'note') {
        const text = new fabric.IText(shape.props.text, {
          left: shape.x,
          top: shape.y,
          fontSize: shape.props.size === 'xl' ? 48 : shape.props.size === 'l' ? 32 : 24,
          fill: '#000000',
          fontFamily: 'Arial',
        });
        canvas.add(text);
      } else if (shape.type === 'text') {
        const txt = new fabric.IText(shape.content || shape.props?.text || '', {
          left: shape.x,
          top: shape.y,
          fontSize: shape.fontSize || shape.props?.size || 24,
          fill: shape.color || shape.props?.color || '#000000',
          fontFamily: shape.fontFamily || shape.props?.font || 'Arial',
          fontWeight: shape.fontWeight || undefined,
        });
        canvas.add(txt);
      } else if (shape.type === 'image') {
        // Add image layer (async)
        try {
          const src = shape.src || shape.url || shape.content;
          if (src) {
            fabric.Image.fromURL(src, (img: any) => {
              try {
                const canvasWidth = canvas.width || 800;
                const canvasHeight = canvas.height || 600;
                if (shape.width && shape.height) {
                  img.scaleToWidth(shape.width);
                  img.scaleToHeight(shape.height);
                } else {
                  // Fit to canvas if image same size
                  img.scaleToWidth(shape.width || canvasWidth);
                }
                img.left = shape.x || 0;
                img.top = shape.y || 0;
                canvas.add(img);
                canvas.requestRenderAll?.();
              } catch (imgErr) {
                console.warn('Failed to add image layer:', imgErr);
              }
            }, { crossOrigin: 'anonymous' } as any);
          }
        } catch (err) {
          console.warn('Error loading image layer:', err);
        }
      } else if (shape.type === 'shape') {
        // Generic shape layer (rectangle currently supported)
        if (shape.shape === 'rectangle') {
          const rect = new fabric.Rect({
            left: shape.x,
            top: shape.y,
            width: shape.width || shape.w || 100,
            height: shape.height || shape.h || 40,
            fill: shape.fill || (shape.props && shape.props.color) || '#000000',
            selectable: true,
          });
          canvas.add(rect);
        }
      }
    });
    canvas.renderAll();
  };

  const loadTemplateData = async (canvas: any) => {
    setLoadingTemplate(true);
    try {
      console.log('Loading template:', templateId);
      const res = await fetch('/api/custom-templates');
      const data = await res.json();
      console.log('Available templates:', data.templates?.map((t: any) => t.id));
      
      const template = data.templates?.find((t: any) => t.id === templateId);
      console.log('Template found:', template?.name);
      
      if (template) {
        setTemplateData(template);
        setProjectName(template.name || 'Untitled Project');
        
        // Set page size and background if provided
        const size = template.size || template.data?.size || { 
          width: template.data?.width || PAGE_SIZES[selectedSize as keyof typeof PAGE_SIZES].width, 
          height: template.data?.height || PAGE_SIZES[selectedSize as keyof typeof PAGE_SIZES].height 
        };
        
        try {
          if (canvas && size) {
            canvas.setWidth(size.width);
            canvas.setHeight(size.height);
            canvas.renderAll();
            setSelectedSize('Custom');
            setCustomWidth(size.width);
            setCustomHeight(size.height);
            console.log('Canvas size set to:', size.width, 'x', size.height);
          }
        } catch (err) {
          console.warn('Failed to set canvas size from template:', err);
        }

        // Load layers or shapes
        if (template.data) {
          const layers = template.data.layers || template.data.shapes || template.data.records || template.data.snapshot?.records;
          if (layers && Array.isArray(layers)) {
            console.log('Loading layers:', layers.length);
            loadShapesIntoCanvas(canvas, layers);
            // Save this template state to history
            saveState(canvas);
          }
        }
      } else {
        console.warn('Template not found:', templateId);
      }
    } catch (err) {
      console.error('Failed to load template:', err);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const getColorHex = (colorName) => {
    const colorMap = {
      'blue': '#3b82f6', 'light-blue': '#60a5fa', 'violet': '#8b5cf6',
      'white': '#ffffff', 'black': '#000000', 'grey': '#6b7280',
      'gray': '#6b7280', 'orange': '#f97316', 'red': '#ef4444',
      'green': '#10b981', 'yellow': '#eab308', 'pink': '#ec4899',
      'purple': '#a855f7',
    };
    return colorMap[colorName?.toLowerCase()] || '#3b82f6';
  };

  const updatePropertiesFromSelection = (obj) => {
    if (obj) {
      if (obj.fill) setFillColor(typeof obj.fill === 'string' ? obj.fill : '#3b82f6');
      if (obj.stroke) setStrokeColor(obj.stroke);
      if (obj.strokeWidth !== undefined) setStrokeWidth(obj.strokeWidth);
      if (obj.opacity !== undefined) setOpacity(Math.round(obj.opacity * 100));
      if (obj.angle !== undefined) setRotation(Math.round(obj.angle));
      if (obj.fontSize) setFontSize(Math.round(obj.fontSize));
      if (obj.fontFamily) setFontFamily(obj.fontFamily);
      if (obj.lineHeight) setLineHeight(obj.lineHeight);
      if (obj.charSpacing) setLetterSpacing(obj.charSpacing);
      if (obj.shadow) {
        setShadowColor(obj.shadow.color);
        setShadowBlur(obj.shadow.blur);
        setShadowOffsetX(obj.shadow.offsetX);
        setShadowOffsetY(obj.shadow.offsetY);
      }
    }
  };

  const saveState = (canvas) => {
    if (!canvas) return;
    const json = canvas.toJSON();
    // Use refs to avoid stale state
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push(json);
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    // Persist history for the current page so undo/redo survives page switches
    try {
      setPages(prev => {
        const newPages = [...prev];
        if (newPages[currentPageIndex]) {
          newPages[currentPageIndex] = {
            ...newPages[currentPageIndex],
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        }
        return newPages;
      });
    } catch (err) {
      console.warn('Failed to persist history to pages:', err);
    }
  };

  const undo = () => {
    const canvas = getCurrentCanvas();
    if (!canvas || historyIndexRef.current <= 0) return;
    
    const newIndex = historyIndexRef.current - 1;
    const prevState = historyRef.current[newIndex];
    if (!prevState) return;
    
    canvas.loadFromJSON(prevState, () => {
      canvas.renderAll();
      historyIndexRef.current = newIndex;
      setHistoryIndex(newIndex);
    });
  };

  const redo = () => {
    const canvas = getCurrentCanvas();
    if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return;
    
    const newIndex = historyIndexRef.current + 1;
    const nextState = historyRef.current[newIndex];
    if (!nextState) return;
    
    canvas.loadFromJSON(nextState, () => {
      canvas.renderAll();
      historyIndexRef.current = newIndex;
      setHistoryIndex(newIndex);
    });
  };

  const enableSelectionMode = () => {
    if (!currentCanvas) return;
    setSelectionMode(true);
    setDrawingMode(false);
    setEraserMode(false);
    currentCanvas.isDrawingMode = false;
    currentCanvas.selection = true;
  };

  const addText = () => {
    if (!currentCanvas) return;
    const text = new fabric.IText('Double click to edit', {
      left: 100, 
      top: 100, 
      fontSize, 
      fill: fillColor, 
      fontFamily,
      editable: true,
      lineHeight,
      charSpacing: letterSpacing,
    });
    currentCanvas.add(text);
    currentCanvas.setActiveObject(text);
    currentCanvas.renderAll();
    text.enterEditing();
    text.selectAll();
  };

  const addRectangle = () => {
    if (!currentCanvas) return;
    const rect = new fabric.Rect({
      left: 100, top: 100, width: 200, height: 100,
      fill: fillColor, stroke: strokeColor, strokeWidth,
      rx: borderRadius, ry: borderRadius,
    });
    currentCanvas.add(rect);
    currentCanvas.setActiveObject(rect);
    currentCanvas.renderAll();
  };

  const addCircle = () => {
    if (!currentCanvas) return;
    const circle = new fabric.Circle({
      left: 100, top: 100, radius: 50,
      fill: fillColor, stroke: strokeColor, strokeWidth,
    });
    currentCanvas.add(circle);
    currentCanvas.setActiveObject(circle);
    currentCanvas.renderAll();
  };

  const addTriangle = () => {
    if (!currentCanvas) return;
    const triangle = new fabric.Triangle({
      left: 100, top: 100, width: 100, height: 100,
      fill: fillColor, stroke: strokeColor, strokeWidth,
    });
    currentCanvas.add(triangle);
    currentCanvas.setActiveObject(triangle);
    currentCanvas.renderAll();
  };

  const addStar = () => {
    if (!currentCanvas) return;
    const star = new fabric.Polygon([
      {x: 50, y: 0}, {x: 61, y: 35}, {x: 98, y: 35}, {x: 68, y: 57},
      {x: 79, y: 91}, {x: 50, y: 70}, {x: 21, y: 91}, {x: 32, y: 57},
      {x: 2, y: 35}, {x: 39, y: 35}
    ], {
      left: 100, top: 100, fill: fillColor, stroke: strokeColor, strokeWidth,
    });
    currentCanvas.add(star);
    currentCanvas.setActiveObject(star);
    currentCanvas.renderAll();
  };

  const addPentagon = () => {
    if (!currentCanvas) return;
    const pentagon = new fabric.Polygon([
      {x: 50, y: 0}, {x: 100, y: 38}, {x: 82, y: 100},
      {x: 18, y: 100}, {x: 0, y: 38}
    ], {
      left: 100, top: 100, fill: fillColor, stroke: strokeColor, strokeWidth,
    });
    currentCanvas.add(pentagon);
    currentCanvas.setActiveObject(pentagon);
    currentCanvas.renderAll();
  };

  const addHexagon = () => {
    if (!currentCanvas) return;
    const hexagon = new fabric.Polygon([
      {x: 50, y: 0}, {x: 93, y: 25}, {x: 93, y: 75},
      {x: 50, y: 100}, {x: 7, y: 75}, {x: 7, y: 25}
    ], {
      left: 100, top: 100, fill: fillColor, stroke: strokeColor, strokeWidth,
    });
    currentCanvas.add(hexagon);
    currentCanvas.setActiveObject(hexagon);
    currentCanvas.renderAll();
  };

  const addLine = () => {
    if (!currentCanvas) return;
    const line = new fabric.Line([50, 50, 200, 50], {
      stroke: strokeColor, strokeWidth,
    });
    currentCanvas.add(line);
    currentCanvas.setActiveObject(line);
    currentCanvas.renderAll();
  };

  const addGradientRect = () => {
    if (!currentCanvas) return;
    const rect = new fabric.Rect({
      left: 100, top: 100, width: 200, height: 100,
      fill: new fabric.Gradient({
        type: 'linear',
        coords: { x1: 0, y1: 0, x2: 200, y2: 0 },
        colorStops: [
          { offset: 0, color: gradientStart },
          { offset: 1, color: gradientEnd }
        ]
      }),
      stroke: strokeColor, strokeWidth,
    });
    currentCanvas.add(rect);
    currentCanvas.setActiveObject(rect);
    currentCanvas.renderAll();
  };

  const handleTemplateFileUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file || !currentCanvas) {
      console.warn('No file or canvas available');
      return;
    }

    const fileName = file.name.toLowerCase();

    try {
      if (fileName.endsWith('.svg')) {
        handleSVGImport(file);
      } else if (fileName.endsWith('.ai') || fileName.endsWith('.eps')) {
        handleAIEPSImport(file);
      } else {
        alert('Please select a valid template file (SVG, AI, or EPS)');
      }
    } catch (err) {
      console.error('Template file upload error:', err);
      alert('Error uploading template file');
    }
  };

  const handleSVGImport = (file: File) => {
    try {
      // Check if canvas exists FIRST
      const canvas = getCurrentCanvas();
      if (!canvas) {
        alert('Canvas not initialized. Please wait for the canvas to load.');
        console.error('Canvas is null/undefined');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event: any) => {
        try {
          const svgString = event.target?.result as string;
          if (!svgString) {
            console.error('Failed to read SVG file');
            alert('Failed to read SVG file.');
            return;
          }

          console.log('SVG string loaded, attempting to add to canvas');

          // Convert SVG string to data URL
          const svg = new Blob([svgString], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(svg);

          console.log('SVG blob URL created:', url);

          // Load SVG as image
          fabric.Image.fromURL(
            url,
            (img: any) => {
              try {
                console.log('SVG loaded as image:', img);
                if (!img) {
                  alert('Failed to load SVG');
                  URL.revokeObjectURL(url);
                  return;
                }

                const canvasWidth = (canvas as any).width || 595;
                const canvasHeight = (canvas as any).height || 842;

                // Scale to fit canvas
                const maxWidth = canvasWidth * 0.7;
                const maxHeight = canvasHeight * 0.7;
                
                if (img.width && img.height) {
                  const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
                  img.scaleX = scale;
                  img.scaleY = scale;
                }

                // Center
                img.left = (canvasWidth - (img.width * (img.scaleX || 1))) / 2;
                img.top = (canvasHeight - (img.height * (img.scaleY || 1))) / 2;

                console.log('Adding SVG image to canvas');
                canvas.add(img);
                canvas.setActiveObject(img);
                canvas.renderAll();
                saveState(canvas);
                alert('SVG imported successfully!');
                URL.revokeObjectURL(url);
              } catch (err) {
                console.error('Error processing SVG image:', err);
                alert('Error: ' + (err as any).message);
                URL.revokeObjectURL(url);
              }
            },
            { crossOrigin: 'anonymous' } as any
          );
        } catch (err) {
          console.error('Reader error:', err);
          alert('Failed to read the SVG file: ' + (err as any).message);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      console.error('SVG import error:', err);
      alert('Error importing SVG: ' + (err as any).message);
    } finally {
      if (svgTemplateInputRef.current) {
        (svgTemplateInputRef.current as any).value = '';
      }
    }
  };

  const handleAIEPSImport = (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        try {
          const fileData = event.target?.result;
          if (!fileData) {
            alert('Failed to read file.');
            return;
          }

          const fileName = file.name;
          const isAI = fileName.endsWith('.ai');
          const isEPS = fileName.endsWith('.eps');

            if (isAI || isEPS) {
            console.log('Processing', isAI ? 'AI' : 'EPS', 'file:', fileName);

            // AI files are PDF-based, try to extract embedded SVG or content
            const buffer = fileData as ArrayBuffer;
            const view = new Uint8Array(buffer);
            
            // Convert buffer to string for searching (limit to avoid memory issues)
            let fileStr = '';
            for (let i = 0; i < Math.min(view.length, 100000); i++) {
              const charCode = view[i];
              // Only add printable characters and newlines
              if ((charCode >= 32 && charCode <= 126) || charCode === 10 || charCode === 13) {
                fileStr += String.fromCharCode(charCode);
              }
            }

            // Check for PDF header
            if (fileStr.includes('%PDF')) {
              console.log('Detected PDF-based format in', fileName);
            }

            // Try to find any embedded SVG data
            const svgMatch = fileStr.match(/<svg[^>]*>[\s\S]*?<\/svg>/i);
            if (svgMatch) {
              console.log('Found embedded SVG data, extracting...');
              try {
                const svgBlob = new Blob([svgMatch[0]], { type: 'image/svg+xml' });
                const svgFile = new File([svgBlob], 'embedded.svg', { type: 'image/svg+xml' });
                handleSVGImport(svgFile);
                return;
              } catch (svgErr) {
                console.warn('Could not extract embedded SVG:', svgErr);
              }
            }

            // If no SVG found, show conversion guide and add reference box
            console.log('No embedded SVG found, adding file reference');
            alert(
              `${isAI ? 'Adobe Illustrator (.ai)' : 'EPS'} file detected!\\n\\n` +
              'Since this is a proprietary format, for full editing capability:\\n\\n' +
              '1. Open the file in Adobe Illustrator or Inkscape\\n' +
              '2. Export as SVG format\\n' +
              '3. Import the SVG file here for full editing\\n\\n' +
              'Adding file reference to canvas...'
            );

            // Create an informational box with the filename
            const boxWidth = 350;
            const boxHeight = 180;
            
            const rect = new fabric.Rect({
              width: boxWidth,
              height: boxHeight,
              fill: '#f5f5f5',
              stroke: '#999999',
              strokeWidth: 2,
            });

            // Create text with filename and instruction
            const text = new fabric.Text(
              `${fileName}\\n\\n[File Reference]\\n\\nConvert to SVG for editing`,
              {
                fontSize: 14,
                fill: '#333333',
                fontFamily: 'Arial',
              }
            );

            // Center both on canvas
            const canvas = getCurrentCanvas();
            if (!canvas) {
              alert('Canvas not initialized. Please wait for the canvas to load.');
              return;
            }

            const canvasWidth = (canvas as any).width || 595;
            const canvasHeight = (canvas as any).height || 842;

            rect.left = (canvasWidth - boxWidth) / 2;
            rect.top = (canvasHeight - boxHeight) / 2;

            text.left = (canvasWidth - (text.width || 250)) / 2;
            text.top = (canvasHeight - (text.height || 100)) / 2;

            canvas.add(rect);
            canvas.add(text);
            canvas.setActiveObject(rect);
            canvas.renderAll();
            saveState(canvas);
            console.log('Added file reference to canvas');
          }
        } catch (innerError) {
          console.error('Error processing file:', innerError);
          alert('Error processing file: ' + (innerError as any).message);
        }
      };
      reader.onerror = () => {
        alert('Failed to read the file.');
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('File import error:', error);
      alert('An error occurred while importing the file: ' + (error as any).message);
    } finally {
      if (svgTemplateInputRef.current) {
        (svgTemplateInputRef.current as any).value = '';
      }
    }
  };

  const handleImageUpload = async (e: any) => {
    const file = e.target.files?.[0];
    const canvas = getCurrentCanvas();
    if (!canvas) {
      console.error('Canvas not initialized');
      alert('Canvas not initialized. Please wait for the canvas to load.');
      return;
    }
    
    if (!file) {
      console.warn('No file selected');
      return;
    }

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    try {
      const imageUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event: any) => resolve(event.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      console.log('Image data URL created');

      // Create image object
      const imgElement = new Image();
      imgElement.onload = () => {
        try {
          console.log('Creating fabric image');
          const fabricImg = new fabric.Image(imgElement);

          if (!fabricImg || !fabricImg.width || !fabricImg.height) {
            console.error('Fabric image creation failed');
            alert('Failed to create image object');
            return;
          }

          console.log('Image created:', fabricImg.width, 'x', fabricImg.height);

          const canvasWidth = (canvas as any).width || 595;
          const canvasHeight = (canvas as any).height || 842;
          const maxWidth = canvasWidth * 0.6;
          const maxHeight = canvasHeight * 0.6;

          // Scale
          if (fabricImg.width > maxWidth || fabricImg.height > maxHeight) {
            const scale = Math.min(maxWidth / fabricImg.width, maxHeight / fabricImg.height);
            fabricImg.scale(scale);
          }

          // Center
          fabricImg.left = (canvasWidth - (fabricImg.width * (fabricImg.scaleX || 1))) / 2;
          fabricImg.top = (canvasHeight - (fabricImg.height * (fabricImg.scaleY || 1))) / 2;

          // If an image is currently selected, replace it preserving transforms
          const active = (canvas as any).getActiveObject?.();
          if (active && active.type === 'image') {
            // copy transform properties from the existing image
            fabricImg.left = active.left;
            fabricImg.top = active.top;
            fabricImg.angle = active.angle || 0;
            // preserve scale if present, otherwise use computed scale
            fabricImg.scaleX = active.scaleX ?? (fabricImg.scaleX || 1);
            fabricImg.scaleY = active.scaleY ?? (fabricImg.scaleY || 1);
            fabricImg.flipX = active.flipX || false;
            fabricImg.flipY = active.flipY || false;
            fabricImg.originX = active.originX || 'left';
            fabricImg.originY = active.originY || 'top';

            canvas.add(fabricImg);
            try { canvas.remove(active); } catch (e) { /* ignore */ }
            canvas.setActiveObject(fabricImg);
            console.log('Replaced selected image with uploaded image');
            alert('Image replaced on canvas!');
          } else {
            console.log('Adding image to canvas at', fabricImg.left, fabricImg.top);
            canvas.add(fabricImg);
            canvas.setActiveObject(fabricImg);
            console.log('Image added successfully');
            alert('Image added to canvas!');
          }
          canvas.renderAll();
          saveState(canvas);
        } catch (err) {
          console.error('Error creating fabric image:', err);
          alert('Error: ' + (err as any).message);
        }
      };

      imgElement.onerror = () => {
        console.error('Image loading failed');
        alert('Failed to load image');
      };

      imgElement.src = imageUrl;

    } catch (error) {
      console.error('Image upload error:', error);
      alert('Error uploading image: ' + (error as any).message);
    } finally {
      if (fileInputRef.current) {
        (fileInputRef.current as any).value = '';
      }
    }
  };

  const uploadImage = () => {
    fileInputRef.current?.click();
  };

  const toggleDrawingMode = () => {
    if (!currentCanvas) return;
    const newMode = !drawingMode;
    setDrawingMode(newMode);
    setEraserMode(false);
    setSelectionMode(!newMode);
    currentCanvas.isDrawingMode = newMode;
    currentCanvas.selection = !newMode;
    if (newMode && currentCanvas.freeDrawingBrush) {
      currentCanvas.freeDrawingBrush = new fabric.PencilBrush(currentCanvas);
      currentCanvas.freeDrawingBrush.color = fillColor;
      currentCanvas.freeDrawingBrush.width = brushSize;
    }
  };

  const toggleEraserMode = () => {
    if (!currentCanvas) return;
    const newMode = !eraserMode;
    setEraserMode(newMode);
    setDrawingMode(false);
    setSelectionMode(!newMode);
    currentCanvas.isDrawingMode = newMode;
    currentCanvas.selection = !newMode;
    if (newMode) {
      currentCanvas.freeDrawingBrush = new fabric.PencilBrush(currentCanvas);
      currentCanvas.freeDrawingBrush.color = backgroundColor;
      currentCanvas.freeDrawingBrush.width = brushSize * 2;
    }
  };

  const updateBrushSize = (size) => {
    setBrushSize(size);
    if (currentCanvas && currentCanvas.freeDrawingBrush) {
      currentCanvas.freeDrawingBrush.width = eraserMode ? size * 2 : size;
    }
  };

  const deleteSelected = () => {
    if (!currentCanvas) return;
    const activeObjects = currentCanvas.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach(obj => currentCanvas.remove(obj));
      currentCanvas.discardActiveObject();
      currentCanvas.renderAll();
    }
  };

  const duplicateSelected = () => {
    if (!currentCanvas || !selectedObject) return;
    selectedObject.clone((cloned) => {
      cloned.left = cloned.left + 20; cloned.top = cloned.top + 20;
      currentCanvas.add(cloned);
      currentCanvas.setActiveObject(cloned);
      currentCanvas.renderAll();
    });
  };

  const groupObjects = () => {
    if (!currentCanvas) return;
    const activeObjects = currentCanvas.getActiveObjects();
    if (activeObjects.length > 1) {
      const group = new fabric.Group(activeObjects);
      currentCanvas.remove(...activeObjects);
      currentCanvas.add(group);
      currentCanvas.setActiveObject(group);
      currentCanvas.renderAll();
    }
  };

  const ungroupObjects = () => {
    if (!currentCanvas || !selectedObject) return;
    if (selectedObject.type === 'group') {
      const items = selectedObject._objects;
      selectedObject._restoreObjectsState();
      currentCanvas.remove(selectedObject);
      items.forEach(item => currentCanvas.add(item));
      currentCanvas.renderAll();
    }
  };

  const bringToFront = () => {
    if (!currentCanvas || !selectedObject) return;
    currentCanvas.bringObjectToFront(selectedObject);
    currentCanvas.renderAll();
  };

  const sendToBack = () => {
    if (!currentCanvas || !selectedObject) return;
    currentCanvas.sendObjectToBack(selectedObject);
    currentCanvas.renderAll();
  };

  const bringForward = () => {
    if (!currentCanvas || !selectedObject) return;
    (currentCanvas as any).bringForward(selectedObject);
    currentCanvas.renderAll();
  };

  const sendBackward = () => {
    if (!currentCanvas || !selectedObject) return;
    (currentCanvas as any).sendBackward(selectedObject);
    currentCanvas.renderAll();
  };

  const flipHorizontal = () => {
    if (!selectedObject) return;
    selectedObject.flipX = !selectedObject.flipX;
    currentCanvas?.renderAll();
  };

  const flipVertical = () => {
    if (!selectedObject) return;
    selectedObject.flipY = !selectedObject.flipY;
    currentCanvas?.renderAll();
  };

  const toggleLock = () => {
    if (!selectedObject) return;
    const isLocked = selectedObject.lockMovementX;
    (selectedObject as any).lockMovementX = !isLocked;
    (selectedObject as any).lockMovementY = !isLocked;
    (selectedObject as any).lockRotation = !isLocked;
    (selectedObject as any).lockScalingX = !isLocked;
    (selectedObject as any).lockScalingY = !isLocked;
    selectedObject.selectable = isLocked;
    currentCanvas?.renderAll();
  };

  const updateFillColor = (color) => {
    setFillColor(color);
    if (selectedObject && 'fill' in selectedObject) {
      selectedObject.fill = color;
      currentCanvas?.renderAll();
    }
    if (currentCanvas && currentCanvas.freeDrawingBrush && !eraserMode) {
      currentCanvas.freeDrawingBrush.color = color;
    }
  };

  const updateStrokeColor = (color) => {
    setStrokeColor(color);
    if (selectedObject && 'stroke' in selectedObject) {
      selectedObject.stroke = color;
      currentCanvas?.renderAll();
    }
  };

  const updateStrokeWidth = (width) => {
    setStrokeWidth(width);
    if (selectedObject && 'strokeWidth' in selectedObject) {
      selectedObject.strokeWidth = width;
      currentCanvas?.renderAll();
    }
  };

  const updateOpacity = (value) => {
    setOpacity(value);
    if (selectedObject) {
      selectedObject.opacity = value / 100;
      currentCanvas?.renderAll();
    }
  };

  const updateRotation = (angle) => {
    setRotation(angle);
    if (selectedObject) {
      selectedObject.rotate(angle);
      currentCanvas?.renderAll();
    }
  };

  const updateFontSize = (size) => {
    setFontSize(size);
    if (selectedObject && selectedObject.type === 'i-text') {
      selectedObject.fontSize = size;
      currentCanvas?.renderAll();
    }
  };

  const updateFontFamily = (family) => {
    setFontFamily(family);
    if (selectedObject && selectedObject.type === 'i-text') {
      selectedObject.fontFamily = family;
      currentCanvas?.renderAll();
    }
  };

  const updateLineHeight = (value) => {
    setLineHeight(value);
    if (selectedObject && selectedObject.type === 'i-text') {
      selectedObject.lineHeight = value;
      currentCanvas?.renderAll();
    }
  };

  const updateLetterSpacing = (value) => {
    setLetterSpacing(value);
    if (selectedObject && selectedObject.type === 'i-text') {
      selectedObject.charSpacing = value;
      currentCanvas?.renderAll();
    }
  };

  const updateTextStroke = () => {
    if (!selectedObject || selectedObject.type !== 'i-text') return;
    if (textStroke) {
      selectedObject.stroke = textStrokeColor;
      (selectedObject as any).strokeWidth = textStrokeWidth;
    } else {
      selectedObject.stroke = null;
      (selectedObject as any).strokeWidth = 0;
    }
    currentCanvas?.renderAll();
  };

  const updateBorderRadius = (value) => {
    setBorderRadius(value);
    if (selectedObject && selectedObject.type === 'rect') {
      selectedObject.rx = value; selectedObject.ry = value;
      currentCanvas?.renderAll();
    }
  };

  const updateShadow = () => {
    if (!selectedObject) return;
    if (shadowBlur > 0 || shadowOffsetX !== 0 || shadowOffsetY !== 0) {
      selectedObject.shadow = new fabric.Shadow({
        color: shadowColor,
        blur: shadowBlur,
        offsetX: shadowOffsetX,
        offsetY: shadowOffsetY,
      });
    } else {
      selectedObject.shadow = null;
    }
    currentCanvas?.renderAll();
  };

  const applyFilters = () => {
    if (!selectedObject || selectedObject.type !== 'image') return;
    
    const filters: any[] = [];
    if (brightness !== 0) {
      filters.push(new fabric.Image.filters.Brightness({ brightness: brightness / 100 }));
    }
    if (contrast !== 0) {
      filters.push(new fabric.Image.filters.Contrast({ contrast: contrast / 100 }));
    }
    if (saturation !== 0) {
      filters.push(new fabric.Image.filters.Saturation({ saturation: saturation / 100 }));
    }
    if (blur > 0) {
      filters.push(new fabric.Image.filters.Blur({ blur: blur / 100 }));
    }
    
    selectedObject.filters = filters;
    selectedObject.applyFilters();
    currentCanvas?.renderAll();
  };

  // Keyboard shortcuts: undo/redo/delete/duplicate/save/export
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const canvas = getCurrentCanvas();
      if (!canvas) return;
      const ctrl = e.ctrlKey || e.metaKey;

      // Select All: Ctrl+A
      if (ctrl && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        canvas.discardActiveObject();
        canvas.getObjects().forEach((obj: any) => {
          obj.set({ selected: true });
          canvas.setActiveObject(obj);
        });
        const sel = new fabric.ActiveSelection(canvas.getObjects(), { canvas });
        canvas.setActiveObject(sel);
        canvas.renderAll();
        return;
      }

      // Undo: Ctrl+Z
      if (ctrl && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        // Broadcast undo action to collaborators
        if (isCollaborating) {
          broadcastCanvasChange(canvas.toJSON(['objects']));
        }
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if (ctrl && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        redo();
        // Broadcast redo action to collaborators
        if (isCollaborating) {
          broadcastCanvasChange(canvas.toJSON(['objects']));
        }
        return;
      }

      // Delete
      if (e.key === 'Delete') {
        e.preventDefault();
        deleteSelected();
        // Broadcast delete action to collaborators
        if (isCollaborating) {
          broadcastCanvasChange(canvas.toJSON(['objects']));
        }
        return;
      }

      // Duplicate: Ctrl+D
      if (ctrl && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelected();
        // Broadcast duplicate action to collaborators
        if (isCollaborating) {
          broadcastCanvasChange(canvas.toJSON(['objects']));
        }
        return;
      }

      // Save: Ctrl+S
      if (ctrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
        return;
      }
    };

    window.addEventListener('keydown', handler as any);
    return () => window.removeEventListener('keydown', handler as any);
  }, [currentPageIndex, historyIndex, selectedObject, drawingMode, isCollaborating]);

  // Spacebar handling and workspace panning key listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpaceDown(true);
        if (workspaceRef.current && !isPanning.current) workspaceRef.current.style.cursor = 'grab';
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpaceDown(false);
        if (workspaceRef.current && !isPanning.current) workspaceRef.current.style.cursor = 'default';
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const alignLeft = () => {
    if (selectedObject && selectedObject.type === 'i-text') {
      selectedObject.textAlign = 'left';
      currentCanvas?.renderAll();
    }
  };

  const alignCenter = () => {
    if (selectedObject && selectedObject.type === 'i-text') {
      selectedObject.textAlign = 'center';
      currentCanvas?.renderAll();
    }
  };

  const alignRight = () => {
    if (selectedObject && selectedObject.type === 'i-text') {
      selectedObject.textAlign = 'right';
      currentCanvas?.renderAll();
    }
  };

  const alignJustify = () => {
    if (selectedObject && selectedObject.type === 'i-text') {
      selectedObject.textAlign = 'justify';
      currentCanvas?.renderAll();
    }
  };

  const toggleBold = () => {
    if (selectedObject && selectedObject.type === 'i-text') {
      (selectedObject as any).fontWeight = (selectedObject as any).fontWeight === 'bold' ? 'normal' : 'bold';
      currentCanvas?.renderAll();
    }
  };

  const toggleItalic = () => {
    if (selectedObject && selectedObject.type === 'i-text') {
      (selectedObject as any).fontStyle = (selectedObject as any).fontStyle === 'italic' ? 'normal' : 'italic';
      currentCanvas?.renderAll();
    }
  };

  const toggleUnderline = () => {
    if (selectedObject && selectedObject.type === 'i-text') {
      (selectedObject as any).underline = !(selectedObject as any).underline;
      currentCanvas?.renderAll();
    }
  };

  const toggleStrikethrough = () => {
    if (selectedObject && selectedObject.type === 'i-text') {
      (selectedObject as any).linethrough = !(selectedObject as any).linethrough;
      currentCanvas?.renderAll();
    }
  };

  const updateBackgroundColor = (color) => {
    setBackgroundColor(color);
    if (currentCanvas) {
      currentCanvas.backgroundColor = color;
      currentCanvas.renderAll();
    }
  };

  const zoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 5);
    setZoom(newZoom);
  };

  const zoomOut = () => {
    const newZoom = Math.max(zoom / 1.2, 0.1);
    setZoom(newZoom);
  };

  const resetZoom = () => {
    setZoom(1);
  };

  const applyMask = (type: 'rect' | 'ellipse' | 'path') => {
    const canvas = getCurrentCanvas();
    if (!canvas) return;
    const obj: any = canvas.getActiveObject();
    if (!obj) {
      alert('Select an image or group to apply a mask');
      setShowMaskTool(false);
      return;
    }

    // Compute mask dimensions based on object bounding box
    const bbox = obj.getBoundingRect();
    let mask: any = null;
    if (type === 'rect') {
      mask = new fabric.Rect({
        left: bbox.left + bbox.width / 2,
        top: bbox.top + bbox.height / 2,
        originX: 'center',
        originY: 'center',
        width: bbox.width,
        height: bbox.height,
        absolutePositioned: true,
        selectable: false,
        evented: false,
      });
    } else if (type === 'ellipse') {
      mask = new fabric.Ellipse({
        left: bbox.left + bbox.width / 2,
        top: bbox.top + bbox.height / 2,
        originX: 'center',
        originY: 'center',
        rx: bbox.width / 2,
        ry: bbox.height / 2,
        absolutePositioned: true,
        selectable: false,
        evented: false,
      });
    } else {
      // Simple fallback path: use ellipse for now
      mask = new fabric.Ellipse({
        left: bbox.left + bbox.width / 2,
        top: bbox.top + bbox.height / 2,
        originX: 'center',
        originY: 'center',
        rx: bbox.width / 2,
        ry: bbox.height / 2,
        absolutePositioned: true,
        selectable: false,
        evented: false,
      });
    }

    try {
      // Apply as clipPath to object or group
      if (obj.type === 'group' || obj.type === 'activeSelection') {
        obj.clipPath = mask;
      } else {
        obj.clipPath = mask;
      }
      canvas.requestRenderAll();
      saveState(canvas);
    } catch (err) {
      console.warn('Failed to apply mask:', err);
    }

    setShowMaskTool(false);
  };

  // Keep page decorations and canvas container transforms in sync with zoom.
  useEffect(() => {
    // Scale the page box (decorations, borders, etc.) so it zooms visually
    if (pageBoxRef.current) {
      pageBoxRef.current.style.transform = `scale(${zoom})`;
      pageBoxRef.current.style.transformOrigin = 'center center';
      // When zooming out, allow overflow so the fabric canvas (which we inverse-scale)
      // doesn't get clipped by the rounded page box. When zoomed in keep clipping.
      pageBoxRef.current.style.overflow = zoom < 1 ? 'visible' : 'hidden';
    }
    // Apply no inverse transform: we want the page wrapper scale to affect
    // the entire page including the fabric canvas. Removing the inverse
    // transform ensures the artwork visually scales along with the page.
    if (canvasContainerRef.current) {
      canvasContainerRef.current.style.transform = '';
      canvasContainerRef.current.style.transformOrigin = '';
      canvasContainerRef.current.style.willChange = 'auto';
    }
  }, [zoom]);

  const addNewPage = () => {
    // Atomically save current page JSON and append a new page to avoid races
    const currentJson = currentCanvas ? currentCanvas.toJSON() : null;

    const newPage = {
      id: Date.now(), // Use timestamp for unique ID
      canvas: null,
      name: `Page ${pages.length + 1}`,
      data: null
    };

    setPages((prev) => {
      const updated = prev.map((p, i) => {
        if (i === currentPageIndex) {
          return { ...p, data: currentJson };
        }
        return p;
      });

      const next = [...updated, newPage];
      // switch to the newly added page index
      setCurrentPageIndex(next.length - 1);
      return next;
    });

    setShowAddPageModal(false);
  };

  const deletePage = (index) => {
    if (pages.length === 1) {
      alert('Cannot delete the last page');
      return;
    }
    // Save current page data before deleting
    saveCurrentPageData();

    setPages((prev) => {
      const pageToDelete = prev[index];
      if (pageToDelete && pageToDelete.canvas) {
        try { pageToDelete.canvas.dispose(); } catch (err) { console.warn('Error disposing canvas:', err); }
      }

      const newPages = prev.filter((_, i) => i !== index);

      // Adjust current page index based on deletion
      if (currentPageIndex >= newPages.length) {
        setCurrentPageIndex(newPages.length - 1);
      } else if (currentPageIndex > index) {
        setCurrentPageIndex(currentPageIndex - 1);
      }

      return newPages;
    });
  };

  const updatePageSize = () => {
    const size = selectedSize === 'Custom' 
      ? { width: customWidth, height: customHeight }
      : PAGE_SIZES[selectedSize];
    
    if (currentCanvas) {
      currentCanvas.setDimensions(size);
      currentCanvas.renderAll();
    }
    setShowSizeModal(false);
  };

  // Helper to compute current page pixel size
  const getPagePixelSize = () => {
    if (selectedSize === 'Custom') return { width: customWidth, height: customHeight };
    return PAGE_SIZES[selectedSize as keyof typeof PAGE_SIZES] || PAGE_SIZES['A4 Portrait'];
  };

  const clearCanvas = () => {
    if (!currentCanvas) return;
    if (confirm('Clear all content? This cannot be undone.')) {
      currentCanvas.clear();
      currentCanvas.backgroundColor = backgroundColor;
      if (gridVisible) {
        const size = PAGE_SIZES[selectedSize];
        addGrid(currentCanvas, size);
      }
      currentCanvas.renderAll();
    }
  };

  // Export functions for multiple formats
  const exportAsFormat = (format: 'png' | 'jpg' | 'svg') => {
    if (!currentCanvas) return;
    
    const objects = currentCanvas.getObjects();
    const gridObjects = objects.filter((obj: any) => obj.excludeFromExport);
    gridObjects.forEach((obj: any) => { obj.visible = false; });
    
    let dataURL = '';
    let filename = `${projectName.replace(/\s+/g, '-').toLowerCase()}-page-${currentPageIndex + 1}`;
    
    try {
      if (format === 'svg') {
        // For SVG, we need to use toSVG method
        const svgData = currentCanvas.toSVG() as string;
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.svg`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        // For PNG and JPG
        dataURL = currentCanvas.toDataURL({
          format: format === 'jpg' ? 'jpeg' : 'png',
          quality: format === 'jpg' ? 0.95 : 1,
          multiplier: 2,
        });
        
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `${filename}.${format}`;
        link.click();
      }
    } catch (error) {
      console.error(`Failed to export as ${format}:`, error);
    } finally {
      gridObjects.forEach((obj: any) => { obj.visible = true; });
      currentCanvas.renderAll();
    }
  };

  const handleExport = () => {
    if (!currentCanvas) return;
    exportAsFormat('png');
  };

  const exportAsJPG = () => exportAsFormat('jpg');
  const exportAsPNG = () => exportAsFormat('png');
  const exportAsSVG = () => exportAsFormat('svg');

  const exportAsPDF = async () => {
    if (!currentCanvas) return;
    
    try {
      // Try to use jsPDF if available, otherwise provide fallback
      try {
        const { jsPDF } = await import('jspdf');
        
        const objects = currentCanvas.getObjects();
        const gridObjects = objects.filter((obj: any) => obj.excludeFromExport);
        gridObjects.forEach((obj: any) => { obj.visible = false; });
        
        const imgData = currentCanvas.toDataURL({ format: 'png', multiplier: 2 });
        
        const width = (currentCanvas.width || 595) / 2.835;
        const height = (currentCanvas.height || 842) / 2.835;
        
        const pdf = new jsPDF({
          orientation: width > height ? 'landscape' : 'portrait',
          unit: 'mm',
          format: [width, height],
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, width, height);
        pdf.save(`${projectName.replace(/\s+/g, '-').toLowerCase()}-page-${currentPageIndex + 1}.pdf`);
        
        gridObjects.forEach((obj: any) => { obj.visible = true; });
        currentCanvas.renderAll();
        console.log('PDF exported successfully');
      } catch (jsPdfError) {
        // jsPDF not installed - provide installation instructions
        console.warn('jsPDF not available:', jsPdfError);
        alert(
          'PDF export requires jsPDF. Please install it with:\n\nnpm install jspdf\n\nExporting as PNG instead for now.'
        );
        exportAsPNG();
      }
    } catch (error) {
      console.error('Failed to export as PDF:', error);
      alert('PDF export failed. Exporting as PNG instead.');
      exportAsPNG();
    }
  };

  const exportAsEPS = () => {
    if (!currentCanvas) return;
    
    try {
      const objects = currentCanvas.getObjects();
      const gridObjects = objects.filter((obj: any) => obj.excludeFromExport);
      gridObjects.forEach((obj: any) => { obj.visible = false; });
      
      // Get canvas as SVG
      const svgData = currentCanvas.toSVG() as string;
      
      // Convert SVG to simple EPS format
      const width = currentCanvas.width || 595;
      const height = currentCanvas.height || 842;
      
      let epsContent = `%!PS-Adobe-3.0 EPSF-3.0
%%Creator: Alton Studio
%%Title: ${projectName}
%%BoundingBox: 0 0 ${width} ${height}
%%Pages: 1
%%DocumentSuppliedResources: font Helvetica
%%EndComments
%%BeginSetup
/inch {72 mul} def
%%EndSetup
%%Page: 1 1
gsave
0 0 moveto
${width} 0 lineto
${width} ${height} lineto
0 ${height} lineto
closepath
stroke
grestore
showpage
%%EOF`;
      
      const blob = new Blob([epsContent], { type: 'application/postscript' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}-page-${currentPageIndex + 1}.eps`;
      link.click();
      URL.revokeObjectURL(url);
      
      gridObjects.forEach((obj: any) => { obj.visible = true; });
      currentCanvas.renderAll();
    } catch (error) {
      console.error('Failed to export as EPS:', error);
    }
  };

  const exportAllPages = () => {
    pages.forEach((page, index) => {
      if (page.canvas) {
        const objects = page.canvas.getObjects();
        const gridObjects = objects.filter((obj: any) => obj.excludeFromExport);
        gridObjects.forEach((obj: any) => { obj.visible = false; });
        
        const dataURL = page.canvas.toDataURL({
          format: 'png',
          quality: 1,
          multiplier: 2,
        });
        
        gridObjects.forEach((obj: any) => { obj.visible = true; });
        page.canvas.renderAll();
        
        const link = document.createElement('a');
        link.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}-page-${index + 1}.png`;
        link.href = dataURL;
        link.click();
      }
    });
  };

  const handleSave = () => {
    saveToStorage();
  };

  const searchTemplates = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch('/api/freepik-search', {
        method: 'POST',
        body: JSON.stringify({ query: searchQuery.trim() }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const loadTemplate = (templateUrl: string) => {
    if (!currentCanvas) return;
    fabric.Image.fromURL(templateUrl, (img: any) => {
      if (img && img.width && img.height) {
        img.scaleToWidth(currentCanvas!.width || 595);
        currentCanvas!.add(img);
        (currentCanvas! as any).sendToBack(img);
        currentCanvas!.renderAll();
      }
    }, { crossOrigin: 'anonymous' } as any);
  };

  // Real-time effect updates
  useEffect(() => {
    if (textStroke) {
      updateTextStroke();
    }
  }, [textStroke, textStrokeColor, textStrokeWidth]);

  useEffect(() => {
    updateShadow();
  }, [shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-black to-purple-950">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <input
        ref={svgTemplateInputRef}
        type="file"
        accept=".svg,.ai,.eps"
        onChange={handleTemplateFileUpload}
        className="hidden"
      />

      {loadingTemplate && (
        <div className="absolute inset-0 bg-black/80 z-[100] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto text-purple-500 animate-spin mb-4" />
            <p className="text-white text-lg">Loading template...</p>
          </div>
        </div>
      )}

      {loadingDesign && (
        <div className="absolute inset-0 bg-black/80 z-[100] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto text-purple-500 animate-spin mb-4" />
            <p className="text-white text-lg">Loading design...</p>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-xl border-b border-white/10 z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          {/* Hamburger Menu for Mobile */}
          <a href="/templates" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10">
            <Home className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">Back</span>
          </a>
          
          {isEditingName ? (
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
              className="bg-white/5 border border-purple-500/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
            >
              <Edit3 className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">{projectName}</span>
            </button>
          )}

          {lastSaved && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-600/20 rounded-lg border border-green-500/30">
              <Sparkle className="w-3 h-3 text-green-400" />
              <span className="text-xs text-green-400">Saved {new Date(lastSaved).toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Zoom Controls */}
          <button
            onClick={zoomOut}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-white" />
          </button>
              
              <button
                onClick={resetZoom}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
                title="Reset Zoom"
              >
                <span className="text-xs text-white font-medium">{Math.round(zoom * 100)}%</span>
              </button>
              
              <button
                onClick={zoomIn}
                className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4 text-white" />
              </button>

              <div className="w-px h-8 bg-white/10" />

              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg transition-colors border border-purple-500/30"
              >
                <Search className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">Find More</span>
              </button>

              <div className="w-px h-8 bg-white/10" />

              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10 disabled:opacity-50"
                title="Undo"
              >
                <Undo2 className="w-4 h-4 text-white" />
              </button>
              
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10 disabled:opacity-50"
                title="Redo"
              >
                <Redo2 className="w-4 h-4 text-white" />
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
              >
                {isSaving ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <SaveAll className="w-4 h-4 text-white" />}
                <span className="text-sm font-medium text-white">Save</span>
              </button>

          {/* My Designs */}
          <button
            onClick={() => router.push('/designs')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-lg transition-all shadow-lg shadow-emerald-500/25"
            title="View My Designs - All your saved designs"
          >
            <Palette className="w-4 h-4 text-white" />
            <span className="text-sm font-bold text-white">My Designs</span>
          </button>

          {/* Collaboration Button */}
          <button
            onClick={() => setCollaborativeMode(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all shadow-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/25"
            title="Real-time collaborative editing"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-sm text-white">{isCollaborating ? 'Live: ' + collaborationCode : 'Go Live'}</span>
          </button>

          {/* Real-time Collaboration Chat Sidebar - Right Side Only */}
          {collaborativeMode && isCollaborating && (
            <div className="fixed inset-0 z-50 flex">
              {/* Background overlay (left side clickable to close) */}
              <div className="flex-1 bg-black/50" onClick={() => setCollaborativeMode(false)} />

              {/* Chat Sidebar (Right side - Full Height) */}
              <div className="w-80 bg-slate-950 border-l border-white/10 flex flex-col h-screen">
                {/* Session Info Box - At Top */}
                <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-4 border-b border-white/10 space-y-4">
                  {/* Session Code - PROMINENT */}
                  <div className="bg-white/20 rounded-lg px-4 py-3 space-y-2 border border-white/30">
                    <p className="text-xs font-semibold text-cyan-50 uppercase tracking-widest">Your Session Code</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-3xl font-bold text-white font-mono tracking-widest">{collaborationCode}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(collaborationCode);
                          alert('Code copied to clipboard!');
                        }}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex-shrink-0"
                        title="Copy code"
                      >
                        <Copy className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    <p className="text-xs text-cyan-50">Share this code for others to join</p>
                  </div>

                  {/* Connected Collaborators */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Group className="w-4 h-4 text-white" />
                        <span className="text-sm font-semibold text-white">Connected Collaborators</span>
                      </div>
                      <span className="text-sm font-bold text-cyan-100">({collaboratorsList.length})</span>
                    </div>
                    <div className="bg-white/10 rounded px-3 py-2 space-y-1">
                      {collaboratorsList.map((collab) => (
                        <div key={collab.id} className="flex items-center justify-between text-xs">
                          <span className="text-white">{collab.name}</span>
                          <span className="text-green-300">🔴 Live</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* End Session Button */}
                  <button
                    onClick={() => {
                      setIsCollaborating(false);
                      setCollaboratorsList([]);
                      setCollaborationCode('');
                      setChatMessages([]);
                      setCollaborativeMode(false);
                    }}
                    className="w-full px-3 py-2 bg-red-600/40 hover:bg-red-600/50 border border-red-500/60 rounded-lg text-red-200 text-sm font-bold transition-colors"
                  >
                    End Session
                  </button>
                </div>

                {/* Chat Header */}
                <div className="bg-slate-800 px-6 py-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-bold text-white">Team Chat</h3>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">{collaborationCode}</span>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center">
                      <div>
                        <MessageCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No messages yet</p>
                        <p className="text-gray-600 text-xs mt-1">Start chatting with your team!</p>
                      </div>
                    </div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div key={msg.id} className="bg-slate-800 rounded-lg p-3 border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="collab-color-indicator" style={{ backgroundColor: msg.color }}></div>
                          <span className="text-sm font-semibold text-white">{msg.user}</span>
                          <span className="text-xs text-gray-500 ml-auto">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 break-words">{msg.message}</p>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="border-t border-white/10 p-4 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          sendChatMessage(chatInput);
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                    />
                    <button
                      onClick={() => sendChatMessage(chatInput)}
                      className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white transition-colors"
                      title="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 text-center">Press Enter to send</p>
                </div>
              </div>
            </div>
          )}

          {/* Collaboration Setup Modal - Right Side Sidebar - FULL HEIGHT */}
          {collaborativeMode && !isCollaborating && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setCollaborativeMode(false)} />
              
              {/* Right Sidebar Modal */}
              <div className="fixed right-0 top-0 z-50 h-screen w-96 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-l border-cyan-500/30 shadow-2xl overflow-y-auto">
                {/* Header with Gradient */}
                <div className="sticky top-0 bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-6 border-b border-cyan-400/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-7 h-7 text-white" />
                    <div>
                      <h2 className="text-2xl font-bold text-white">Live Collaboration</h2>
                      <p className="text-cyan-100 text-xs">Design together in real-time</p>
                    </div>
                  </div>
                  <button onClick={() => setCollaborativeMode(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0" title="Close">
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>

                <div className="p-8 space-y-8">
                  {/* Start Session Section */}
                  <div className="space-y-4">
                    <h3 className="text-white font-bold text-lg">Start a New Session</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">Create a new collaborative session and share the code with your team to start designing together</p>
                    <button
                      onClick={startCollaborativeSession}
                      className="w-full px-6 py-5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-lg text-white font-bold transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:shadow-cyan-500/30 text-lg"
                    >
                      <Plus className="w-6 h-6" />
                      Start Live Session
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/20"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-3 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-400 font-bold uppercase tracking-widest">OR</span>
                    </div>
                  </div>

                  {/* Join Session Section */}
                  <div className="space-y-4">
                    <h3 className="text-white font-bold text-lg">Join Existing Session</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">Ask your team for their collaboration code and join their active design session</p>
                    <input
                      type="text"
                      placeholder="Enter code"
                      value={collaborationCode}
                      onChange={(e) => setCollaborationCode(e.target.value.toUpperCase())}
                      className="w-full px-4 py-4 bg-slate-700/50 border-2 border-cyan-500/30 hover:border-cyan-500/60 focus:border-cyan-500 rounded-lg text-white placeholder-gray-400 text-center font-mono text-3xl font-bold tracking-widest focus:outline-none transition-all focus:shadow-lg focus:shadow-cyan-500/20"
                      maxLength={6}
                    />
                    <button
                      onClick={() => joinCollaborativeSession(collaborationCode)}
                      className="w-full px-6 py-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg text-white font-bold transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:shadow-green-500/30 text-lg"
                    >
                      Join Session
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-all shadow-lg shadow-purple-500/25"
            >
              <Download className="w-4 h-4 text-white" />
              <span className="text-sm font-bold text-white">Export</span>
              <ChevronDown className={`w-4 h-4 text-white transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showExportMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-black/95 border border-white/20 rounded-lg shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
                <button
                  onClick={() => { exportAsPNG(); setShowExportMenu(false); }}
                  className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export as PNG
                </button>
                <button
                  onClick={() => { exportAsJPG(); setShowExportMenu(false); }}
                  className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-2 border-t border-white/10"
                >
                  <Download className="w-4 h-4" />
                  Export as JPG
                </button>
                <button
                  onClick={() => { exportAsSVG(); setShowExportMenu(false); }}
                  className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-2 border-t border-white/10"
                >
                  <Download className="w-4 h-4" />
                  Export as SVG
                </button>
                <button
                  onClick={() => { exportAsPDF(); setShowExportMenu(false); }}
                  className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-2 border-t border-white/10"
                >
                  <Download className="w-4 h-4" />
                  Export as PDF
                </button>
                <button
                  onClick={() => { exportAsEPS(); setShowExportMenu(false); }}
                  className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-2 border-t border-white/10"
                >
                  <Download className="w-4 h-4" />
                  Export as EPS
                </button>
                <button
                  onClick={() => { exportAllPages(); setShowExportMenu(false); }}
                  className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-2 border-t border-white/10 border-b"
                >
                  <Download className="w-4 h-4" />
                  Export All Pages (PNG)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Left Sidebar - Tools */}
      <div className="absolute top-16 left-0 bottom-0 bg-black/95 backdrop-blur-xl border-r border-white/10 z-40 overflow-y-auto transition-all w-80">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">Tools</h3>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('tools')}
              className={'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all' + (activeTab === 'tools' ? ' bg-purple-600 text-white' : ' bg-white/5 text-gray-400 hover:bg-white/10')}
            >
              Tools
            </button>
            <button
              onClick={() => setActiveTab('properties')}
              className={'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all' + (activeTab === 'properties' ? ' bg-purple-600 text-white' : ' bg-white/5 text-gray-400 hover:bg-white/10')}
            >
              Props
            </button>
            <button
              onClick={() => setActiveTab('pages')}
              className={'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all' + (activeTab === 'pages' ? ' bg-purple-600 text-white' : ' bg-white/5 text-gray-400 hover:bg-white/10')}
            >
              Pages
            </button>
          </div>

          {/* Tools Tab */}
          {activeTab === 'tools' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                  <MousePointer className="w-4 h-4" />
                  Mode Selection
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={enableSelectionMode}
                    className={`p-3 rounded-lg transition-colors flex flex-col items-center gap-2 ${
                      selectionMode ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <MousePointer className="w-5 h-5" />
                    <span className="text-xs">Select</span>
                  </button>
                  <button
                    onClick={toggleDrawingMode}
                    className={`p-3 rounded-lg transition-colors flex flex-col items-center gap-2 ${
                      drawingMode ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <Pen className="w-5 h-5" />
                    <span className="text-xs">Draw</span>
                  </button>
                  <button
                    onClick={toggleEraserMode}
                    className={`p-3 rounded-lg transition-colors flex flex-col items-center gap-2 ${
                      eraserMode ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <Eraser className="w-5 h-5" />
                    <span className="text-xs">Erase</span>
                  </button>
                </div>
              </div>

              {(drawingMode || eraserMode) && (
                <div className="px-3 py-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">Brush Size</span>
                    <span className="text-xs text-white font-medium">{brushSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={brushSize}
                    onChange={(e) => updateBrushSize(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}

              <div>
                <h3 className="text-white font-bold mb-3">Basic Shapes</h3>
                <div className="grid grid-cols-3 gap-2">
              <button onClick={addText} className="p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex flex-col items-center gap-2">
                <Type className="w-5 h-5 text-white" />
                <span className="text-xs text-gray-400">Text</span>
              </button>
              <button onClick={addRectangle} className="p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex flex-col items-center gap-2">
                <Square className="w-5 h-5 text-white" />
                <span className="text-xs text-gray-400">Rectangle</span>
              </button>
              <button onClick={addCircle} className="p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex flex-col items-center gap-2">
                <Circle className="w-5 h-5 text-white" />
                <span className="text-xs text-gray-400">Circle</span>
              </button>
              <button onClick={addTriangle} className="p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex flex-col items-center gap-2">
                <Triangle className="w-5 h-5 text-white" />
                <span className="text-xs text-gray-400">Triangle</span>
              </button>
              <button onClick={addStar} className="p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex flex-col items-center gap-2">
                <Star className="w-5 h-5 text-white" />
                <span className="text-xs text-gray-400">Star</span>
              </button>
              <button onClick={addPentagon} className="p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex flex-col items-center gap-2">
                <Pentagon className="w-5 h-5 text-white" />
                <span className="text-xs text-gray-400">Pentagon</span>
              </button>
              <button onClick={addHexagon} className="p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex flex-col items-center gap-2">
                <Hexagon className="w-5 h-5 text-white" />
                <span className="text-xs text-gray-400">Hexagon</span>
              </button>
              <button onClick={addLine} className="p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex flex-col items-center gap-2">
                <Minus className="w-5 h-5 text-white" />
                <span className="text-xs text-gray-400">Line</span>
              </button>
                </div>
              </div>

              <div>
                <h3 className="text-white font-bold mb-3">Advanced</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={addGradientRect} className="p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex flex-col items-center gap-2">
                    <Blend className="w-5 h-5 text-white" />
                    <span className="text-xs text-gray-400">Gradient</span>
                  </button>
                  <button onClick={uploadImage} className="p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex flex-col items-center gap-2">
                    <ImagePlus className="w-5 h-5 text-white" />
                    <span className="text-xs text-gray-400">Image</span>
                  </button>
                  <button onClick={() => setShowMaskTool(true)} className="p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex flex-col items-center gap-2">
                    <Crop className="w-5 h-5 text-white" />
                    <span className="text-xs text-gray-400">Mask</span>
                  </button>
                  <button onClick={() => setPenMode(!penMode)} className={`p-3 rounded-lg transition-colors flex flex-col items-center gap-2 ${penMode ? 'bg-blue-600 text-white' : 'bg-white/5 hover:bg-white/10 text-gray-400'}`}>
                    <Edit3 className="w-5 h-5" />
                    <span className="text-xs">{penMode ? 'Drawing...' : 'Pen Tool'}</span>
                  </button>
                  <div className="p-3 bg-white/5 rounded-lg flex flex-col gap-2 col-span-2">
                    <button onClick={() => startMaskEditing()} className="w-full p-2 bg-white/10 hover:bg-white/15 rounded">Edit Mask</button>
                    <label className="flex items-center justify-between text-xs text-gray-400">
                      <span>Invert</span>
                      <input type="checkbox" checked={maskInvert} onChange={(e) => setMaskInvert(e.target.checked)} />
                    </label>
                    <label className="text-xs text-gray-400">Feather <span className="text-white">{maskFeather}px</span></label>
                    <input type="range" min={0} max={50} value={maskFeather} onChange={(e) => setMaskFeather(Number(e.target.value))} />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-white font-bold mb-3">Colors</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">Background</label>
                    <div className="flex gap-2">
                      <input type="color" value={backgroundColor} onChange={(e) => updateBackgroundColor(e.target.value)} className="w-12 h-10 rounded cursor-pointer" />
                      <input type="text" value={backgroundColor} onChange={(e) => updateBackgroundColor(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">Fill Color</label>
                    <div className="flex gap-2">
                      <input type="color" value={fillColor} onChange={(e) => updateFillColor(e.target.value)} className="w-12 h-10 rounded cursor-pointer" />
                      <input type="text" value={fillColor} onChange={(e) => updateFillColor(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">Stroke Color</label>
                    <div className="flex gap-2">
                      <input type="color" value={strokeColor} onChange={(e) => updateStrokeColor(e.target.value)} className="w-12 h-10 rounded cursor-pointer" />
                      <input type="text" value={strokeColor} onChange={(e) => updateStrokeColor(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-white font-bold mb-3">Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={duplicateSelected} disabled={!selectedObject} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 flex items-center justify-center gap-2">
                    <Copy className="w-4 h-4 text-white" />
                    <span className="text-xs text-white">Duplicate</span>
                  </button>
                  <button onClick={deleteSelected} disabled={!selectedObject} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-30 flex items-center justify-center gap-2">
                    <Trash2 className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-red-400">Delete</span>
                  </button>
                  <button onClick={groupObjects} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <Group className="w-4 h-4 text-white" />
                    <span className="text-xs text-white">Group</span>
                  </button>
                  <button onClick={ungroupObjects} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <Ungroup className="w-4 h-4 text-white" />
                    <span className="text-xs text-white">Ungroup</span>
                  </button>
                  <button onClick={clearCanvas} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors flex items-center justify-center gap-2 col-span-2">
                    <Trash2 className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-red-400">Clear Canvas</span>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-white font-bold mb-3">Settings</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setGridVisible(!gridVisible)}
                    className={`w-full p-2 rounded-lg transition-colors flex items-center justify-between ${
                      gridVisible ? 'bg-purple-600/20 border border-purple-500/30' : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-sm text-white flex items-center gap-2">
                      <Grid3x3 className="w-4 h-4" />
                      Show Grid
                    </span>
                    <div className={`w-10 h-5 rounded-full transition-colors ${gridVisible ? 'bg-purple-600' : 'bg-gray-600'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform ${gridVisible ? 'ml-5' : 'ml-0.5'}`} />
                    </div>
                  </button>
                  <button
                    onClick={() => setSnapToGrid(!snapToGrid)}
                    className={`w-full p-2 rounded-lg transition-colors flex items-center justify-between ${
                      snapToGrid ? 'bg-purple-600/20 border border-purple-500/30' : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-sm text-white flex items-center gap-2">
                      <Magnet className="w-4 h-4" />
                      Snap to Grid
                    </span>
                    <div className={`w-10 h-5 rounded-full transition-colors ${snapToGrid ? 'bg-purple-600' : 'bg-gray-600'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform ${snapToGrid ? 'ml-5' : 'ml-0.5'}`} />
                    </div>
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowLayers(!showLayers)}
                className="w-full p-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Layers className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">View Layers</span>
              </button>
            </div>
          )}

          {/* Properties Tab */}
          {activeTab === 'properties' && (
            <div className="space-y-4">
              {!selectedObject ? (
                <div className="text-center py-12">
                  <Palette className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Select an object to edit properties</p>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-purple-600/20 rounded-lg border border-purple-500/30">
                    <div className="text-xs text-purple-300 mb-1">Selected Object</div>
                    <div className="text-sm text-white font-medium capitalize">
                      {selectedObject.type === 'i-text' ? 'Text' : selectedObject.type}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Colors & Stroke
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-400 mb-2 block">Fill Color</label>
                        <div className="flex gap-2">
                          <input type="color" value={fillColor} onChange={(e) => updateFillColor(e.target.value)} className="w-12 h-10 rounded cursor-pointer" />
                          <input type="text" value={fillColor} onChange={(e) => updateFillColor(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 mb-2 block">Stroke Color</label>
                        <div className="flex gap-2">
                          <input type="color" value={strokeColor} onChange={(e) => updateStrokeColor(e.target.value)} className="w-12 h-10 rounded cursor-pointer" />
                          <input type="text" value={strokeColor} onChange={(e) => updateStrokeColor(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 mb-2 flex items-center justify-between">
                          <span>Stroke Width</span>
                          <span className="text-white">{strokeWidth}px</span>
                        </label>
                        <input type="range" min="0" max="20" value={strokeWidth} onChange={(e) => updateStrokeWidth(Number(e.target.value))} className="w-full" />
                      </div>
                    </div>
                  </div>

                  {selectedObject.type === 'rect' && (
                    <div>
                      <h3 className="text-white font-bold mb-3">Border Radius</h3>
                      <div>
                        <label className="text-xs text-gray-400 mb-2 flex items-center justify-between">
                          <span>Radius</span>
                          <span className="text-white">{borderRadius}px</span>
                        </label>
                        <input type="range" min="0" max="100" value={borderRadius} onChange={(e) => updateBorderRadius(Number(e.target.value))} className="w-full" />
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-white font-bold mb-3">Transform</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-400 mb-2 flex items-center justify-between">
                          <span>Opacity</span>
                          <span className="text-white">{opacity}%</span>
                        </label>
                        <input type="range" min="0" max="100" value={opacity} onChange={(e) => updateOpacity(Number(e.target.value))} className="w-full" />
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 mb-2 flex items-center justify-between">
                          <span>Rotation</span>
                          <span className="text-white">{Math.round(rotation)}°</span>
                        </label>
                        <input type="range" min="0" max="360" value={rotation} onChange={(e) => updateRotation(Number(e.target.value))} className="w-full" />
                      </div>
                    </div>
                  </div>

                  {selectedObject.type === 'i-text' && (
                    <>
                      <div>
                        <h3 className="text-white font-bold mb-3">Text Properties</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-gray-400 mb-2 block">Font Size</label>
                            <input type="number" value={fontSize} onChange={(e) => updateFontSize(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" />
                          </div>

                          <div>
                            <label className="text-xs text-gray-400 mb-2 block">Font Family</label>
                            <select value={fontFamily} onChange={(e) => updateFontFamily(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white text-sm max-h-64 hover:bg-slate-700 focus:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500">
                              <option className="font-option" disabled>Popular Fonts</option>
                              {PROFESSIONAL_FONTS.slice(0, 40).map((font) => (
                                <option key={font} value={font} className="font-option">{font}</option>
                              ))}
                              <option className="font-option" disabled>---</option>
                              <option className="font-option" disabled>Professional Fonts</option>
                              {PROFESSIONAL_FONTS.slice(40).map((font) => (
                                <option key={font} value={font} className="font-option">{font}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-xs text-gray-400 mb-2 flex items-center justify-between">
                              <span>Line Height</span>
                              <span className="text-white">{lineHeight.toFixed(2)}</span>
                            </label>
                            <input type="range" min="0.5" max="3" step="0.1" value={lineHeight} onChange={(e) => updateLineHeight(Number(e.target.value))} className="w-full" />
                          </div>

                          <div>
                            <label className="text-xs text-gray-400 mb-2 flex items-center justify-between">
                              <span>Letter Spacing</span>
                              <span className="text-white">{letterSpacing}</span>
                            </label>
                            <input type="range" min="-200" max="800" value={letterSpacing} onChange={(e) => updateLetterSpacing(Number(e.target.value))} className="w-full" />
                          </div>

                          <div>
                            <label className="text-xs text-gray-400 mb-2 block">Format</label>
                            <div className="grid grid-cols-4 gap-2">
                              <button onClick={toggleBold} className="p-2 bg-white/5 hover:bg-white/10 rounded transition-colors">
                                <Bold className="w-4 h-4 text-white mx-auto" />
                              </button>
                              <button onClick={toggleItalic} className="p-2 bg-white/5 hover:bg-white/10 rounded transition-colors">
                                <Italic className="w-4 h-4 text-white mx-auto" />
                              </button>
                              <button onClick={toggleUnderline} className="p-2 bg-white/5 hover:bg-white/10 rounded transition-colors">
                                <Underline className="w-4 h-4 text-white mx-auto" />
                              </button>
                              <button onClick={toggleStrikethrough} className="p-2 bg-white/5 hover:bg-white/10 rounded transition-colors">
                                <Strikethrough className="w-4 h-4 text-white mx-auto" />
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs text-gray-400 mb-2 block">Alignment</label>
                            <div className="grid grid-cols-4 gap-2">
                              <button onClick={alignLeft} className="p-2 bg-white/5 hover:bg-white/10 rounded transition-colors">
                                <AlignLeft className="w-4 h-4 text-white mx-auto" />
                              </button>
                              <button onClick={alignCenter} className="p-2 bg-white/5 hover:bg-white/10 rounded transition-colors">
                                <AlignCenter className="w-4 h-4 text-white mx-auto" />
                              </button>
                              <button onClick={alignRight} className="p-2 bg-white/5 hover:bg-white/10 rounded transition-colors">
                                <AlignRight className="w-4 h-4 text-white mx-auto" />
                              </button>
                              <button onClick={alignJustify} className="p-2 bg-white/5 hover:bg-white/10 rounded transition-colors">
                                <AlignJustify className="w-4 h-4 text-white mx-auto" />
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs text-gray-400 mb-2 flex items-center justify-between">
                              <span>Text Stroke</span>
                              <button
                                onClick={() => setTextStroke(!textStroke)}
                                className={`px-2 py-1 rounded text-xs ${textStroke ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400'}`}
                              >
                                {textStroke ? 'On' : 'Off'}
                              </button>
                            </label>
                            {textStroke && (
                              <div className="space-y-2 mt-2">
                                <div className="flex gap-2">
                                  <input type="color" value={textStrokeColor} onChange={(e) => setTextStrokeColor(e.target.value)} className="w-12 h-8 rounded cursor-pointer" />
                                  <input type="number" min="1" max="10" value={textStrokeWidth} onChange={(e) => setTextStrokeWidth(Number(e.target.value))} placeholder="Width" className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedObject.type === 'image' && (
                    <div>
                      <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Image Filters
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-400 mb-2 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <Sun className="w-4 h-4" />
                              Brightness
                            </span>
                            <span className="text-white">{brightness}</span>
                          </label>
                          <input type="range" min="-100" max="100" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full" />
                        </div>

                        <div>
                          <label className="text-xs text-gray-400 mb-2 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <Contrast className="w-4 h-4" />
                              Contrast
                            </span>
                            <span className="text-white">{contrast}</span>
                          </label>
                          <input type="range" min="-100" max="100" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full" />
                        </div>

                        <div>
                          <label className="text-xs text-gray-400 mb-2 flex items-center justify-between">
                            <span>Saturation</span>
                            <span className="text-white">{saturation}</span>
                          </label>
                          <input type="range" min="-100" max="100" value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} className="w-full" />
                        </div>

                        <div>
                          <label className="text-xs text-gray-400 mb-2 flex items-center justify-between">
                            <span>Blur</span>
                            <span className="text-white">{blur}</span>
                          </label>
                          <input type="range" min="0" max="100" value={blur} onChange={(e) => setBlur(Number(e.target.value))} className="w-full" />
                        </div>

                        <button onClick={applyFilters} className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-bold text-white transition-all">
                          Apply Filters
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-white font-bold mb-3">Shadow Effects</h3>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input type="color" value={shadowColor} onChange={(e) => setShadowColor(e.target.value)} className="w-12 h-10 rounded cursor-pointer" />
                        <input type="text" value={shadowColor} onChange={(e) => setShadowColor(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm" placeholder="Color" />
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 mb-2 flex items-center justify-between">
                          <span>Blur</span>
                          <span className="text-white">{shadowBlur}px</span>
                        </label>
                        <input type="range" min="0" max="50" value={shadowBlur} onChange={(e) => setShadowBlur(Number(e.target.value))} className="w-full" />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-400 mb-2 block">Offset X</label>
                          <input type="number" value={shadowOffsetX} onChange={(e) => setShadowOffsetX(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-sm" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-2 block">Offset Y</label>
                          <input type="number" value={shadowOffsetY} onChange={(e) => setShadowOffsetY(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-sm" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-bold mb-3">Layer Order</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={bringToFront} className="p-2 bg-white/5 hover:bg-white/10 rounded transition-colors flex items-center justify-center gap-2">
                        <ChevronUp className="w-4 h-4 text-white" />
                        <span className="text-xs text-white">Front</span>
                      </button>
                      <button onClick={sendToBack} className="p-2 bg-white/5 hover:bg-white/10 rounded transition-colors flex items-center justify-center gap-2">
                        <ChevronDown className="w-4 h-4 text-white" />
                        <span className="text-xs text-white">Back</span>
                      </button>
                      <button onClick={bringForward} className="p-2 bg-white/5 hover:bg-white/10 rounded transition-colors flex items-center justify-center gap-2">
                        <ChevronUp className="w-3 h-3 text-white" />
                        <span className="text-xs text-white">Forward</span>
                      </button>
                      <button onClick={sendBackward} className="p-2 bg-white/5 hover:bg-white/10 rounded transition-colors flex items-center justify-center gap-2">
                        <ChevronDown className="w-3 h-3 text-white" />
                        <span className="text-xs text-white">Backward</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-bold mb-3">Actions</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={flipHorizontal} className="p-2 bg-white/5 hover:bg-white/10 rounded transition-colors flex items-center justify-center gap-2">
                        <FlipHorizontal className="w-4 h-4 text-white" />
                        <span className="text-xs text-white">Flip H</span>
                      </button>
                      <button onClick={flipVertical} className="p-2 bg-white/5 hover:bg-white/10 rounded transition-colors flex items-center justify-center gap-2">
                        <FlipVertical className="w-4 h-4 text-white" />
                        <span className="text-xs text-white">Flip V</span>
                      </button>
                      <button onClick={toggleLock} className="p-2 bg-white/5 hover:bg-white/10 rounded transition-colors flex items-center justify-center gap-2 col-span-2">
                        {selectedObject.lockMovementX ? <Lock className="w-4 h-4 text-white" /> : <Unlock className="w-4 h-4 text-white" />}
                        <span className="text-xs text-white">{selectedObject.lockMovementX ? 'Unlock' : 'Lock'}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Pages Tab */}
          {activeTab === 'pages' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold">All Pages</h3>
                <span className="text-xs text-gray-400">Page {currentPageIndex + 1} of {pages.length}</span>
              </div>

              <button
                onClick={() => setShowAddPageModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                <PlusCircle className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">Add New Page</span>
              </button>

              <button
                onClick={() => setShowSizeModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
              >
                <Settings className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">Edit Page Size</span>
              </button>

              {pages.length > 1 && (
                <button
                  onClick={exportAllPages}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span className="text-sm font-medium text-white">Export All Pages</span>
                </button>
              )}

              <div className="space-y-3 mt-6">
                {pages.map((page, index) => (
                  <div
                    key={page.id}
                    className={`relative group rounded-lg border-2 transition-all ${
                      currentPageIndex === index
                        ? 'border-purple-500 bg-purple-600/20'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div
                      onClick={() => {
                        saveCurrentPageData();
                        // switch page
                        setCurrentPageIndex(index);
                        // restore history for the selected page if present
                        const pageMeta = pagesRef.current[index];
                        if (pageMeta?.history && Array.isArray(pageMeta.history)) {
                          try {
                            setHistory(pageMeta.history);
                            setHistoryIndex(typeof pageMeta.historyIndex === 'number' ? pageMeta.historyIndex : pageMeta.history.length - 1);
                          } catch (err) {
                            console.warn('Failed to restore history on page switch:', err);
                          }
                        }
                      }}
                      className="w-full p-4 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-white" />
                        <div>
                          <div className="text-sm font-medium text-white">{page.name}</div>
                          <div className="text-xs text-gray-400">Page {index + 1}</div>
                        </div>
                      </div>
                    </div>
                    
                    {pages.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePage(index);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Layers Modal */}
      {showLayers && (
        <div className="absolute inset-0 bg-black/80 z-[60] flex items-center justify-center" onClick={() => setShowLayers(false)}>
          <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-[400px] max-h-[600px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Layers
              </h3>
              <button onClick={() => setShowLayers(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {currentCanvas?.getObjects().reverse().map((obj, i) => (
                <div
                  key={i}
                  onClick={() => {
                    currentCanvas?.setActiveObject(obj);
                    currentCanvas?.renderAll();
                  }}
                  className={`w-full p-3 rounded-lg text-left text-sm transition-colors cursor-pointer flex items-center justify-between ${
                    selectedObject === obj ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <span>{obj.type === 'i-text' ? 'Text' : obj.type === 'image' ? 'Image' : obj.type || 'Object'}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        currentCanvas.bringForward(obj);
                        currentCanvas.renderAll();
                      }}
                      className="p-1 hover:bg-white/20 rounded"
                      title="Bring Forward"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        currentCanvas.sendBackward(obj);
                        currentCanvas.renderAll();
                      }}
                      className="p-1 hover:bg-white/20 rounded"
                      title="Send Backward"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Page Size Modal */}
      {showSizeModal && (
        <div className="absolute inset-0 bg-black/80 z-[60] flex items-center justify-center" onClick={() => setShowSizeModal(false)}>
          <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-[500px] max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Maximize2 className="w-5 h-5" />
                Edit Page Size
              </h3>
              <button onClick={() => setShowSizeModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {Object.keys(PAGE_SIZES).map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-full p-4 rounded-lg text-left transition-all border ${
                    selectedSize === size
                      ? 'bg-purple-600/20 border-purple-500 text-white'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <div className="font-bold">{size}</div>
                  <div className="text-sm text-gray-400">
                    {PAGE_SIZES[size].width} × {PAGE_SIZES[size].height} px
                  </div>
                </button>
              ))}
            </div>

            {selectedSize === 'Custom' && (
              <div className="mb-6">
                <label className="text-sm text-gray-400 mb-2 block">Custom Size</label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(Number(e.target.value))}
                      placeholder="Width"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white"
                    />
                    <div className="text-xs text-gray-500 mt-1">Width (px)</div>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(Number(e.target.value))}
                      placeholder="Height"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white"
                    />
                    <div className="text-xs text-gray-500 mt-1">Height (px)</div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={updatePageSize}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-bold text-white transition-all"
            >
              Apply Size
            </button>
          </div>
        </div>
      )}

      {/* Add Page Modal */}
      {showAddPageModal && (
        <div className="absolute inset-0 bg-black/80 z-[60] flex items-center justify-center" onClick={() => setShowAddPageModal(false)}>
          <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-[400px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                Add New Page
              </h3>
              <button onClick={() => setShowAddPageModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <p className="text-gray-400 mb-6">Add a new blank page to your project with the same dimensions.</p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddPageModal(false)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-lg font-medium text-white transition-all border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={addNewPage}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-bold text-white transition-all"
              >
                Add Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Sidebar */}
      <div className={`absolute top-16 right-0 bottom-0 w-96 bg-black/95 backdrop-blur-xl border-l border-white/10 z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Find Inspiration</h2>
              <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchTemplates()}
                placeholder="Search templates..."
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
              />
            </div>
            
            <button
              onClick={searchTemplates}
              disabled={isSearching}
              className="w-full mt-3 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 rounded-lg font-medium transition-colors text-white"
            >
              {isSearching ? 'Searching...' : 'Search Freepik'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
                <p className="text-sm text-gray-400">Searching...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {searchResults.map((template, i) => (
                  <button
                    key={template.id || i}
                    onClick={() => loadTemplate(template.preview)}
                    className="group relative aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all hover:scale-105"
                  >
                    <img src={template.preview} alt="Template" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <span className="text-xs font-medium text-white">Load</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <Search className="w-12 h-12 text-gray-600 mb-3" />
                <p className="text-sm text-gray-400">Search Freepik for background inspiration</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Canvas Container */}
      <div ref={workspaceRef} className="absolute inset-0 top-16 bg-gray-900/50 overflow-auto transition-all left-80 right-0">
        <div
          style={{
            minWidth: 2400,
            minHeight: 1600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 200,
            boxSizing: 'border-box',
            backgroundImage: 'repeating-linear-gradient(#0b1220 0 1px, transparent 1px 40px), repeating-linear-gradient(90deg, #0b1220 0 1px, transparent 1px 40px)'
          }}
          onPointerDown={(e) => {
            if (!spaceDown) return;
            isPanning.current = true;
            panStart.current = {
              x: e.clientX,
              y: e.clientY,
              scrollLeft: workspaceRef.current?.scrollLeft || 0,
              scrollTop: workspaceRef.current?.scrollTop || 0,
            };
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            if (workspaceRef.current) workspaceRef.current.style.cursor = 'grabbing';
          }}
          onPointerMove={(e) => {
            if (!isPanning.current || !workspaceRef.current) return;
            const dx = e.clientX - panStart.current.x;
            const dy = e.clientY - panStart.current.y;
            workspaceRef.current.scrollLeft = panStart.current.scrollLeft - dx;
            workspaceRef.current.scrollTop = panStart.current.scrollTop - dy;
          }}
          onPointerUp={(e) => {
            if (!isPanning.current) return;
            isPanning.current = false;
            try { (e.target as HTMLElement).releasePointerCapture?.(e.pointerId); } catch {}
            if (workspaceRef.current) workspaceRef.current.style.cursor = spaceDown ? 'grab' : 'default';
          }}
        >
          {/* Page box (fixed size). Zoom is handled via Fabric's canvas.setZoom so we DON'T apply CSS scale here. */}
          <div
            ref={pageBoxRef}
            className="bg-white shadow-2xl page-box"
            style={{
              width: `${getPagePixelSize().width}px`,
              height: `${getPagePixelSize().height}px`,
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Floating subtle gradient decorations inside the page */}
            <div className="floating-gradient g1" />
            <div className="floating-gradient g2" />
            <div className="floating-gradient g3" />

            {/* Smart guide overlays (shown while dragging) */}
            <div ref={verticalGuideRef} className="guide-line guide-vertical" />
            <div ref={horizontalGuideRef} className="guide-line guide-horizontal" />

            {/* Small page toolbar */}
            <div className="canvas-wrapper absolute top-2 left-2 z-10 flex gap-2">
            </div>

            <div ref={canvasContainerRef} className="canvas-container" />
          </div>
        </div>
      </div>

      {/* Floating gradient styles for page decorations and panning cursor */}
      <style>{`
        .floating-gradient { position: absolute; border-radius: 50%; filter: blur(30px); opacity: 0.25; transform: translate3d(0,0,0); }
        .floating-gradient.g1 { width: 180px; height: 180px; left: 10%; top: 10%; background: radial-gradient(circle at 30% 30%, #7c3aed, transparent 40%); animation: floaty 6s ease-in-out infinite alternate; }
        .floating-gradient.g2 { width: 120px; height: 120px; right: 12%; top: 25%; background: radial-gradient(circle at 30% 30%, #06b6d4, transparent 40%); animation: floaty 7s ease-in-out infinite alternate-reverse; }
        .floating-gradient.g3 { width: 220px; height: 220px; left: 50%; bottom: 8%; background: radial-gradient(circle at 30% 30%, #f472b6, transparent 40%); animation: floaty 9s ease-in-out infinite alternate; }
        @keyframes floaty { from { transform: translateY(0px) } to { transform: translateY(-18px) } }
        .page-box { background: linear-gradient(180deg, #ffffff 0%, #fbfbff 100%); }
      `}</style>

      {/* Save Notification */}
      {showSaveNotif && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-green-500/90 backdrop-blur-xl text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-2 z-50 animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span className="font-medium">Project saved successfully!</span>
        </div>
      )}

      {/* Mask tool modal */}
      {showMaskTool && (
        <MaskTool onApply={(t) => applyMask(t)} onClose={() => setShowMaskTool(false)} />
      )}

      {/* Bottom Info */}
      <div className="absolute bottom-6 left-[340px] text-white/20 text-xs font-medium pointer-events-none z-30">
        Alton Studio · {templateData?.name || selectedSize} · Page {currentPageIndex + 1}/{pages.length}
      </div>
    </div>
  );
}
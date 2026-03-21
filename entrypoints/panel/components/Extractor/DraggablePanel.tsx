import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface DraggablePanelProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  initialWidth?: number;
  initialHeight?: number;
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export const DraggablePanel: React.FC<DraggablePanelProps> = ({ 
  title, 
  onClose, 
  children,
  initialWidth = 600,
  initialHeight = 400
}) => {
  const MIN_PANEL_WIDTH = 400;
  const MIN_PANEL_HEIGHT = 300;
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const resizeRef = useRef<{
    direction: ResizeDirection;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startLeft: number;
    startTop: number;
  } | null>(null);
  
  // Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const startResize = (direction: ResizeDirection, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    setIsResizing(true);
    resizeRef.current = {
      direction,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: size.width,
      startHeight: size.height,
      startLeft: position.x,
      startTop: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
      if (isResizing) {
          const resizeData = resizeRef.current;
          if (!resizeData) return;
          const dx = e.clientX - resizeData.startX;
          const dy = e.clientY - resizeData.startY;

          let nextWidth = resizeData.startWidth;
          let nextHeight = resizeData.startHeight;
          let nextLeft = resizeData.startLeft;
          let nextTop = resizeData.startTop;

          if (resizeData.direction.includes('e')) {
            nextWidth = Math.max(MIN_PANEL_WIDTH, resizeData.startWidth + dx);
          }
          if (resizeData.direction.includes('s')) {
            nextHeight = Math.max(MIN_PANEL_HEIGHT, resizeData.startHeight + dy);
          }
          if (resizeData.direction.includes('w')) {
            nextWidth = Math.max(MIN_PANEL_WIDTH, resizeData.startWidth - dx);
            nextLeft = resizeData.startLeft + (resizeData.startWidth - nextWidth);
          }
          if (resizeData.direction.includes('n')) {
            nextHeight = Math.max(MIN_PANEL_HEIGHT, resizeData.startHeight - dy);
            nextTop = resizeData.startTop + (resizeData.startHeight - nextHeight);
          }

          setSize({ width: nextWidth, height: nextHeight });
          setPosition({ x: nextLeft, y: nextTop });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      resizeRef.current = null;
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, position]);

  // Center on first render
  useEffect(() => {
     setPosition({
         x: Math.max(0, (window.innerWidth - initialWidth) / 2),
         y: Math.max(0, (window.innerHeight - initialHeight) / 2)
     });
  }, []);

  const panel = (
    <div className="extractor-root">
      <div 
         className="extractor-overlay"
         onClick={onClose} 
      />
      <div 
        className="extractor-panel"
        style={{
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
        }}
      >
        {/* Header */}
        <div 
          className="extractor-header"
          onMouseDown={handleMouseDown}
        >
          <div className="extractor-title">
             <span>{title}</span>
          </div>
          <button 
            onClick={onClose}
            className="extractor-close"
            aria-label="Close extractor"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="extractor-body">
          {children}
        </div>

        <div className="extractor-resize-handle extractor-resize-handle--n" onMouseDown={(e) => startResize('n', e)} />
        <div className="extractor-resize-handle extractor-resize-handle--s" onMouseDown={(e) => startResize('s', e)} />
        <div className="extractor-resize-handle extractor-resize-handle--e" onMouseDown={(e) => startResize('e', e)} />
        <div className="extractor-resize-handle extractor-resize-handle--w" onMouseDown={(e) => startResize('w', e)} />
        <div className="extractor-resize-handle extractor-resize-handle--ne" onMouseDown={(e) => startResize('ne', e)} />
        <div className="extractor-resize-handle extractor-resize-handle--nw" onMouseDown={(e) => startResize('nw', e)} />
        <div className="extractor-resize-handle extractor-resize-handle--se" onMouseDown={(e) => startResize('se', e)} />
        <div className="extractor-resize-handle extractor-resize-handle--sw" onMouseDown={(e) => startResize('sw', e)} />
      </div>
    </div>
  );

  if (typeof document === 'undefined') return panel;
  return createPortal(panel, document.body);
};

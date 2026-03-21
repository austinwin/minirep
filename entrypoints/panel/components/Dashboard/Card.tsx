import React, { forwardRef } from 'react';
import { Minimize2, Maximize2, X } from 'lucide-react';
import './Dashboard.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  onClose?: () => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
  headerControls?: React.ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ 
  style, 
  className, 
  onMouseDown, 
  onMouseUp, 
  onTouchEnd, 
  children, 
  title, 
  onClose,
  onMinimize,
  isMinimized,
  headerControls,
  ...props 
}, ref) => {
  return (
    <div
      ref={ref}
      style={style}
      className={`card-container ${className || ''}`}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onTouchEnd={onTouchEnd}
      {...props}
    >
        <div className="card-header drag-handle">
            <div className="card-title">
               <h3>{title}</h3>
            </div>
            <div className="card-actions" onMouseDown={e => e.stopPropagation()}>
               {headerControls}
               {onMinimize && (
                   <button 
                     onClick={onMinimize} 
                     className="icon-btn"
                     title={isMinimized ? "Restore" : "Minimize"}
                   >
                     {isMinimized ? <Maximize2 size={14}/> : <Minimize2 size={14}/>}
                   </button>
               )}
               {onClose && (
                   <button 
                     onClick={onClose} 
                     className="icon-btn"
                     title="Close"
                   >
                     <X size={14}/>
                   </button>
               )}
            </div>
        </div>
        {!isMinimized && <div
          className="card-content"
          onMouseDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
        >
            {children}
        </div>}
    </div>
  );
});

Card.displayName = "Card";

import React, { useRef } from 'react';

interface TopBarProps {
  paused: boolean;
  isExtractorOpen: boolean;
  isAIReperOpen: boolean;
  onTogglePause: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onExtractorToggle: () => void;
  onAIReperToggle: () => void;
  onResetLayout: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  paused,
  isExtractorOpen,
  isAIReperOpen,
  onTogglePause,
  onExport,
  onImport,
  onExtractorToggle,
  onAIReperToggle,
  onResetLayout,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
    }
    // Reset value to allow re-importing same file
    if (event.target) {
      event.target.value = '';
    }
  };

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-dot" />
        <div>
          <div className="brand-title">minirep</div>
          <div className="brand-sub">DevTools request mirror</div>
        </div>
      </div>
      <div className="topbar-actions">
        <button
          className={`btn ghost${paused ? ' active' : ''}`}
          onClick={onTogglePause}
        >
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button className="btn ghost" onClick={handleImportClick}>
          Import
        </button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".json"
          onChange={handleFileChange}
        />
        <button className="btn ghost" onClick={onExport}>
          Export
        </button>
        <button 
          className={`btn ${isExtractorOpen ? 'primary' : 'ghost'}`} 
          onClick={onExtractorToggle}
        >
          Extractor
        </button>
        <button 
          className={`btn ${isAIReperOpen ? 'primary' : 'ghost'}`} 
          onClick={onAIReperToggle}
        >
          AI MiniReper
        </button>
        <button className="btn ghost" onClick={onResetLayout}>
          Reset Layout
        </button>
      </div>
    </header>
  );
};

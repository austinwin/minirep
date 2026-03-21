import React, { useState, useEffect, useRef, useMemo } from 'react';
import { browser } from '#imports';
import { Responsive, getCompactor } from 'react-grid-layout';

type Layouts = { [key: string]: any[] };
import { LayoutTemplate } from 'lucide-react';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Card } from './Card';
import { NetworkEntry, ParsedRequest } from '../../types';
import { AISettings, AIContextItem } from '../../types/ai';
import { WidthProvider } from './WidthProvider';

import { RequestList } from '../RequestList';
import { RequestDetail } from '../RequestDetail';
import { ResponseDetail } from '../ResponseDetail';
import { AIMiniReper } from '../AIMiniReper/AIMiniReper';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface WorkspaceProps {
  requests: NetworkEntry[];
  selectedId: string | null;
  selectedIds: string[];
  selectedRequest: NetworkEntry | null;
  selectedRequests: NetworkEntry[];
  paused: boolean;
  onSelect: (id: string | null) => void;
  onSelectionChange: (ids: string[]) => void;
  onClear: () => void;
  onExport: () => void;
  onTogglePause: () => void;
  onSend: (req: ParsedRequest) => Promise<NetworkEntry | null>;
  isSending: boolean;
  
  // AI Props
  isAIReperOpen: boolean;
  onCloseAIReper: () => void;
  settings: AISettings;
  onUpdateSettings: (s: AISettings) => void;
  resetSignal: number;
  extractorCatalog: AIContextItem[];
  extractorContextItems: AIContextItem[];
  onAddExtractorContextItems: (items: AIContextItem[]) => void;
  onRemoveExtractorContextItem: (id: string) => void;
  onClearExtractorContextItems: () => void;
}

const GRID_BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const BASE_GRID_COLS = { lg: 96, md: 80, sm: 48, xs: 32, xxs: 16 };
const GRID_ROW_HEIGHT = 5;
const GRID_MARGIN: [number, number] = [4, 4];
const GRID_CONTAINER_PADDING: [number, number] = [4, 4];
const MIN_GRID_W = 16;
const MIN_GRID_H = 20;
const WORKSPACE_MIN_WIDTH = 1600;
const WORKSPACE_BASE_HEIGHT = 900;
const WORKSPACE_VERTICAL_SLACK = 320;
const OVERLAP_COMPACTOR = getCompactor(null, true, false);
const LAYOUT_STORAGE_KEY = 'minirep-layout';
const VISIBILITY_STORAGE_KEY = 'minirep-visibility';

const getDynamicCols = (width: number) => {
  const scale = width / WORKSPACE_MIN_WIDTH;
  const cols: Record<string, number> = {};
  for (const bp in BASE_GRID_COLS) {
    cols[bp] = Math.round(BASE_GRID_COLS[bp as keyof typeof BASE_GRID_COLS] * scale);
  }
  return cols;
};

const getRequiredWidth = (layouts: Layouts) => {
  let maxRight = 0;
  // We check 'lg' as the reference for expansion
  const lgLayout = layouts['lg'] || [];
  lgLayout.forEach((item: any) => {
    maxRight = Math.max(maxRight, item.x + item.w);
  });
  
  if (maxRight <= BASE_GRID_COLS.lg) return WORKSPACE_MIN_WIDTH;
  
  const scale = maxRight / BASE_GRID_COLS.lg;
  // Add some buffer (e.g. 5% + 100px) to ensure we don't just fit exactly
  return Math.ceil(scale * 1.05 * WORKSPACE_MIN_WIDTH);
};

const getRowCount = (height: number) =>
  Math.max(
    1,
    Math.floor(
      (height - GRID_CONTAINER_PADDING[1] * 2 + GRID_MARGIN[1]) /
        (GRID_ROW_HEIGHT + GRID_MARGIN[1])
    )
  );

// Keys for component visibility mapping
type ComponentKey = 'capture' | 'request' | 'response' | 'ai-minireper';

const readLocalStorageJSON = <T,>(key: string): T | null => {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const writeLocalStorageJSON = (key: string, value: unknown) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage write failures (quota, privacy mode, etc.)
  }
};

const readStoredJSON = async <T,>(key: string): Promise<T | null> => {
  try {
    if (typeof browser !== 'undefined' && browser.storage?.local) {
      const res = await browser.storage.local.get(key);
      if (res && res[key]) {
        return res[key] as T;
      }
    }
  } catch {
    // Ignore extension storage errors and fall back to localStorage
  }
  return readLocalStorageJSON<T>(key);
};

const writeStoredJSON = async (key: string, value: unknown) => {
  if (typeof browser !== 'undefined' && browser.storage?.local) {
    try {
      await browser.storage.local.set({ [key]: value });
    } catch {
      // Ignore extension storage errors and fall back to localStorage
    }
  }
  writeLocalStorageJSON(key, value);
};

const buildDefaultLayouts = (viewRows: number): Layouts => {
  const aiHeight = Math.max(MIN_GRID_H * 2, Math.floor(viewRows / 2));
  
  const commonLg = [
      { i: 'capture', x: 0, y: 0, w: 32, h: viewRows, minW: 16, minH: 20 },
      { i: 'request', x: 32, y: 0, w: 32, h: viewRows, minW: 16, minH: 20 },
      { i: 'response', x: 64, y: 0, w: 32, h: viewRows, minW: 16, minH: 20 },
      { i: 'ai-minireper', x: 64, y: 15, w: 32, h: aiHeight, minW: 24, minH: 20 }, 
  ];

  const commonMd = [
        { i: 'capture', x: 0, y: 0, w: 26, h: viewRows, minW: 16, minH: 20 },
        { i: 'request', x: 26, y: 0, w: 26, h: viewRows, minW: 16, minH: 20 },
        { i: 'response', x: 52, y: 0, w: 28, h: viewRows, minW: 16, minH: 20 },
        { i: 'ai-minireper', x: 52, y: 15, w: 28, h: aiHeight, minW: 24, minH: 20 }, 
  ];

  // We simply clone these for smaller breakpoints to ensure existence, 
  // relying on RGL to resize widths if needed, but at least y-coords persist.
  return {
    lg: commonLg,
    md: commonMd,
    sm: commonMd, // Fallback
    xs: commonMd, // Fallback
    xxs: commonMd // Fallback
  };
};

const CARD_MIN_DEFAULTS: Record<ComponentKey, { minW: number; minH: number }> = {
  capture: { minW: MIN_GRID_W, minH: MIN_GRID_H },
  request: { minW: MIN_GRID_W, minH: MIN_GRID_H },
  response: { minW: MIN_GRID_W, minH: MIN_GRID_H },
  'ai-minireper': { minW: 24, minH: MIN_GRID_H }
};

const normalizeLayouts = (allLayouts: Layouts, maxRows: number, colsMap: Record<string, number> = BASE_GRID_COLS) => {
  return Object.keys(allLayouts).reduce((acc, key) => {
    const cols =
      colsMap[key as keyof typeof colsMap] ?? colsMap.lg;

    acc[key] = allLayouts[key].map((item: any) => {
      const defaults = CARD_MIN_DEFAULTS[item.i as ComponentKey] ?? {
        minW: MIN_GRID_W,
        minH: MIN_GRID_H
      };
      const minW = defaults.minW;
      const minH = defaults.minH;
      const effectiveMinW =
        typeof cols === 'number' ? Math.min(minW, cols) : minW;
      
      // We remove the maxRows constraint from normalization to allow infinite vertical scrolling/placement
      // const effectiveMinH = typeof maxRows === 'number' ? Math.min(minH, maxRows) : minH;
      const effectiveMinH = minH;

      const w =
        typeof cols === 'number'
          ? Math.min(Math.max(item.w, effectiveMinW), cols)
          : Math.max(item.w, effectiveMinW);
      
      const h = Math.max(item.h, effectiveMinH);

      let x = Math.max(item.x, 0);
      let y = Math.max(item.y, 0);

      if (typeof cols === 'number' && x + w > cols) {
        x = Math.max(0, cols - w);
      }

      // Allow placement beyond maxRows
      // if (typeof maxRows === 'number' && y + h > maxRows) {
      //   y = Math.max(0, maxRows - h);
      // }

      return {
        ...item,
        x,
        y,
        w,
        h,
        minW: effectiveMinW,
        minH: effectiveMinH
      };
    });

    return acc;
  }, {} as Layouts);
};

export const Workspace: React.FC<WorkspaceProps> = ({
  requests,
  selectedId,
  selectedIds,
  selectedRequest,
  selectedRequests,
  paused,
  onSelect,
  onSelectionChange,
  onClear,
  onExport,
  onTogglePause,
  onSend,
  isSending,
  isAIReperOpen,
  onCloseAIReper,
  settings,
  onUpdateSettings,
  resetSignal,
  extractorCatalog,
  extractorContextItems,
  onAddExtractorContextItems,
  onRemoveExtractorContextItem,
  onClearExtractorContextItems
}) => {
  const workspaceScrollRef = useRef<HTMLDivElement>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const [workspaceBaseHeight, setWorkspaceBaseHeight] = useState(WORKSPACE_BASE_HEIGHT);

  const viewRows = getRowCount(workspaceBaseHeight);
  // Increase vertical slack significantly to allow dragging cards further down
  const workspaceCanvasHeight = workspaceBaseHeight + WORKSPACE_VERTICAL_SLACK * 4; 
  // We remove maxRows constraint from the grid itself to allow infinite scrolling usage if needed, 
  // or just set it very high. 
  const maxRows = getRowCount(workspaceCanvasHeight);
  const defaultLayouts = buildDefaultLayouts(viewRows);
  
  const [workspaceCanvasWidth, setWorkspaceCanvasWidth] = useState(() => {
    const saved = readLocalStorageJSON<Layouts>(LAYOUT_STORAGE_KEY);
    return saved ? getRequiredWidth(saved) : WORKSPACE_MIN_WIDTH;
  });
  
  const dynamicCols = useMemo(() => getDynamicCols(workspaceCanvasWidth), [workspaceCanvasWidth]);

  const [layouts, setLayouts] = useState<Layouts>(() => {
    const saved = readLocalStorageJSON<Layouts>(LAYOUT_STORAGE_KEY);
    // Use dynamic cols during init to ensure loaded layout fits
    const initialWidth = saved ? getRequiredWidth(saved) : WORKSPACE_MIN_WIDTH;
    const initialCols = getDynamicCols(initialWidth);

    return saved
      ? normalizeLayouts(saved, maxRows, initialCols)
      : normalizeLayouts(defaultLayouts, maxRows, initialCols);
  });
  const [layoutLoaded, setLayoutLoaded] = useState(false);

  // New state for AI-driven request edits
  const [appliedRequest, setAppliedRequest] = useState<any>(null);

    // We need to manage visibility. Capture, Request, Response are always visible (unless user closes them? Prompt says "Users can add, remove...").
  // For now let's keep the core 3 always there, and AI togglable. 
  // But wait, "User can ... close it, open minimize it".
  // So we need state for visibility of all cards.
  const [visibleCards, setVisibleCards] = useState<Record<string, boolean>>(() => {
     const saved = readLocalStorageJSON<Record<string, boolean>>(VISIBILITY_STORAGE_KEY);
     if (saved) return saved;
     return {
        capture: true,
        request: true,
        response: true,
        'ai-minireper': isAIReperOpen
     };
  });
  const [visibilityLoaded, setVisibilityLoaded] = useState(false);
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');

  useEffect(() => {
     if (!visibilityLoaded) return;
     void writeStoredJSON(VISIBILITY_STORAGE_KEY, visibleCards);
  }, [visibleCards, visibilityLoaded]);

  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const zIndexCounter = useRef(4);
  const didMountRef = useRef(false);
  const [cardZIndices, setCardZIndices] = useState<Record<ComponentKey, number>>({
    capture: 1,
    request: 2,
    response: 3,
    'ai-minireper': 4
  });

  const bringCardToFront = (key: ComponentKey) => {
    zIndexCounter.current += 1;
    setCardZIndices(prev => ({ ...prev, [key]: zIndexCounter.current }));
  };

  const resetToDefaultLayout = () => {
    setWorkspaceCanvasWidth(WORKSPACE_MIN_WIDTH);
    // BASE_GRID_COLS matches WORKSPACE_MIN_WIDTH
    const resetLayouts = normalizeLayouts(buildDefaultLayouts(viewRows), maxRows, BASE_GRID_COLS);
    const resetVisibility = {
      capture: true,
      request: true,
      response: true,
      'ai-minireper': false
    };

    setLayouts(resetLayouts);
    void writeStoredJSON(LAYOUT_STORAGE_KEY, resetLayouts);
    setLayoutLoaded(true);
    setVisibleCards(resetVisibility);
    void writeStoredJSON(VISIBILITY_STORAGE_KEY, resetVisibility);
    setVisibilityLoaded(true);
    zIndexCounter.current = 4;
    setCardZIndices({
      capture: 1,
      request: 2,
      response: 3,
      'ai-minireper': 4
    });
    setShowLayoutMenu(false);
    onCloseAIReper();
  };

  const handleLayoutChange = (_currentLayout: any[], allLayouts: Layouts) => {
    setLayouts((prev) => {
      const next = { ...prev };
      Object.keys(allLayouts).forEach((bp) => {
        const items = allLayouts[bp];
        if (!items || items.length === 0) return;
        const existingList = [...(next[bp] || [])];
        items.forEach((movedItem) => {
          const idx = existingList.findIndex(i => i.i === movedItem.i);
          if (idx !== -1) {
            existingList[idx] = movedItem;
          } else {
            existingList.push(movedItem);
          }
        });
        next[bp] = existingList;
      });

      const enforced = normalizeLayouts(next, maxRows, dynamicCols);
      if (layoutLoaded) {
        void writeStoredJSON(LAYOUT_STORAGE_KEY, enforced);
      }
      return enforced;
    });
  };

  // Sync AI prop with internal visibility
  useEffect(() => {
    setVisibleCards(prev => ({ ...prev, 'ai-minireper': isAIReperOpen }));
  }, [isAIReperOpen]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    resetToDefaultLayout();
  }, [resetSignal]);

  useEffect(() => {
    const container = workspaceScrollRef.current;
    if (!container) return;
    const measured = Math.floor(container.getBoundingClientRect().height);
    if (measured && measured > 0) {
      setWorkspaceBaseHeight((prev) =>
        Math.max(prev, measured)
      );
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isPanningRef.current) return;
      const container = workspaceScrollRef.current;
      if (!container) return;
      const deltaX = event.clientX - panStartRef.current.x;
      const deltaY = event.clientY - panStartRef.current.y;
      container.scrollLeft = panStartRef.current.scrollLeft - deltaX;
      container.scrollTop = panStartRef.current.scrollTop - deltaY;
    };

    const handleMouseUp = () => {
      if (!isPanningRef.current) return;
      isPanningRef.current = false;
      const container = workspaceScrollRef.current;
      if (container) {
        container.classList.remove('is-panning');
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    setLayouts((prev) => {
      const normalized = normalizeLayouts(prev, maxRows, dynamicCols);
      if (layoutLoaded) {
        void writeStoredJSON(LAYOUT_STORAGE_KEY, normalized);
      }
      return normalized;
    });
  }, [maxRows, layoutLoaded, dynamicCols]);

  useEffect(() => {
    let cancelled = false;
    const loadLayouts = async () => {
      const stored = await readStoredJSON<Layouts>(LAYOUT_STORAGE_KEY);
      if (!cancelled && stored) {
        const reqWidth = getRequiredWidth(stored);
        if (reqWidth > workspaceCanvasWidth) {
           setWorkspaceCanvasWidth(reqWidth);
        }
        // Calculate local cols since state update is pending
        const cols = getDynamicCols(reqWidth);
        setLayouts(normalizeLayouts(stored, maxRows, cols));
      }
      if (!cancelled) setLayoutLoaded(true);
    };

    loadLayouts();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadVisibility = async () => {
      const stored = await readStoredJSON<Record<string, boolean>>(VISIBILITY_STORAGE_KEY);
      if (!cancelled && stored) {
        setVisibleCards(stored);
      }
      if (!cancelled) setVisibilityLoaded(true);
    };

    loadVisibility();
    return () => {
      cancelled = true;
    };
  }, []);

  const closeCard = (key: string) => {
      if (key === 'ai-minireper') {
          onCloseAIReper();
      }
      setVisibleCards(prev => ({...prev, [key]: false}));
  };

  const toggleVisibility = (key: string) => {
      const newState = !visibleCards[key];
      if (key === 'ai-minireper' && !newState) {
          onCloseAIReper();
      }
      if (newState) {
          bringCardToFront(key as ComponentKey);
      }
      setVisibleCards(prev => ({...prev, [key]: newState}));
  };

  const handlePanStart = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (target.closest('.react-grid-item')) return;
    if (target.closest('.layout-menu') || target.closest('.layout-menu-trigger')) return;
    const container = workspaceScrollRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const scrollbarX = container.offsetWidth - container.clientWidth;
    const scrollbarY = container.offsetHeight - container.clientHeight;
    const onVerticalScrollbar =
      scrollbarX > 0 && event.clientX > rect.right - scrollbarX;
    const onHorizontalScrollbar =
      scrollbarY > 0 && event.clientY > rect.bottom - scrollbarY;
    if (onVerticalScrollbar || onHorizontalScrollbar) return;
    isPanningRef.current = true;
    panStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop
    };
    container.classList.add('is-panning');
    event.preventDefault();
  };

  const handleEmptyHover = (event: React.MouseEvent<HTMLDivElement>) => {
    const container = workspaceScrollRef.current;
    const target = event.target as HTMLElement | null;
    if (!container || !target) return;
    const isEmptySpace =
      !target.closest('.react-grid-item') &&
      !target.closest('.layout-menu') &&
      !target.closest('.layout-menu-trigger');
    if (isEmptySpace) {
      container.classList.add('is-empty-hover');
    } else {
      container.classList.remove('is-empty-hover');
    }
  };

  const handleEmptyLeave = () => {
    const container = workspaceScrollRef.current;
    if (container) {
      container.classList.remove('is-empty-hover');
    }
  };

  // Determine which cards to render
  const cardsToRender = [];
  
  const getLayout = (key: string) => layouts[currentBreakpoint]?.find(l => l.i === key);

  if (visibleCards['capture']) {
    cardsToRender.push(
      <div
        key="capture"
        data-grid={getLayout('capture')}
        style={{ zIndex: cardZIndices.capture }}
        onMouseDownCapture={() => bringCardToFront('capture')}
      >
        <Card 
          title="Capture" 
          onClose={() => closeCard('capture')}
        >
          <RequestList
            requests={requests}
            selectedId={selectedId}
            selectedIds={selectedIds}
            paused={paused}
            onSelect={onSelect}
            onSelectionChange={onSelectionChange}
            onClear={onClear}
            onExport={onExport}
            onTogglePause={onTogglePause}
          />
        </Card>
      </div>
    );
  }

  if (visibleCards['request']) {
    cardsToRender.push(
      <div
        key="request"
        data-grid={getLayout('request')}
        style={{ zIndex: cardZIndices.request }}
        onMouseDownCapture={() => bringCardToFront('request')}
      >
        <Card 
          title="Request"
          onClose={() => closeCard('request')}
        >
          <RequestDetail
              selectedRequest={selectedRequest}
              selectedRequests={selectedRequests}
              appliedRequest={appliedRequest}
              onSend={onSend}
              isSending={isSending}
            />
        </Card>
      </div>
    );
  }

  if (visibleCards['response']) {
    cardsToRender.push(
      <div
        key="response"
        data-grid={getLayout('response')}
        style={{ zIndex: cardZIndices.response }}
        onMouseDownCapture={() => bringCardToFront('response')}
      >
        <Card 
          title="Response"
          onClose={() => closeCard('response')}
        >
           <ResponseDetail selectedRequest={selectedRequest} />
        </Card>
      </div>
    );
  }

  if (visibleCards['ai-minireper']) {
     cardsToRender.push(
      <div
        key="ai-minireper"
        data-grid={getLayout('ai-minireper')}
        style={{ zIndex: cardZIndices['ai-minireper'] }}
        onMouseDownCapture={() => bringCardToFront('ai-minireper')}
      >
        <Card 
          title="AI Minireper"
          onClose={() => closeCard('ai-minireper')}
        >
           <AIMiniReper
              isOpen={true} // Always open inside the card content
              onClose={() => {}} // Controlled by Card wrapper
              selectedRequest={selectedRequest}
              selectedRequests={selectedRequests}
              settings={settings}
              onUpdateSettings={onUpdateSettings}
              onApplyRequest={(req) => setAppliedRequest(req)}
              onApplyAndSend={onSend}
              isCardMode={true} 
              extractorCatalog={extractorCatalog}
              extractorContextItems={extractorContextItems}
              onAddExtractorContextItems={onAddExtractorContextItems}
              onRemoveExtractorContextItem={onRemoveExtractorContextItem}
              onClearExtractorContextItems={onClearExtractorContextItems}
            />
        </Card>
      </div>
    );
  }

  return (
    <div style={{position: 'relative', height: '100%', width: '100%'}}> 
        <div
          ref={workspaceScrollRef}
          className="workspace-scroll"
          style={{height: '100%', width: '100%', overflow: 'auto'}}
          onMouseDown={handlePanStart}
          onMouseMove={handleEmptyHover}
          onMouseLeave={handleEmptyLeave}
        >
          <div
            style={{
              position: 'relative',
              width: workspaceCanvasWidth,
              height: workspaceCanvasHeight
            }}
          >
            <ResponsiveGridLayout
              className="layout"
              style={{ height: workspaceCanvasHeight, width: '100%' }}
              layouts={layouts}
              breakpoints={GRID_BREAKPOINTS}
              cols={dynamicCols}
              rowHeight={GRID_ROW_HEIGHT}
              margin={GRID_MARGIN}
              containerPadding={GRID_CONTAINER_PADDING}
              onBreakpointChange={setCurrentBreakpoint}
              onLayoutChange={handleLayoutChange}
              onDrag={(_layout: any, _oldItem: any, newItem: any, _placeholder: any, _e: any, _element: any) => {
                 const currentCols = dynamicCols[currentBreakpoint] ?? dynamicCols.lg;
                 if (newItem.x + newItem.w >= currentCols - 1) {
                    setWorkspaceCanvasWidth(prev => Math.min(prev + 400, 10000));
                 }
              }}
              onDragStart={(_layout: any, oldItem: any) => {
                if(oldItem) bringCardToFront(oldItem.i as ComponentKey);
              }}
              draggableHandle=".card-header"
              draggableCancel=".card-actions, .card-actions *, .card-content, .card-content *, .icon-btn, button, input, textarea, select, a" 
              resizeHandles={['se']}
              compactor={OVERLAP_COMPACTOR}
              autoSize={false}
              {...({} as any)}
            >
              {cardsToRender}
            </ResponsiveGridLayout>
          </div>
        </div>

        {/* Layout Menu Trigger - floating in workspace */}
        <div className="layout-menu-trigger">
           <button 
             className="btn layout-menu-button" 
             onClick={() => setShowLayoutMenu(!showLayoutMenu)}
             title="Manage Cards"
           >
              <LayoutTemplate size={18} color="#0c1015"/>
           </button>
           {showLayoutMenu && (
             <div className="layout-menu">
                <div className="layout-menu-header">
                  <div className="layout-menu-title">Manage Cards</div>
                  <div className="layout-menu-subtitle">Show or hide panels</div>
                </div>
                <div className="layout-menu-list">
                  {(['capture', 'request', 'response', 'ai-minireper'] as ComponentKey[]).map(key => (
                       <label key={key} className="layout-menu-item">
                           <span className="layout-menu-text">
                             {key === 'ai-minireper' ? 'AI Minireper' : key.charAt(0).toUpperCase() + key.slice(1)}
                           </span>
                           <input 
                               className="layout-menu-input"
                               type="checkbox" 
                               checked={visibleCards[key]} 
                               onChange={() => toggleVisibility(key)}
                           />
                           <span className="layout-menu-check" aria-hidden="true" />
                       </label>
                  ))}
                </div>
             </div>
           )}
        </div>
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { NetworkEntry, FilterMode } from '../types';
import { statusTone, formatTime, matchesMode } from '../utils';

interface RequestListProps {
  requests: NetworkEntry[];
  selectedId: string | null;
  selectedIds: string[];
  paused: boolean;
  onSelect: (id: string | null) => void;
  onSelectionChange: (ids: string[]) => void;
  onClear: () => void;
  onExport: () => void;
  onTogglePause: () => void;
}

export const RequestList: React.FC<RequestListProps> = ({
  requests,
  selectedId,
  selectedIds = [],
  paused,
  onSelect,
  onSelectionChange,
  onClear,
  onExport,
  onTogglePause,
}) => {
  const [filterText, setFilterText] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  const filteredRequests = useMemo(() => {
    const term = filterText.trim().toLowerCase();
    return requests.filter((entry) => {
      if (!matchesMode(entry, filterMode)) return false;
      if (!term) return true;

      return (
        entry.url.toLowerCase().includes(term) ||
        entry.path.toLowerCase().includes(term) ||
        entry.host.toLowerCase().includes(term)
      );
    });
  }, [requests, filterText, filterMode]);

  const handleRequestClick = (id: string, event: React.MouseEvent) => {
    // If onSelectionChange isn't provided (backwards compat?), just select
    if (!onSelectionChange) {
      onSelect(id);
      return;
    }

    // 1. Shift Key (Range Selection)
    if (event.shiftKey && selectedId && filteredRequests.some(r => r.id === selectedId)) {
      const lastIndex = filteredRequests.findIndex((r) => r.id === selectedId);
      const currentIndex = filteredRequests.findIndex((r) => r.id === id);

      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        
        // Get all IDs in the visible range
        const rangeIds = filteredRequests.slice(start, end + 1).map((r) => r.id);
        
        // Determine final selection:
        // Commonly, Shift sets the range based on the 'anchor' (selectedId).
        // If meta is NOT held, we replace selection with this range.
        if (event.metaKey || event.ctrlKey) {
             // Add range to existing selection.
             // We want the clicked item (id) to be the 'last' one so it becomes the primary selection.
             // We filter it out if it exists, then append it? 
             // Actually, set logic is tricky with ordering. 
             // Let's just merge and ensure 'id' is at the end.
             const set = new Set([...selectedIds, ...rangeIds]);
             set.delete(id);
             const newIds = Array.from(set);
             newIds.push(id);
             onSelectionChange(newIds);
        } else {
             // Replace selection with range. 
             // Ensure 'id' is at the end.
             const newIds = rangeIds.filter(x => x !== id);
             newIds.push(id);
             onSelectionChange(newIds);
        }
        
        return;
      }
    }

    // 2. Command/Meta Key (Toggle Selection)
    if (event.metaKey || event.ctrlKey) {
      if (selectedIds.includes(id)) {
        // Deselecting the clicked item
        const newIds = selectedIds.filter((sid) => sid !== id);
        onSelectionChange(newIds);
      } else {
        // Selecting a new item (add to selection)
        onSelectionChange([...selectedIds, id]);
      }
      return;
    }

    // 3. Normal Click (Single Select)
    onSelectionChange([id]);
  };

  return (
    <section className="panel panel--list">
      <div className="panel-header">
        <div className="panel-title">
          <span className="eyebrow">Capture</span>
          <h2>
            Requests <span className="count">{requests.length}</span>
            {selectedIds.length > 1 && (
              <span className="count selected" style={{ marginLeft: '8px', opacity: 0.8 }}>
                {selectedIds.length} selected
              </span>
            )}
          </h2>
        </div>
        <div className="panel-actions">
          <button className="btn ghost slim" onClick={onExport}>
            Export
          </button>
          <button className="btn ghost slim" onClick={onClear}>
            Clear
          </button>
        </div>
      </div>
      <div className="panel-body">
        <div className="search">
          <input
            type="search"
            value={filterText}
            onChange={(event) => setFilterText(event.target.value)}
            placeholder="Filter requests..."
            aria-label="Filter requests"
          />
          <button
            className={`btn ghost slim${paused ? ' active' : ''}`}
            onClick={onTogglePause}
          >
            {paused ? 'Paused' : 'Live'}
          </button>
        </div>
        <div className="filters">
          {(['all', 'xhr', 'fetch', 'errors', 'assets'] as FilterMode[]).map(
            (mode) => (
              <button
                key={mode}
                className={`chip${filterMode === mode ? ' active' : ''}`}
                onClick={() => setFilterMode(mode)}
              >
                {mode === 'all' ? 'All' : mode.toUpperCase()}
              </button>
            ),
          )}
        </div>
        {filteredRequests.length ? (
          <ul className="request-list">
            {filteredRequests.map((request) => {
              const isSelected = selectedIds && selectedIds.length > 0 
                ? selectedIds.includes(request.id)
                : request.id === selectedId;

              return (
                <li
                  key={request.id}
                  className={`request-item${
                    isSelected ? ' active' : ''
                  }${request.id === selectedId ? ' primary' : ''}`}
                  onClick={(e) => handleRequestClick(request.id, e)}
                >
                  <div className="request-main">
                    <div className="request-header-row">
                      <span className="request-sequence">#{request.sequence ?? '?'}</span>
                      <span
                        className={`method method--${request.method.toLowerCase()}`}
                      >
                        {request.method}
                      </span>
                      <span
                        className={`status status--${statusTone(request.status)}`}
                      >
                        {request.status ?? '---'}
                      </span>
                      <span className="spacer" />
                      <span className="time">
                        {formatTime(request.startedDateTime)}
                      </span>
                    </div>
                    <div className="request-path">{request.path}</div>
                    <div className="request-domain">
                      {request.host || 'unknown host'}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="empty-state">
            No requests yet. Reload the tab or interact with the page to
            capture traffic.
          </div>
        )}
      </div>
    </section>
  );
};

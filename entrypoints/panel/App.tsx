import { useState, useMemo, useRef } from 'react';
import 'highlight.js/styles/atom-one-dark.css';
import './App.css';
import { Extractor } from './components/Extractor';
import { TopBar } from './components/TopBar';
import { Workspace } from './components/Dashboard/Workspace';
import { useNetworkMonitor } from './hooks/useNetworkMonitor';
import { useAISettings } from './hooks/useAISettings';
import { MAX_ITEMS, METHOD_OPTIONS } from './constants';
import { NetworkEntry, ParsedRequest, HeaderPair } from './types';
import { AIContextItem } from './types/ai';
import {
  parseUrlParts,
  isValidHeaderName,
  isForbiddenHeaderName,
  buildExportPayload,
  decodeContent,
  importFromPayload,
} from './utils';

function App() {
  const [paused, setPaused] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isExtractorOpen, setIsExtractorOpen] = useState(false);
  const [isAIReperOpen, setIsAIReperOpen] = useState(false);
  const [layoutResetSignal, setLayoutResetSignal] = useState(0);
  const [extractorCatalog, setExtractorCatalog] = useState<AIContextItem[]>([]);
  const [extractorContextItems, setExtractorContextItems] = useState<AIContextItem[]>([]);
  const manualIdRef = useRef(0);

  // Custom hooks
  const { requests, setRequests, selectedId, selectedIds, setSelectedId, setSelectedIds } = useNetworkMonitor(paused);
  const { settings, updateSettings } = useAISettings();

  const selectedRequest = useMemo(() => {
    if (!selectedId) return requests[0] ?? null;
    return requests.find((entry) => entry.id === selectedId) ?? null;
  }, [requests, selectedId]);

  const selectedRequests = useMemo(() => {
    return requests.filter((r) => selectedIds.includes(r.id));
  }, [requests, selectedIds]);

  const handleClear = () => {
    setRequests([]);
    setSelectedId(null);
  };

  const handleExport = () => {
    const payload = buildExportPayload(requests);
    const fileName = `minirep-export-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const importedRequests = importFromPayload(json);
        setRequests((prev) => {
          const maxSeq = prev[0]?.sequence ?? 0;
          const resequenced = importedRequests.map((req, i) => ({
             ...req,
             sequence: maxSeq + (importedRequests.length - i)
          }));
          return [...resequenced, ...prev].slice(0, MAX_ITEMS);
        });
        if (importedRequests.length > 0) {
          setSelectedId(importedRequests[0].id);
        }
      } catch (error) {
        console.error('Failed to import requests:', error);
        alert('Failed to import requests.');
      }
    };
    reader.readAsText(file);
  };

  const handleSend = async (parsedRequest: ParsedRequest): Promise<NetworkEntry | null> => {
    if (!parsedRequest.url) return null;

    const trimmedMethod = parsedRequest.method.trim().toUpperCase();
    const method = METHOD_OPTIONS.includes(trimmedMethod)
      ? trimmedMethod
      : 'GET';

    const headers = parsedRequest.headers.filter(
      (header) => header.key.trim() || header.value.trim(),
    );

    const startedDateTime = new Date().toISOString();
    const parts = parseUrlParts(parsedRequest.url);
    const manualId = `manual-${Date.now()}-${manualIdRef.current++}`;

    const manualEntry: NetworkEntry = {
      id: manualId,
      method,
      url: parsedRequest.url,
      path: parts.path || parsedRequest.url,
      host: parts.host,
      protocol: parts.protocol,
      startedDateTime,
      time: undefined,
      requestHeaders: headers,
      responseHeaders: [],
      requestBody: parsedRequest.body,
      responseBody: undefined,
      responseHttpVersion: 'HTTP',
      resourceType: 'fetch',
    };

    setRequests((prev) => {
      const nextSeq = ((prev[0]?.sequence) ?? 0) + 1;
      manualEntry.sequence = nextSeq;
      return [manualEntry, ...prev].slice(0, MAX_ITEMS);
    });
    setSelectedId(manualId);
    setIsSending(true);

    const headerObject: Record<string, string> = {};
    headers.forEach((header) => {
      const name = header.key.trim();
      if (!name) return;
      if (!isValidHeaderName(name) || isForbiddenHeaderName(name)) return;
      headerObject[name] = header.value;
    });

    const canHaveBody = !['GET', 'HEAD'].includes(method);

    try {
      const start = performance.now();
      const response = await fetch(parsedRequest.url, {
        method,
        headers: headerObject,
        body: canHaveBody && parsedRequest.body ? parsedRequest.body : undefined,
      });

      const responseText = await response.text();
      const duration = performance.now() - start;
      const responseHeaders: HeaderPair[] = Array.from(
        response.headers.entries(),
      ).map(([key, value]) => ({ key, value }));
      const responseBody = decodeContent(responseText);
      const updatedEntry: NetworkEntry = {
        ...manualEntry,
        status: response.status,
        statusText: response.statusText,
        responseHeaders,
        responseBody,
        size: responseText.length,
        time: duration,
      };

      setRequests((prev) =>
        prev.map((entry) =>
          entry.id === manualId
            ? updatedEntry
            : entry,
        ),
      );
      return updatedEntry;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Request failed.';
      const updatedEntry: NetworkEntry = {
        ...manualEntry,
        status: 0,
        statusText: 'Request failed',
        responseBody: message,
        time: 0,
      };
      setRequests((prev) =>
        prev.map((entry) =>
          entry.id === manualId
            ? updatedEntry
            : entry,
        ),
      );
      return updatedEntry;
    } finally {
      setIsSending(false);
    }
  };

  const handleResetLayout = () => {
    setIsAIReperOpen(false);
    setLayoutResetSignal((prev) => prev + 1);
  };

  const handleAddExtractorContextItems = (items: AIContextItem[]) => {
    if (!items.length) return;
    setExtractorContextItems((prev) => {
      const seen = new Set(prev.map((item) => item.id));
      const next = [...prev];
      items.forEach((item) => {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          next.push(item);
        }
      });
      return next;
    });
    setIsAIReperOpen(true);
  };

  const handleRemoveExtractorContextItem = (id: string) => {
    setExtractorContextItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearExtractorContextItems = () => {
    setExtractorContextItems([]);
  };

  return (
    <div className="app">
      <TopBar
        paused={paused}
        isExtractorOpen={isExtractorOpen}
        isAIReperOpen={isAIReperOpen}
        onTogglePause={() => setPaused(!paused)}
        onExport={handleExport}
        onImport={handleImport}
        onExtractorToggle={() => setIsExtractorOpen(!isExtractorOpen)}
        onAIReperToggle={() => setIsAIReperOpen(!isAIReperOpen)}
        onResetLayout={handleResetLayout}
      />

      <div className="workspace-container" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <Workspace
          requests={requests}
          selectedId={selectedId}
          selectedIds={selectedIds}
          selectedRequest={selectedRequest}
          selectedRequests={selectedRequests}
          paused={paused}
          onSelect={setSelectedId}
          onSelectionChange={setSelectedIds}
          onClear={handleClear}
          onExport={handleExport}
          onTogglePause={() => setPaused((prev) => !prev)}
          onSend={handleSend}
          isSending={isSending}
          isAIReperOpen={isAIReperOpen}
          onCloseAIReper={() => setIsAIReperOpen(false)}
          settings={settings}
          onUpdateSettings={updateSettings}
          resetSignal={layoutResetSignal}
          extractorCatalog={extractorCatalog}
          extractorContextItems={extractorContextItems}
          onAddExtractorContextItems={handleAddExtractorContextItems}
          onRemoveExtractorContextItem={handleRemoveExtractorContextItem}
          onClearExtractorContextItems={handleClearExtractorContextItems}
        />
      </div>

      <Extractor 
        isOpen={isExtractorOpen} 
        onClose={() => setIsExtractorOpen(false)} 
        entries={requests} 
        onCatalogUpdate={setExtractorCatalog}
      />
    </div>
  );
}

export default App;

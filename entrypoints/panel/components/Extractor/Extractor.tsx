import React, { useState, useMemo, useEffect, useRef } from 'react';
import { browser } from '#imports';
import { DraggablePanel } from './DraggablePanel';
import { NetworkEntry } from '../../types';
import { AIContextItem } from '../../types/ai';
import { scanForSecrets, SecretFinding } from '../../utils/scanners/secrets';
import { scanForEndpoints, EndpointFinding } from '../../utils/scanners/endpoints';
import { scanForParameters, ParameterFinding } from '../../utils/scanners/parameters';
import { scanForCachePoisoning, CachePoisoningFinding } from '../../utils/scanners/cache_poisoning';
import { scanForXss, XssFinding } from '../../utils/scanners/xss';
import { scanForSupabase, SupabaseAuditResult } from '../../utils/scanners/supabase';
import { scanSecurityHeaders, SecurityHeaderFinding } from '../../utils/scanners/security_headers';
import { buildEndpointGraph, EndpointGraphNode } from '../../utils/scanners/endpoint_graph';
import { decodeContent, parseUrlParts } from '../../utils';
import { MAX_SCAN_BODY_CHARS } from '../../constants';
import { GENERATED_RULES_META } from '../../utils/scanners/generated_rules';
import './Extractor.css';

const SOURCE_MAP_REGEX =
  /\/\/[#@]\s*sourceMappingURL=([^\s'"]+)|\/\*#\s*sourceMappingURL=([^*]+)\*\//g;
const MAX_SOURCE_MAP_SOURCES = 40;
const MAX_SOURCE_MAP_TOTAL_CHARS = 1200000;
const MAX_SOURCE_MAP_ENTRY_CHARS = 200000;
const MAX_CATALOG_ITEMS = 400;

function syntaxHighlight(item: any): string {
  if (item === undefined || item === null) return '';
  let json = JSON.stringify(item, null, 2);
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = 'json-number';
      if (/^"/.test(match)) {
          if (/:$/.test(match)) {
              cls = 'json-key';
          } else {
              cls = 'json-string';
          }
      } else if (/true|false/.test(match)) {
          cls = 'json-boolean';
      } else if (/null/.test(match)) {
          cls = 'json-null';
      }
      return `<span class="${cls}">${match}</span>`;
  });
}

interface ExtractorProps {
  isOpen: boolean;
  onClose: () => void;
  entries: NetworkEntry[];
  onCatalogUpdate?: (items: AIContextItem[]) => void;
}

type SearchResult = {
  id: string;
  file: string;
  match: string;
  context: string;
};

type Tab =
  | 'Supabase'
  | 'Secrets'
  | 'Endpoints'
  | 'Parameters'
  | 'Web Cache Poisoning'
  | 'XSS Scanner'
  | 'Security Headers'
  | 'Endpoint Graph'
  | 'Response Search';
type SortDirection = 'asc' | 'desc';
type SortState = {
  key: string;
  direction: SortDirection;
};


export const Extractor: React.FC<ExtractorProps> = ({ isOpen, onClose, entries, onCatalogUpdate }) => {
  const [activeTab, setActiveTab] = useState<Tab>('Secrets');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [strictMode, setStrictMode] = useState(false);
  const devtoolsApi =
    browser?.devtools ?? (globalThis as typeof globalThis & { chrome?: any }).chrome?.devtools;
  
  const [isScanning, setIsScanning] = useState(false);
  const [secrets, setSecrets] = useState<SecretFinding[]>([]);
  const [endpoints, setEndpoints] = useState<EndpointFinding[]>([]);
  const [parameters, setParameters] = useState<ParameterFinding[]>([]);
  const [cachePoisoning, setCachePoisoning] = useState<CachePoisoningFinding[]>([]);
  const [xssFindings, setXssFindings] = useState<XssFinding[]>([]);
  const [supabaseResult, setSupabaseResult] = useState<SupabaseAuditResult | null>(null);
  const [securityHeaders, setSecurityHeaders] = useState<SecurityHeaderFinding[]>([]);
  const [endpointGraph, setEndpointGraph] = useState<EndpointGraphNode[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [copyState, setCopyState] = useState<{ id: string; status: 'copied' | 'error' } | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const [sortByTab, setSortByTab] = useState<Record<Tab, SortState | null>>({
    Supabase: null,
    Secrets: null,
    Endpoints: null,
    Parameters: null,
    'Web Cache Poisoning': null,
    'XSS Scanner': null,
    'Security Headers': null,
    'Endpoint Graph': null,
    'Response Search': null,
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filterQuery, strictMode]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const loadScriptResources = async (): Promise<NetworkEntry[]> => {
    if (!devtoolsApi?.inspectedWindow?.getResources) return [];

    return new Promise((resolve) => {
      devtoolsApi.inspectedWindow.getResources((resources) => {
        const candidates = resources.filter((resource) => {
          const url = resource.url ?? '';
          if (!url) return false;
          if ((resource as any).type === 'script' || (resource as any).type === 'document') return true;
          return /\.(mjs|cjs|js)(\?|#|$)/i.test(url);
        });

        if (!candidates.length) {
          resolve([]);
          return;
        }

        const resourceMap = new Map(
          resources
            .filter((resource) => resource.url)
            .map((resource) => [resource.url as string, resource]),
        );

        const results: NetworkEntry[] = [];
        let remainingChars = MAX_SOURCE_MAP_TOTAL_CHARS;
        let remainingSources = MAX_SOURCE_MAP_SOURCES;

        const loadAll = async () => {
          for (const [index, resource] of candidates.entries()) {
            const { content, encoding } = await getResourceContent(resource);
            const fullDecoded = content
              ? decodeContent(content, encoding, Infinity)
              : '';
            const decoded = fullDecoded
              ? fullDecoded.slice(0, MAX_SCAN_BODY_CHARS)
              : '';
            if (!decoded) continue;

            const parts = parseUrlParts(resource.url ?? '');
            results.push({
              id: `resource-${Date.now()}-${index}`,
              method: 'GET',
              url: resource.url ?? '',
              path: parts.path || resource.url || '',
              host: parts.host,
              protocol: parts.protocol,
              requestHeaders: [],
              responseHeaders: [],
              responseBody: decoded,
              resourceType: (resource as any).type || 'resource',
            });

            if (remainingChars <= 0 || remainingSources <= 0) continue;

            const sourceMapEntries = await extractSourceMapEntries(
              fullDecoded,
              resource.url ?? '',
              resourceMap,
              remainingChars,
              remainingSources,
            );

            sourceMapEntries.forEach((entry) => results.push(entry));
            sourceMapEntries.forEach((entry) => {
              remainingChars -= entry.responseBody?.length ?? 0;
              remainingSources -= 1;
            });
          }
        };

        loadAll()
          .then(() => resolve(results))
          .catch(() => resolve(results));
      });
    });
  };

  const handleScan = async () => {
      if (!canScan) return;
      setIsScanning(true);
      setHasScanned(true);
      // Allow UI to update before blocking with heavy scan
      await new Promise((resolve) => setTimeout(resolve, 50));

      try {
        const resourceEntries = await loadScriptResources();
        const scanEntries = resourceEntries.length
          ? [...entries, ...resourceEntries]
          : entries;
        const s = await scanForSecrets(scanEntries, { strict: strictMode });
        const e = scanForEndpoints(scanEntries);
        const p = scanForParameters(scanEntries);
        const c = scanForCachePoisoning(scanEntries);
        const x = scanForXss(scanEntries);
        const sup = await scanForSupabase(scanEntries);
        const secHeaders = scanSecurityHeaders(scanEntries);
        const graph = buildEndpointGraph(e, entries);
        setSecrets(s);
        setEndpoints(e);
        setParameters(p);
        setCachePoisoning(c);
        setXssFindings(x);
        setSupabaseResult(sup);
        setSecurityHeaders(secHeaders);
        setEndpointGraph(graph);
      } catch (err) {
        console.error(err);
      } finally {
        setIsScanning(false);
      }
  };

  const handleSearch = () => {
    if (!searchQuery) return;
    const results: SearchResult[] = [];
    const query = searchQuery.toLowerCase();

    entries.forEach(entry => {
        if (entry.responseBody?.toLowerCase().includes(query)) {
             results.push({
                 id: `search-${Date.now()}-${results.length}`,
                 file: entry.url,
                 match: 'Response Body Match',
                 context: entry.responseBody.substring(0, 100) + '...' 
             });
        }
    });
    setSearchResults(results);
  };

  // Get current list
  const currentList = activeTab === 'Secrets' ? secrets : 
                      activeTab === 'Endpoints' ? endpoints : 
                      activeTab === 'Parameters' ? parameters :
                      activeTab === 'Web Cache Poisoning' ? cachePoisoning :
                      activeTab === 'XSS Scanner' ? xssFindings :
                      activeTab === 'Security Headers' ? securityHeaders :
                      activeTab === 'Endpoint Graph' ? endpointGraph : [];

  const filteredList = useMemo(() => {
    const query = filterQuery.trim().toLowerCase();
    if (!query) return currentList;

    if (activeTab === 'Secrets') {
      return (currentList as SecretFinding[]).filter((item) =>
        `${item.type} ${item.match} ${item.file}`.toLowerCase().includes(query),
      );
    }

    if (activeTab === 'Endpoints') {
      return (currentList as EndpointFinding[]).filter((item) =>
        `${item.path} ${item.source} ${item.method ?? ''}`.toLowerCase().includes(query),
      );
    }

    if (activeTab === 'Parameters') {
      return (currentList as ParameterFinding[]).filter((item) =>
        `${item.key} ${item.value ?? ''} ${item.url}`.toLowerCase().includes(query),
      );
    }

    if (activeTab === 'Web Cache Poisoning') {
      return (currentList as CachePoisoningFinding[]).filter((item) =>
        `${item.vector} ${item.evidence} ${item.requestUrl}`.toLowerCase().includes(query),
      );
    }

    if (activeTab === 'XSS Scanner') {
      return (currentList as XssFinding[]).filter((item) =>
        `${item.parameter} ${item.context} ${item.evidence} ${item.requestUrl}`.toLowerCase().includes(query),
      );
    }

    if (activeTab === 'Security Headers') {
      return (currentList as SecurityHeaderFinding[]).filter((item) =>
        `${item.header} ${item.issue} ${item.guidance} ${item.url}`.toLowerCase().includes(query),
      );
    }

    if (activeTab === 'Endpoint Graph') {
      return (currentList as EndpointGraphNode[]).filter((item) =>
        `${item.method} ${item.path} ${item.riskLevel} ${item.riskSignals.join(' ')} ${item.sources.join(' ')}`.toLowerCase().includes(query),
      );
    }

    return currentList;
  }, [activeTab, currentList, filterQuery]);

  const sortedList = useMemo(() => {
    const sortState = sortByTab[activeTab];
    if (!sortState) return filteredList;
    const mapped = filteredList.map((item, index) => ({ item, index }));
    mapped.sort((a, b) => {
      const aValue = getSortValue(activeTab, sortState.key, a.item);
      const bValue = getSortValue(activeTab, sortState.key, b.item);
      const result = compareSortValue(aValue, bValue);
      if (result === 0) return a.index - b.index;
      return sortState.direction === 'asc' ? result : -result;
    });
    return mapped.map((entry) => entry.item);
  }, [activeTab, filteredList, sortByTab]);
  
  const totalPages = Math.ceil(sortedList.length / itemsPerPage);
  const paginatedList = sortedList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const hasEntries = entries.length > 0;
  const canScanResources = Boolean(browser?.devtools?.inspectedWindow?.getResources);
  const canScan = !isScanning && (hasEntries || canScanResources);
  const showFilter = activeTab !== 'Response Search';
  const filterPlaceholder = activeTab === 'Endpoints'
    ? 'Filter endpoints...'
    : activeTab === 'Parameters'
      ? 'Filter parameters...'
      : activeTab === 'Web Cache Poisoning'
        ? 'Filter cache signals...'
        : activeTab === 'XSS Scanner'
          ? 'Filter XSS signals...'
        : activeTab === 'Security Headers'
          ? 'Filter security headers...'
        : activeTab === 'Endpoint Graph'
          ? 'Filter endpoint graph...'
      : 'Filter secrets...';
  const canExport = activeTab === 'Response Search'
    ? searchResults.length > 0
    : sortedList.length > 0;
  const sortState = sortByTab[activeTab];
  const handleExport = () => {
    const payload = getExportPayload(activeTab, sortedList, searchResults);
    if (!payload) return;
    downloadCsv(payload.filename, payload.header, payload.rows);
  };
  const handleSort = (key: string) => {
    setSortByTab((prev) => {
      const current = prev[activeTab];
      const nextDirection =
        current && current.key === key && current.direction === 'asc'
          ? 'desc'
          : 'asc';
      return {
        ...prev,
        [activeTab]: { key, direction: nextDirection },
      };
    });
    setCurrentPage(1);
  };

  const handleCopyRecommendation = async (id: string, recommendation?: string) => {
    if (!recommendation) return;
    const success = await copyToClipboard(recommendation);
    setCopyState({ id, status: success ? 'copied' : 'error' });
    if (copyTimerRef.current) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(() => {
      setCopyState((prev) => (prev?.id === id ? null : prev));
    }, 1600);
  };

  const truncateText = (value: string | undefined, max = 400) => {
    if (!value) return 'None';
    if (value.length <= max) return value;
    return `${value.slice(0, max)}... [truncated, total ${value.length} chars]`;
  };

  const buildContextItem = (
    tab: Tab,
    id: string,
    title: string,
    content: string,
  ): AIContextItem => ({
    id: `extractor:${tab}:${id}`,
    source: 'extractor',
    tab,
    title,
    content,
  });

  const catalogItems = useMemo(() => {
    const items: AIContextItem[] = [];
    if (supabaseResult) {
      items.push(
        buildContextItem(
          'Supabase',
          'supabase-summary',
          'Supabase audit summary',
          formatSupabaseSummary(supabaseResult),
        ),
      );
    }

    secrets.forEach((item) => {
      items.push(
        buildContextItem(
          'Secrets',
          item.id,
          `${item.type} (${item.confidence})`,
          [
            `Type: ${item.type}`,
            `Match: ${truncateText(item.match, 200)}`,
            `Confidence: ${item.confidence}`,
            `Source: ${item.file}`,
          ].join('\n'),
        ),
      );
    });

    endpoints.forEach((item) => {
      items.push(
        buildContextItem(
          'Endpoints',
          item.id,
          `${item.method || 'GET'} ${item.path}`,
          [
            `Path: ${item.path}`,
            `Method: ${item.method || 'GET'}`,
            `Confidence: ${item.confidence || 'low'}`,
            `Source: ${item.source}`,
            item.sourceUrl ? `Source URL: ${item.sourceUrl}` : '',
          ]
            .filter(Boolean)
            .join('\n'),
        ),
      );
    });

    parameters.forEach((item) => {
      items.push(
        buildContextItem(
          'Parameters',
          item.id,
          `${item.key} (${item.source})`,
          [
            `Key: ${item.key}`,
            `Value: ${truncateText(item.value, 160)}`,
            `Source: ${item.source}`,
            `Request: ${item.url}`,
            item.risk ? `Risk: ${item.risk}` : '',
            item.confidence != null ? `Confidence: ${item.confidence}` : '',
          ]
            .filter(Boolean)
            .join('\n'),
        ),
      );
    });

    cachePoisoning.forEach((item) => {
      items.push(
        buildContextItem(
          'Web Cache Poisoning',
          item.id,
          item.vector,
          [
            `Vector: ${item.vector}`,
            `Evidence: ${truncateText(item.evidence, 220)}`,
            `Confidence: ${item.confidence || 'low'}`,
            `Request: ${item.requestUrl}`,
          ].join('\n'),
        ),
      );
    });

    xssFindings.forEach((item) => {
      items.push(
        buildContextItem(
          'XSS Scanner',
          item.id,
          `${item.parameter} (${item.confidence})`,
          [
            `Parameter: ${item.parameter}`,
            `Context: ${item.context}`,
            `Evidence: ${truncateText(item.evidence, 220)}`,
            `Confidence: ${item.confidence}`,
            `Request: ${item.requestUrl}`,
          ].join('\n'),
        ),
      );
    });

    securityHeaders.forEach((item) => {
      items.push(
        buildContextItem(
          'Security Headers',
          item.id,
          `${item.header} (${item.severity})`,
          [
            `Header: ${item.header}`,
            `Issue: ${item.issue}`,
            `Severity: ${item.severity}`,
            `Guidance: ${truncateText(item.guidance, 240)}`,
            item.recommendation
              ? `Recommendation: ${truncateText(item.recommendation, 240)}`
              : '',
            item.evidence ? `Evidence: ${truncateText(item.evidence, 200)}` : '',
            `Request: ${item.url}`,
          ]
            .filter(Boolean)
            .join('\n'),
        ),
      );
    });

    endpointGraph.forEach((item) => {
      items.push(
        buildContextItem(
          'Endpoint Graph',
          item.id,
          `${item.method} ${item.path}`,
          [
            `Path: ${item.path}`,
            `Method: ${item.method}`,
            `Risk: ${item.riskLevel || 'low'}`,
            item.riskScore != null ? `Risk Score: ${item.riskScore}` : '',
            `Hit: ${item.hit ? 'yes' : 'no'}`,
            item.riskSignals?.length
              ? `Signals: ${item.riskSignals.join(', ')}`
              : '',
            item.sources?.length ? `Sources: ${item.sources.join(', ')}` : '',
          ]
            .filter(Boolean)
            .join('\n'),
        ),
      );
    });

    searchResults.forEach((item) => {
      items.push(
        buildContextItem(
          'Response Search',
          item.id,
          `Response match in ${formatFileLabel(item.file)}`,
          [
            `File: ${item.file}`,
            `Match: ${item.match}`,
            `Context: ${truncateText(item.context, 240)}`,
          ].join('\n'),
        ),
      );
    });

    return items.slice(0, MAX_CATALOG_ITEMS);
  }, [
    supabaseResult,
    secrets,
    endpoints,
    parameters,
    cachePoisoning,
    xssFindings,
    securityHeaders,
    endpointGraph,
    searchResults,
  ]);

  useEffect(() => {
    if (!onCatalogUpdate) return;
    onCatalogUpdate(catalogItems);
  }, [catalogItems, onCatalogUpdate]);

  const scanTargetLabel = hasEntries
    ? `${entries.length} requests${canScanResources ? ' + page scripts' : ''}`
    : canScanResources
      ? 'page scripts'
      : 'requests';
  const rulesMeta = GENERATED_RULES_META;

  if (!isOpen) return null;

  return (
    <DraggablePanel title="Extractor" onClose={onClose} initialWidth={900} initialHeight={600}>
        <div className="extractor">
        
        {/* Toolbar Tabs */}
        <div className="extractor-toolbar">
           {['Supabase', 'Secrets', 'Endpoints', 'Parameters', 'Web Cache Poisoning', 'XSS Scanner', 'Security Headers', 'Endpoint Graph', 'Response Search'].map((tab) => (
             <button
               key={tab}
               onClick={() => { setActiveTab(tab as Tab); setCurrentPage(1); }}
               className={`extractor-tab ${activeTab === tab ? 'active' : ''}`}
               title={tab}
             >
               {tab}
             </button>
           ))}
           
           <div className="extractor-spacer" />
           {showFilter && (
             <div className="extractor-filter">
               <input 
                   type="text" 
                   placeholder={filterPlaceholder}
                   className="extractor-filter-input"
                   value={filterQuery}
                   onChange={(event) => setFilterQuery(event.target.value)}
               />
              <button
                type="button"
                className="extractor-filter-clear"
                onClick={() => setFilterQuery('')}
                aria-label="Clear filter"
                title="Clear filter"
              >
                ✕
              </button>
             </div>
           )}
           {canExport && (
             <button
               type="button"
               className="extractor-export"
               onClick={handleExport}
               aria-label="Download CSV"
               title="Download CSV"
             >
               <svg viewBox="0 0 24 24" aria-hidden="true">
                 <path d="M12 3a1 1 0 0 1 1 1v8.59l2.3-2.3a1 1 0 1 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.42l2.3 2.3V4a1 1 0 0 1 1-1zM5 19a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1z" />
               </svg>
             </button>
           )}
        </div>

        {/* Content Area */}
        <div className="extractor-content">
          
          {!hasScanned && activeTab !== 'Response Search' && (
              <div className="extractor-empty">
                  <p className="extractor-empty-text">
                    {canScan
                      ? `Click "Start Scan" to analyze ${scanTargetLabel}.`
                      : 'No requests captured yet.'}
                  </p>
              </div>
          )}

          {hasScanned && activeTab === 'Supabase' && (
             <div className="extractor-json-view" style={{ padding: '16px', overflow: 'auto', height: '100%', whiteSpace: 'pre', fontFamily: 'monospace', fontSize: '13px' }}>
                {supabaseResult ? (
                   <div dangerouslySetInnerHTML={{ __html: syntaxHighlight(supabaseResult) }} />
                ) : (
                    <div className="extractor-empty-text">No Supabase scan results.</div>
                )}
             </div>
          )}

          {hasScanned && activeTab === 'Secrets' && (
             <>
               <div className="extractor-count">{filteredList.length} secrets found</div>
               <div className="extractor-table-wrap">
                <Table>
                    <thead>
                        <tr className="extractor-table-head">
                            <Th sortKey="type" sortLabel="Type" sortState={sortState} onSort={handleSort}>Type</Th>
                            <Th sortKey="match" sortLabel="Match" sortState={sortState} onSort={handleSort}>Match</Th>
                            <Th sortKey="confidence" sortLabel="Confidence" sortState={sortState} onSort={handleSort}>Confidence</Th>
                            <Th sortKey="file" sortLabel="File" sortState={sortState} onSort={handleSort}>File</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedList.map((s: any) => (
                            <tr key={s.id} className="extractor-table-row">
                                <Td>{s.type}</Td>
                                <Td>
                                    <code className="extractor-code">
                                        {s.match}
                                    </code>
                                </Td>
                                <Td>
                                    <Badge level={s.confidence} />
                                </Td>
                                <Td className="extractor-truncate">
                                   <FileLink url={s.file} />
                                </Td>
                            </tr>
                        ))}
                        {paginatedList.length === 0 && <EmptyRow colSpan={4} />}
                    </tbody>
                </Table>
               </div>
             </>
          )}
          
          {hasScanned && activeTab === 'Endpoints' && (
             <Table>
                 <thead>
                     <tr className="extractor-table-head">
                        <Th sortKey="method" sortLabel="Method" sortState={sortState} onSort={handleSort}>Method</Th>
                        <Th sortKey="path" sortLabel="Path" sortState={sortState} onSort={handleSort}>Path</Th>
                        <Th sortKey="confidence" sortLabel="Confidence" sortState={sortState} onSort={handleSort}>Confidence</Th>
                        <Th sortKey="source" sortLabel="Source" sortState={sortState} onSort={handleSort}>Source</Th>
                     </tr>
                 </thead>
                 <tbody>{paginatedList.map((e: any) => (
                     <tr key={e.id} className="extractor-table-row">
                         <Td>{e.method || 'GET'}</Td>
                         <Td className="extractor-mono">{e.path}</Td>
                         <Td>
                           <Badge level={e.confidence || 'low'} />
                         </Td>
                         <Td className="extractor-muted">
                           <FileLink url={e.sourceUrl} label={e.source} />
                         </Td>
                     </tr>
                 ))}
                   {paginatedList.length === 0 && <EmptyRow colSpan={4} />}
                 </tbody>
             </Table>
          )}

          {hasScanned && activeTab === 'Parameters' && (
             <>
               <div className="extractor-count">{filteredList.length} parameters found</div>
               <Table>
                   <thead>
                       <tr className="extractor-table-head">
                          <Th sortKey="key" sortLabel="Key" sortState={sortState} onSort={handleSort}>Key</Th>
                          <Th sortKey="value" sortLabel="Value" sortState={sortState} onSort={handleSort}>Value</Th>
                          <Th sortKey="source" sortLabel="Source" sortState={sortState} onSort={handleSort}>Source</Th>
                          <Th sortKey="request" sortLabel="Request" sortState={sortState} onSort={handleSort}>Request</Th>
                       </tr>
                   </thead>
                   <tbody>{paginatedList.map((p: any) => (
                       <tr key={p.id} className="extractor-table-row">
                           <Td className="extractor-mono">{p.key}</Td>
                           <Td className="extractor-mono">{p.value || '-'}</Td>
                           <Td className="extractor-muted">{p.source}</Td>
                           <Td className="extractor-truncate">
                             <FileLink url={p.url} />
                           </Td>
                       </tr>
                   ))}
                     {paginatedList.length === 0 && <EmptyRow colSpan={4} />}
                   </tbody>
               </Table>
             </>
          )}

          {hasScanned && activeTab === 'Web Cache Poisoning' && (
             <>
               <div className="extractor-count">{filteredList.length} cache signals found</div>
               <Table>
                   <thead>
                       <tr className="extractor-table-head">
                          <Th sortKey="vector" sortLabel="Vector" sortState={sortState} onSort={handleSort}>Vector</Th>
                          <Th sortKey="evidence" sortLabel="Evidence" sortState={sortState} onSort={handleSort}>Evidence</Th>
                          <Th sortKey="confidence" sortLabel="Confidence" sortState={sortState} onSort={handleSort}>Confidence</Th>
                          <Th sortKey="request" sortLabel="Request" sortState={sortState} onSort={handleSort}>Request</Th>
                       </tr>
                   </thead>
                  <tbody>{paginatedList.map((item: any) => (
                      <tr key={item.id} className="extractor-table-row">
                           <Td>{item.vector}</Td>
                           <Td className="extractor-truncate" title={item.evidence}>
                             {item.evidence}
                           </Td>
                           <Td>
                             <Badge level={item.confidence || 'low'} />
                           </Td>
                           <Td className="extractor-truncate">
                             <FileLink url={item.requestUrl} />
                           </Td>
                       </tr>
                   ))}
                    {paginatedList.length === 0 && <EmptyRow colSpan={4} />}
                  </tbody>
               </Table>
             </>
          )}

          {hasScanned && activeTab === 'XSS Scanner' && (
             <>
               <div className="extractor-count">{filteredList.length} XSS signals found</div>
               <Table>
                   <thead>
                       <tr className="extractor-table-head">
                          <Th sortKey="parameter" sortLabel="Parameter" sortState={sortState} onSort={handleSort}>Parameter</Th>
                          <Th sortKey="evidence" sortLabel="Evidence" sortState={sortState} onSort={handleSort}>Evidence</Th>
                          <Th sortKey="confidence" sortLabel="Confidence" sortState={sortState} onSort={handleSort}>Confidence</Th>
                          <Th sortKey="request" sortLabel="Request" sortState={sortState} onSort={handleSort}>Request</Th>
                       </tr>
                   </thead>
                   <tbody>{paginatedList.map((item: any) => (
                       <tr key={item.id} className="extractor-table-row">
                           <Td className="extractor-mono">{item.parameter}</Td>
                           <Td className="extractor-truncate" title={item.evidence}>
                             {item.evidence}
                           </Td>
                           <Td>
                             <Badge level={item.confidence || 'low'} />
                           </Td>
                           <Td className="extractor-truncate">
                             <FileLink url={item.requestUrl} />
                           </Td>
                       </tr>
                   ))}
                     {paginatedList.length === 0 && <EmptyRow colSpan={4} />}
                   </tbody>
               </Table>
             </>
          )}

          {hasScanned && activeTab === 'Security Headers' && (
             <>
               <div className="extractor-count">{filteredList.length} header findings</div>
               <Table>
                   <thead>
                       <tr className="extractor-table-head">
                          <Th sortKey="severity" sortLabel="Severity" sortState={sortState} onSort={handleSort}>Severity</Th>
                          <Th sortKey="header" sortLabel="Header" sortState={sortState} onSort={handleSort}>Header</Th>
                          <Th sortKey="issue" sortLabel="Issue" sortState={sortState} onSort={handleSort}>Issue</Th>
                          <Th sortKey="guidance" sortLabel="Guidance" sortState={sortState} onSort={handleSort}>Guidance</Th>
                          <Th sortKey="url" sortLabel="Request" sortState={sortState} onSort={handleSort}>Request</Th>
                       </tr>
                   </thead>
                   <tbody>{paginatedList.map((item: any) => (
                       <tr key={item.id} className="extractor-table-row">
                           <Td>
                             <Badge level={item.severity || 'low'} />
                           </Td>
                           <Td className="extractor-mono">{item.header}</Td>
                           <Td>{item.issue}</Td>
                           <Td
                             className="extractor-truncate"
                             title={
                               item.evidence
                                 ? `${item.guidance}\nEvidence: ${item.evidence}`
                                 : item.guidance
                             }
                           >
                             <div className="extractor-guidance">
                               <span>{item.guidance}</span>
                               {item.recommendation && (
                                 <button
                                   type="button"
                                   className={`extractor-copy${copyState?.id === item.id ? ` is-${copyState?.status}` : ''}`}
                                   onClick={() => handleCopyRecommendation(item.id, item.recommendation)}
                                   title="Copy recommended header"
                                 >
                                   {copyState?.id === item.id
                                     ? copyState?.status === 'copied'
                                       ? 'Copied'
                                       : 'Failed'
                                     : 'Copy'}
                                 </button>
                               )}
                             </div>
                           </Td>
                           <Td className="extractor-truncate">
                             <FileLink url={item.url} />
                           </Td>
                       </tr>
                   ))}
                     {paginatedList.length === 0 && <EmptyRow colSpan={5} />}
                   </tbody>
               </Table>
             </>
          )}

          {hasScanned && activeTab === 'Endpoint Graph' && (
             <>
               <div className="extractor-count">{filteredList.length} endpoints mapped</div>
               <Table>
                   <thead>
                       <tr className="extractor-table-head">
                          <Th sortKey="riskScore" sortLabel="Risk" sortState={sortState} onSort={handleSort}>Risk</Th>
                          <Th sortKey="method" sortLabel="Method" sortState={sortState} onSort={handleSort}>Method</Th>
                          <Th sortKey="path" sortLabel="Path" sortState={sortState} onSort={handleSort}>Path</Th>
                          <Th sortKey="hit" sortLabel="Hit" sortState={sortState} onSort={handleSort}>Hit</Th>
                          <Th sortKey="signals" sortLabel="Signals" sortState={sortState} onSort={handleSort}>Signals</Th>
                          <Th sortKey="sources" sortLabel="Source" sortState={sortState} onSort={handleSort}>Source</Th>
                       </tr>
                   </thead>
                   <tbody>{paginatedList.map((item: any) => (
                       <tr key={item.id} className="extractor-table-row">
                           <Td>
                             <Badge level={item.riskLevel || 'low'} />
                             <span style={{ marginLeft: '6px', fontSize: '11px', color: '#949ba4' }}>
                               {item.riskScore}
                             </span>
                           </Td>
                           <Td>{item.method}</Td>
                           <Td className="extractor-mono">{item.path}</Td>
                           <Td>{item.hit ? 'Yes' : 'No'}</Td>
                           <Td className="extractor-truncate" title={item.riskSignals?.join(', ')}>
                             {item.riskSignals?.join(', ') || '-'}
                           </Td>
                           <Td className="extractor-truncate">
                             {item.sources?.length ? item.sources.join(', ') : '-'}
                           </Td>
                       </tr>
                   ))}
                     {paginatedList.length === 0 && <EmptyRow colSpan={6} />}
                   </tbody>
               </Table>
             </>
          )}

          {activeTab === 'Response Search' && (
            <div className="extractor-search">
               <div className="extractor-search-row">
                   <input 
                     type="text" 
                     className="extractor-search-input"
                     placeholder="Search across all response bodies..."
                     value={searchQuery}
                     onChange={e => setSearchQuery(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && handleSearch()}
                   />
                   <button 
                     className="extractor-search-button"
                     onClick={handleSearch}
                     title="Search response bodies"
                   >
                     Search
                   </button>
               </div>
               <div className="extractor-search-results">
                  {searchResults.map((res) => (
                      <div key={res.id} className="extractor-search-card">
                          <div className="extractor-search-file">
                            <FileLink url={res.file} label={res.file} />
                          </div>
                          <div className="extractor-search-context">{res.context}</div>
                      </div>
                  ))}
               </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="extractor-footer">
            <div className="extractor-footer-left">
              {activeTab !== 'Response Search' && (
                <>
                  <div className="extractor-footer-row">
                      {hasScanned && (
                        <div className="extractor-pagination">
                            <button 
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                                className="extractor-page-button"
                                title="Previous page"
                            >
                                ‹
                            </button>
                            <span>Page {currentPage} of {totalPages || 1}</span>
                            <button 
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                                className="extractor-page-button"
                                title="Next page"
                            >
                                ›
                            </button>
                        </div>
                      )}
                      <div className="extractor-rules-meta">
                        Rules: {rulesMeta.totalRules}
                        {rulesMeta.skippedRules ? ` (skipped ${rulesMeta.skippedRules})` : ''}
                      </div>
                  </div>
                  <div className="extractor-disclaimer">
                    Disclaimer: Automated scanning may produce false positives. Please manually verify all findings.
                  </div>
                </>
              )}
            </div>
            <div className="extractor-footer-right">
              {activeTab !== 'Response Search' && (
                <label className="extractor-toggle">
                  <input
                    type="checkbox"
                    checked={strictMode}
                    onChange={(event) => setStrictMode(event.target.checked)}
                    title="Toggle strict rules"
                  />
                  Strict rules
                </label>
              )}
              {activeTab !== 'Response Search' && (
                  <button 
                      className={`extractor-primary ${isScanning ? 'is-scanning' : ''} ${!canScan ? 'is-disabled' : ''}`}
                      onClick={handleScan}
                      disabled={!canScan}
                      title={isScanning ? 'Scanning…' : 'Start scan'}
                  >
                      {isScanning ? 'Scanning...' : 'Start Scan'}
                  </button>
              )}
            </div>
        </div>
      </div>
    </DraggablePanel>
  );
};

// UI Helpers
const Table = ({ children }: { children: React.ReactNode }) => (
    <table className="extractor-table">{children}</table>
);

const Th = ({
  children,
  sortKey,
  sortLabel,
  sortState,
  onSort,
}: {
  children: React.ReactNode;
  sortKey?: string;
  sortLabel?: string;
  sortState?: SortState | null;
  onSort?: (key: string) => void;
}) => {
  const isSortable = Boolean(sortKey && onSort);
  const isActive = Boolean(isSortable && sortState?.key === sortKey);
  const label =
    sortLabel || (typeof children === 'string' ? children : 'column');
  const indicator = isActive
    ? sortState?.direction === 'asc'
      ? '^'
      : 'v'
    : '';
  return (
    <th
      className={`extractor-th${isSortable ? ' is-sortable' : ''}${isActive ? ' is-sorted' : ''}`}
    >
      {isSortable ? (
        <button
          type="button"
          className="extractor-th-button"
          onClick={() => onSort?.(sortKey as string)}
          title={`Sort by ${label}`}
        >
          <span>{children}</span>
          <span className={`extractor-sort ${isActive ? 'is-active' : ''}`}>
            {indicator}
          </span>
        </button>
      ) : (
        children
      )}
    </th>
  );
};

const Td = ({ children, className = '', title }: { children: React.ReactNode; className?: string, title?: string }) => (
    <td className={`extractor-td ${className}`} title={title}>
        {children}
    </td>
);

const Badge = ({ level }: { level: string }) => {
    const colors = {
        low: 'badge-low',
        medium: 'badge-medium',
        high: 'badge-high'
    };
    const style = colors[level as keyof typeof colors] || colors.low;
    return (
        <span className={`extractor-badge ${style}`}>
            {level === 'high' ? '80%' : level === 'medium' ? '70%' : '60%'}
        </span>
    );
}

const EmptyRow = ({ colSpan }: { colSpan: number }) => (
    <tr><td colSpan={colSpan} className="extractor-empty-row">No items found</td></tr>
);

const FileLink = ({
  url,
  label,
}: {
  url?: string;
  label?: string;
}) => {
  const text = label || formatFileLabel(url || '');
  const isLink = Boolean(url && /^https?:\/\//i.test(url));

  if (!isLink) {
    return (
      <span className="extractor-link-text" title={url || text}>
        {text || 'Unknown'}
      </span>
    );
  }

  return (
    <a
      className="extractor-link"
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      title={url}
    >
      {text || url}
    </a>
  );
};

const formatFileLabel = (value: string) => {
  if (!value) return '';
  const base = value.split('?')[0];
  const parts = base.split('/');
  return parts[parts.length - 1] || value;
};

const formatSupabaseSummary = (result: SupabaseAuditResult): string => {
  if (!result) return 'No Supabase findings.';
  const lines: string[] = [];
  lines.push(`Status: ${result.status}`);
  if (result.reason) {
    lines.push(`Reason: ${result.reason}`);
  }

  if (result.summary) {
    lines.push('Summary:');
    lines.push(`- total_tables_accessible: ${result.summary.total_tables_accessible}`);
    lines.push(`- vulnerable_tables_count: ${result.summary.vulnerable_tables_count}`);
    lines.push(`- critical: ${result.summary.critical_count}`);
    lines.push(`- high: ${result.summary.high_count}`);
    lines.push(`- medium: ${result.summary.medium_count}`);
    if (result.summary.vulnerable_tables?.length) {
      lines.push('- vulnerable_tables:');
      result.summary.vulnerable_tables.slice(0, 10).forEach((table) => {
        const fields = table.sensitive_fields?.slice(0, 8) || [];
        lines.push(
          `  - ${table.table} (${table.level})${fields.length ? ` fields: ${fields.join(', ')}` : ''}`,
        );
      });
    }
  }

  if (result.targets?.length) {
    lines.push('Targets:');
    result.targets.slice(0, 5).forEach((target) => {
      lines.push(`- url: ${target.supabase_url}`);
      lines.push(`  token_role: ${target.token_role}`);
      if (target.token) {
        lines.push(`  token: ${target.token}`);
        lines.push('  use_as: apikey + Authorization: Bearer <token>');
      }
      lines.push(`  status: ${target.status}${target.http_status ? ` (${target.http_status})` : ''}`);
      if (target.error_message) {
        lines.push(`  error: ${target.error_message}`);
      }
      if (target.tables?.length) {
        target.tables.slice(0, 10).forEach((table) => {
          const fields = table.sensitive_fields?.slice(0, 6) || [];
          lines.push(
            `  - ${table.table}: vulnerable=${table.vulnerable ? 'yes' : 'no'}${table.vulnerability_level ? ` level=${table.vulnerability_level}` : ''}${fields.length ? ` fields=${fields.join(', ')}` : ''}`,
          );
        });
      }
    });
  }

  return lines.join('\n');
};

const getSortValue = (tab: Tab, key: string, item: unknown) => {
  if (tab === 'Secrets') {
    const secret = item as SecretFinding;
    if (key === 'type') return secret.type || '';
    if (key === 'match') return secret.match || '';
    if (key === 'confidence') return confidenceRank(secret.confidence);
    if (key === 'file') return secret.file || '';
    if (key === 'index') return secret.index ?? 0;
  }

  if (tab === 'Endpoints') {
    const endpoint = item as EndpointFinding;
    if (key === 'method') return endpoint.method || '';
    if (key === 'path') return endpoint.path || '';
    if (key === 'confidence') return confidenceRank(endpoint.confidence);
    if (key === 'source') return endpoint.source || endpoint.sourceUrl || '';
    if (key === 'sourceUrl') return endpoint.sourceUrl || '';
  }

  if (tab === 'Parameters') {
    const parameter = item as ParameterFinding;
    if (key === 'key') return parameter.key || '';
    if (key === 'value') return parameter.value || '';
    if (key === 'source') return parameter.source || '';
    if (key === 'request') return parameter.url || '';
  }

  if (tab === 'Web Cache Poisoning') {
    const finding = item as CachePoisoningFinding;
    if (key === 'vector') return finding.vector || '';
    if (key === 'evidence') return finding.evidence || '';
    if (key === 'confidence') return confidenceRank(finding.confidence);
    if (key === 'request') return finding.requestUrl || '';
  }

  if (tab === 'XSS Scanner') {
    const finding = item as XssFinding;
    if (key === 'parameter') return finding.parameter || '';
    if (key === 'evidence') return finding.evidence || '';
    if (key === 'context') return finding.context || '';
    if (key === 'confidence') return confidenceRank(finding.confidence);
    if (key === 'request') return finding.requestUrl || '';
  }

  if (tab === 'Security Headers') {
    const finding = item as SecurityHeaderFinding;
    if (key === 'severity') return confidenceRank(finding.severity);
    if (key === 'header') return finding.header || '';
    if (key === 'issue') return finding.issue || '';
    if (key === 'guidance') return finding.guidance || '';
    if (key === 'url') return finding.url || '';
  }

  if (tab === 'Endpoint Graph') {
    const node = item as EndpointGraphNode;
    if (key === 'riskScore') return node.riskScore || 0;
    if (key === 'method') return node.method || '';
    if (key === 'path') return node.path || '';
    if (key === 'hit') return node.hit ? 1 : 0;
    if (key === 'signals') return node.riskSignals?.join(', ') || '';
    if (key === 'sources') return node.sources?.join(', ') || '';
  }

  return '';
};

const compareSortValue = (a: unknown, b: unknown) => {
  const aValue = a ?? '';
  const bValue = b ?? '';
  if (typeof aValue === 'number' && typeof bValue === 'number') {
    return aValue - bValue;
  }
  return String(aValue).localeCompare(String(bValue));
};

const confidenceRank = (value?: string) => {
  if (value === 'high') return 3;
  if (value === 'medium') return 2;
  if (value === 'low') return 1;
  return 0;
};

const getResourceContent = (resource: any) =>
  new Promise<{ content?: string; encoding?: string }>((resolve) => {
    resource.getContent((content: string, encoding: string) => {
      resolve({ content, encoding });
    });
  });

const extractSourceMapEntries = async (
  content: string,
  resourceUrl: string,
  resourceMap: Map<string, any>,
  remainingChars: number,
  remainingSources: number,
): Promise<NetworkEntry[]> => {
  const sourceMapUrl = findSourceMapUrl(content);
  if (!sourceMapUrl) return [];

  let sourceMapText = '';
  if (sourceMapUrl.startsWith('data:')) {
    sourceMapText = decodeDataUri(sourceMapUrl);
    if (sourceMapText.length > MAX_SOURCE_MAP_TOTAL_CHARS) {
      return [];
    }
  } else {
    const resolvedUrl = resolveSourceMapUrl(resourceUrl, sourceMapUrl);
    const mapResource = resourceMap.get(resolvedUrl);
    if (!mapResource) return [];
    const { content: mapContent, encoding } =
      await getResourceContent(mapResource);
    sourceMapText = mapContent
      ? decodeContent(mapContent, encoding, Infinity)
      : '';
    if (sourceMapText.length > MAX_SOURCE_MAP_TOTAL_CHARS) {
      return [];
    }
  }

  if (!sourceMapText) return [];

  let parsed: any;
  try {
    parsed = JSON.parse(sourceMapText);
  } catch {
    return [];
  }

  const sourcesContent = Array.isArray(parsed.sourcesContent)
    ? parsed.sourcesContent
    : [];
  const sources = Array.isArray(parsed.sources) ? parsed.sources : [];

  const entries: NetworkEntry[] = [];
  let usedChars = 0;
  let usedSources = 0;

  for (let i = 0; i < sourcesContent.length; i += 1) {
    if (usedSources >= remainingSources) break;
    if (usedChars >= remainingChars) break;

    const body = sourcesContent[i];
    if (!body || typeof body !== 'string') continue;

    const allowed = Math.min(
      remainingChars - usedChars,
      MAX_SOURCE_MAP_ENTRY_CHARS,
    );
    const trimmed = body.slice(0, allowed);
    if (!trimmed) continue;

    const sourceName = sources[i] || `source-${i}`;
    const sourceUrl = resolveSourceMapUrl(resourceUrl, sourceName);
    const parts = parseUrlParts(sourceUrl);

    entries.push({
      id: `source-map-${Date.now()}-${entries.length}`,
      method: 'GET',
      url: sourceUrl,
      path: parts.path || sourceUrl,
      host: parts.host,
      protocol: parts.protocol,
      requestHeaders: [],
      responseHeaders: [],
      responseBody: trimmed,
      resourceType: 'source-map',
    });

    usedChars += trimmed.length;
    usedSources += 1;
  }

  return entries;
};

const findSourceMapUrl = (content: string) => {
  let match;
  let last = '';
  const regex = new RegExp(SOURCE_MAP_REGEX.source, SOURCE_MAP_REGEX.flags);
  while ((match = regex.exec(content)) !== null) {
    last = (match[1] || match[2] || '').trim();
  }
  return last;
};

const resolveSourceMapUrl = (baseUrl: string, mapUrl: string) => {
  try {
    return new URL(mapUrl, baseUrl).toString();
  } catch {
    return mapUrl;
  }
};

const decodeDataUri = (dataUri: string) => {
  const commaIndex = dataUri.indexOf(',');
  if (commaIndex === -1) return '';
  const meta = dataUri.slice(0, commaIndex);
  const data = dataUri.slice(commaIndex + 1);
  try {
    if (meta.includes('base64')) {
      return atob(data);
    }
    return decodeURIComponent(data);
  } catch {
    return '';
  }
};

const getExportPayload = (
  tab: Tab,
  filteredList: unknown[],
  searchResults: SearchResult[],
) => {
  if (tab === 'Secrets') {
    return {
      filename: 'extractor-secrets.csv',
      header: ['Type', 'Match', 'Confidence', 'File', 'Index'],
      rows: (filteredList as SecretFinding[]).map((item) => [
        item.type,
        item.match,
        item.confidence,
        item.file,
        item.index,
      ]),
    };
  }

  if (tab === 'Endpoints') {
    return {
      filename: 'extractor-endpoints.csv',
      header: ['Method', 'Path', 'Confidence', 'Source', 'Source URL'],
      rows: (filteredList as EndpointFinding[]).map((item) => [
        item.method || 'GET',
        item.path,
        item.confidence || 'low',
        item.source,
        item.sourceUrl || '',
      ]),
    };
  }

  if (tab === 'Parameters') {
    return {
      filename: 'extractor-parameters.csv',
      header: ['Key', 'Value', 'Source', 'Request'],
      rows: (filteredList as ParameterFinding[]).map((item) => [
        item.key,
        item.value || '',
        item.source,
        item.url,
      ]),
    };
  }

  if (tab === 'Response Search') {
    return {
      filename: 'extractor-response-search.csv',
      header: ['File', 'Match', 'Context'],
      rows: searchResults.map((item) => [
        item.file || '',
        item.match || '',
        item.context || '',
      ]),
    };
  }

  if (tab === 'Web Cache Poisoning') {
    return {
      filename: 'extractor-cache-poisoning.csv',
      header: ['Vector', 'Evidence', 'Confidence', 'Request'],
      rows: (filteredList as CachePoisoningFinding[]).map((item) => [
        item.vector,
        item.evidence,
        item.confidence,
        item.requestUrl,
      ]),
    };
  }

  if (tab === 'XSS Scanner') {
    return {
      filename: 'extractor-xss.csv',
      header: ['Parameter', 'Context', 'Evidence', 'Confidence', 'Request'],
      rows: (filteredList as XssFinding[]).map((item) => [
        item.parameter,
        item.context,
        item.evidence,
        item.confidence,
        item.requestUrl,
      ]),
    };
  }

  if (tab === 'Security Headers') {
    return {
      filename: 'extractor-security-headers.csv',
      header: ['Severity', 'Header', 'Issue', 'Guidance', 'Request', 'Evidence'],
      rows: (filteredList as SecurityHeaderFinding[]).map((item) => [
        item.severity,
        item.header,
        item.issue,
        item.guidance,
        item.url,
        item.evidence || '',
      ]),
    };
  }

  if (tab === 'Endpoint Graph') {
    return {
      filename: 'extractor-endpoint-graph.csv',
      header: ['Risk Score', 'Risk Level', 'Method', 'Path', 'Hit', 'Signals', 'Sources', 'Source URLs'],
      rows: (filteredList as EndpointGraphNode[]).map((item) => [
        item.riskScore,
        item.riskLevel,
        item.method,
        item.path,
        item.hit ? 'yes' : 'no',
        item.riskSignals.join('; '),
        item.sources.join('; '),
        item.sourceUrls.join('; '),
      ]),
    };
  }

  return null;
};

const downloadCsv = (
  filename: string,
  header: Array<string | number>,
  rows: Array<Array<string | number>>,
) => {
  const lines = [
    header.map(csvEscape).join(','),
    ...rows.map((row) => row.map(csvEscape).join(',')),
  ];
  const csv = lines.join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const csvEscape = (value: string | number) => {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const copyToClipboard = async (text: string) => {
  if (!text) return false;
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall back to execCommand
    }
  }
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(textArea);
  }
};

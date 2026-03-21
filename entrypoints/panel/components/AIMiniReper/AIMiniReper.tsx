import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ParsedRequest, NetworkEntry } from '../../types';
import { AISettings, Message, AIContextItem, MemoryStore, MemorySummary } from '../../types/ai';
import { PROVIDER_MODELS } from '../../utils/ai';
import { Send, Settings, Trash2, Bot, User, Loader2, Info, Pin, Plus, X, Download } from 'lucide-react';
import './AIMiniReper.css';
import { SYSTEM_PROMPT, ATTACK_ANALYSIS_PROMPT, EXPLAIN_REQUEST_PROMPT, GENERATE_ATTACK_PROMPT, AGENT_SYSTEM_PROMPT, AGENT_AUDIT_PROMPT, AGENT_AUTO_REPORT_PROMPT, MEMORY_BEHAVIOR_PROMPT, MEMORY_UPDATE_PROMPT } from './prompts';

interface AIMiniReperProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRequest: NetworkEntry | null;
  selectedRequests: NetworkEntry[];
  settings: AISettings;
  onUpdateSettings: (settings: AISettings) => void;
  onApplyRequest?: (request: any) => void;
  onApplyAndSend?: (request: ParsedRequest) => Promise<NetworkEntry | null>;
  isCardMode?: boolean;
  extractorCatalog?: AIContextItem[];
  extractorContextItems?: AIContextItem[];
  onAddExtractorContextItems?: (items: AIContextItem[]) => void;
  onRemoveExtractorContextItem?: (id: string) => void;
  onClearExtractorContextItems?: () => void;
}

type AIMode = 'ask' | 'agent';
type ProgressStatus = 'pending' | 'running' | 'done' | 'error' | 'skipped';
type ProgressStep = {
  id: 'prepare' | 'request' | 'response' | 'parse' | 'auto-run' | 'analyze';
  label: string;
  status: ProgressStatus;
  detail?: string;
};
type AttackSuggestion = {
  type: 'attack-suggestion';
  label?: string;
  method: string;
  url: string;
  headers?: Record<string, unknown>;
  body?: string;
};

type ChecklistSectionId = 'passive' | 'probe' | 'planning';
type ChecklistSection = {
  id: ChecklistSectionId;
  label: string;
  note: string;
};
type ChecklistItem = {
  id: string;
  section: ChecklistSectionId;
  label: string;
  description: string;
  instructions: string;
};

const CHECKLIST_SECTIONS: ChecklistSection[] = [
  {
    id: 'passive',
    label: 'Passive checks',
    note: 'Uses captured traffic and extractor findings only.',
  },
  {
    id: 'probe',
    label: 'Lightweight probes',
    note: 'Safe GET/HEAD/OPTIONS on the current host.',
  },
  {
    id: 'planning',
    label: 'Preparation',
    note: 'Summaries and test planning from observed flows.',
  },
];

const CHECKLIST_BASE_PROMPT = [
  'You are running a single checklist item inside MiniRep.',
  'Use ONLY the CONTEXT DATA and extractor findings provided.',
  'Do not invent endpoints or parameters.',
  'If evidence is missing, say "Need more traffic" and ask for a specific request to capture.',
  'If a probe is needed, output one or more attack-suggestion JSON blocks.',
  'Probes must be SAFE: GET, HEAD, or OPTIONS only, and only to the same host already seen.',
  'Keep output concise and actionable.',
].join('\n');

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'tech-fingerprint',
    section: 'passive',
    label: 'Identify web server, technologies, database',
    description: 'Infer stack from headers, HTML, JS, and error messages.',
    instructions: [
      'Identify the web server, framework, CDN/WAF, and likely database.',
      'Cite evidence from headers or response content and provide confidence.',
      'If evidence is weak, request one SAFE HEAD or GET probe to an existing URL for headers.',
    ].join('\n'),
  },
  {
    id: 'security-headers-cookies',
    section: 'passive',
    label: 'Security headers and cookie flags',
    description: 'Check CSP, HSTS, XFO, and session cookie attributes.',
    instructions: [
      'Check for missing or weak security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options,',
      'Referrer-Policy, Cache-Control, and Expires.',
      'Also review cookies for HttpOnly, Secure, SameSite, and expiry settings.',
      'Report what is missing or weak and why it matters.',
    ].join('\n'),
  },
  {
    id: 'comments-review',
    section: 'passive',
    label: 'Review source comments',
    description: 'Scan HTML/JS/CSS comments for endpoints, TODOs, or secrets.',
    instructions: [
      'Scan HTML, JS, and CSS responses for comments that reveal endpoints, credentials, or feature flags.',
      'List any findings with the source URL.',
    ].join('\n'),
  },
  {
    id: 'leaked-identifiers',
    section: 'passive',
    label: 'Find leaked IDs or emails',
    description: 'Look for emails, IDs, tokens, or secrets in responses.',
    instructions: [
      'Scan response bodies for emails, IDs (UUIDs or numeric), tokens, or secrets.',
      'List any findings with context and where they appeared.',
    ].join('\n'),
  },
  {
    id: 'waf-signals',
    section: 'passive',
    label: 'Identify WAF signals',
    description: 'Look for WAF/CDN indicators in headers or block pages.',
    instructions: [
      'Look for WAF or CDN indicators in headers (Server, Via, X-* headers) or block pages.',
      'Provide a likely vendor and supporting evidence.',
      'Do not craft attack payloads for this check.',
    ].join('\n'),
  },
  {
    id: 'url-inventory',
    section: 'passive',
    label: 'Inventory URLs',
    description: 'List unique endpoints from traffic and JS.',
    instructions: [
      'List unique URLs or paths from observed requests and extractor findings.',
      'Group by auth, admin, API, and static.',
      'Note parameters seen on each endpoint.',
    ].join('\n'),
  },
  {
    id: 'vuln-url-triage',
    section: 'passive',
    label: 'Check potential vulnerable URLs',
    description: 'Highlight risky endpoints and likely test ideas.',
    instructions: [
      'Highlight endpoints that look sensitive (IDs in path, file=, url=, redirect, search, export, upload).',
      'Explain the risk and propose a small, safe test idea for each.',
    ].join('\n'),
  },
  {
    id: 'login-admin-discovery',
    section: 'passive',
    label: 'Locate admin and login panels',
    description: 'Find login/admin routes from observed URLs or suggest safe probes.',
    instructions: [
      'Identify any login, auth, or admin endpoints already seen.',
      'If none are observed, propose up to 4 common login/admin paths as SAFE GET probes',
      'on the same host and output attack-suggestion JSON for them.',
    ].join('\n'),
  },
  {
    id: 'js-inventory',
    section: 'passive',
    label: 'Get all JS files',
    description: 'List JS bundles and entrypoints from the current site.',
    instructions: [
      'List all JavaScript files or bundles seen in responses and HTML references.',
      'Include full URLs when possible.',
    ].join('\n'),
  },
  {
    id: 'js-secrets-endpoints',
    section: 'passive',
    label: 'JS hardcoded APIs and secrets',
    description: 'Extract hardcoded keys and internal API endpoints from JS.',
    instructions: [
      'Inspect JS content and extractor findings for hardcoded keys, tokens, or internal API endpoints.',
      'Report findings with evidence and list any related endpoints.',
    ].join('\n'),
  },
  {
    id: 'standard-meta-files',
    section: 'probe',
    label: 'Check robots.txt and well-known files',
    description: 'Probe standard metadata files on the current host.',
    instructions: [
      'Generate SAFE GET requests to check: /robots.txt, /sitemap.xml, /crossdomain.xml,',
      '/clientaccesspolicy.xml, /.well-known/security.txt, /.well-known/assetlinks.json.',
      'Use the same host as the latest request. Output attack-suggestion JSON for each request and nothing else.',
    ].join('\n'),
  },
  {
    id: 'cors-check',
    section: 'probe',
    label: 'Test CORS',
    description: 'Probe one API endpoint for permissive CORS.',
    instructions: [
      'Pick one representative API endpoint from context and craft a CORS probe.',
      'Use an OPTIONS preflight and/or a GET with Origin: https://evil.example.',
      'Output attack-suggestion JSON and explain how to interpret Access-Control-Allow-*.',
    ].join('\n'),
  },
  {
    id: 'http-methods',
    section: 'probe',
    label: 'Dangerous HTTP methods',
    description: 'Use OPTIONS to see if PUT/DELETE are enabled.',
    instructions: [
      'Send an OPTIONS request to the latest request URL to inspect Allow or Access-Control-Allow-Methods.',
      'Output attack-suggestion JSON and explain what to look for.',
    ].join('\n'),
  },
  {
    id: 'site-structure',
    section: 'planning',
    label: 'Study site structure',
    description: 'Summarize flows and key data objects from traffic.',
    instructions: [
      'Summarize site structure and main flows using observed requests.',
      'Identify key resources, data objects, and auth boundaries.',
    ].join('\n'),
  },
  {
    id: 'test-case-list',
    section: 'planning',
    label: 'Make a focused test case list',
    description: 'Produce a practical test plan tied to observed endpoints.',
    instructions: [
      'Create a focused test case list for the observed endpoints and data flows.',
      'Keep it practical and tied to the captured requests.',
    ].join('\n'),
  },
  {
    id: 'business-area',
    section: 'planning',
    label: 'Understand the business area',
    description: 'Infer the domain and critical user actions from traffic.',
    instructions: [
      'Infer the business domain and critical user actions based on URLs and content.',
      'If unclear, say so and list what is missing.',
    ].join('\n'),
  },
];

const buildChecklistPrompt = (item: ChecklistItem) =>
  `${CHECKLIST_BASE_PROMPT}\n\nChecklist item: ${item.label}\n${item.instructions}`.trim();

const TabSelectHeader = ({
  label,
  total,
  selected,
  onToggle,
}: {
  label: string;
  total: number;
  selected: number;
  onToggle: (checked: boolean) => void;
}) => {
  const checkboxRef = useRef<HTMLInputElement | null>(null);
  const checked = total > 0 && selected === total;
  const indeterminate = selected > 0 && selected < total;

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <label className="extractor-picker-title">
      <input
        ref={checkboxRef}
        type="checkbox"
        checked={checked}
        onChange={(event) => onToggle(event.target.checked)}
      />
      <span className="extractor-picker-title-text">
        {label} ({total})
      </span>
    </label>
  );
};

const MODE_STORAGE_KEY = 'ai-minireper-mode';
const AUTO_RUN_STORAGE_KEY = 'ai-minireper-auto-run';
const MAX_AGENT_AUTORUN = 6;
const MEMORY_STORE_KEY = 'ai-minireper-memory-store';
const MAX_MESSAGE_CONTEXT_CHARS = 20000;
const RECENT_MESSAGE_COUNT = 8;

const DEFAULT_MEMORY_SUMMARY: MemorySummary = {
  userPreferences: [],
  keyTopics: [],
  pendingQuestions: [],
};

const buildEmptyMemoryStore = (): MemoryStore => ({
  version: 1,
  history: [],
  facts: [],
  summary: { ...DEFAULT_MEMORY_SUMMARY },
  checkpoints: [],
});

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const cleaned = value
    .map((item) => (typeof item === 'string' ? item.trim() : String(item).trim()))
    .filter(Boolean);
  return Array.from(new Set(cleaned));
};

const normalizeSummary = (value: unknown): MemorySummary => {
  const summary = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    userPreferences: normalizeStringArray(summary.userPreferences),
    keyTopics: normalizeStringArray(summary.keyTopics),
    pendingQuestions: normalizeStringArray(summary.pendingQuestions),
  };
};

const coerceMemoryStore = (value: unknown): MemoryStore => {
  if (!value || typeof value !== 'object') return buildEmptyMemoryStore();
  const data = value as Record<string, unknown>;
  const history = Array.isArray(data.history)
    ? data.history.map((item) => {
        const entry = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
        const role = (entry.role === 'assistant' || entry.role === 'system' ? entry.role : 'user') as 'system' | 'assistant' | 'user';
        const content = typeof entry.content === 'string' ? entry.content : String(entry.content ?? '');
        const timestamp = typeof entry.timestamp === 'string' ? entry.timestamp : new Date().toISOString();
        return { role, content, timestamp };
      })
    : [];

  const checkpoints = Array.isArray(data.checkpoints) ? data.checkpoints : [];
  const facts = normalizeStringArray(data.facts);
  const summary = normalizeSummary(data.summary);

  return {
    version: 1,
    history,
    facts,
    summary,
    checkpoints: checkpoints as MemoryStore['checkpoints'],
  };
};

const buildMemoryStoreFromMessages = (messages: Message[]): MemoryStore => {
  const timestamp = new Date().toISOString();
  return {
    ...buildEmptyMemoryStore(),
    history: messages.map((msg) => ({
      role: msg.role as 'system' | 'assistant' | 'user',
      content: msg.content,
      timestamp,
    })),
  };
};

const extractJsonPayload = (text: string): string | null => {
  const codeBlockMatch = /```json\s*([\s\S]*?)\s*```/i.exec(text);
  if (codeBlockMatch) return codeBlockMatch[1];
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return null;
};

const parseMemoryUpdate = (text: string): { facts: string[]; summary: MemorySummary } | null => {
  const raw = text.trim();
  const payload = extractJsonPayload(raw) ?? raw;
  try {
    const parsed = JSON.parse(payload);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      facts: normalizeStringArray((parsed as Record<string, unknown>).facts),
      summary: normalizeSummary((parsed as Record<string, unknown>).summary),
    };
  } catch {
    return null;
  }
};

const formatMemorySummary = (summary: MemorySummary): string => {
  const sections: string[] = [];
  if (summary.userPreferences.length) {
    sections.push(`User Preferences:\n${summary.userPreferences.map((item) => `- ${item}`).join('\n')}`);
  }
  if (summary.keyTopics.length) {
    sections.push(`Key Topics:\n${summary.keyTopics.map((item) => `- ${item}`).join('\n')}`);
  }
  if (summary.pendingQuestions.length) {
    sections.push(`Pending Questions:\n${summary.pendingQuestions.map((item) => `- ${item}`).join('\n')}`);
  }
  return sections.join('\n\n');
};

const buildMemoryContext = (memory: MemoryStore): string => {
  const sections: string[] = [];
  const summaryText = formatMemorySummary(memory.summary);
  if (summaryText) sections.push(summaryText);
  if (memory.facts.length) {
    sections.push(`Atomic Facts:\n${memory.facts.map((item) => `- ${item}`).join('\n')}`);
  }
  return sections.join('\n\n');
};

const buildMessagesForModel = (messages: Message[], memory: MemoryStore): Message[] => {
  const totalChars = messages.reduce((acc, msg) => acc + msg.content.length, 0);
  if (totalChars <= MAX_MESSAGE_CONTEXT_CHARS || memory.summary.keyTopics.length === 0) {
    return messages;
  }
  return messages.slice(-RECENT_MESSAGE_COUNT);
};

const buildSystemPrompt = (
  basePrompt: string,
  memoryContext: string,
  requestContext: string,
) => {
  const sections = [basePrompt, MEMORY_BEHAVIOR_PROMPT];
  if (memoryContext) sections.push(`SHORT-TERM MEMORY:\n${memoryContext}`);
  if (requestContext) sections.push(`CONTEXT DATA:\n${requestContext}`);
  return sections.join('\n\n');
};

const buildProgressSteps = (): ProgressStep[] => [
  { id: 'prepare', label: 'Prepare context', status: 'pending' },
  { id: 'request', label: 'Request model', status: 'pending' },
  { id: 'response', label: 'Receive response', status: 'pending' },
  { id: 'parse', label: 'Parse test variants', status: 'pending' },
  { id: 'auto-run', label: 'Auto-run tests', status: 'pending' },
  { id: 'analyze', label: 'Analyze results', status: 'pending' },
];

const extractAttackSuggestions = (content: string): AttackSuggestion[] => {
  if (!content) return [];
  const suggestions: AttackSuggestion[] = [];
  const codeBlockRegex = /```json\s*([\s\S]*?)\s*```/g;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const jsonStr = match[1];
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed?.type === 'attack-suggestion') {
        suggestions.push(parsed as AttackSuggestion);
      }
    } catch {
      // Ignore parse errors from non-JSON blocks
    }
  }

  return suggestions;
};

const buildParsedRequestFromSuggestion = (suggestion: AttackSuggestion): ParsedRequest | null => {
  if (!suggestion || typeof suggestion !== 'object') return null;
  const method = typeof suggestion.method === 'string' ? suggestion.method : '';
  const url = typeof suggestion.url === 'string' ? suggestion.url : '';
  if (!method || !url) return null;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return null;
  }

  const rawHeaders =
    suggestion.headers && typeof suggestion.headers === 'object'
      ? (suggestion.headers as Record<string, unknown>)
      : {};
  const headers = Object.entries(rawHeaders).map(([key, value]) => ({
    key,
    value: value == null ? '' : String(value),
  }));
  const body =
    typeof suggestion.body === 'string'
      ? suggestion.body
      : suggestion.body == null
        ? ''
        : String(suggestion.body);
  const requestLine = `${method} ${parsedUrl.pathname + parsedUrl.search} HTTP/1.1`;

  return {
    method,
    url,
    headers,
    body,
    requestLine,
  };
};

const AttackSuggestionCard = ({ suggestion, onApply, onApplyAndSend }: { 
    suggestion: any, 
    onApply: (req: any) => void,
    onApplyAndSend?: (req: ParsedRequest) => Promise<NetworkEntry | null> 
}) => {
    const [status, setStatus] = useState<'idle' | 'applied' | 'sent'>('idle');
    const urlPreview = typeof suggestion?.url === 'string' ? suggestion.url : '';

    useEffect(() => {
        if (status === 'applied' || status === 'sent') {
            const timer = setTimeout(() => setStatus('idle'), 2000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const handleApply = () => {
        onApply(suggestion);
        setStatus('applied');
    };

    const handleApplyAndSend = () => {
        if (!onApplyAndSend) return;
        
        const parsed = buildParsedRequestFromSuggestion(suggestion);
        if (!parsed) return;

        // First apply to UI
        onApply(suggestion);
        // Then send
        void onApplyAndSend(parsed);
        
        setStatus('sent');
    };

    return (
        <div className="attack-suggestion-card" style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--panel-border)',
            borderRadius: '8px',
            padding: '12px',
            marginTop: '8px',
            marginBottom: '8px',
        }}>
            <div style={{fontWeight: 600, marginBottom: '4px', color: 'var(--accent-2)'}}>
                {suggestion.label || 'Suggested Attack'}
            </div>
            <div style={{fontSize: '12px', opacity: 0.8, marginBottom: '8px', fontFamily: 'monospace'}}>
                {suggestion.method} {urlPreview.slice(0, 50)}{urlPreview.length > 50 ? '...' : ''}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                    className={`btn slim ${status === 'applied' ? 'active' : 'primary'}`}
                    onClick={handleApply}
                    disabled={status === 'applied' || status === 'sent'}
                    style={{flex: 1}}
                >
                    {status === 'applied' ? 'All Set!' : 'Apply Change'}
                </button>
                {onApplyAndSend && (
                    <button 
                        className={`btn slim ${status === 'sent' ? 'active' : 'primary'}`}
                        onClick={handleApplyAndSend}
                        disabled={status === 'sent'}
                        style={{flex: 1}}
                    >
                        {status === 'sent' ? 'Sent!' : 'Apply & Send'}
                    </button>
                )}
            </div>
        </div>
    );
};

export const AIMiniReper: React.FC<AIMiniReperProps> = ({
  isOpen,
  onClose,
  selectedRequest,
  selectedRequests,
  settings,
  onUpdateSettings,
  onApplyRequest,
  onApplyAndSend,
  isCardMode = true,
  extractorCatalog = [],
  extractorContextItems = [],
  onAddExtractorContextItems,
  onRemoveExtractorContextItem,
  onClearExtractorContextItems,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [memoryStore, setMemoryStore] = useState<MemoryStore>(buildEmptyMemoryStore());
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);
  const [pinnedRequests, setPinnedRequests] = useState<NetworkEntry[]>([]);
  const [mode, setMode] = useState<AIMode>('ask');
  const [autoRunAgent, setAutoRunAgent] = useState(false);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [isExtractorPickerOpen, setIsExtractorPickerOpen] = useState(false);
  const [isExtractorContextOpen, setIsExtractorContextOpen] = useState(true);
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<string[]>([]);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [lastChecklistId, setLastChecklistId] = useState<string | null>(null);
  const memoryStoreRef = useRef<MemoryStore>(buildEmptyMemoryStore());

  const MEMORY_STORAGE_KEY = 'ai-minireper-memory';

  // Load memory from local storage on mount
  useEffect(() => {
    try {
      const savedStore = localStorage.getItem(MEMORY_STORE_KEY);
      if (savedStore) {
        const parsedStore = coerceMemoryStore(JSON.parse(savedStore));
        setMemoryStore(parsedStore);
        memoryStoreRef.current = parsedStore;
        if (parsedStore.history.length > 0) {
          setMessages(
            parsedStore.history.map((entry) => ({
              role: entry.role,
              content: entry.content,
            })),
          );
          return;
        }
      }
      const savedMemory = localStorage.getItem(MEMORY_STORAGE_KEY);
      if (savedMemory) {
        const parsedMessages = JSON.parse(savedMemory);
        if (Array.isArray(parsedMessages)) {
          setMessages(parsedMessages);
          const derivedStore = buildMemoryStoreFromMessages(parsedMessages as Message[]);
          setMemoryStore(derivedStore);
          memoryStoreRef.current = derivedStore;
        }
      }
    } catch (e) {
      console.error('Failed to load chat history', e);
    }
  }, []);

  useEffect(() => {
    memoryStoreRef.current = memoryStore;
  }, [memoryStore]);

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem(MODE_STORAGE_KEY);
      if (savedMode === 'ask' || savedMode === 'agent') {
        setMode(savedMode);
      }
      const savedAutoRun = localStorage.getItem(AUTO_RUN_STORAGE_KEY);
      if (savedAutoRun !== null) {
        setAutoRunAgent(savedAutoRun === 'true');
      }
    } catch (e) {
      console.error('Failed to load agent mode settings', e);
    }
  }, []);

  // Save memory to local storage on update
  useEffect(() => {
    try {
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save chat history', e);
    }
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(MEMORY_STORE_KEY, JSON.stringify(memoryStore));
    } catch (e) {
      console.error('Failed to save memory store', e);
    }
  }, [memoryStore]);

  useEffect(() => {
    try {
      localStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch {
      // Ignore storage write failures
    }
  }, [mode]);

  useEffect(() => {
    try {
      localStorage.setItem(AUTO_RUN_STORAGE_KEY, String(autoRunAgent));
    } catch {
      // Ignore storage write failures
    }
  }, [autoRunAgent]);

  useEffect(() => {
    if (!extractorCatalog.length) {
      setSelectedCatalogIds([]);
      setIsExtractorPickerOpen(false);
      return;
    }
    const valid = new Set(extractorCatalog.map((item) => item.id));
    setSelectedCatalogIds((prev) => prev.filter((id) => valid.has(id)));
  }, [extractorCatalog]);

  // Combined context: Pinned requests + Current selected request(s)
  const activeContext = useMemo(() => {
    const context = [...pinnedRequests];
    
    const candidates = selectedRequests && selectedRequests.length > 0
        ? selectedRequests
        : (selectedRequest ? [selectedRequest] : []);

    candidates.forEach(req => {
        if (!context.find(r => r.id === req.id)) {
            context.push(req);
        }
    });

    return context;
  }, [selectedRequest, selectedRequests, pinnedRequests]);

  useEffect(() => {
    const requestContext = formatContextForAI(activeContext, extractorContextItems);
    const memoryContext = buildMemoryContext(memoryStore);
    const contextText = [memoryContext, requestContext].filter(Boolean).join('\n\n');
    if (contextText) {
      // Rough estimate: 1 token ~= 4 chars for English text
      setTokenCount(Math.ceil(contextText.length / 4));
    } else {
      setTokenCount(0);
    }
  }, [activeContext, extractorContextItems, memoryStore]);


  const formatRequestForAI = (req: NetworkEntry) => {
    const truncate = (str: string | undefined, max: number = 2000) => {
      if (!str) return 'None';
      if (str.length <= max) return str;
      return str.slice(0, max) + `... [truncated, total ${str.length} chars]`;
    };

    return `
--- REQUEST ID: ${req.id} ---
URL: ${req.url}
Method: ${req.method}
Status: ${req.status} ${req.statusText}
Request Headers: ${JSON.stringify(req.requestHeaders, null, 2)}
Request Body: ${truncate(req.requestBody)}
Response Headers: ${JSON.stringify(req.responseHeaders, null, 2)}
Response Body: ${truncate(req.responseBody)}
-----------------------------
    `.trim();
  };
  const renderInlineMarkdown = (text: string, keyPrefix: string) => {
    const nodes: React.ReactNode[] = [];
    let i = 0;
    let keyIndex = 0;

    const pushText = (value: string) => {
      if (value) nodes.push(value);
    };

    while (i < text.length) {
      const char = text[i];
      if (char === '`') {
        const end = text.indexOf('`', i + 1);
        if (end !== -1) {
          nodes.push(
            <code key={`${keyPrefix}-code-${keyIndex++}`}>
              {text.slice(i + 1, end)}
            </code>,
          );
          i = end + 1;
          continue;
        }
      }
      if (char === '*' && text[i + 1] === '*') {
        const end = text.indexOf('**', i + 2);
        if (end !== -1) {
          nodes.push(
            <strong key={`${keyPrefix}-strong-${keyIndex++}`}>
              {renderInlineMarkdown(text.slice(i + 2, end), `${keyPrefix}-strong-${keyIndex}`)}
            </strong>,
          );
          i = end + 2;
          continue;
        }
      }
      if (char === '*' || char === '_') {
        const end = text.indexOf(char, i + 1);
        if (end !== -1) {
          nodes.push(
            <em key={`${keyPrefix}-em-${keyIndex++}`}>
              {renderInlineMarkdown(text.slice(i + 1, end), `${keyPrefix}-em-${keyIndex}`)}
            </em>,
          );
          i = end + 1;
          continue;
        }
      }
      const next = text.slice(i + 1).search(/[`*_]/);
      if (next === -1) {
        pushText(text.slice(i));
        break;
      }
      const nextIndex = i + 1 + next;
      pushText(text.slice(i, nextIndex));
      i = nextIndex;
    }

    return nodes;
  };

  const renderMarkdownBlocks = (text: string, keyPrefix: string) => {
    const blocks: React.ReactNode[] = [];
    const lines = text.split(/\r?\n/);
    let paragraph: string[] = [];
    let listType: 'ul' | 'ol' | null = null;
    let listItems: string[] = [];

    const flushParagraph = () => {
      if (!paragraph.length) return;
      const content = paragraph.join(' ');
      blocks.push(
        <p key={`${keyPrefix}-p-${blocks.length}`}>
          {renderInlineMarkdown(content, `${keyPrefix}-p-${blocks.length}`)}
        </p>,
      );
      paragraph = [];
    };

    const flushList = () => {
      if (!listType || listItems.length === 0) return;
      const items = listItems.map((item, idx) => (
        <li key={`${keyPrefix}-li-${blocks.length}-${idx}`}>
          {renderInlineMarkdown(item, `${keyPrefix}-li-${blocks.length}-${idx}`)}
        </li>
      ));
      blocks.push(
        listType === 'ul' ? (
          <ul key={`${keyPrefix}-ul-${blocks.length}`}>{items}</ul>
        ) : (
          <ol key={`${keyPrefix}-ol-${blocks.length}`}>{items}</ol>
        ),
      );
      listType = null;
      listItems = [];
    };

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushParagraph();
        flushList();
        return;
      }

      const headingMatch = /^(#{1,6})\s+(.*)/.exec(trimmed);
      if (headingMatch) {
        flushParagraph();
        flushList();
        const level = Math.min(headingMatch[1].length, 6);
        const Tag = `h${level}` as any;
        blocks.push(
          <Tag key={`${keyPrefix}-h-${blocks.length}`}>
            {renderInlineMarkdown(headingMatch[2], `${keyPrefix}-h-${blocks.length}`)}
          </Tag>,
        );
        return;
      }

      const orderedMatch = /^(\d+)\.\s+(.*)/.exec(trimmed);
      if (orderedMatch) {
        flushParagraph();
        if (listType !== 'ol') {
          flushList();
          listType = 'ol';
        }
        listItems.push(orderedMatch[2]);
        return;
      }

      const unorderedMatch = /^[-*]\s+(.*)/.exec(trimmed);
      if (unorderedMatch) {
        flushParagraph();
        if (listType !== 'ul') {
          flushList();
          listType = 'ul';
        }
        listItems.push(unorderedMatch[1]);
        return;
      }

      if (listType && listItems.length > 0) {
        listItems[listItems.length - 1] = `${listItems[listItems.length - 1]} ${trimmed}`;
        return;
      }

      paragraph.push(trimmed);
    });

    flushParagraph();
    flushList();

    return blocks;
  };

  const renderMessageContent = (content: string) => {
    const codeBlockRegex = /```([a-zA-Z0-9_-]+)?\s*([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const textSegment = content.slice(lastIndex, match.index);
        if (textSegment.trim()) {
          parts.push(
            <div key={`text-${lastIndex}`} className="ai-markdown">
              {renderMarkdownBlocks(textSegment, `text-${lastIndex}`)}
            </div>,
          );
        }
      }

      const lang = (match[1] || '').toLowerCase();
      const codeText = match[2];
      let rendered = false;

      if (lang === 'json' || !lang) {
        try {
          const parsed = JSON.parse(codeText);
          if (parsed.type === 'attack-suggestion' && onApplyRequest) {
            parts.push(
              <AttackSuggestionCard
                key={`attack-${match.index}`}
                suggestion={parsed}
                onApply={onApplyRequest}
                onApplyAndSend={onApplyAndSend}
              />,
            );
            rendered = true;
          }
        } catch {
          // ignore invalid JSON
        }
      }

      if (!rendered) {
        parts.push(
          <pre key={`code-${match.index}`} className="code-block">
            <code>{codeText.trimEnd()}</code>
          </pre>,
        );
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      const textSegment = content.slice(lastIndex);
      if (textSegment.trim()) {
        parts.push(
          <div key={`text-${lastIndex}`} className="ai-markdown">
            {renderMarkdownBlocks(textSegment, `text-${lastIndex}`)}
          </div>,
        );
      }
    }

    if (parts.length === 0) {
      return (
        <div className="ai-markdown">
          {renderMarkdownBlocks(content, 'text-0')}
        </div>
      );
    }

    return parts;
  };
  const formatExtractorContext = (items: AIContextItem[]) => {
    if (!items.length) return '';
    const lines = items.map((item, index) => {
      const header = `${index + 1}. ${item.title} (tab: ${item.tab})`;
      return `${header}\n${item.content}`;
    });
    return `EXTRACTOR FINDINGS:\n${lines.join('\n\n')}`;
  };

  const formatContextForAI = (
    requests: NetworkEntry[],
    items: AIContextItem[],
  ) => {
    const sections: string[] = [];
    if (requests.length > 0) {
      const requestBlock =
        'The following HTTP requests are active in the context (The LAST request is the most recent/focused one):\n\n' +
        requests
          .map((req, index) => {
            const isLast = index === requests.length - 1;
            const content = formatRequestForAI(req);
            return isLast
              ? `[CURRENT / LATEST REQUEST TO CHECK]\n${content}`
              : content;
          })
          .join('\n\n');
      sections.push(requestBlock);
    }

    const extractorBlock = formatExtractorContext(items);
    if (extractorBlock) sections.push(extractorBlock);

    return sections.join('\n\n');
  };

  const extractorCatalogByTab = useMemo(() => {
    return extractorCatalog.reduce<Record<string, AIContextItem[]>>((acc, item) => {
      if (!acc[item.tab]) acc[item.tab] = [];
      acc[item.tab].push(item);
      return acc;
    }, {});
  }, [extractorCatalog]);

  const extractorTabOrder = [
    'Supabase',
    'Secrets',
    'Endpoints',
    'Parameters',
    'Web Cache Poisoning',
    'XSS Scanner',
    'Security Headers',
    'Endpoint Graph',
    'Response Search',
  ];

  const extractorTabs = useMemo(() => {
    const tabs = extractorTabOrder.filter((tab) => extractorCatalogByTab[tab]?.length);
    const extraTabs = Object.keys(extractorCatalogByTab).filter(
      (tab) => !extractorTabOrder.includes(tab),
    );
    return [...tabs, ...extraTabs];
  }, [extractorCatalogByTab]);

  const checklistBySection = useMemo(() => {
    return CHECKLIST_ITEMS.reduce<Record<ChecklistSectionId, ChecklistItem[]>>(
      (acc, item) => {
        acc[item.section].push(item);
        return acc;
      },
      { passive: [], probe: [], planning: [] },
    );
  }, []);

  const toggleCatalogSelection = (id: string) => {
    setSelectedCatalogIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleCatalogTab = (tab: string, checked: boolean) => {
    const tabItems = extractorCatalogByTab[tab] || [];
    if (tabItems.length === 0) return;
    setSelectedCatalogIds((prev) => {
      const set = new Set(prev);
      if (checked) {
        tabItems.forEach((item) => set.add(item.id));
      } else {
        tabItems.forEach((item) => set.delete(item.id));
      }
      return Array.from(set);
    });
  };

  const clearCatalogSelection = () => {
    setSelectedCatalogIds([]);
  };

  const handleAddSelectedCatalog = () => {
    if (!onAddExtractorContextItems) return;
    if (selectedCatalogIds.length === 0) return;
    const selectedItems = extractorCatalog.filter((item) =>
      selectedCatalogIds.includes(item.id),
    );
    if (selectedItems.length === 0) return;
    onAddExtractorContextItems(selectedItems);
    clearCatalogSelection();
    setIsExtractorPickerOpen(false);
  };

  const progressSummary = useMemo(() => {
    if (progressSteps.length === 0) return '';
    const totals = progressSteps.reduce(
      (acc, step) => {
        acc[step.status] += 1;
        return acc;
      },
      {
        pending: 0,
        running: 0,
        done: 0,
        error: 0,
        skipped: 0,
      } as Record<ProgressStatus, number>,
    );
    if (totals.error > 0) return `Errors ${totals.error}`;
    if (totals.running > 0) return `Running ${totals.running}/${progressSteps.length}`;
    if (totals.done > 0) return `Done ${totals.done}/${progressSteps.length}`;
    if (totals.skipped === progressSteps.length) return 'Skipped';
    return 'Pending';
  }, [progressSteps]);

  const updateProgressStep = (id: ProgressStep['id'], patch: Partial<ProgressStep>) => {
    setProgressSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, ...patch } : step)),
    );
  };

  const updateMemoryFromExchange = async (
    exchange: { user: string; assistant: string; tools?: string[] },
    model?: any,
    generateText?: any,
  ) => {
    const baseMemory = memoryStoreRef.current ?? buildEmptyMemoryStore();
    const timestamp = new Date().toISOString();
    const nextHistory = [
      ...baseMemory.history,
      { role: 'user' as const, content: exchange.user, timestamp },
      { role: 'assistant' as const, content: exchange.assistant, timestamp },
    ];
    let nextSummary = baseMemory.summary;
    let nextFacts = baseMemory.facts;

    if (model && generateText) {
      const memoryInput = [
        'CURRENT MEMORY (JSON):',
        JSON.stringify({ facts: baseMemory.facts, summary: baseMemory.summary }, null, 2),
        'LATEST EXCHANGE:',
        `USER: ${exchange.user}`,
        `ASSISTANT: ${exchange.assistant}`,
        `TOOLS: ${(exchange.tools && exchange.tools.length > 0) ? exchange.tools.join(', ') : 'None'}`,
      ].join('\n\n');

      try {
        const { text: memoryText } = await generateText({
          model,
          system: MEMORY_UPDATE_PROMPT,
          messages: [{ role: 'user', content: memoryInput }],
        });
        const parsed = parseMemoryUpdate(memoryText);
        if (parsed) {
          const hasSummaryContent =
            parsed.summary.userPreferences.length > 0 ||
            parsed.summary.keyTopics.length > 0 ||
            parsed.summary.pendingQuestions.length > 0;
          if (hasSummaryContent || baseMemory.summary.keyTopics.length === 0) {
            nextSummary = parsed.summary;
          }
          if (parsed.facts.length > 0 || baseMemory.facts.length === 0) {
            nextFacts = parsed.facts;
          }
        }
      } catch (error) {
        console.warn('Failed to update memory summary', error);
      }
    }

    const checkpointId = `checkpoint-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextCheckpoint = {
      id: checkpointId,
      timestamp,
      input: exchange.user,
      output: exchange.assistant,
      tools: exchange.tools ?? [],
      summary: nextSummary,
      facts: nextFacts,
    };

    const nextMemory: MemoryStore = {
      ...baseMemory,
      history: nextHistory,
      summary: nextSummary,
      facts: nextFacts,
      checkpoints: [...baseMemory.checkpoints, nextCheckpoint],
    };

    memoryStoreRef.current = nextMemory;
    setMemoryStore(nextMemory);
  };

  const queueAgentRuns = async (suggestions: AttackSuggestion[]) => {
    if (!onApplyAndSend) return [];
    const limited = suggestions.slice(0, MAX_AGENT_AUTORUN);
    const results: NetworkEntry[] = [];
    for (const suggestion of limited) {
      const parsed = buildParsedRequestFromSuggestion(suggestion);
      if (!parsed) continue;
      onApplyRequest?.(suggestion);
      const result = await onApplyAndSend(parsed);
      if (result) results.push(result);
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return results;
  };

  const handleSend = async (
    customPrompt?: string,
    systemPromptOverride?: string,
    options?: { autoRun?: boolean }
  ) => {
    const promptValue = customPrompt || input;
    if (!promptValue.trim() && !customPrompt) return;
    if (!settings.apiKey) {
      alert('Please set your API key in settings');
      setShowSettings(true);
      return;
    }

    const initialSteps: ProgressStep[] = buildProgressSteps().map((step) =>
      step.id === 'prepare' ? { ...step, status: 'running' } : step,
    );
    setProgressSteps(initialSteps);
    setIsProgressOpen(false);

    const newUserMessage: Message = { role: 'user', content: promptValue };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Dynamic imports to avoid crashing on boot if these libraries have browser issues
      const { generateText } = await import('ai');
      const { getAIModel } = await import('../../utils/ai');

      const model = await getAIModel(settings);

      const contextData = formatContextForAI(activeContext, extractorContextItems);
      updateProgressStep('prepare', { status: 'done' });
      updateProgressStep('request', { status: 'running' });
      const defaultSystemPrompt = mode === 'agent' ? AGENT_SYSTEM_PROMPT : SYSTEM_PROMPT;
      const systemMessage = systemPromptOverride || defaultSystemPrompt;

      const memoryContext = buildMemoryContext(memoryStoreRef.current);
      const finalSystem = buildSystemPrompt(systemMessage, memoryContext, contextData);
      const messagesForModel = buildMessagesForModel(updatedMessages, memoryStoreRef.current);

      const { text } = await generateText({
        model,
        system: finalSystem,
        messages: messagesForModel.map(m => ({
          role: m.role as any, 
          content: m.content 
        })),
      });

      const assistantMessage: Message = { role: 'assistant', content: text };
      updateProgressStep('request', { status: 'done' });
      updateProgressStep('response', { status: 'done' });
      setMessages(prev => [...prev, assistantMessage]);

      const suggestions = mode === 'agent' ? extractAttackSuggestions(text) : [];
      void updateMemoryFromExchange(
        {
          user: promptValue,
          assistant: text,
          tools: [],
        },
        model,
        generateText,
      );
      if (mode === 'agent') {
        updateProgressStep('parse', { status: 'running' });
        updateProgressStep('parse', {
          status: 'done',
          detail: suggestions.length ? `${suggestions.length} variants` : 'No variants',
        });
      } else {
        updateProgressStep('parse', { status: 'skipped', detail: 'Agent only' });
      }

      const shouldAutoRun =
        mode === 'agent' &&
        autoRunAgent &&
        onApplyAndSend &&
        options?.autoRun !== false;
      if (shouldAutoRun) {
        if (suggestions.length === 0) {
          updateProgressStep('auto-run', { status: 'skipped', detail: 'No variants' });
          updateProgressStep('analyze', { status: 'skipped', detail: 'No results' });
        } else {
          updateProgressStep('auto-run', {
            status: 'running',
            detail: `Running up to ${Math.min(suggestions.length, MAX_AGENT_AUTORUN)}`,
          });
          const results = await queueAgentRuns(suggestions);
          updateProgressStep('auto-run', {
            status: 'done',
            detail: `Executed ${results.length}`,
          });

          if (results.length > 0) {
            updateProgressStep('analyze', { status: 'running' });
            const autoReportMessage: Message = { role: 'user', content: AGENT_AUTO_REPORT_PROMPT };
            setMessages(prev => [...prev, autoReportMessage]);
            const reportContext = formatContextForAI(results, extractorContextItems);
            const reportSystem = buildSystemPrompt(
              AGENT_SYSTEM_PROMPT,
              buildMemoryContext(memoryStoreRef.current),
              reportContext,
            );
            const reportMessages = buildMessagesForModel(
              [...updatedMessages, assistantMessage, autoReportMessage],
              memoryStoreRef.current,
            ).map(m => ({
              role: m.role as any,
              content: m.content,
            }));
            try {
              const { text: reportText } = await generateText({
                model,
                system: reportSystem,
                messages: reportMessages,
              });
              setMessages(prev => [...prev, { role: 'assistant', content: reportText }]);
              void updateMemoryFromExchange(
                {
                  user: autoReportMessage.content,
                  assistant: reportText,
                  tools: [],
                },
                model,
                generateText,
              );
              updateProgressStep('analyze', { status: 'done', detail: `${results.length} results` });
            } catch (reportError: any) {
              const reportMessage =
                reportError?.message || 'Failed to analyze auto-run results';
              updateProgressStep('analyze', { status: 'error', detail: reportMessage });
              setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${reportMessage}` }]);
              void updateMemoryFromExchange({
                user: autoReportMessage.content,
                assistant: `Error: ${reportMessage}`,
                tools: [],
              });
            }
          } else {
            updateProgressStep('analyze', { status: 'skipped', detail: 'No results' });
          }
        }
      } else {
        const autoRunDetail =
          !onApplyAndSend
            ? 'Runner unavailable'
            : mode !== 'agent'
              ? 'Agent mode only'
              : autoRunAgent
                ? 'Auto-run not requested'
                : 'Auto-run disabled';
        updateProgressStep('auto-run', {
          status: 'skipped',
          detail: autoRunDetail,
        });
        updateProgressStep('analyze', { status: 'skipped', detail: 'Auto-run skipped' });
      }
    } catch (error: any) {
      console.error('AI Error:', error);
      let errorMessage = error.message || 'Failed to get response from AI';
      
      if (error.cause) {
         errorMessage += ` (Cause: ${error.cause})`;
      }
      
      updateProgressStep('request', { status: 'error', detail: errorMessage });
      updateProgressStep('response', { status: 'skipped' });
      updateProgressStep('parse', { status: 'skipped' });
      updateProgressStep('auto-run', { status: 'skipped' });
      updateProgressStep('analyze', { status: 'skipped' });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${errorMessage}` 
      }]);
      void updateMemoryFromExchange({
        user: promptValue,
        assistant: `Error: ${errorMessage}`,
        tools: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportChat = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      messages: messages,
      context: activeContext,
      extractorContext: extractorContextItems,
      memory: memoryStore,
      settings: {
        provider: settings.provider,
        model: settings.model
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `minirep-chat-export-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const clearChat = () => {
    if (confirm('Clear chat history?')) {
      setMessages([]);
      setMemoryStore(buildEmptyMemoryStore());
      memoryStoreRef.current = buildEmptyMemoryStore();
      localStorage.removeItem(MEMORY_STORAGE_KEY);
      localStorage.removeItem(MEMORY_STORE_KEY);
    }
  };

  const togglePinRequest = (req: NetworkEntry) => {
    if (pinnedRequests.find(r => r.id === req.id)) {
      setPinnedRequests(prev => prev.filter(r => r.id !== req.id));
    } else {
      setPinnedRequests(prev => [...prev, req]);
    }
  };

  const handleAnalysis = () => {
    const hasResponse = activeContext.some(r => r.responseBody);
    handleSend(ATTACK_ANALYSIS_PROMPT(hasResponse), SYSTEM_PROMPT);
  };

  const handleExplanation = () => {
    handleSend(EXPLAIN_REQUEST_PROMPT, SYSTEM_PROMPT);
  };

  const handleGenerateAttack = () => {
    handleSend(GENERATE_ATTACK_PROMPT, SYSTEM_PROMPT);
  };

  const handleAgentAudit = () => {
    handleSend(AGENT_AUDIT_PROMPT, AGENT_SYSTEM_PROMPT, { autoRun: true });
  };

  const handleChecklistRun = (item: ChecklistItem) => {
    if (isLoading) return;
    setLastChecklistId(item.id);
    handleSend(buildChecklistPrompt(item));
  };

  // If not open and not in card mode (which usually implies always rendered but hidden by parent), null.
  // But if parent handles visibility, we might just render.
    if (!isOpen && !isCardMode) return null;

  return (
    <div className="ai-minireper-panel">
      {/* Toolbar */}
      <div className="ai-toolbar" style={{display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid var(--panel-border)'}}>
           <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
             <span style={{fontWeight: 600, fontSize: '12px'}}>AI MiniRep</span>
             <span className="context-count" title="Tokens">{tokenCount} toks</span>
             <div className="ai-mode-controls">
               <select
                 className="ai-mode-select"
                 value={mode}
                 onChange={(event) => setMode(event.target.value as AIMode)}
                 title="Mode"
               >
                 <option value="ask">Ask</option>
                 <option value="agent">Agent</option>
               </select>
               {mode === 'agent' && onApplyAndSend && (
                 <label className="ai-auto-run" title={`Auto-run up to ${MAX_AGENT_AUTORUN} tests after Agent Audit and analyze results`}>
                   <input
                     type="checkbox"
                     checked={autoRunAgent}
                     onChange={(event) => setAutoRunAgent(event.target.checked)}
                   />
                   Auto-run
                 </label>
               )}
             </div>
           </div>
           
           <div style={{display: 'flex', gap: '4px'}}>
             <button className="icon-btn" onClick={handleExportChat} title="Export Chat">
                <Download size={16} />
             </button>
             <button className="icon-btn" onClick={() => setShowSettings(!showSettings)} title="Settings">
                <Settings size={16} />
             </button>
             <button className="icon-btn" onClick={clearChat} title="Clear Memory">
                <Trash2 size={16} />
             </button>
           </div>
      </div>

      {showSettings ? (
        <div className="ai-settings">
          <h3>Provider Settings</h3>
          <div className="settings-group">
            <label>Provider</label>
            <select 
              value={settings.provider} 
              onChange={(e) => {
                const newProvider = e.target.value as any;
                onUpdateSettings({
                  ...settings, 
                  provider: newProvider,
                  model: PROVIDER_MODELS[newProvider][0]
                });
              }}
            >
              <option value="openai">OpenAI</option>
              <option value="google">Google (Gemini)</option>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="grok">Grok (xAI)</option>
              <option value="deepseek">DeepSeek</option>
              <option value="perplexity">Perplexity</option>
            </select>
          </div>
          <div className="settings-group">
            <label>API Key</label>
            <input 
              type="password" 
              value={settings.apiKey} 
              onChange={(e) => onUpdateSettings({...settings, apiKey: e.target.value})}
              placeholder="Enter your API key"
            />
          </div>
          <div className="settings-group">
            <label>Model</label>
            <select 
              value={settings.model} 
              onChange={(e) => onUpdateSettings({...settings, model: e.target.value})}
            >
              {PROVIDER_MODELS[settings.provider]?.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
          { (settings.provider === 'openai') && (
              <div className="settings-group">
              <label>Base URL (Optional)</label>
              <input 
                type="text" 
                value={settings.baseUrl || ''} 
                onChange={(e) => onUpdateSettings({...settings, baseUrl: e.target.value})}
                placeholder="https://api.openai.com/v1"
              />
            </div>
          )}
          <button className="btn primary w-full" onClick={() => setShowSettings(false)}>Save & Close</button>
        </div>
      ) : (
        <>
          {/* Active Context Panel */}
          {(activeContext.length > 0 || extractorContextItems.length > 0) && (
            <div className="context-panel">
              <div className="context-header">
                <span>Active Context</span>
                <span className="context-meta">
                  {activeContext.length} req / {extractorContextItems.length} findings
                </span>
              </div>
              {activeContext.length > 0 && (
                <div className="pinned-list">
                  {activeContext.map(req => {
                     const isPinned = pinnedRequests.find(r => r.id === req.id);
                     const isSelected = selectedRequests && selectedRequests.length > 0 
                        ? selectedRequests.some(r => r.id === req.id)
                        : selectedRequest?.id === req.id;
                     
                     // Logic: Show if it's in the active context (which is Pinned + Selected)
                     // But activeContext ALREADY filters to this. 
                     // The check `!isPinned && !isSelected` below was redundant/buggy if we use activeContext.
                     // Actually activeContext is Computed. So we can just render all activeContext items.

                     return (
                      <div key={req.id} className="pinned-item">
                        <div style={{display: 'flex', alignItems: 'center', overflow: 'hidden'}}>
                           <span className="method" style={{color: isSelected ? 'var(--accent)' : 'inherit'}}>
                              {req.method}
                           </span>
                           <span title={req.url}>{req.url}</span>
                        </div>
                        <div style={{display: 'flex', alignItems: 'center'}}>
                          {isPinned ? (
                            <button className="pinned-item-remove" onClick={() => togglePinRequest(req)} title="Unpin">
                              <X size={12} />
                            </button>
                          ) : (
                            <button className="pinned-item-remove" onClick={() => togglePinRequest(req)} title="Pin to Keep in Context">
                              <Pin size={12} style={{transform: 'rotate(45deg)'}} />
                            </button>
                          )}
                        </div>
                      </div>
                     );
                  })}
                </div>
              )}
              {extractorContextItems.length > 0 && (
                <>
                  <div className="context-subheader">
                    <button
                      type="button"
                      className="context-toggle"
                      onClick={() => setIsExtractorContextOpen((prev) => !prev)}
                      title={
                        isExtractorContextOpen
                          ? 'Collapse extractor findings'
                          : 'Expand extractor findings'
                      }
                      aria-expanded={isExtractorContextOpen}
                    >
                      <span className="context-caret">
                        {isExtractorContextOpen ? 'v' : '>'}
                      </span>
                      <span>Extractor Findings ({extractorContextItems.length})</span>
                    </button>
                    <div className="context-subheader-actions">
                      {onClearExtractorContextItems && (
                        <button
                          type="button"
                          className="context-clear"
                          onClick={onClearExtractorContextItems}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  {isExtractorContextOpen && (
                    <div className="pinned-list context-extractor-list">
                      {extractorContextItems.map((item) => (
                        <div key={item.id} className="pinned-item context-item">
                          <div className="context-item-text">
                            <span className="context-item-title" title={item.title}>
                              {item.title}
                            </span>
                            <span className="context-item-meta">{item.tab}</span>
                          </div>
                          {onRemoveExtractorContextItem && (
                            <button
                              type="button"
                              className="pinned-item-remove"
                              onClick={() => onRemoveExtractorContextItem(item.id)}
                              title="Remove from context"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {onAddExtractorContextItems && (
            <div className="extractor-picker">
              <button
                type="button"
                className={`extractor-picker-trigger${isExtractorPickerOpen ? ' is-open' : ''}`}
                onClick={() => setIsExtractorPickerOpen((prev) => !prev)}
                disabled={extractorCatalog.length === 0}
                title={
                  extractorCatalog.length === 0
                    ? 'Run Extractor scan to populate findings'
                    : 'Select findings to add to AI context'
                }
              >
                Extractor findings ({extractorCatalog.length})
              </button>
              {isExtractorPickerOpen && (
                <div className="extractor-picker-panel">
                  <div className="extractor-picker-actions">
                    <span>{selectedCatalogIds.length} selected</span>
                    <div className="extractor-picker-buttons">
                      <button
                        type="button"
                        className="extractor-picker-add"
                        onClick={handleAddSelectedCatalog}
                        disabled={selectedCatalogIds.length === 0}
                      >
                        Add to context
                      </button>
                      <button
                        type="button"
                        className="extractor-picker-clear"
                        onClick={clearCatalogSelection}
                        disabled={selectedCatalogIds.length === 0}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  {extractorTabs.length === 0 ? (
                    <div className="extractor-picker-empty">
                      Run Extractor scan to populate findings.
                    </div>
                  ) : (
                    <div className="extractor-picker-list">
                      {extractorTabs.map((tab) => (
                        <div key={tab} className="extractor-picker-group">
                          <TabSelectHeader
                            label={tab}
                            total={extractorCatalogByTab[tab]?.length || 0}
                            selected={
                              extractorCatalogByTab[tab]?.filter((item) =>
                                selectedCatalogIds.includes(item.id),
                              ).length || 0
                            }
                            onToggle={(checked) => toggleCatalogTab(tab, checked)}
                          />
                          <div className="extractor-picker-items">
                            {extractorCatalogByTab[tab]?.map((item) => (
                              <label key={item.id} className="extractor-picker-item">
                                <input
                                  type="checkbox"
                                  checked={selectedCatalogIds.includes(item.id)}
                                  onChange={() => toggleCatalogSelection(item.id)}
                                />
                                <span className="extractor-picker-label">{item.title}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="ai-checklist">
            <div className="ai-checklist-header">
              <button
                type="button"
                className="ai-checklist-toggle"
                onClick={() => setIsChecklistOpen((prev) => !prev)}
                title={isChecklistOpen ? 'Collapse checklist' : 'Expand checklist'}
              >
                <span className="ai-checklist-caret">{isChecklistOpen ? 'v' : '>'}</span>
                <span>Checklist (feasible)</span>
              </button>
              <span className="ai-checklist-meta">{CHECKLIST_ITEMS.length} items</span>
            </div>
            {isChecklistOpen && (
              <div className="ai-checklist-body">
                <div className="ai-checklist-note">
                  Uses captured traffic and safe probes only. No external scanners.
                </div>
                {CHECKLIST_SECTIONS.map((section) => {
                  const items = checklistBySection[section.id];
                  if (items.length === 0) return null;
                  return (
                    <div key={section.id} className="ai-checklist-section">
                      <div className="ai-checklist-section-header">
                        <span>{section.label}</span>
                        <span className="ai-checklist-section-note">{section.note}</span>
                      </div>
                      <div className="ai-checklist-items">
                        {items.map((item) => {
                          const isActive = lastChecklistId === item.id;
                          const runLabel = isLoading && isActive ? 'Running...' : 'Run';
                          return (
                            <div
                              key={item.id}
                              className={`ai-checklist-item${isActive ? ' is-active' : ''}`}
                            >
                              <div className="ai-checklist-item-text">
                                <div className="ai-checklist-item-title">{item.label}</div>
                                <div className="ai-checklist-item-desc">{item.description}</div>
                              </div>
                              <button
                                type="button"
                                className="btn slim ai-checklist-run"
                                onClick={() => handleChecklistRun(item)}
                                disabled={isLoading}
                              >
                                {runLabel}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {progressSteps.length > 0 && (
            <div className={`ai-progress ${isProgressOpen ? 'is-open' : 'is-collapsed'}`}>
              <div className="ai-progress-header">
                <button
                  type="button"
                  className="ai-progress-toggle"
                  onClick={() => setIsProgressOpen((prev) => !prev)}
                  title={isProgressOpen ? 'Collapse progress' : 'Expand progress'}
                >
                  <span className="ai-progress-caret">{isProgressOpen ? 'v' : '>'}</span>
                  <span>Run Progress</span>
                </button>
                <span className="ai-progress-summary">{progressSummary}</span>
              </div>
              {isProgressOpen && (
                <>
                  <div className="ai-progress-note">Status only, no chain-of-thought</div>
                  <div className="ai-progress-steps">
                    {progressSteps.map((step) => (
                      <div key={step.id} className={`ai-progress-step is-${step.status}`}>
                        <span className="ai-progress-label">{step.label}</span>
                        {step.detail && <span className="ai-progress-detail">{step.detail}</span>}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="ai-chat-container">
            <div className="ai-messages">
              {messages.length === 0 && (
                <div className="ai-welcome">
                  <Bot size={48} className="welcome-icon" />
                  <h2>{mode === 'agent' ? 'Adversarial Agent' : 'AI Security Assistant'}</h2>
                  <p>
                    I have context of {activeContext.length} request{activeContext.length !== 1 ? 's' : ''}.{' '}
                    {mode === 'agent'
                      ? 'Agent mode runs bounded adversarial audits and reports risk score, coverage, and confidence with explicit gaps.'
                      : 'I can analyze them for vulnerabilities, suggest attacks, or explain complex flows.'}
                  </p>
                  <div className="ai-suggestions">
                    {mode === 'agent' ? (
                      <>
                        <button onClick={handleAgentAudit}>
                          🧪 Run Agent Audit
                        </button>
                        <button onClick={handleGenerateAttack}>
                          ⚔️ Generate Test Variants
                        </button>
                        <button onClick={handleExplanation}>
                          💡 Explain Request
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={handleAnalysis}>
                          🔍 Analyze for Vulnerabilities
                        </button>
                        <button onClick={handleGenerateAttack}>
                          ⚔️ Suggest Attack Vectors
                        </button>
                        <button onClick={handleExplanation}>
                          💡 Explain Request
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`ai-message ${m.role}`}>
                  <div className="message-avatar">
                    {m.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                  </div>
                  <div className="message-content" style={{whiteSpace: 'pre-wrap'}}>
                    {renderMessageContent(m.content)}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="ai-message assistant">
                  <div className="message-avatar">
                    <Bot size={16} />
                  </div>
                  <div className="message-content loading">
                    <Loader2 size={16} className="spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}

            </div>

            <div className="ai-footer">
              <div className="ai-input-wrapper">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={mode === 'agent' ? 'Describe what to validate or run an audit...' : 'Ask about these requests...'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button 
                  className="send-btn" 
                  onClick={() => handleSend()}
                  disabled={isLoading || (!input.trim() && activeContext.length === 0)}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

import { NetworkEntry } from '../../types';

// Configuration
const SUPABASE_ENUM_ENABLED = true;
const SUPABASE_ENUM_ALLOW_ANON = true;
const SUPABASE_ENUM_MAX_KEYS = 5;
const SUPABASE_ENUM_MAX_URLS = 5;
const SUPABASE_ENUM_MAX_TABLES = 10;
const SUPABASE_ENUM_MAX_ROWS = 100;
const SUPABASE_ENUM_PAGE_SIZE = 100;
const SUPABASE_ENUM_TIMEOUT = 10000; // 10s

// Regex Constants
const JWT_REGEX = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;
// Supabase cloud regex
const SUPABASE_CLOUD_REGEX = /https:\/\/[a-z0-9-]+\.supabase\.co/g;
// Env var patterns
const SUPABASE_ENV_VAR_PATTERNS = [
  /(?:NEXT_PUBLIC_|VITE_|REACT_APP_|PUBLIC_)?SUPABASE[_-]?URL["']?\s*[:=]\s*["']?(https:\/\/[^"'\s,}]+)/gi,
  /(?:["']?)(?:supabaseUrl|supabase_url|supabaseURL)(?:["']?\s*[:=]\s*["']?)(https:\/\/[^"'\s,}]+)/gi,
];

const SENSITIVE_FIELD_PATTERNS = [
    "\\bemail\\b",
    "\\bpassword\\b", "\\bpasswd\\b", "\\bpwd\\b", "\\bpass\\b", "\\bpassphrase\\b",
    "\\bapi[_-]?key\\b", "\\bapikey\\b", "\\bauth[_-]?key\\b", "\\bapplication[_-]?key\\b",
    "\\bsecret\\b", "\\bprivate[_-]?key\\b", "\\bsecret[_-]?key\\b", "\\bshared[_-]?secret\\b",
    "\\btoken\\b", "\\bjwt\\b", "\\baccess[_-]?token\\b", "\\brefresh[_-]?token\\b",
    "\\boauth[_-]?token\\b", "\\bsession[_-]?token\\b", "\\bbearer[_-]?token\\b",
    "\\bauth\\b", "\\bauth[_-]?code\\b", "\\bauthorization[_-]?code\\b",
    "\\bsession[_-]?id\\b", "\\bsession[_-]?key\\b", "\\bsession[_-]?secret\\b",
    "\\brecovery[_-]?code\\b", "\\bbackup[_-]?code\\b", "\\bverification[_-]?code\\b",
    "\\botp\\b", "\\btwo[_-]?factor\\b", "\\b2fa[_-]?secret\\b", "\\b2fa[_-]?code\\b",
    "\\bphone\\b", "\\bphone[_-]?number\\b", "\\bmobile\\b", "\\btelephone\\b",
    "\\bssn\\b", "\\bsocial[_-]?security\\b", "\\bsocial[_-]?security[_-]?number\\b",
    "\\bdriver[_-]?license\\b", "\\bdrivers[_-]?license\\b", "\\blicense[_-]?number\\b",
    "\\bpassport[_-]?number\\b", "\\bpassport[_-]?id\\b",
    "\\bnational[_-]?id\\b", "\\bnational[_-]?identifier\\b", "\\btax[_-]?id\\b",
    "\\buser[_-]?id\\b", "\\baccount[_-]?id\\b", "\\bcustomer[_-]?id\\b",
    "\\bemployee[_-]?id\\b", "\\bstaff[_-]?id\\b",
    "\\bcredit[_-]?card\\b", "\\bcard[_-]?number\\b", "\\bcvv\\b", "\\bcvc\\b", "\\bcvn\\b",
    "\\bexpiry[_-]?date\\b", "\\bexpiration[_-]?date\\b", "\\bexp[_-]?date\\b",
    "\\bbank[_-]?account\\b", "\\baccount[_-]?number\\b", "\\brouting[_-]?number\\b",
    "\\biban\\b", "\\bswift[_-]?code\\b", "\\bbic\\b",
    "\\bpayment[_-]?method\\b", "\\bpayment[_-]?info\\b", "\\bpayment[_-]?details\\b",
    "\\bsalary\\b", "\\bincome\\b", "\\bwage\\b", "\\bpayroll\\b",
    "\\baddress\\b", "\\bstreet\\b", "\\bzip\\b", "\\bpostal[_-]?code\\b", "\\bpostcode\\b",
    "\\bhome[_-]?address\\b", "\\bwork[_-]?address\\b", "\\bbilling[_-]?address\\b",
    "\\bip[_-]?address\\b", "\\bipv4\\b", "\\bipv6\\b",
    "\\blocation\\b", "\\bcoordinates\\b", "\\bgps[_-]?coordinates\\b", "\\blat\\b", "\\blong\\b", "\\blatitude\\b", "\\blongitude\\b",
    "\\bbirth[_-]?date\\b", "\\bdob\\b", "\\bdate[_-]?of[_-]?birth\\b",
    "\\bgender\\b", "\\brace\\b", "\\bethnicity\\b",
    "\\bmarital[_-]?status\\b",
    "\\bhealth[_-]?record\\b", "\\bmedical[_-]?record\\b", "\\bpatient[_-]?id\\b",
    "\\binsurance[_-]?number\\b", "\\bhealth[_-]?insurance\\b", "\\bmedical[_-]?insurance\\b",
    "\\bdiagnosis\\b", "\\btreatment\\b",
    "\\bdevice[_-]?id\\b", "\\bdevice[_-]?identifier\\b", "\\bdevice[_-]?uuid\\b",
    "\\bmac[_-]?address\\b", "\\bmacaddr\\b",
    "\\bimei\\b", "\\bserial[_-]?number\\b",
    "\\bhardware[_-]?id\\b",
    "\\bprivate[_-]?key\\b", "\\bpublic[_-]?key\\b", "\\bcertificate\\b",
    "\\bpgp[_-]?key\\b", "\\bgpg[_-]?key\\b", "\\bssh[_-]?key\\b",
    "\\blicense[_-]?key\\b", "\\bsubscription[_-]?key\\b", "\\bactivation[_-]?key\\b",
    "\\bfingerprint\\b", "\\bbiometric\\b", "\\bfacial[_-]?recognition\\b",
    "\\bcase[_-]?number\\b", "\\blegal[_-]?document\\b",
    "\\binternal[_-]?note\\b", "\\badmin[_-]?note\\b", "\\bconfidential\\b",
];

const NON_SENSITIVE_FIELDS = [
    "\\bcreated[_-]?at\\b", "\\bupdated[_-]?at\\b", "\\bdeleted[_-]?at\\b",
    "^id$",
    "\\bdescription\\b", "\\btitle\\b", "\\bname\\b", "\\bcontent\\b",
    "\\bcreator\\b", "\\bauthor\\b", "\\blinks?\\b", "\\burl\\b",
    "\\bimage\\b", "\\bavatar\\b", "\\bsearch[_-]?vector\\b", "\\bvector\\b",
    "\\bauthor[_-]?links\\b", "\\bexample[_-]?emails\\b",
];

const SENSITIVE_FIELD_REGEXES = SENSITIVE_FIELD_PATTERNS.map(pat => new RegExp(pat, 'i'));
const NON_SENSITIVE_FIELD_REGEXES = NON_SENSITIVE_FIELDS.map(pat => new RegExp(pat, 'i'));
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}/;
const CREDIT_CARD_REGEX = /\b(?:\d{4}[-\s]?){3}\d{4}\b/;

export interface SupabaseAuditResult {
    status: 'ok' | 'skipped' | 'error';
    reason?: string;
    targets?: Array<{
        supabase_url: string;
        token_role: string;
        token: string;
        status: 'ok' | 'error';
        http_status?: number;
        error_message?: string;
        tables?: Array<{
            table: string;
            rows?: number;
            dumped: boolean;
            status?: number;
            vulnerable: boolean;
            vulnerability_level?: string;
            sensitive_fields?: string[];
            analysis?: any;
        }>;
    }>;
    summary?: {
        total_tables_accessible: number;
        vulnerable_tables_count: number;
        critical_count: number;
        high_count: number;
        medium_count: number;
        vulnerable_tables: Array<{
            table: string;
            level: string;
            sensitive_fields: string[];
        }>;
    };
}

function extractSupabaseUrls(content: string): Set<string> {
    const urls = new Set<string>();
    if (!content) return urls;

    const cloudMatches = content.match(SUPABASE_CLOUD_REGEX);
    if (cloudMatches) {
        cloudMatches.forEach(url => urls.add(url));
    }

    for (const pattern of SUPABASE_ENV_VAR_PATTERNS) {
        let match;
        // Reset lastIndex because patterns identify global matches
        const regex = new RegExp(pattern);
        while ((match = regex.exec(content)) !== null) {
             let url = match[1] || match[0];
             url = url.replace(/["',)}\]]+$/, "").replace(/\/$/, "");
             if (url.startsWith("https://")) {
                 urls.add(url);
             }
        }
    }

    const supabaseKeywordPattern = /(?:supabase|SUPABASE)["'\s:=]+(https:\/\/[^"'\s,}]+)/gi;
    let match;
    while ((match = supabaseKeywordPattern.exec(content)) !== null) {
        let url = match[1].replace(/["',)}\]]+$/, "").replace(/\/$/, "");
        if (url.startsWith("https://")) {
            urls.add(url);
        }
    }
    return urls;
}

function extractJwtTokens(content: string): Set<string> {
    if (!content) return new Set();
    const matches = content.match(JWT_REGEX);
    return new Set(matches || []);
}

function base64UrlDecode(str: string): string {
    // Replace non-url compatible chars
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    // Pad with =
    while (base64.length % 4) {
        base64 += '=';
    }
    return atob(base64);
}

function decodeJwtRole(token: string): string {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return "";
        const payload = JSON.parse(base64UrlDecode(parts[1]));
        return payload.role || "";
    } catch {
        return "";
    }
}

function isNonSensitiveField(fieldName: string): boolean {
    const fieldLower = fieldName.toLowerCase();
    return NON_SENSITIVE_FIELD_REGEXES.some(regex => regex.test(fieldLower));
}

function isSensitiveFieldName(fieldName: string): boolean {
    if (isNonSensitiveField(fieldName)) return false;
    const fieldLower = fieldName.toLowerCase();
    return SENSITIVE_FIELD_REGEXES.some(regex => regex.test(fieldLower));
}

function analyzeTableForSensitiveData(rows: any[], maxSamples: number = 100): any {
    if (!rows || rows.length === 0) {
        return {
            sensitive_fields: [],
            vulnerability_level: "none",
            has_sensitive_data: false,
            details: {},
        };
    }

    const sampleRows = rows.slice(0, Math.min(rows.length, maxSamples));
    if (!sampleRows.length || typeof sampleRows[0] !== 'object') {
        return {
            sensitive_fields: [],
            vulnerability_level: "unknown",
            has_sensitive_data: false,
            details: {},
        };
    }

    const allFields = Object.keys(sampleRows[0]);
    const sensitiveFields: string[] = [];
    const fieldAnalysis: any = {};

    for (const field of allFields) {
        if (isNonSensitiveField(field)) continue;

        const fieldLower = field.toLowerCase();
        let isSensitive = false;
        const detectionReasons: string[] = [];

        if (isSensitiveFieldName(field)) {
            isSensitive = true;
            detectionReasons.push("field_name");
        }

        const nonNullValues = sampleRows
            .map(r => r[field])
            .filter(v => v !== null && v !== undefined)
            .slice(0, 10);

        for (const value of nonNullValues) {
            if (typeof value !== 'string' && typeof value !== 'number') continue;
            const valueStr = String(value);

            if (EMAIL_REGEX.test(valueStr) && fieldLower.includes("email")) {
                if (!detectionReasons.includes("email_pattern")) {
                    detectionReasons.push("email_pattern");
                    isSensitive = true;
                }
            }

            if (PHONE_REGEX.test(valueStr)) {
                const digits = valueStr.replace(/[^\d]/g, "");
                if (digits.length >= 10 && (fieldLower.includes("phone") || fieldLower.includes("mobile"))) {
                    if (!detectionReasons.includes("phone_pattern")) {
                        detectionReasons.push("phone_pattern");
                        isSensitive = true;
                    }
                }
            }
            // Simple check for JWT like string
            if (/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(valueStr)) {
                if (!detectionReasons.includes("jwt_pattern")) {
                    detectionReasons.push("jwt_pattern");
                    isSensitive = true;
                }
            }

            if (CREDIT_CARD_REGEX.test(valueStr)) {
                if (!detectionReasons.includes("credit_card_pattern")) {
                    detectionReasons.push("credit_card_pattern");
                    isSensitive = true;
                }
            }
        }

        if (isSensitive) {
            sensitiveFields.push(field);
            fieldAnalysis[field] = {
                reasons: detectionReasons,
                sample_count: nonNullValues.length,
            };
        }
    }

    let vulnerability_level = "none";
    if (sensitiveFields.length > 0) {
        const highSeverityPatterns = [
             /password/i, /passwd/i, /pwd/i, /secret/i, /api[_-]?key/i,
             /token/i, /jwt/i, /credit[_-]?card/i, /ssn/i,
        ];
        const hasHighSeverity = sensitiveFields.some(field => 
            highSeverityPatterns.some(p => p.test(field))
        );

        if (hasHighSeverity) {
            vulnerability_level = "critical";
        } else if (Object.values(fieldAnalysis).some((fa: any) => 
            fa.reasons.some((r: string) => r.includes("email") || r.includes("phone"))
        )) {
            vulnerability_level = "high";
        } else {
            vulnerability_level = "medium";
        }
    }

    return {
        sensitive_fields: sensitiveFields,
        vulnerability_level,
        has_sensitive_data: sensitiveFields.length > 0,
        details: fieldAnalysis,
    };
}

async function supabaseGetTables(baseUrl: string, headers: Record<string, string>): Promise<{tables: string[] | null, status: number, error_message?: string}> {
    const url = `${baseUrl}/rest/v1/`;
    try {
        const ctrl = new AbortController();
        const id = setTimeout(() => ctrl.abort(), SUPABASE_ENUM_TIMEOUT);
        const resp = await fetch(url, { 
            headers: { 
                ...headers, 
                "Accept": "application/openapi+json, application/json"
            }, 
            signal: ctrl.signal 
        });
        clearTimeout(id);

        if (!resp.ok) return { tables: null, status: resp.status, error_message: `http_${resp.status}` };
        const bodyText = await resp.text();
        let data: any;
        try {
            data = JSON.parse(bodyText);
        } catch {
            return { tables: null, status: resp.status, error_message: "invalid_json" };
        }
        // Supabase OpenAPI-like discovery
        const paths = data.paths || {};
        const tables = Object.keys(paths)
            .map(p => p.replace(/^\/+|\/+$/g, ''))
            .filter(p => !p.startsWith("rpc") && p !== "");
        return { tables, status: 200 };
    } catch (e) {
        console.warn(`Supabase table fetch failed for ${baseUrl}:`, e);
        const message = e instanceof Error ? e.message : String(e);
        return { tables: null, status: -1, error_message: message };
    }
}

async function supabaseDumpTable(baseUrl: string, table: string, headers: Record<string, string>): Promise<{rows: any[] | null, status: number}> {
    const allRows: any[] = [];
    let offset = 0;

    // Limit to one page for safety in browser, or loop a few times
    // Python script loops until MAX_ROWS
    while (true) {
        const url = `${baseUrl}/rest/v1/${table}?limit=${SUPABASE_ENUM_PAGE_SIZE}&offset=${offset}`;
        try {
            const ctrl = new AbortController();
            const id = setTimeout(() => ctrl.abort(), SUPABASE_ENUM_TIMEOUT);
            const resp = await fetch(url, { headers, signal: ctrl.signal });
            clearTimeout(id);

            if (!resp.ok) return { rows: null, status: resp.status };
            const chunk = await resp.json();
            if (Array.isArray(chunk)) {
                allRows.push(...chunk);
            }
            
            if (chunk.length < SUPABASE_ENUM_PAGE_SIZE || allRows.length >= SUPABASE_ENUM_MAX_ROWS) {
                break;
            }
            offset += SUPABASE_ENUM_PAGE_SIZE;
        } catch (e) {
             console.warn(`Supabase dump failed for ${baseUrl}/${table}:`, e);
             return { rows: null, status: -1 };
        }
    }
    return { rows: allRows.slice(0, SUPABASE_ENUM_MAX_ROWS), status: 200 };
}


export async function scanForSupabase(entries: NetworkEntry[]): Promise<SupabaseAuditResult> {
    if (!SUPABASE_ENUM_ENABLED) {
        return { status: "skipped", reason: "Supabase enum disabled" };
    }

    const supabaseUrls = new Set<string>();
    const supabaseTokens = new Map<string, string>(); // token -> role

    // 1. Scan entries for info
    for (const entry of entries) {
        // Collect text to scan: URL, Headers, Body
        const textsToScan: string[] = [];
        textsToScan.push(entry.url);
        textsToScan.push(entry.responseBody || "");
        
        if (entry.requestHeaders) {
            entry.requestHeaders.forEach(h => {
                textsToScan.push(h.key);
                textsToScan.push(h.value);
            });
        }
        if (entry.responseHeaders) {
            entry.responseHeaders.forEach(h => {
                textsToScan.push(h.key);
                textsToScan.push(h.value);
            });
        }

        for (const content of textsToScan) {
             if (!content) continue;
             const urls = extractSupabaseUrls(content);
             urls.forEach(u => supabaseUrls.add(u));

             const tokens = extractJwtTokens(content);
             tokens.forEach(t => {
                 const role = decodeJwtRole(t);
                 if (role === "anon" || role === "service_role") {
                     supabaseTokens.set(t, role);
                 }
             });
        }
    }

    if (supabaseUrls.size === 0) {
        console.log("Supabase Scan: No URLs found.");
        return { status: "skipped", reason: "No Supabase URL detected" };
    }
    if (supabaseTokens.size === 0) {
        console.log("Supabase Scan: No tokens found. URLs found:", Array.from(supabaseUrls));
        return { status: "skipped", reason: "No Supabase JWT detected" };
    }

    console.log("Supabase Scan: Found", supabaseUrls.size, "URLs and", supabaseTokens.size, "tokens.");


    const sortedTokens = Array.from(supabaseTokens.entries())
        .sort((a, b) => (a[1] === "service_role" ? -1 : 1));
    
    let validTokens = sortedTokens;
    if (!SUPABASE_ENUM_ALLOW_ANON) {
        validTokens = sortedTokens.filter(t => t[1] === "service_role");
    }
    validTokens = validTokens.slice(0, SUPABASE_ENUM_MAX_KEYS);

    if (validTokens.length === 0) return { status: "skipped", reason: "No allowed Supabase tokens" };
    
    const targets: any[] = [];
    const summaryTables: any[] = [];
    
    // 2. perform audit
    const urlsToScan = Array.from(supabaseUrls).slice(0, SUPABASE_ENUM_MAX_URLS);


    for (const baseUrl of urlsToScan) {
        const cleanBaseUrl = baseUrl.replace(/\/$/, "");
        
        for (const [token, role] of validTokens) {
             const masked = token;
             // Headers for supabase
             const headers = { 
                 "apikey": token, 
                 "Authorization": `Bearer ${token}`,
                 "Content-Type": "application/json"
             };

             // Try to fetch tables
             let { tables, status, error_message } = await supabaseGetTables(cleanBaseUrl, headers);

             // If "tables" are missing, it might be that listing is forbidden but individual tables work.
             // We can't easily guess tables, but if we have any known tables (maybe from other sources?) we could try.
             // For now, if table listing fails, we report error.
             
             if (status !== 200 || !tables) {
                 targets.push({
                     supabase_url: cleanBaseUrl,
                     token_role: role,
                     token: masked,
                     status: "error",
                     http_status: status,
                     error_message
                 });
                 continue;
             }
             
             const limitedTables = tables.slice(0, SUPABASE_ENUM_MAX_TABLES);
             const tableSummaries: any[] = [];

             for (const table of limitedTables) {
                 const dumpRes = await supabaseDumpTable(cleanBaseUrl, table, headers);
                 if (dumpRes.status !== 200 || !dumpRes.rows) {
                     tableSummaries.push({
                         table,
                         dumped: false,
                         status: dumpRes.status,
                         vulnerable: false
                     });
                     continue;
                 }
                 
                 const analysis = analyzeTableForSensitiveData(dumpRes.rows);
                 const summary = {
                     table,
                     rows: dumpRes.rows.length,
                     dumped: true,
                     vulnerable: analysis.has_sensitive_data,
                     vulnerability_level: analysis.vulnerability_level,
                     sensitive_fields: analysis.sensitive_fields,
                     analysis
                 };
                 tableSummaries.push(summary);
                 summaryTables.push(summary);
             }

             targets.push({
                 supabase_url: cleanBaseUrl,
                 token_role: role,
                 token: masked,
                 status: "ok",
                 tables: tableSummaries
             });
        }
    }

    const vulnerableTables = summaryTables.filter(t => t.vulnerable);
    
    return {
        status: "ok",
        targets: targets,
        summary: {
            total_tables_accessible: summaryTables.filter(t => t.dumped).length,
            vulnerable_tables_count: vulnerableTables.length,
            critical_count: vulnerableTables.filter(t => t.vulnerability_level === "critical").length,
            high_count: vulnerableTables.filter(t => t.vulnerability_level === "high").length,
            medium_count: vulnerableTables.filter(t => t.vulnerability_level === "medium").length,
            vulnerable_tables: vulnerableTables.map(t => ({
                table: t.table,
                level: t.vulnerability_level,
                sensitive_fields: t.sensitive_fields
            }))
        }
    };
}

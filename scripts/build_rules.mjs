import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Going up from scripts/ to root
const RULES_DIR = path.join(__dirname, '../rules');
const OUTPUT_FILE = path.join(__dirname, '../entrypoints/panel/utils/scanners/generated_rules.ts');

console.log(`Reading rules from ${RULES_DIR}`);

if (!fs.existsSync(RULES_DIR)) {
    console.error("Rules directory not found!");
    process.exit(1);
}

const files = fs.readdirSync(RULES_DIR).filter(f => f.endsWith('.yaml') && !f.startsWith('_'));

const rules = [];
const skipped = [];

function cleanPattern(pattern, modifiers) {
    if (modifiers.includes('x')) {
       let clean = '';
       let inClass = false;
       let escaped = false;
       
       for (let i = 0; i < pattern.length; i++) {
           const char = pattern[i];
           
           if (escaped) { 
               clean += char; 
               escaped = false; 
               continue; 
           }
           
           if (char === '\\') { 
               clean += char; 
               escaped = true; 
               continue; 
           }
           
           if (inClass) {
               clean += char;
               if (char === ']' && !escaped) inClass = false; // Handle escaped parenthesis inside class is rare but possible
               continue;
           }
           
           if (char === '[') { 
               inClass = true; 
               clean += char; 
               continue; 
           }
           
           if (char === '#') {
               // Comment until newline
               while (i < pattern.length && pattern[i] !== '\n') i++;
               continue;
           }
           
           // Ignore whitespace
           if (/\s/.test(char)) continue;
           
           clean += char;
       }
       return clean;
    }
    return pattern;
}

function extractInlineModifiers(pattern) {
    let modifiers = '';

    while (true) {
        const match = pattern.match(/^\(\?([a-z]+)\)/i);
        if (!match) break;
        modifiers += match[1];
        pattern = pattern.slice(match[0].length);
    }

    pattern = pattern.replace(/\(\?([a-z]+)\)/gi, (full, mods) => {
        modifiers += mods;
        return '';
    });

    return { pattern, modifiers: modifiers.toLowerCase() };
}

function buildFlags(modifiers) {
    const flags = new Set(['g']);
    if (modifiers.includes('i')) flags.add('i');
    if (modifiers.includes('m')) flags.add('m');
    if (modifiers.includes('s')) flags.add('s');
    if (modifiers.includes('u')) flags.add('u');
    return Array.from(flags).join('');
}

for (const file of files) {
    try {
        const content = fs.readFileSync(path.join(RULES_DIR, file), 'utf8');
        const doc = yaml.load(content);
        if (!doc || !doc.rules) continue;

        for (const rule of doc.rules) {
            if (!rule.pattern) continue;

            let pattern = rule.pattern;

            // Remove inline comment groups early to avoid leaving dangling "(?"
            pattern = pattern.replace(/\(\?#[^)]*\)/g, '');

            const extracted = extractInlineModifiers(pattern);
            pattern = extracted.pattern;
            let modifiers = extracted.modifiers;
            let flags = buildFlags(modifiers);
            
            // Clean pattern if 'x' present
            if (modifiers.includes('x')) {
                pattern = cleanPattern(pattern, modifiers);
            } else {
                // If not verbose, strip start/end whitespace from YAML block
                pattern = pattern.trim();
            }

            // Convert Python Named Groups (?P<name> -> (?<name>
            pattern = pattern.replace(/\(\?P</g, '(?<');

            try {
                // Test regex validity
                new RegExp(pattern, flags);
                
                // Add to list
                rules.push({
                    name: rule.name,
                    regexString: pattern,
                    flags: flags,
                    confidence: rule.confidence || 'low',
                    id: rule.id,
                    requirements: {
                        min_digits: rule.pattern_requirements?.min_digits,
                        min_lowercase: rule.pattern_requirements?.min_lowercase,
                        min_uppercase: rule.pattern_requirements?.min_uppercase,
                        min_symbols: rule.pattern_requirements?.min_symbols,
                        min_length: rule.pattern_requirements?.min_length,
                        max_length: rule.pattern_requirements?.max_length,
                        min_entropy: rule.min_entropy ?? rule.pattern_requirements?.min_entropy
                    },
                    has_checksum: Boolean(rule.pattern_requirements?.checksum)
                });
            } catch (e) {
                // console.warn(`Skipping invalid rule ${rule.id} in ${file}: ${e.message}`);
                // Many regexes might use features not supported yet or have complex escaping issues
                // We'll skip them to keep the app crashing
                skipped.push({
                    id: rule.id,
                    name: rule.name,
                    file,
                    reason: e.message
                });
            }
        }
    } catch (e) {
        console.error(`Error processing ${file}: ${e.message}`);
    }
}

const tsContent = `export interface GeneratedRuleRequirements {
  min_digits?: number;
  min_lowercase?: number;
  min_uppercase?: number;
  min_symbols?: number;
  min_length?: number;
  max_length?: number;
  min_entropy?: number;
}

export interface GeneratedRule {
  name: string;
  regex: RegExp;
  confidence: 'low' | 'medium' | 'high';
  id?: string;
  requirements?: GeneratedRuleRequirements;
  has_checksum?: boolean;
}

export const GENERATED_PATTERNS: GeneratedRule[] = [
${rules.map(r => `  {
    name: ${JSON.stringify(r.name)},
    id: ${JSON.stringify(r.id)},
    regex: new RegExp(${JSON.stringify(r.regexString)}, "${r.flags}"),
    confidence: ${JSON.stringify(r.confidence)} as any,
    requirements: ${JSON.stringify(r.requirements)},
    has_checksum: ${JSON.stringify(r.has_checksum)}
  }`).join(',\n')}
];

export const GENERATED_RULES_META = {
  totalRules: ${rules.length},
  skippedRules: ${skipped.length},
  skipped: ${JSON.stringify(skipped)}
};
`;

fs.writeFileSync(OUTPUT_FILE, tsContent);
console.log(`Generated ${rules.length} rules.`);

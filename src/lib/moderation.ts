import { db } from "@/db";
import { moderationSettings, auditLogs } from "@/db/schema";

interface ModerationRule {
  key: string;
  enabled: boolean;
  action: string;
  censorText: string;
  pattern: RegExp;
}

// Regex patterns designed to catch obfuscation attempts
// Users may try: spaces, dots, dashes, parentheses, letter substitution, etc.

// Phone patterns: (XX) XXXXX-XXXX, XX 9XXXX-XXXX, +55..., obfuscated with dots/spaces
const PHONE_PATTERN =
  /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2}\)?[\s.-]?\d{4,5}[\s.-]?\d{4}|\b(?:\d[\s.·\-()]*){8,13}\b|\b(?:fone|tel(?:efone)?|whats?(?:app)?|zap|liga|ligue|chama)\s*[:.-]?\s*(?:\d[\s.·\-()]*){8,13}/gi;

// Email patterns: standard + obfuscated (arroba, [at], etc.)
const EMAIL_PATTERN =
  /[a-zA-Z0-9._%+-]+\s*[@＠]\s*[a-zA-Z0-9.-]+\s*[.．]\s*[a-zA-Z]{2,}|[a-zA-Z0-9._%+-]+\s*(?:\[?\s*(?:at|arroba|@)\s*\]?)\s*[a-zA-Z0-9.-]+\s*(?:\[?\s*(?:dot|ponto|\.)\s*\]?)\s*[a-zA-Z]{2,}/gi;

// Address patterns: CEP, street names, common address keywords
const ADDRESS_PATTERN =
  /\b\d{5}[\s.-]?\d{3}\b|(?:rua|av(?:enida)?|alameda|travessa|rodovia|estrada|br[\s.-]?\d{2,3}|km\s*\d+)\s+[a-záàâãéèêíïóôõöúçñ\s,]+\d*/gi;

// Social media patterns: @username, platform names + handles
const SOCIAL_PATTERN =
  /(?:@|＠)[a-zA-Z0-9_.]{2,30}|(?:instagram|insta|face(?:book)?|facebook|twitter|tik\s*tok|telegram|signal|linkedin)\s*[:.\-/]?\s*@?\s*[a-zA-Z0-9_.]{2,30}|(?:instagram|insta|face(?:book)?|twitter|tik\s*tok|telegram|signal|linkedin)\.com\/[a-zA-Z0-9_.]+/gi;

// Link patterns: URLs, obfuscated URLs
const LINK_PATTERN =
  /https?:\/\/[^\s<>]+|www\.[^\s<>]+|\b[a-zA-Z0-9-]+(?:\s*\.\s*(?:com|net|org|br|io|me|app|dev|info|biz))+(?:\s*\/\s*[^\s]*)?/gi;

const RULE_MAP: Record<string, RegExp> = {
  block_phones: PHONE_PATTERN,
  block_emails: EMAIL_PATTERN,
  block_addresses: ADDRESS_PATTERN,
  block_social: SOCIAL_PATTERN,
  block_links: LINK_PATTERN,
};

export async function getModerationRules(): Promise<ModerationRule[]> {
  const settings = await db.select().from(moderationSettings);
  return settings
    .filter((s) => RULE_MAP[s.key])
    .map((s) => ({
      key: s.key,
      enabled: s.enabled === 1,
      action: s.action,
      censorText: s.censorText,
      pattern: RULE_MAP[s.key],
    }));
}

export interface ModerationResult {
  moderated: boolean;
  text: string;
  matches: Array<{
    rule: string;
    original: string;
    replacement: string;
    action: string;
  }>;
  shouldDelete: boolean;
  shouldNotify: boolean;
}

export async function moderateText(
  text: string,
  userId?: number,
  target?: string,
): Promise<ModerationResult> {
  const rules = await getModerationRules();
  let result = text;
  const matches: ModerationResult["matches"] = [];
  let shouldDelete = false;
  let shouldNotify = false;

  for (const rule of rules) {
    if (!rule.enabled) continue;

    // Reset lastIndex for global regex
    rule.pattern.lastIndex = 0;
    const found = result.match(rule.pattern);
    if (!found) continue;

    for (const match of found) {
      if (rule.action === "delete" || rule.action === "delete_notify") {
        shouldDelete = true;
        if (rule.action === "delete_notify") shouldNotify = true;
        matches.push({
          rule: rule.key,
          original: match,
          replacement: "",
          action: rule.action,
        });
      } else if (rule.action === "censor" || rule.action === "censor_notify") {
        result = result.replace(match, rule.censorText);
        if (rule.action === "censor_notify") shouldNotify = true;
        matches.push({
          rule: rule.key,
          original: match,
          replacement: rule.censorText,
          action: rule.action,
        });
      }
      // "none" = do nothing
    }
  }

  // Log moderation actions
  if (matches.length > 0) {
    for (const m of matches) {
      await db.insert(auditLogs).values({
        userId: userId ?? null,
        action: "comment_moderated",
        target: target ?? null,
        originalText: m.original,
        replacedText: m.replacement || null,
        details: JSON.stringify({ rule: m.rule, moderationAction: m.action }),
      });
    }
  }

  return {
    moderated: matches.length > 0,
    text: result,
    matches,
    shouldDelete,
    shouldNotify,
  };
}

export async function logAction(
  action: string,
  opts: {
    userId?: number | null;
    target?: string;
    details?: string;
    originalText?: string;
    replacedText?: string;
    ipAddress?: string;
  } = {},
) {
  await db.insert(auditLogs).values({
    userId: opts.userId ?? null,
    action,
    target: opts.target ?? null,
    details: opts.details ?? null,
    originalText: opts.originalText ?? null,
    replacedText: opts.replacedText ?? null,
    ipAddress: opts.ipAddress ?? null,
  });
}

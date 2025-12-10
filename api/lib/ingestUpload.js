const fs = require('fs');
const path = require('path');

function extractHandlesAndUrls(text) {
  const handles = Array.from(new Set((text.match(/@([A-Za-z0-9_.]+)/g) || []).map(h => h.replace(/^@/, ''))));
  const urls = Array.from(new Set((text.match(/https?:\/\/[^\s'"\)]+/g) || [])));
  return { handles, urls };
}

function parseJsonContent(content) {
  try {
    const parsed = JSON.parse(content);
    // If it's an array of objects, try to extract common fields
    if (Array.isArray(parsed)) {
      const candidates = [];
      for (const item of parsed) {
        if (typeof item === 'object' && item !== null) {
          const text = [item.bio, item.description, item.notes, item.url, item.website, item.handle, item.name]
            .filter(Boolean).join(' ');
          const { handles, urls } = extractHandlesAndUrls(text);
          candidates.push({ source_record: item, handles, urls, name: item.name || item.display_name || null });
        }
      }
      return candidates;
    }
    // If object, search keys for arrays
    const allText = JSON.stringify(parsed);
    const { handles, urls } = extractHandlesAndUrls(allText);
    return [{ source_record: parsed, handles, urls, name: parsed.name || null }];
  } catch (e) {
    return null;
  }
}

function parseSqlInsertDump(content) {
  // Very lightweight: extract quoted strings and then handles/urls inside them
  const candidates = [];
  const matches = content.match(/\(.*?\);/gs) || [];
  for (const m of matches) {
    const { handles, urls } = extractHandlesAndUrls(m);
    if (handles.length || urls.length) {
      candidates.push({ source_record: m, handles, urls, name: null });
    }
  }
  // fallback: whole content
  if (candidates.length === 0) {
    const { handles, urls } = extractHandlesAndUrls(content);
    if (handles.length || urls.length) candidates.push({ source_record: null, handles, urls, name: null });
  }
  return candidates;
}

async function parseUploadFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // try JSON first
  const jsonParsed = parseJsonContent(content);
  if (jsonParsed) return jsonParsed;
  // otherwise try SQL
  return parseSqlInsertDump(content);
}

module.exports = { parseUploadFile, extractHandlesAndUrls };

export const FIELDS = ['S', 'O', 'A', 'P'];
export const STORAGE_KEY = 'clinic-mobile-draft-v1';
const LIMIT = 50000;
const validField = field => FIELDS.includes(field) || field === '';
const text = value => { if (typeof value !== 'string' || value.length > LIMIT) throw new Error('文字過長或格式錯誤'); return value; };
export function createSession(id = crypto.randomUUID()) {
  return {version: 1, session: id, revision: 0, nextId: 1, segments: [], history: [], confirmed: null};
}
function changed(state, event) {
  if (state.history.length >= 5000) throw new Error('此草稿修訂過多，請先確認並匯出，再開新草稿');
  return {...state, revision: state.revision + 1, confirmed: null,
    history: [...state.history, {...event, revision: state.revision + 1}]};
}
export function addSegment(state, source, field = '') {
  text(source); if (!source.trim() || !validField(field)) throw new Error('請輸入文字並選擇有效欄位');
  if (state.segments.length >= 200) throw new Error('本份草稿已達 200 段上限');
  const id = `${state.session}:${state.nextId}`;
  const next = changed(state, {type: 'add', id, field});
  return {...next, nextId: state.nextId + 1, segments: [...state.segments, {id, source, draft: source, field}]};
}
export function editSegment(state, id, draft, field) {
  text(draft); if (!validField(field)) throw new Error('無效欄位');
  const old = state.segments.find(s => s.id === id); if (!old) throw new Error('找不到本份草稿的片段');
  if (old.draft === draft && old.field === field) return state;
  const next = changed(state, {type: 'edit', id, before: old.draft, after: draft, from: old.field, to: field});
  return {...next, segments: state.segments.map(s => s.id === id ? {...s, draft, field} : s)};
}
export function canConfirm(state) {
  return state.segments.length > 0 && state.segments.every(s => FIELDS.includes(s.field) && s.draft.trim());
}
export function confirmReview(state, reviewed) {
  if (reviewed !== true || !canConfirm(state)) throw new Error('請逐段分類、核對內容後勾選人工確認');
  return {...state, confirmed: {session: state.session, revision: state.revision}};
}
export function isConfirmed(state) {
  return canConfirm(state) && state.confirmed?.session === state.session && state.confirmed?.revision === state.revision;
}
export function exportDraft(state) {
  if (!isConfirmed(state)) throw new Error('尚未確認目前版本，不可匯出');
  const body = FIELDS.map(f => `${f}\n${state.segments.filter(s => s.field === f).map(s => s.draft).join('\n') || '（未填寫）'}`).join('\n\n');
  return `已人工確認的 SOAP 草稿 — 非正式病歷\nSession: ${state.session}\nRevision: ${state.revision}\n\n${body}\n\n來源對照\n${state.segments.map(s => `[${s.id}] → ${s.field}\n${s.source}`).join('\n\n')}\n\n人工修正紀錄\n${JSON.stringify(state.history, null, 2)}\n`;
}
export function serialize(state, pending = {text:'',field:''}) {
  text(pending.text); if (!validField(pending.field)) throw new Error('無效欄位');
  const raw = JSON.stringify({state, pending});
  if (raw.length > 3000000) throw new Error('保存內容超過可還原的大小上限');
  return raw;
}
export function restore(raw) {
  if (typeof raw !== 'string' || raw.length > 3000000) throw new Error('保存內容過大');
  const value = JSON.parse(raw), s = value?.state, p = value?.pending;
  if (!s || s.version !== 1 || typeof s.session !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(s.session) || !Number.isSafeInteger(s.revision) || s.revision < 0 || !Number.isSafeInteger(s.nextId) || s.nextId < 1 || !Array.isArray(s.segments) || s.segments.length > 200 || !Array.isArray(s.history) || s.history.length > 5000 || s.history.length !== s.revision || s.nextId !== s.segments.length + 1) throw new Error('無法讀取草稿版本');
  const ids = new Set();
  for (const seg of s.segments) {
    if (typeof seg.id !== 'string' || !seg.id.startsWith(`${s.session}:`) || ids.has(seg.id) || !validField(seg.field)) throw new Error('片段資料錯誤');
    const n = Number(seg.id.slice(s.session.length + 1));
    if (!Number.isSafeInteger(n) || n < 1 || n >= s.nextId) throw new Error('片段序號錯誤');
    text(seg.source); text(seg.draft); ids.add(seg.id);
  }
  for (let i = 0; i < s.history.length; i++) {
    const h = s.history[i];
    if (!h || h.revision !== i + 1 || !ids.has(h.id) || !['add','edit'].includes(h.type)) throw new Error('修正紀錄錯誤');
    if (h.type === 'edit') {text(h.before); text(h.after); if (!validField(h.from) || !validField(h.to)) throw new Error('修正欄位錯誤');}
    else if (!validField(h.field)) throw new Error('來源欄位錯誤');
  }
  const replay = new Map();
  for (const h of s.history) {
    if (h.type === 'add') {
      if (replay.has(h.id) || h.id !== `${s.session}:${replay.size + 1}`) throw new Error('來源順序錯誤');
      replay.set(h.id, {draft:s.segments.find(seg => seg.id === h.id).source, field:h.field});
    } else {
      const old = replay.get(h.id);
      if (!old || old.draft !== h.before || old.field !== h.from) throw new Error('修正歷史不一致');
      replay.set(h.id, {draft:h.after, field:h.to});
    }
  }
  for (const seg of s.segments) {
    if (replay.get(seg.id)?.draft !== seg.draft || replay.get(seg.id)?.field !== seg.field) throw new Error('草稿與修正歷史不一致');
  }
  text(p?.text); if (!validField(p?.field)) throw new Error('輸入草稿錯誤');
  // Restored/browser storage is not trusted clinical evidence: always require fresh review.
  return {state: {...s, confirmed: null}, pending: {text:p.text, field:p.field}};
}

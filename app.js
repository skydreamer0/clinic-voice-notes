import {FIELDS, STORAGE_KEY, createSession, addSegment, editSegment, confirmReview, isConfirmed, exportDraft, serialize, restore} from './state.js';
const $ = id => document.getElementById(id);
let state = createSession();
let dirty = false;
const pending = () => ({text: $('source').value, field: $('field').value});
const announce = message => { $('status').textContent = message; };
function persist() {
  if (!$('persist').checked) return;
  try { localStorage.setItem(STORAGE_KEY, serialize(state, pending())); $('storage-status').textContent = '已保存在此瀏覽器（未加密）。'; }
  catch { $('storage-status').textContent = '保存失敗：空間或權限不足，目前只有記憶體內容。請勿直接關閉。'; }
}
function invalidate() {state = {...state, confirmed:null}; $('reviewed').checked = false; dirty = true; updateStatus(); persist();}
function updateStatus() {
  const confirmed = isConfirmed(state) && !$('source').value.trim();
  $('revision').textContent = `版本 ${state.revision} · ${state.segments.length} 段 · ${confirmed ? '已人工確認的草稿' : '待人工確認'}`;
  $('export').disabled = !confirmed;
}
function element(tag, content, className) { const node = document.createElement(tag); if (content !== undefined) node.textContent = content; if (className) node.className = className; return node; }
function render() {
  $('segments').replaceChildren(); $('empty').hidden = state.segments.length > 0;
  state.segments.forEach((segment, index) => {
    const article = element('article',undefined,'segment');
    article.append(element('h3',`片段 ${index + 1}`));
    const fieldId = `segment-field-${index}`, textId = `segment-text-${index}`;
    const label = element('label','人工分類'); label.htmlFor = fieldId;
    const select = element('select'); select.id = fieldId;
    for (const value of ['',...FIELDS]) {const option = element('option',value || '待分類');option.value = value;select.append(option);}
    select.value = segment.field;
    const draftLabel = element('label','草稿（可修正，來源不變）');draftLabel.htmlFor = textId;
    const area = element('textarea');area.id = textId;area.rows = 4;area.maxLength = 50000;area.value = segment.draft;
    const details = element('details');details.append(element('summary','查看原始文字與片段識別碼'),element('pre',`${segment.id}\n${segment.source}`));
    const edit = () => {try {state = editSegment(state,segment.id,area.value,select.value);invalidate();}catch(error){const current = state.segments.find(item => item.id === segment.id);area.value = current.draft;select.value = current.field;invalidate();announce(`${error.message}；本次修改未套用，畫面已回復，請重新核對。`);}};
    area.addEventListener('input',edit);select.addEventListener('change',edit);
    article.append(label,select,draftLabel,area,details);$('segments').append(article);
  });
  updateStatus();
}
$('source').addEventListener('input',invalidate);$('field').addEventListener('change',invalidate);
$('add').addEventListener('click',() => {
  try {state = addSegment(state,$('source').value,$('field').value);$('source').value = '';invalidate();render();announce('已保留來源。請逐段人工分類與核對。');$('source').focus();} catch(error){announce(error.message);}
});
$('reviewed').addEventListener('change',() => {if (!$('reviewed').checked) {state = {...state,confirmed:null};updateStatus();persist();}});
$('confirm').addEventListener('click',() => {
  try {if ($('source').value.trim()) throw new Error('上方仍有未加入的文字，請先加入或自行清空，再確認。');state = confirmReview(state,$('reviewed').checked);persist();updateStatus();announce('目前版本已人工確認，仍是草稿。');}catch(error){announce(error.message);}
});
$('export').addEventListener('click',() => {
  try {
    if ($('source').value.trim()) throw new Error('有未加入的文字，請重新核對。');
    const content = exportDraft(state);const blob = new Blob([content],{type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);const link = element('a');link.href = url;link.download = `soap-draft-${state.session}-r${state.revision}.txt`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);announce('已請求下載草稿；請確認檔案確實保存。');
  }catch(error){announce(error.message);}
});
function removeSaved() {
  try {localStorage.removeItem(STORAGE_KEY);$('persist').checked = false;$('persist').disabled = false;$('storage-status').textContent = '本頁保存的草稿已移除；目前內容仍在記憶體。';return true;}
  catch {$('storage-status').textContent = '無法清除保存內容，請使用瀏覽器的網站資料設定處理。';return false;}
}
$('persist').addEventListener('change',() => {if ($('persist').checked) persist();else removeSaved();});
$('clear').addEventListener('click',() => {if (window.confirm('只清除本頁的瀏覽器保存內容？畫面中的草稿暫時保留。')) removeSaved();});
$('new').addEventListener('click',() => {
  if (!window.confirm('結束這份會清空畫面及本頁保存的草稿，無法復原。已自行保存所需檔案嗎？')) return;
  if (!removeSaved()) return;
  state = createSession();$('source').value = '';$('field').value = '';$('reviewed').checked = false;dirty = false;render();announce('已開啟獨立空白草稿，未沿用上一份內容。');$('source').focus();
});
window.addEventListener('beforeunload',event => {if (dirty) {event.preventDefault();event.returnValue = '';}});
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && window.confirm('此瀏覽器有先前保存的測試草稿。確認為你本人的資料後，是否還原？取消不會刪除原保存內容。')) {
    const restored = restore(saved);state = restored.state;$('source').value = restored.pending.text;$('field').value = restored.pending.field;$('persist').checked = true;dirty = true;announce('已還原來源與修正紀錄；必須重新人工確認。');
  } else if (saved) { $('persist').disabled = true;$('storage-status').textContent = '尚有未還原的保存內容。為避免覆蓋，請先清除保存草稿，再選擇保存目前內容。'; }
} catch {announce('無法讀取保存草稿；未刪除原內容。請勿依賴此瀏覽器保存。');$('persist').disabled = true;}
// Clearing explicitly unlocks storage opt-in without deleting other origin data.
$('clear').addEventListener('click',() => {if (!$('persist').checked && $('storage-status').textContent.startsWith('本頁保存')) $('persist').disabled = false;});
render();
if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(registration => {
    $('shell-status').textContent = '網頁快取已註冊；實際離線可用仍需在此裝置測試。語音是否離線由系統決定。';
    const waiting = () => {if (registration.waiting) $('shell-status').textContent = '有新版網頁等待。先保存草稿，再關閉所有本頁分頁並重開；不會自動重新整理。';};
    waiting();registration.addEventListener('updatefound',() => registration.installing?.addEventListener('statechange',waiting));
  }).catch(()=>{$('shell-status').textContent = '網頁快取無法註冊；此時不可保證網頁離線可用。';});
}

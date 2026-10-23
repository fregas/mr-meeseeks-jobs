// Greenhouse form fill helpers — work with document.visibilityState === "hidden".
// Paste the whole file into javascript_tool once per tab, then call the helpers.
// No focus, no screenshots, no coordinates. Mismatched option text returns the
// real option list instead of silently selecting the wrong thing.

window.__set = function (id, v) {                 // plain text inputs + textareas
  const el = document.getElementById(id);
  if (!el) return `MISSING ${id}`;
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement : HTMLInputElement;
  Object.getOwnPropertyDescriptor(proto.prototype, 'value').set.call(el, v);
  for (const t of ['input', 'change', 'blur']) el.dispatchEvent(new Event(t, { bubbles: true }));
  return `${id} = ${String(el.value).slice(0, 60)}`;
};

window.__api = function (id) {                    // reach react-select's internals
  const el = document.getElementById(id);
  if (!el) return null;
  const fk = Object.keys(el).find(k => k.startsWith('__reactFiber$'));
  let f = el[fk], d = 0;
  while (f && d < 40) {
    const p = f.memoizedProps;
    if (p && typeof p.selectOption === 'function' && p.selectProps) return p;
    f = f.return; d++;
  }
  return null;
};

// After selectOption(), the visible label updates immediately but the form
// library's validation/touched state (Formik-style) often does NOT update
// until the underlying input receives a real blur. selectOption alone can
// leave a field looking filled while the form still treats it as empty on
// submit. Fire blur both through react-select's own handler (if exposed)
// and natively on the control's input, and give React a tick to flush state.
window.__settle = async function (id) {
  const el = document.getElementById(id);
  const api = __api(id);
  if (api && typeof api.selectProps.onBlur === 'function') {
    try { api.selectProps.onBlur({ target: el, currentTarget: el }); } catch (e) {}
  }
  if (el) {
    el.focus();
    el.blur();
    el.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
  }
  await new Promise(r => setTimeout(r, 50));
};

// Static dropdowns: Yes/No, gender, race, veteran, state, phone country ("#country").
// Returns a Promise — always `await __pick(...)`. Settles the field after
// selecting so validation/touched state updates, matching what a real
// click + tab-away does.
window.__pick = async function (id, text) {
  const api = __api(id);
  if (!api) return `${id}: no react-select api`;
  const opts = api.selectProps.options || api.options || [];
  const flat = opts.flatMap(o => (o.options ? o.options : [o]));
  const want = String(text).toLowerCase();
  const opt = flat.find(o => String(o.label).toLowerCase() === want)
           || flat.find(o => String(o.label).toLowerCase().includes(want));
  if (!opt) return `${id}: "${text}" not in [${flat.map(o => o.label).join(' | ')}]`;
  api.selectOption(opt);
  await __settle(id);
  return `${id} -> ${opt.label}`;
};

// Remote-loaded autocompletes: "Location (City)" (#candidate-location), school, degree.
window.__pickAsync = async function (id, text, matchText) {
  const el = document.getElementById(id);
  if (!el) return `MISSING ${id}`;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, text);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new KeyboardEvent('keyup', { key: 'h', bubbles: true }));
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 250));
    const api = __api(id);
    const opts = (api && api.selectProps.options) || [];
    if (opts.length) {
      const want = String(matchText || text).toLowerCase();
      const opt = opts.find(o => String(o.label).toLowerCase().includes(want)) || opts[0];
      api.selectOption(opt);
      await __settle(id);
      return `${id} -> ${opt.label}`;
    }
  }
  return `${id}: no options loaded for "${text}"`;
};

// Reveal the cover-letter textarea, then fill it with __set('cover_letter_text', ...).
window.__coverLetterManual = async function () {
  const b = [...document.querySelectorAll('form button')]
    .filter(x => x.innerText.trim() === 'Enter manually');
  if (!b.length) return 'no "Enter manually" button';
  b[b.length - 1].click();
  await new Promise(r => setTimeout(r, 600));
  return document.getElementById('cover_letter_text') ? 'textarea ready' : 'textarea not found';
};

// Final verification before handing off for review.
window.__audit = function () {
  const req = [...document.querySelectorAll('form [aria-required="true"], form [required]')];
  return JSON.stringify({
    visibility: document.visibilityState,
    selects: [...document.querySelectorAll('form .select__single-value')].map(e => e.innerText),
    text: [...document.querySelectorAll('form input[type=text],form input[type=tel],form textarea')]
      .filter(e => e.id && e.value && !e.className.includes('select__input'))
      .map(e => `${e.id} = ${e.value.slice(0, 50)}`),
    emptyRequired: req.filter(e => !e.value && !e.className.includes('select__input')).map(e => e.id || e.name),
    files: [...document.querySelectorAll('form input[type=file]')]
      .map(e => `${e.id}: ${e.files.length ? e.files[0].name : '(none)'}`),
    resumeAttached: /\.pdf/i.test(document.body.innerText)
  }, null, 1);
};
'helpers loaded';

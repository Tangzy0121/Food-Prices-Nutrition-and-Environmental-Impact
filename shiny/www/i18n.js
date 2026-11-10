// Translate presentation text only. Input values, identifiers and product names stay intact.
(() => {
  let dictionary = {}, language = 'zh', queued = false;
  const originals = new WeakMap();
  function translate(value) {
    if (language !== 'zh') return value;
    if (dictionary[value]) return dictionary[value];
    const core = value.trim();
    if (dictionary[core]) return value.replace(core, dictionary[core]);
    // Labels built from a fixed prefix and a measurement unit.
    for (const key of ['Unit-price ceiling (EUR/', 'Sugars', 'Saturated fat', 'Fibre']) {
      if (core.startsWith(key) && dictionary[key]) return value.replace(key, dictionary[key]);
    }
    return value;
  }
  function refresh() {
    queued = false;
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement?.closest('script,style,.product-name,.barcode,#product_a,#product_b,.selectize-dropdown[data-product]')) continue;
      let record = originals.get(node);
      if (!record || node.nodeValue !== record.display) record = {source: node.nodeValue};
      record.display = translate(record.source);
      originals.set(node, record);
      if (node.nodeValue !== record.display) node.nodeValue = record.display;
    }
    document.querySelectorAll('[placeholder],[alt],[title]').forEach(element => {
      for (const attr of ['placeholder','alt','title']) {
        if (!element.hasAttribute(attr)) continue;
        const key = 'data-original-' + attr;
        if (!element.hasAttribute(key)) element.setAttribute(key, element.getAttribute(attr));
        const value = translate(element.getAttribute(key));
        if (element.getAttribute(attr) !== value) element.setAttribute(attr, value);
      }
    });
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(refresh); } }
  document.addEventListener('DOMContentLoaded', async () => {
    dictionary = await (await fetch('translations.json')).json();
    language = localStorage.getItem('food-signal-language') || 'zh';
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {childList:true, subtree:true, characterData:true});
    document.addEventListener('change', event => {
      if (event.target.name !== 'lang') return;
      language = event.target.value;
      localStorage.setItem('food-signal-language', language);
      schedule();
    });
    const restore = () => {
      const radio = document.querySelector(`input[name="lang"][value="${language}"]`);
      if (radio && !radio.checked) { radio.checked = true; radio.dispatchEvent(new Event('change', {bubbles:true})); }
      schedule();
    };
    if (window.jQuery) window.jQuery(document).on('shiny:connected', restore);
    restore();
  });
})();

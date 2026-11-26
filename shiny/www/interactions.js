document.addEventListener('click', function (event) {
  var button = event.target.closest('button[data-inspect-code]');
  if (!button || !window.Shiny) return;
  Shiny.setInputValue(button.dataset.target || 'selected_code', button.dataset.inspectCode, { priority: 'event' });
});

if (window.Shiny) {
  Shiny.addCustomMessageHandler('dash-lang', function (message) {
    var lang = message && message.lang === 'zh' ? 'zh' : 'en';
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    var en = document.getElementById('lang_en');
    var zh = document.getElementById('lang_zh');
    if (en) en.setAttribute('aria-pressed', lang === 'en' ? 'true' : 'false');
    if (zh) zh.setAttribute('aria-pressed', lang === 'zh' ? 'true' : 'false');
  });
}

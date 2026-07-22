/*
 * Kontaktformular jamalsalif — Anbindung an die S&A-Formular-API
 * (gleiche API wie jvm-media.de: POST https://api.sundasolutions.de/contact, project 'jvm').
 * Capture-Listener auf document, damit der Webflow-Form-Handler (jamalsalif.js)
 * NIE greift und kein Request an webflow.com abgeht.
 */
(function () {
  var ENDPOINT = 'https://api.sundasolutions.de/contact';

  function formatEuro(raw) {
    var str = String(raw || '').trim();
    var plus = /\+$/.test(str);
    var n = parseFloat(str.replace(/\+$/, ''));
    if (isNaN(n)) return str;
    return n.toLocaleString('de-DE') + ' €' + (plus ? '+' : '');
  }

  function show(el) { if (el) el.style.display = 'block'; }
  function hide(el) { if (el) el.style.display = 'none'; }

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || form.id !== 'wf-form-Contact-Form') return;

    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();

    var wrapper = form.closest('.w-form') || form.parentElement;
    var successEl = wrapper.querySelector('.w-form-done');
    var failEl = wrapper.querySelector('.w-form-fail');
    var submitBtn = form.querySelector('input[type="submit"]');
    var defaultBtnValue = submitBtn ? submitBtn.value : '';

    hide(successEl);
    hide(failEl);
    if (submitBtn) {
      submitBtn.value = submitBtn.getAttribute('data-wait') || 'Bitte warte...';
      submitBtn.disabled = true;
    }

    var services = [];
    form.querySelectorAll('input[type="checkbox"]:checked').forEach(function (cb) {
      var label = cb.parentElement ? cb.parentElement.querySelector('.checkbox_label') : null;
      services.push(label ? label.textContent.trim() : (cb.getAttribute('data-name') || cb.name));
    });

    var val = function (sel) {
      var el = form.querySelector(sel);
      return el ? el.value.trim() : '';
    };

    var budget = formatEuro(val('#Budget-Min')) + ' – ' + formatEuro(val('#Budget-Max'));

    var message = [
      val('#Details'),
      '',
      '--- Angaben aus dem Formular ---',
      'Gesucht: ' + (services.length ? services.join(', ') : 'keine Angabe'),
      'Budget: ' + budget,
      'Quelle: jamalsalif.vercel.app (Portfolio-Seite Jamal Salif)'
    ].join('\n');

    var payload = {
      project: 'jvm',
      source: 'jamalsalif',
      name: val('#name'),
      email: val('#Email'),
      phone: val('#Telefonnnummer'),
      message: message,
      hp: ''
    };

    var finish = function () {
      if (submitBtn) {
        submitBtn.value = defaultBtnValue;
        submitBtn.disabled = false;
      }
    };

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (res.ok && data.ok) {
          form.style.display = 'none';
          show(successEl);
        } else {
          if (failEl && data.error) {
            var t = failEl.querySelector('div');
            if (t) t.textContent = data.error;
          }
          show(failEl);
        }
      });
    }).catch(function (err) {
      console.error('Kontaktformular-Fehler:', err);
      show(failEl);
    }).then(finish, finish);
  }, true);
})();

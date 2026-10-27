// Quizfabrik ohne PC: beantwortet die Anfragen von app.js an /api/… direkt im Browser.
// Macht dasselbe wie server.py, speichert aber im Speicher des Handys (localStorage) statt in SQLite.
// Die fertigen Quizze kommen aus quizze-daten.js (window.QUIZFABRIK_START, erzeugt aus start-quizze.json).
(function () {
  'use strict';

  const SPEICHER = 'quizfabrik-handy';
  const START = window.QUIZFABRIK_START;
  const STUFEN = ['leicht', 'mittel', 'schwer'];
  const ARTEN = ['eine', 'mehrere', 'wahrfalsch'];
  const SPIEL_ARTEN = ['quiz', 'mix', 'fehler', 'uebung'];
  const ID_MUSTER = /^[a-z0-9-]{1,40}$/;
  const MAX_FRAGEN = 400;

  const startById = new Map(START.quizze.map((q) => [q.id, q]));
  const jetzt = () => new Date().toISOString().slice(0, 19);
  const schluessel = (quizId, frage) => quizId + '\n' + frage;

  // ---------- Speichern und Laden ----------
  // Unveränderte fertige Quizze stehen nur als Verweis { id, start: true } im Speicher
  function leer() {
    return { stand: START.version, quizze: START.quizze.map((q) => ({ id: q.id, start: true })), fehler: [], spiele: [], geloest: {} };
  }
  function laden() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(SPEICHER) || 'null'); } catch (_) { d = null; }
    if (!d || !Array.isArray(d.quizze)) return leer();
    if ((d.stand || 0) < START.version) {
      // Neue fertige Quizze: alle fertigen austauschen, eigene bleiben (wie server.py)
      d.quizze = d.quizze.filter((q) => !q.start && !q.fertig);
      START.quizze.forEach((q, i) => d.quizze.splice(i, 0, { id: q.id, start: true }));
      d.stand = START.version;
    }
    d.fehler = d.fehler || [];
    d.spiele = d.spiele || [];
    d.geloest = d.geloest || {};
    return d;
  }
  let daten = laden();
  function sichern() {
    localStorage.setItem(SPEICHER, JSON.stringify(daten));   // wirft bei vollem Speicher
  }
  // Das Handy soll die Daten nicht von selbst wegräumen
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (_) { /* egal */ }

  function quizAusEintrag(e) {
    if (e.start) {
      const q = startById.get(e.id);
      return q ? { id: q.id, titel: q.titel, stufe: q.stufe, fertig: true, fragen: q.fragen.map(sauber) } : null;
    }
    return e;
  }
  // Fragen wie server.py: Wahr/Falsch nur 2 Antworten, "richtig" bei "mehrere" als Liste
  function sauber(f) {
    const art = f.art || 'eine';
    return {
      art: art, stufe: f.stufe || 'mittel', frage: f.frage,
      antworten: art === 'wahrfalsch' ? ['Wahr', 'Falsch'] : f.antworten.slice(0, 4),
      richtig: art === 'mehrere' ? (Array.isArray(f.richtig) ? f.richtig.slice() : [f.richtig]) : (Array.isArray(f.richtig) ? f.richtig[0] : f.richtig),
      erklaerung: f.erklaerung || ''
    };
  }
  function alleQuizze() {
    return daten.quizze.map(quizAusEintrag).filter(Boolean);
  }
  function fragenMenge() {
    const s = new Set();
    alleQuizze().forEach((q) => q.fragen.forEach((f) => s.add(schluessel(q.id, f.frage))));
    return s;
  }
  function fehlendeFertige() {
    const da = new Set(daten.quizze.map((q) => q.id));
    return START.quizze.filter((q) => !da.has(q.id));
  }
  function fehlerListe(menge) {
    const m = menge || fragenMenge();
    return daten.fehler.filter((f) => m.has(schluessel(f.quiz_id, f.frage)))
      .sort((a, b) => (b.zuletzt > a.zuletzt ? 1 : b.zuletzt < a.zuletzt ? -1 : b.anzahl - a.anzahl))
      .map((f) => ({ quiz_id: f.quiz_id, frage: f.frage, anzahl: f.anzahl }));
  }
  function geloestListe(menge) {
    const m = menge || fragenMenge();
    return Object.keys(daten.geloest).filter((k) => m.has(k)).map((k) => {
      const i = k.indexOf('\n');
      return { quiz_id: k.slice(0, i), frage: k.slice(i + 1) };
    });
  }
  function statistik(menge) {
    const normale = daten.spiele.filter((s) => s.art !== 'uebung');
    const quizze = {};
    normale.forEach((s) => {
      const q = quizze[s.quiz_id] || (quizze[s.quiz_id] = { gespielt: 0, beste: 0, geloest: 0 });
      q.gespielt++;
      q.beste = Math.max(q.beste, Math.round((100 * s.richtig) / s.anzahl));
    });
    geloestListe(menge).forEach((g) => {
      (quizze[g.quiz_id] || (quizze[g.quiz_id] = { gespielt: 0, beste: null, geloest: 0 })).geloest++;
    });
    return { spiele: normale.length, richtig: daten.spiele.reduce((n, s) => n + s.richtig, 0), quizze: quizze };
  }

  // ---------- Prüfen (wie pruefen() in server.py) ----------
  function text(wert, feld, max) {
    if (typeof wert !== 'string' || !wert.trim()) throw new Error(feld + ' fehlt.');
    if (wert.trim().length > max) throw new Error(feld + ' ist zu lang (höchstens ' + max + ' Zeichen).');
    return wert.trim();
  }
  const ganzzahl = (x) => Number.isInteger(x);
  function pruefen(d, id) {
    if (!d || typeof d !== 'object') throw new Error('Das Quiz hat das falsche Format.');
    if (!ID_MUSTER.test(id)) throw new Error('Das Quiz hat eine ungültige Kennung.');
    if (!Array.isArray(d.fragen) || !d.fragen.length) throw new Error('Das Quiz braucht mindestens eine Frage.');
    if (d.fragen.length > MAX_FRAGEN) throw new Error('Höchstens ' + MAX_FRAGEN + ' Fragen pro Quiz.');
    const quizStufe = STUFEN.includes(d.stufe) ? d.stufe : 'mittel';
    const fragen = d.fragen.map((f, i) => {
      const nr = i + 1;
      if (!f || typeof f !== 'object') throw new Error('Frage ' + nr + ' hat das falsche Format.');
      const art = f.art || 'eine';
      if (!ARTEN.includes(art)) throw new Error('Frage ' + nr + ' hat eine unbekannte Art.');
      let richtig = f.richtig;
      let antworten;
      if (art === 'wahrfalsch') {
        if (richtig !== 0 && richtig !== 1) throw new Error('Bei Frage ' + nr + ' ist nicht gewählt, ob die Aussage wahr oder falsch ist.');
        antworten = ['Wahr', 'Falsch'];
      } else {
        if (!Array.isArray(f.antworten) || f.antworten.length !== 4) throw new Error('Frage ' + nr + ' braucht genau 4 Antworten.');
        antworten = f.antworten.map((a, k) => text(a, 'Antwort ' + 'ABCD'[k] + ' bei Frage ' + nr, 150));
        if (art === 'mehrere') {
          if (!Array.isArray(richtig) || !richtig.length || !richtig.every((k) => ganzzahl(k) && k >= 0 && k <= 3)) {
            throw new Error('Bei Frage ' + nr + ' ist keine richtige Antwort gewählt.');
          }
          richtig = Array.from(new Set(richtig)).sort();
        } else if (!ganzzahl(richtig) || richtig < 0 || richtig > 3) {
          throw new Error('Bei Frage ' + nr + ' ist keine richtige Antwort gewählt.');
        }
      }
      return {
        art: art, stufe: STUFEN.includes(f.stufe) ? f.stufe : quizStufe, frage: text(f.frage, 'Frage ' + nr, 300),
        antworten: antworten, richtig: richtig,
        erklaerung: typeof f.erklaerung === 'string' ? f.erklaerung.trim().slice(0, 500) : ''
      };
    });
    return { id: id, titel: text(d.titel, 'Der Titel', 80), stufe: quizStufe, fragen: fragen };
  }
  function spielPruefen(d) {
    if (!d || typeof d !== 'object') throw new Error('Das Spiel hat das falsche Format.');
    if (!SPIEL_ARTEN.includes(d.art)) throw new Error('Das Spiel hat eine unbekannte Art.');
    if (!ganzzahl(d.anzahl) || d.anzahl < 1 || d.anzahl > MAX_FRAGEN) throw new Error('Die Anzahl der Fragen fehlt.');
    if (!ganzzahl(d.richtig) || d.richtig < 0 || d.richtig > d.anzahl) throw new Error('Die Zahl der richtigen Antworten stimmt nicht.');
    if (!ID_MUSTER.test(d.quiz_id || '')) throw new Error('Das Quiz hat eine ungültige Kennung.');
    if (!Array.isArray(d.richtige) || d.richtige.length > d.anzahl) throw new Error('Die Liste der richtigen Fragen stimmt nicht.');
    d.richtige.forEach((r) => {
      if (!r || !ID_MUSTER.test(r.quiz_id || '')) throw new Error('Die Liste der richtigen Fragen stimmt nicht.');
      text(r.frage, 'Die Frage', 300);
    });
    return d;
  }

  // ---------- Die Adressen von server.py ----------
  function antworten(method, pfad, body) {
    const m = /^\/api\/quizze\/([^/]+)$/.exec(pfad);
    if (method === 'GET' && pfad === '/api/quizze') {
      const menge = fragenMenge();
      return [200, { quizze: alleQuizze(), fehlende_fertige: fehlendeFertige().length, fehler: fehlerListe(menge), statistik: statistik(menge), geloest: geloestListe(menge) }];
    }
    if (method === 'PUT' && m) {
      const quiz = pruefen(body, decodeURIComponent(m[1]));
      const pos = daten.quizze.findIndex((q) => q.id === quiz.id);
      const fertig = pos >= 0 && (daten.quizze[pos].start || daten.quizze[pos].fertig);
      const eintrag = { id: quiz.id, titel: quiz.titel, stufe: quiz.stufe, fertig: !!fertig, fragen: quiz.fragen };
      if (pos >= 0) daten.quizze[pos] = eintrag; else daten.quizze.push(eintrag);
      sichern();
      return [200, { quiz: eintrag }];
    }
    if (method === 'DELETE' && m) {
      const id = decodeURIComponent(m[1]);
      const vorher = daten.quizze.length;
      daten.quizze = daten.quizze.filter((q) => q.id !== id);
      if (daten.quizze.length === vorher) return [404, { fehler: 'Dieses Quiz gibt es nicht mehr.' }];
      daten.fehler = daten.fehler.filter((f) => f.quiz_id !== id);
      sichern();
      return [200, { ok: true }];
    }
    if (method === 'POST' && pfad === '/api/fertige-quizze') {
      const fehlend = fehlendeFertige();
      fehlend.forEach((q) => daten.quizze.push({ id: q.id, start: true }));
      sichern();
      return [200, { zurueckgeholt: fehlend.length, quizze: alleQuizze(), fehlende_fertige: 0 }];
    }
    if (method === 'POST' && pfad === '/api/fehler') {
      if (!body || typeof body !== 'object') throw new Error('Die Antwort hat das falsche Format.');
      if (!ID_MUSTER.test(body.quiz_id || '')) throw new Error('Das Quiz hat eine ungültige Kennung.');
      const frage = text(body.frage, 'Die Frage', 300);
      if (typeof body.richtig !== 'boolean') throw new Error('Es fehlt, ob die Antwort richtig war.');
      const gibtEs = fragenMenge().has(schluessel(body.quiz_id, frage));
      const pos = daten.fehler.findIndex((f) => f.quiz_id === body.quiz_id && f.frage === frage);
      if (body.richtig) {
        if (pos >= 0) daten.fehler.splice(pos, 1);
        if (gibtEs) daten.geloest[schluessel(body.quiz_id, frage)] = jetzt();   // sofort gelöst, auch bei Abbruch
      } else if (gibtEs) {
        if (pos >= 0) {
          daten.fehler[pos].anzahl++;
          daten.fehler[pos].zuletzt = jetzt();
        } else {
          daten.fehler.push({ quiz_id: body.quiz_id, frage: frage, anzahl: 1, zuletzt: jetzt() });
        }
      } else {
        throw new Error('Diese Frage gibt es nicht.');
      }
      sichern();
      return [200, { fehler: fehlerListe() }];
    }
    if (method === 'DELETE' && pfad === '/api/fehler') {
      daten.fehler = [];
      sichern();
      return [200, { fehler: [] }];
    }
    if (method === 'POST' && pfad === '/api/spiele') {
      const s = spielPruefen(body);
      daten.spiele.push({ quiz_id: s.quiz_id, art: s.art, datum: jetzt(), anzahl: s.anzahl, richtig: s.richtig });
      s.richtige.forEach((r) => { daten.geloest[schluessel(r.quiz_id, r.frage.trim())] = jetzt(); });
      sichern();
      return [200, { statistik: statistik() }];
    }
    if (method === 'DELETE' && pfad === '/api/statistik') {
      daten.spiele = [];
      daten.geloest = {};
      sichern();
      return [200, { statistik: statistik() }];
    }
    return [404, { fehler: 'Unbekannte Adresse.' }];
  }

  // fetch() für /api/… abfangen; alles andere geht normal ins Netz bzw. an den Service Worker
  const echtesFetch = window.fetch.bind(window);
  window.fetch = function (eingabe, optionen) {
    const url = new URL(typeof eingabe === 'string' ? eingabe : eingabe.url, location.href);
    if (url.origin !== location.origin || !url.pathname.startsWith('/api/')) return echtesFetch(eingabe, optionen);
    const method = ((optionen && optionen.method) || 'GET').toUpperCase();
    let status, ergebnis;
    try {
      const body = optionen && optionen.body ? JSON.parse(optionen.body) : null;
      [status, ergebnis] = antworten(method, url.pathname, body);
    } catch (e) {
      // Fehler beim Prüfen: wie der Server mit 400; voller Speicher: 500
      const voll = e && (e.name === 'QuotaExceededError' || /quota/i.test(String(e)));
      daten = laden();   // nichts halb Geändertes behalten
      [status, ergebnis] = voll
        ? [500, { fehler: 'Speichern hat nicht geklappt: Der Speicher auf dem Handy ist voll.' }]
        : [400, { fehler: e && e.message ? e.message : 'Die Anfrage kam kaputt an.' }];
    }
    return Promise.resolve(new Response(JSON.stringify(ergebnis), { status: status, headers: { 'Content-Type': 'application/json' } }));
  };

  // ---------- Sichern und Laden als Datei ----------
  // Die Daten liegen nur auf diesem Handy. Mit einer Sicherungsdatei gehen sie nicht verloren
  // (z. B. beim Deinstallieren) und lassen sich auf ein anderes Handy übertragen.
  function sicherungsdatei() {
    const blob = new Blob([JSON.stringify({ quizfabrik_sicherung: 1, erstellt: jetzt(), daten: daten }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'quizfabrik-sicherung-' + jetzt().slice(0, 10) + '.json';
    document.body.append(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function sicherungLaden(datei, meldung) {
    const leser = new FileReader();
    leser.onload = () => {
      try {
        const s = JSON.parse(leser.result);
        if (!s || s.quizfabrik_sicherung !== 1 || !s.daten || !Array.isArray(s.daten.quizze)) throw new Error('Das ist keine Sicherung der Quizfabrik.');
        if (!window.confirm('Sicherung vom ' + String(s.erstellt || '').slice(0, 10) + ' laden? Alles, was jetzt auf diesem Handy gespeichert ist, wird dadurch ersetzt.')) return;
        localStorage.setItem(SPEICHER, JSON.stringify(s.daten));
        location.reload();
      } catch (e) {
        meldung.textContent = e.message || 'Die Datei konnte nicht gelesen werden.';
        meldung.hidden = false;
      }
    };
    leser.readAsText(datei);
  }
  function sicherungsBereich() {
    const home = document.getElementById('home');
    if (!home) return;
    const panel = document.createElement('section');
    panel.className = 'panel stack';
    panel.id = 'sicherung';
    panel.innerHTML = '<h2 class="section-title">Deine Daten auf diesem Handy</h2>'
      + '<p class="hint">Quizze, Fehler und Statistik speichert die App nur hier auf dem Handy. Mach ab und zu eine '
      + 'Sicherungsdatei, dann ist nichts weg, wenn du die App löschst oder ein neues Handy bekommst.</p>'
      + '<p class="form-msg" data-kind="error" hidden></p>'
      + '<div class="actions"><button class="btn btn-ghost btn-small" type="button" id="sicherung-speichern">Sicherung speichern</button>'
      + '<button class="btn btn-ghost btn-small" type="button" id="sicherung-laden">Sicherung laden</button>'
      + '<input type="file" accept=".json,application/json" id="sicherung-datei" hidden></div>';
    home.append(panel);
    const meldung = panel.querySelector('.form-msg');
    panel.querySelector('#sicherung-speichern').addEventListener('click', sicherungsdatei);
    panel.querySelector('#sicherung-laden').addEventListener('click', () => panel.querySelector('#sicherung-datei').click());
    panel.querySelector('#sicherung-datei').addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) sicherungLaden(e.target.files[0], meldung);
      e.target.value = '';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sicherungsBereich); else sicherungsBereich();
})();

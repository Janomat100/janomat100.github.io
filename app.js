(function () {
  'use strict';

  const LETTERS = ['A', 'B', 'C', 'D'];
  const API = '/api';
  const ARTEN = [['eine', 'Eine richtige'], ['mehrere', 'Mehrere richtige'], ['wahrfalsch', 'Wahr/Falsch']];
  const WAHR_FALSCH = ['Wahr', 'Falsch'];
  const STUFEN = ['leicht', 'mittel', 'schwer'];
  const ART_HINWEIS = {
    eine: 'Klick auf den Buchstaben vor der richtigen Antwort, er wird grün.',
    mehrere: 'Klick auf die Buchstaben vor allen richtigen Antworten. Mindestens eine muss richtig sein.',
    wahrfalsch: 'Schreib eine Aussage und wähl, ob sie wahr oder falsch ist.'
  };
  // Symbole als Inline-SVG (24 × 24, Linien in der Textfarbe)
  const ICONS = {
    chip: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><rect x="10" y="10" width="4" height="4" rx=".5"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>',
    globus: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9M12 3C9.5 5.6 8.2 8.6 8.2 12s1.3 6.4 3.8 9"/>',
    schild: '<path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/>',
    code: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>',
    fenster: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M6 6.5h.01M8.5 6.5h.01"/><circle cx="12" cy="14.5" r="2.2"/><path d="M12 10.8v1.5M12 16.7v1.5M8.3 14.5h1.5M14.2 14.5h1.5"/>',
    etikett: '<path d="M3 12V4.8A1.8 1.8 0 0 1 4.8 3H12l9 9-9 9-9-9z"/><circle cx="7.5" cy="7.5" r="1.4"/>',
    eigen: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
    mix: '<path d="M3 7h3.5c4.5 0 6.5 10 11 10H21M3 17h3.5c1.8 0 3.1-1.6 4.3-3.6M13.2 9.6C14.4 8 15.7 7 17.5 7H21"/><path d="M18 4l3 3-3 3M18 14l3 3-3 3"/>',
    fehler: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.7"/><path d="M20 4v4.7h-4.7"/><path d="M20 12a8 8 0 0 1-13.7 5.6L4 15.3"/><path d="M4 20v-4.7h4.7"/>',
    spiele: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l5.5-3.5z"/>',
    richtig: '<circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.7 2.7L16 9.7"/>',
    start: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    sonne: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    mond: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    auto: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/>'
  };
  // Darstellung: reihum Automatisch → Hell → Dunkel
  const THEMES = {
    auto: { name: 'Automatisch', icon: 'auto', naechstes: 'light' },
    light: { name: 'Hell', icon: 'sonne', naechstes: 'dark' },
    dark: { name: 'Dunkel', icon: 'mond', naechstes: 'auto' }
  };
  // Jede Kategorie hat ein Symbol und (in style.css) eine eigene Akzentfarbe
  const KAT_ICON = {
    hardware: 'chip', internet: 'globus', sicherheit: 'schild', programmieren: 'code', software: 'fenster',
    abkuerzungen: 'etikett', eigen: 'eigen', mix: 'mix', fehler: 'fehler'
  };

  const el = (id) => document.getElementById(id);
  const ui = {
    home: el('home'), homeMsg: el('home-msg'), mixPanel: el('mix-panel'), mixMeta: el('mix-meta'), mixStart: el('mix-start'),
    mixStats: el('mix-stats'), mixProgress: el('mix-progress'), mixBar: el('mix-bar'), mixBarText: el('mix-bar-text'),
    setupGeloest: el('setup-geloest'), alleFragen: el('alle-fragen'), setupAlle: el('setup-alle'), hello: el('hello'), helloTitle: el('hello-title'), helloText: el('hello-text'), stats: el('stats'),
    statSpiele: el('stat-spiele'), statRichtig: el('stat-richtig'), statFehler: el('stat-fehler'), firstPlay: el('first-play'),
    statsReset: el('stats-reset'), setupIcon: el('setup-icon'), quizIcon: el('quiz-icon'),
    ring: el('ring'), ringFill: el('ring-fill'), resPct: el('res-pct'),
    stdList: el('std-list'), stdEmpty: el('std-empty'), restore: el('restore'),
    setup: el('setup'), setupTitle: el('setup-title'), setupMeta: el('setup-meta'), setupCount: el('setup-count'),
    setupStart: el('setup-start'), setupBack: el('setup-back'),
    errPanel: el('err-panel'), errList: el('err-list'), errEmpty: el('err-empty'), errHint: el('err-hint'),
    ownList: el('own-list'), ownEmpty: el('own-empty'), create: el('create'),
    editor: el('editor'), edForm: el('ed-form'), edHeading: el('ed-heading'), edName: el('ed-name'), edQuestions: el('ed-questions'),
    edAdd: el('ed-add'), edMsg: el('ed-msg'), edSave: el('ed-save'), edCancel: el('ed-cancel'), tplQuestion: el('tpl-question'),
    quiz: el('quiz'), back: el('back'), badge: el('badge'), title: el('quiz-title'), meta: el('quiz-meta'), scoreNum: el('score-num'), steps: el('steps'),
    play: el('play'), counter: el('counter'), question: el('question'), answers: el('answers'), artHint: el('art-hint'),
    checkRow: el('check-row'), check: el('check'), timer: el('timer'), timerFill: el('timer-fill'), timerNum: el('timer-num'),
    feedback: el('feedback'), fbTitle: el('fb-title'), fbText: el('fb-text'), next: el('next'),
    result: el('result'), resNum: el('res-num'), resTotal: el('res-total'), resMsg: el('res-msg'), review: el('review'),
    practice: el('practice'), replay: el('replay'), other: el('other')
  };

  let quizze = [];
  let fehler = [];   // gemerkte falsche Antworten: { quiz_id, frage, anzahl }
  // Statistik vom Server: { spiele, richtig, quizze: { <id>: { gespielt, beste, geloest } } }
  let statistik = { spiele: 0, richtig: 0, quizze: {} };
  // Schon mindestens einmal richtig beantwortete Fragen ("<quiz-id>\n<Fragetext>"); sie werden nicht mehr gezogen
  let geloest = new Set();
  let fehlendeFertige = 0;
  let serverOk = false;
  let state = null;
  let editId = null;
  let qCounter = 0;
  let timer = null;
  let setup = null;   // gewähltes Spiel auf dem Einstellungs-Bildschirm: { titel, meta, zaehlen(), bauen() }

  // ---------- Hilfen ----------
  function make(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  // Bei "mehrere" ist richtig eine Liste, sonst eine Zahl
  function richtigeListe(item) {
    return Array.isArray(item.richtig) ? item.richtig : [item.richtig];
  }
  // Richtig ist eine Antwort nur, wenn genau die richtigen gewählt sind
  function istRichtig(item, wahl) {
    if (!wahl) return false;
    const r = richtigeListe(item);
    return wahl.length === r.length && r.every((k) => wahl.includes(k));
  }
  function antwortText(item, liste) {
    return liste.map((k) => item.antworten[k]).join(', ');
  }
  function points() {
    return state.quiz.fragen.reduce((sum, q, i) => sum + (istRichtig(q, state.answers[i]) ? 1 : 0), 0);
  }
  function showMsg(node, text, kind) {
    node.textContent = text || '';
    node.dataset.kind = kind || 'info';
    node.hidden = !text;
  }
  function zahl(n) {
    return Number(n || 0).toLocaleString('de-DE');
  }
  function fragenText(n) {
    return zahl(n) + (n === 1 ? ' Frage' : ' Fragen');
  }
  function setIcon(node, name) {
    node.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" '
      + 'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || ICONS.eigen) + '</svg>';
    return node;
  }
  function icon(name) {
    return setIcon(make('span', 'kat-icon'), name);
  }
  // Kategorie eines Quiz: die sechs fertigen haben eine eigene, alle eigenen Quizze teilen sich "eigen"
  function katVon(id) {
    return KAT_ICON[id] ? id : 'eigen';
  }

  // ---------- Filter: Schwierigkeit und Fragearten ----------
  // Gewählte Häkchen einer Gruppe ("filter-stufe" oder "filter-art")
  function haekchen(name) {
    return Array.from(document.querySelectorAll('input[name="' + name + '"]:checked')).map((x) => x.value);
  }
  function schluessel(quizId, frage) {
    return quizId + '\n' + frage;
  }
  // Nur Fragen, die zur Auswahl passen. Fragen ohne eigenen Grad haben den Grad ihres Quiz.
  // Mit quizId fallen außerdem schon gelöste Fragen weg, außer bei „Alle Fragen“ (nicht beim Fehler-Quiz).
  function passend(fragen, quizStufe, quizId) {
    const stufen = haekchen('filter-stufe');
    const arten = haekchen('filter-art');
    const ohneGeloeste = quizId && !ui.alleFragen.checked;
    return fragen.filter((f) => stufen.includes(f.stufe || quizStufe || 'mittel') && arten.includes(f.art || 'eine')
      && !(ohneGeloeste && geloest.has(schluessel(quizId, f.frage))));
  }
  function geloesteZahl(q) {
    return q.fragen.reduce((n, f) => n + (geloest.has(schluessel(q.id, f.frage)) ? 1 : 0), 0);
  }
  // "24 von 300 Fragen gelöst · 8 %" (abgerundet, 100 % erst, wenn wirklich alle gelöst sind)
  function geloestText(g, alle) {
    return zahl(g) + ' von ' + zahl(alle) + ' Fragen gelöst · ' + (alle ? Math.floor((g / alle) * 100) : 0) + ' %';
  }
  // "leicht" oder "40 leicht, 80 mittel, 30 schwer"
  function stufenText(fragen, quizStufe) {
    const zahl = {};
    fragen.forEach((f) => {
      const s = f.stufe || quizStufe || 'mittel';
      zahl[s] = (zahl[s] || 0) + 1;
    });
    const teile = STUFEN.filter((s) => zahl[s]);
    if (teile.length === 1) return teile[0];
    return teile.map((s) => zahl[s] + ' ' + s).join(', ');
  }
  function newId() {
    return 'q' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }
  function show(name) {
    ui.home.hidden = name !== 'home';
    ui.setup.hidden = name !== 'setup';
    ui.editor.hidden = name !== 'editor';
    ui.quiz.hidden = name !== 'quiz';
    window.scrollTo({ top: 0 });
  }

  // ---------- Server ----------
  async function api(method, path, body) {
    let res;
    try {
      res = await fetch(API + path, {
        method: method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined
      });
    } catch (_) {
      throw new Error('Der Server antwortet nicht. Läuft das schwarze Fenster von starten.bat noch?');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.fehler || 'Der Server meldet einen Fehler.');
    return data;
  }

  function takeList(data) {
    quizze = Array.isArray(data.quizze) ? data.quizze : [];
    fehlendeFertige = Number(data.fehlende_fertige) || 0;
    if (Array.isArray(data.fehler)) fehler = data.fehler;
    if (data.statistik) statistik = data.statistik;
    if (Array.isArray(data.geloest)) geloest = new Set(data.geloest.map((g) => schluessel(g.quiz_id, g.frage)));
  }

  async function loadQuizze() {
    if (location.protocol === 'file:') {
      serverOk = false;
      showMsg(ui.homeMsg, 'Die Quizze liegen in einer Datenbank auf deinem PC. Starte die App bitte mit starten.bat.', 'error');
    } else {
      try {
        takeList(await api('GET', '/quizze'));
        serverOk = true;
      } catch (err) {
        serverOk = false;
        showMsg(ui.homeMsg, 'Die Quizze konnten nicht geladen werden. ' + err.message, 'error');
      }
    }
    ui.create.disabled = !serverOk;
    renderHome();
  }

  // ---------- Übersicht ----------
  function renderHome() {
    const fertige = quizze.filter((q) => q.fertig);
    const eigene = quizze.filter((q) => !q.fertig);
    ui.stdList.replaceChildren(...fertige.map(card));
    ui.ownList.replaceChildren(...eigene.map(card));
    ui.stdEmpty.hidden = !serverOk || fertige.length > 0;
    ui.ownEmpty.hidden = !serverOk || eigene.length > 0;
    ui.restore.hidden = fehlendeFertige === 0;
    ui.restore.textContent = 'Gelöschte fertige Quizze zurückholen (' + fehlendeFertige + ')';
    renderHello();
    renderMix();
    renderFehler();
  }

  // ---------- Begrüßung und Statistik ----------
  function renderHello() {
    const stunde = new Date().getHours();
    ui.helloTitle.textContent = stunde >= 5 && stunde < 11 ? 'Guten Morgen!' : (stunde >= 18 ? 'Guten Abend!' : 'Hallo!');
    const spiele = statistik.spiele || 0;
    ui.hello.hidden = !serverOk;
    ui.stats.hidden = !spiele;
    ui.firstPlay.hidden = spiele > 0;
    ui.statsReset.hidden = !spiele;
    ui.helloText.textContent = spiele
      ? 'Schön, dass du wieder da bist. Such dir ein Quiz aus oder übe deine Fehler.'
      : 'Willkommen in der Quizfabrik. Alles ist bereit für deine erste Runde.';
    ui.statSpiele.textContent = zahl(spiele);
    ui.statRichtig.textContent = zahl(statistik.richtig);
    ui.statFehler.textContent = zahl(fehlerFragen().length);
  }

  // "3× gespielt · beste Quote 80 %"
  function spielText(s) {
    if (!s || !s.gespielt) return 'Noch nicht gespielt';
    return s.gespielt + '× gespielt · beste Quote ' + s.beste + ' %';
  }

  // Fortschritt eines Quiz: wie viele seiner Fragen schon mindestens einmal richtig beantwortet wurden
  // (in diesem Quiz, im IT-Mix, im Fehler-Quiz oder beim Üben)
  function fortschritt(q) {
    const s = statistik.quizze[q.id] || {};
    const alle = q.fragen.length;
    const g = geloesteZahl(q);
    const box = make('span', 'card-progress');
    box.title = 'Gelöst heißt: mindestens einmal richtig beantwortet. Gelöste Fragen kommen nicht mehr dran, außer du wählst „Alle Fragen“.';
    const bar = make('span', 'bar');
    bar.setAttribute('aria-hidden', 'true');
    const fill = make('span', 'bar-fill');
    fill.style.width = (alle ? (g / alle) * 100 : 0) + '%';
    bar.append(fill);
    box.append(make('span', 'card-stats', spielText(s)), bar, make('span', 'bar-text', geloestText(g, alle)));
    return box;
  }

  async function resetStatistik() {
    if (!window.confirm('Wirklich löschen? Gespielte Quizze, beste Quoten und der Fortschritt werden auf null gesetzt. Alle Fragen gelten dann wieder als ungelöst und kommen wieder dran. Deine Quizze und deine Fehler bleiben.')) return;
    try {
      const data = await api('DELETE', '/statistik');
      statistik = data.statistik;
      geloest = new Set();
      renderHome();
      showMsg(ui.homeMsg, 'Die Statistik ist zurückgesetzt.', 'ok');
    } catch (err) {
      showMsg(ui.homeMsg, err.message, 'error');
    }
  }

  // Nach jedem beendeten Spiel: Ergebnis und richtig beantwortete Fragen in der Datenbank speichern
  function spielSpeichern() {
    const q = state.quiz;
    if (!serverOk || state.gespeichert) return;
    state.gespeichert = true;
    const art = q.uebung ? 'uebung' : (q.quelle === 'mix' || q.quelle === 'fehler' ? q.quelle : 'quiz');
    const richtige = q.fragen
      .filter((item, i) => item.herkunft && istRichtig(item, state.answers[i]))
      .map((item) => ({ quiz_id: item.herkunft, frage: item.frage }));
    api('POST', '/spiele', {
      art: art, quiz_id: typeof q.quelle === 'string' ? q.quelle : q.quelle.id,
      anzahl: q.fragen.length, richtig: points(), richtige: richtige
    }).then((data) => {
      if (data.statistik) statistik = data.statistik;
    }).catch(() => {
      /* Spielen geht weiter, auch wenn das Speichern einmal nicht klappt */
    });
  }

  // ---------- IT-Mix: Fragen aus allen fertigen Quizzen ----------
  // Eigene Quizze sind nicht dabei, sie können ganz andere Themen haben
  function mixQuellen() {
    return quizze.filter((q) => q.fertig);
  }

  function mixMeta() {
    const quellen = mixQuellen();
    const alle = quellen.reduce((s, q) => s + q.fragen.length, 0);
    return fragenText(alle) + ' aus ' + quellen.length + (quellen.length === 1 ? ' Kategorie' : ' Kategorien');
  }

  function renderMix() {
    ui.mixPanel.hidden = !serverOk || !mixQuellen().length;
    ui.mixMeta.textContent = mixMeta();
    const s = statistik.quizze.mix;
    ui.mixStats.hidden = !s || !s.gespielt;
    ui.mixStats.textContent = spielText(s);
    // Fortschritt über alle fertigen Quizze zusammen
    const quellen = mixQuellen();
    const alle = quellen.reduce((n, q) => n + q.fragen.length, 0);
    const g = quellen.reduce((n, q) => n + geloesteZahl(q), 0);
    ui.mixProgress.hidden = !serverOk;
    ui.mixProgress.title = 'Gelöst heißt: mindestens einmal richtig beantwortet, egal in welchem Quiz.';
    ui.mixBar.style.width = (alle ? (g / alle) * 100 : 0) + '%';
    ui.mixBarText.textContent = geloestText(g, alle);
  }

  function mixSetup() {
    openSetup({
      kat: 'mix',
      titel: 'IT-Mix – Fragen aus allen Kategorien',
      meta: mixMeta() + ', gleichmäßig gemischt',
      zaehlen: () => mixQuellen().reduce((s, q) => s + passend(q.fragen, q.stufe, q.id).length, 0),
      bauen: mixQuiz
    });
  }

  // Zieht reihum aus den gemischten Kategorien, damit keine Kategorie überwiegt
  function mixQuiz() {
    const quellen = mixQuellen();
    const kategorien = shuffle(quellen)
      .map((q) => ({ q: q, fragen: shuffle(passend(q.fragen, q.stufe, q.id)) }))
      .filter((k) => k.fragen.length);
    const gesamt = kategorien.reduce((s, k) => s + k.fragen.length, 0);
    const n = Math.min(wahl('anzahl', 10), gesamt);
    const gezogen = [];
    for (let runde = 0; gezogen.length < n; runde++) {
      kategorien.forEach((k) => {
        if (gezogen.length < n && runde < k.fragen.length) {
          gezogen.push(reshuffle(Object.assign({}, k.fragen[runde], { herkunftTitel: k.q.titel }), k.q.id));
        }
      });
    }
    return {
      titel: 'IT-Mix', stufe: 'gemischt', gesamt: gesamt, alle: quellen.reduce((s, q) => s + q.fragen.length, 0),
      quelle: 'mix', kat: 'mix', mixQuiz: true, zeit: wahl('zeit', 0), fragen: shuffle(gezogen)
    };
  }

  // ---------- Deine Fehler ----------
  // Sucht die gemerkten Fragen in den Quizzen. Gelöschte oder umgeschriebene Fragen fallen weg.
  function fehlerFragen() {
    const byId = new Map(quizze.map((q) => [q.id, q]));
    const liste = [];
    fehler.forEach((f) => {
      const q = byId.get(f.quiz_id);
      const item = q && q.fragen.find((x) => x.frage === f.frage);
      if (item) liste.push(Object.assign({}, item, { herkunft: q.id, herkunftTitel: q.titel }));
    });
    return liste;
  }

  function renderFehler() {
    ui.errPanel.hidden = !serverOk;
    const fragen = fehlerFragen();
    ui.errEmpty.hidden = fragen.length > 0;
    ui.errHint.hidden = !fragen.length;
    if (!fragen.length) {
      ui.errList.replaceChildren();
      return;
    }
    const anzahlQuizze = new Set(fragen.map((f) => f.herkunft)).size;
    const li = make('li', 'card');
    li.dataset.kat = 'fehler';
    const main = make('button', 'card-main');
    main.type = 'button';
    const meta = fragenText(fragen.length) + ' aus ' + anzahlQuizze + (anzahlQuizze === 1 ? ' Quiz' : ' Quizzen');
    const body = make('span', 'card-body');
    body.append(make('span', 'card-title', 'Fehler-Quiz'), make('span', 'card-meta', meta));
    main.append(icon('fehler'), body);
    main.addEventListener('click', () => openSetup({
      kat: 'fehler',
      titel: 'Fehler-Quiz',
      meta: 'Deine gespeicherten Fehler: ' + meta,
      zaehlen: () => passend(fehlerFragen()).length,
      bauen: fehlerQuiz
    }));
    const tools = make('div', 'card-tools');
    const del = make('button', 'is-danger', 'Liste leeren');
    del.type = 'button';
    del.addEventListener('click', clearFehler);
    tools.append(del);
    li.append(main, tools);
    ui.errList.replaceChildren(li);
  }

  async function clearFehler() {
    if (!window.confirm('Willst du alle gespeicherten Fehler löschen? Die Quizze selbst bleiben.')) return;
    try {
      await api('DELETE', '/fehler');
      fehler = [];
      renderHome();
      showMsg(ui.homeMsg, 'Deine Fehlerliste ist leer.', 'ok');
    } catch (err) {
      showMsg(ui.homeMsg, err.message, 'error');
    }
  }

  // Merkt sich eine falsche Antwort bzw. streicht eine richtig beantwortete Frage.
  // Die Liste im Browser wird sofort angepasst, der Server speichert im Hintergrund.
  function merken(item, ok) {
    if (!serverOk || !item.herkunft) return;
    const pos = fehler.findIndex((f) => f.quiz_id === item.herkunft && f.frage === item.frage);
    if (ok) {
      if (pos >= 0) fehler.splice(pos, 1);
      geloest.add(schluessel(item.herkunft, item.frage));   // der Server speichert das sofort mit
    } else if (pos >= 0) {
      const f = fehler.splice(pos, 1)[0];
      f.anzahl++;
      fehler.unshift(f);
    } else {
      fehler.unshift({ quiz_id: item.herkunft, frage: item.frage, anzahl: 1 });
    }
    api('POST', '/fehler', { quiz_id: item.herkunft, frage: item.frage, richtig: ok }).catch(() => {
      /* Spielen geht weiter, auch wenn das Merken einmal nicht klappt */
    });
  }

  async function restoreFertige() {
    ui.restore.disabled = true;
    try {
      const data = await api('POST', '/fertige-quizze', {});
      takeList(data);
      renderHome();
      showMsg(ui.homeMsg, data.zurueckgeholt === 1 ? '1 fertiges Quiz ist wieder da.' : data.zurueckgeholt + ' fertige Quizze sind wieder da.', 'ok');
    } catch (err) {
      showMsg(ui.homeMsg, err.message, 'error');
    } finally {
      ui.restore.disabled = false;
    }
  }

  function card(q) {
    const kat = katVon(q.id);
    const li = make('li', 'card');
    li.dataset.kat = kat;
    const main = make('button', 'card-main');
    main.type = 'button';
    const meta = fragenText(q.fragen.length) + ' · ' + stufenText(q.fragen, q.stufe);
    const body = make('span', 'card-body');
    body.append(make('span', 'card-title', q.titel), make('span', 'card-meta', meta));
    if (serverOk) {
      body.append(fortschritt(q));
      // 100 %: kleine, ruhige Auszeichnung
      if (q.fragen.length && geloesteZahl(q) === q.fragen.length) {
        li.classList.add('is-fertig');
        body.firstChild.after(make('span', 'done-badge', '✓ Alles gelöst'));
      }
    }
    main.append(icon(KAT_ICON[kat]), body);
    main.addEventListener('click', () => openSetup({
      kat: kat,
      titel: q.titel,
      meta: meta,
      zaehlen: () => passend(q.fragen, q.stufe, q.id).length,
      bauen: () => remix(q)
    }));
    li.append(main);
    if (serverOk) {
      const tools = make('div', 'card-tools');
      const edit = make('button', null, 'Bearbeiten');
      edit.type = 'button';
      edit.setAttribute('aria-label', '„' + q.titel + '“ bearbeiten');
      edit.addEventListener('click', () => openEditor(q));
      const del = make('button', 'is-danger', 'Löschen');
      del.type = 'button';
      del.setAttribute('aria-label', '„' + q.titel + '“ löschen');
      del.addEventListener('click', () => removeQuiz(q));
      tools.append(edit, del);
      li.append(tools);
    }
    return li;
  }

  async function removeQuiz(q) {
    if (!window.confirm('Willst du das Quiz „' + q.titel + '“ wirklich löschen?')) return;
    try {
      await api('DELETE', '/quizze/' + encodeURIComponent(q.id));
      quizze = quizze.filter((x) => x.id !== q.id);
      if (q.fertig) fehlendeFertige++;
      renderHome();
      showMsg(ui.homeMsg, '„' + q.titel + '“ wurde gelöscht.', 'ok');
    } catch (err) {
      showMsg(ui.homeMsg, err.message, 'error');
    }
  }

  // ---------- Editor ----------
  function openEditor(q) {
    editId = q ? q.id : null;
    ui.edHeading.textContent = !q ? 'Neues Quiz' : (q.fertig ? 'Fertiges Quiz bearbeiten' : 'Quiz bearbeiten');
    ui.edName.value = q ? q.titel : '';
    ui.edName.classList.remove('is-invalid');
    const stufe = (q && q.stufe) || 'mittel';
    const radio = ui.edForm.querySelector('input[name="ed-stufe"][value="' + stufe + '"]');
    if (radio) radio.checked = true;
    ui.edQuestions.replaceChildren();
    const fragen = q ? q.fragen : [null, null, null];
    fragen.forEach((f) => addQuestion(f));
    showMsg(ui.edMsg, '');
    showMsg(ui.homeMsg, '');
    show('editor');
    ui.edName.focus();
  }

  // Kleine Auswahlknöpfe (Radio + Label) in eine Zeile setzen
  function segRadio(row, name, id, value, text, checked) {
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = name;
    input.id = id;
    input.value = value;
    input.checked = checked;
    const label = make('label', null, text);
    label.htmlFor = id;
    row.append(input, label);
    return input;
  }

  function addQuestion(f) {
    const n = ++qCounter;
    const box = ui.tplQuestion.content.firstElementChild.cloneNode(true);
    const art = (f && f.art) || 'eine';
    const wf = art === 'wahrfalsch';
    const richtige = f ? richtigeListe(f) : [];

    const artRow = box.querySelector('.ed-art .seg-row');
    ARTEN.forEach(([wert, name]) => {
      const input = segRadio(artRow, 'art-' + n, 'art-' + n + '-' + wert, wert, name, wert === art);
      input.addEventListener('change', () => setArt(box, wert));
    });

    // Schwierigkeit der Frage, Standard ist die Schwierigkeit des Quiz
    const stufe = (f && f.stufe) || ui.edForm.elements['ed-stufe'].value || 'mittel';
    const stufeRow = box.querySelector('.ed-qstufe .seg-row');
    STUFEN.forEach((wert) => segRadio(stufeRow, 'qstufe-' + n, 'qstufe-' + n + '-' + wert, wert, wert, wert === stufe));

    const answers = box.querySelector('.ed-answers');
    LETTERS.forEach((letter, k) => {
      const row = make('div', 'ed-ans');
      const pick = make('label', 'ed-pick');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'richtig-' + n;
      radio.value = String(k);
      if (!wf && richtige.includes(k)) radio.checked = true;
      pick.append(radio, make('span', 'letter', letter));
      const input = make('input', 'text-in ed-ant');
      input.type = 'text';
      input.maxLength = 150;
      input.placeholder = 'Antwort ' + letter;
      input.setAttribute('aria-label', 'Antwort ' + letter);
      if (f && !wf) input.value = f.antworten[k] || '';
      row.append(pick, input);
      answers.append(row);
    });

    const wfRow = box.querySelector('.ed-wf .seg-row');
    WAHR_FALSCH.forEach((name, k) => {
      segRadio(wfRow, 'wf-' + n, 'wf-' + n + '-' + k, String(k), name.toLowerCase(), wf && f.richtig === k);
    });

    setArt(box, art);
    if (f) {
      box.querySelector('.ed-frage').value = f.frage;
      box.querySelector('.ed-erkl').value = f.erklaerung || '';
    }
    box.querySelector('.ed-remove').addEventListener('click', () => {
      box.remove();
      renumber();
    });
    box.addEventListener('input', (e) => e.target.classList.remove('is-invalid'));
    ui.edQuestions.append(box);
    renumber();
    return box;
  }

  // Stellt eine Frage im Editor auf die gewählte Art um. Schon geschriebene Antworten bleiben stehen.
  function setArt(box, art) {
    const wf = art === 'wahrfalsch';
    box.dataset.art = art;
    box.querySelector('.ed-answers').hidden = wf;
    box.querySelector('.ed-wf').hidden = !wf;
    box.querySelector('.ed-frage-label').textContent = wf ? 'Aussage' : 'Frage';
    box.querySelector('.ed-frage').placeholder = wf ? 'z. B. Ein Byte hat 8 Bit.' : 'Was möchtest du fragen?';
    box.querySelector('.ed-art-hint').textContent = ART_HINWEIS[art];
    let schon = false;
    box.querySelectorAll('.ed-pick input').forEach((input, k) => {
      // Bei "eine richtige" bleibt nur der erste Haken stehen
      if (art === 'eine' && input.checked) {
        if (schon) input.checked = false;
        schon = true;
      }
      input.type = art === 'mehrere' ? 'checkbox' : 'radio';
      input.setAttribute('aria-label', 'Antwort ' + LETTERS[k] + ' ist richtig');
    });
  }

  function renumber() {
    const boxes = ui.edQuestions.querySelectorAll('.ed-q');
    boxes.forEach((b, i) => {
      b.querySelector('.ed-q-num').textContent = 'Frage ' + (i + 1);
      b.querySelector('.ed-remove').hidden = boxes.length === 1;
    });
  }

  // Liest das Formular. Gibt das Quiz zurück oder einen Fehler mit dem Feld, das fehlt.
  function readEditor() {
    const titel = ui.edName.value.trim();
    if (!titel) return { error: 'Gib deinem Quiz einen Titel.', field: ui.edName };
    const fragen = [];
    const quizStufe = ui.edForm.elements['ed-stufe'].value || 'mittel';
    const boxes = Array.from(ui.edQuestions.querySelectorAll('.ed-q'));
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      const nr = 'Frage ' + (i + 1);
      const art = box.dataset.art || 'eine';
      const stufeWahl = box.querySelector('.ed-qstufe input:checked');
      const stufe = stufeWahl ? stufeWahl.value : quizStufe;
      const frageIn = box.querySelector('.ed-frage');
      const erkl = box.querySelector('.ed-erkl').value.trim();
      const frage = frageIn.value.trim();
      if (art === 'wahrfalsch') {
        const wahl = box.querySelector('.ed-wf input:checked');
        if (!frage && !erkl && !wahl) continue;
        if (!frage) return { error: nr + ': Die Aussage fehlt.', field: frageIn };
        if (!wahl) return { error: nr + ': Wähl, ob die Aussage wahr oder falsch ist.', field: box.querySelector('.ed-wf input') };
        fragen.push({ art: art, stufe: stufe, frage: frage, antworten: WAHR_FALSCH.slice(), richtig: Number(wahl.value), erklaerung: erkl });
        continue;
      }
      const antIns = Array.from(box.querySelectorAll('.ed-ant'));
      const antworten = antIns.map((a) => a.value.trim());
      const checked = Array.from(box.querySelectorAll('.ed-pick input:checked')).map((x) => Number(x.value));
      // Ganz leere Fragen einfach überspringen
      if (!frage && antworten.every((a) => !a) && !erkl && !checked.length) continue;
      if (!frage) return { error: nr + ': Die Frage fehlt.', field: frageIn };
      const leer = antworten.findIndex((a) => !a);
      if (leer >= 0) return { error: nr + ': Antwort ' + LETTERS[leer] + ' fehlt.', field: antIns[leer] };
      if (!checked.length) {
        const text = art === 'mehrere' ? ': Klick auf die Buchstaben aller richtigen Antworten.' : ': Klick auf den Buchstaben der richtigen Antwort.';
        return { error: nr + text, field: box.querySelector('.ed-pick input') };
      }
      fragen.push({ art: art, stufe: stufe, frage: frage, antworten: antworten, richtig: art === 'mehrere' ? checked : checked[0], erklaerung: erkl });
    }
    if (!fragen.length) return { error: 'Schreib mindestens eine Frage.', field: boxes.length ? boxes[0].querySelector('.ed-frage') : ui.edAdd };
    return { quiz: { titel: titel, stufe: quizStufe, fragen: fragen } };
  }

  async function saveEditor(e) {
    e.preventDefault();
    const r = readEditor();
    if (r.error) {
      showMsg(ui.edMsg, r.error, 'error');
      if (r.field) {
        if (r.field.classList.contains('text-in')) r.field.classList.add('is-invalid');
        r.field.focus();
      }
      return;
    }
    if (!serverOk) {
      showMsg(ui.edMsg, 'Speichern geht nur, wenn du die App mit starten.bat öffnest.', 'error');
      return;
    }
    const id = editId || newId();
    ui.edSave.disabled = true;
    try {
      const data = await api('PUT', '/quizze/' + encodeURIComponent(id), r.quiz);
      const saved = data.quiz;
      const pos = quizze.findIndex((x) => x.id === saved.id);
      if (pos >= 0) quizze[pos] = saved; else quizze.push(saved);
      renderHome();
      show('home');
      showMsg(ui.homeMsg, '„' + saved.titel + '“ ist gespeichert.', 'ok');
    } catch (err) {
      showMsg(ui.edMsg, err.message, 'error');
    } finally {
      ui.edSave.disabled = false;
    }
  }

  // ---------- Spielen ----------
  // Gleiche Frage, Antworten neu gemischt, damit man sich nicht nur die Position merkt
  // Wahr/Falsch bleibt in fester Reihenfolge
  // herkunft = Kennung des Quiz, aus dem die Frage stammt (für "Deine Fehler")
  function reshuffle(item, herkunft) {
    const art = item.art || 'eine';
    const order = art === 'wahrfalsch' ? [0, 1] : shuffle([0, 1, 2, 3]);
    const neu = (k) => order.indexOf(k);
    return {
      art: art,
      stufe: item.stufe,
      frage: item.frage,
      antworten: order.map((i) => item.antworten[i]),
      richtig: Array.isArray(item.richtig) ? item.richtig.map(neu) : neu(item.richtig),
      erklaerung: item.erklaerung || '',
      herkunft: herkunft || item.herkunft,
      herkunftTitel: item.herkunftTitel
    };
  }

  function wahl(name, standard) {
    const checked = document.querySelector('input[name="' + name + '"]:checked');
    return checked ? Number(checked.value) : standard;
  }

  // Zieht so viele zufällige Fragen, wie oben gewählt sind (ohne Wiederholung),
  // nur aus den Fragen, die zu Schwierigkeit und Fragearten passen
  function remix(q) {
    const pool = passend(q.fragen, q.stufe, q.id);
    const n = Math.min(wahl('anzahl', 10), pool.length);
    return {
      titel: q.titel, stufe: q.stufe || 'mittel', gesamt: pool.length, alle: q.fragen.length, quelle: q, kat: katVon(q.id), zeit: wahl('zeit', 0),
      fragen: shuffle(pool).slice(0, n).map((item) => reshuffle(item, q.id))
    };
  }

  // Quiz aus den gemerkten Fehlern, gemischt aus allen Quizzen (auch hier mit Filter)
  function fehlerQuiz() {
    const alle = passend(fehlerFragen());
    const n = Math.min(wahl('anzahl', 10), alle.length);
    return {
      titel: 'Fehler-Quiz', stufe: 'gemischt', gesamt: alle.length, quelle: 'fehler', kat: 'fehler', fehlerQuiz: true, zeit: wahl('zeit', 0),
      fragen: shuffle(alle).slice(0, n).map((item) => reshuffle(item))
    };
  }

  function play(quiz) {
    stopTimer();
    state = { quiz: quiz, index: 0, answers: [], zeitUm: [], auswahl: [], phase: 'play' };
    show('quiz');
    render();
    startTimer();
    ui.question.focus({ preventScroll: true });
  }

  // ---------- Zeitlimit ----------
  function stopTimer() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function startTimer() {
    stopTimer();
    const sekunden = state.quiz.zeit || 0;
    ui.timer.hidden = !sekunden;
    if (!sekunden) return;
    const ende = Date.now() + sekunden * 1000;
    const tick = () => {
      const rest = Math.max(0, ende - Date.now());
      const s = Math.ceil(rest / 1000);
      ui.timerNum.textContent = s + ' s';
      ui.timerFill.style.width = (rest / (sekunden * 1000)) * 100 + '%';
      ui.timer.classList.toggle('is-low', s <= 5);
      if (rest <= 0) {
        stopTimer();
        zeitIstUm();
      }
    };
    tick();
    timer = setInterval(tick, 100);
  }

  // Zeit um: Die Frage zählt als falsch
  function zeitIstUm() {
    if (!state || state.phase !== 'play' || state.answers[state.index] != null) return;
    state.zeitUm[state.index] = true;
    werten([]);
  }

  // ---------- Einstellungs-Bildschirm vor jedem Spiel ----------
  function openSetup(s) {
    showMsg(ui.homeMsg, '');
    setup = s;
    // „Alle Fragen“ gilt nur für dieses eine Spiel; das Fehler-Quiz zeigt ohnehin nur gemerkte Fehler
    ui.alleFragen.checked = false;
    ui.setupGeloest.hidden = s.kat === 'fehler';
    ui.setup.dataset.kat = s.kat || 'eigen';
    setIcon(ui.setupIcon, KAT_ICON[s.kat]);
    ui.setupTitle.textContent = s.titel;
    ui.setupMeta.textContent = s.meta;
    updateSetup();
    show('setup');
    ui.setupStart.focus({ preventScroll: true });
  }

  // Zeigt live, wie viele Fragen zur Auswahl passen; passt keine, ist Starten nicht möglich
  function updateSetup() {
    if (!setup) return;
    const n = setup.zaehlen();
    const anzahl = wahl('anzahl', 10);
    // Wie viele wären es mit „Alle Fragen“? So sieht man, ob gelöste Fragen ausgeblendet sind.
    let mitGeloesten = n;
    if (!ui.alleFragen.checked && setup.kat !== 'fehler') {
      ui.alleFragen.checked = true;
      mitGeloesten = setup.zaehlen();
      ui.alleFragen.checked = false;
    }
    ui.setupAlle.hidden = true;
    if (!n && mitGeloesten) {
      ui.setupCount.dataset.kind = 'fertig';
      ui.setupCount.textContent = 'Du hast alle passenden Fragen hier gelöst! Mit „Alle Fragen“ kannst du sie wiederholen.';
      ui.setupAlle.hidden = false;
    } else if (!n) {
      ui.setupCount.dataset.kind = 'leer';
      ui.setupCount.textContent = 'Keine Frage passt zu deiner Auswahl. Setz bei Schwierigkeit oder Fragearten weitere Häkchen.';
    } else {
      ui.setupCount.dataset.kind = 'ok';
      ui.setupCount.textContent = (n === 1 ? '1 Frage passt' : n + ' Fragen passen') + ' zu deiner Auswahl'
        + (n <= anzahl ? ', alle kommen dran.' : ', ' + anzahl + ' davon werden zufällig gezogen.')
        + (mitGeloesten > n ? ' Schon gelöste Fragen sind ausgeblendet.' : '');
    }
    ui.setupStart.disabled = !n;
  }

  function startSetup() {
    if (!setup || ui.setupStart.disabled) return;
    const quiz = setup.bauen();
    if (!quiz.fragen.length) {
      updateSetup();
      return;
    }
    play(quiz);
  }

  function render() {
    const q = state.quiz;
    ui.badge.hidden = !q.uebung && !q.fehlerQuiz;
    ui.badge.textContent = q.uebung ? 'Fehler üben' : 'Deine Fehler';
    ui.quiz.dataset.kat = q.kat || 'eigen';
    setIcon(ui.quizIcon, KAT_ICON[q.kat]);
    ui.title.textContent = q.titel;
    if (q.uebung) ui.meta.textContent = fragenText(q.fragen.length) + ' zum Wiederholen · Runde ' + q.runde;
    else if (q.fehlerQuiz) {
      ui.meta.textContent = q.fragen.length < q.gesamt
        ? q.fragen.length + ' von ' + q.gesamt + ' gespeicherten Fehlern'
        : fragenText(q.fragen.length) + ' aus deinen Fehlern';
    } else {
      const gefiltert = q.alle && q.gesamt < q.alle;
      const teil = q.fragen.length < q.gesamt
        ? q.fragen.length + ' von ' + q.gesamt + (gefiltert ? ' passenden' : '') + ' Fragen'
        : fragenText(q.fragen.length) + (gefiltert ? ' (alle passenden)' : '');
      ui.meta.textContent = teil + ' · ' + stufenText(q.fragen, q.stufe);
    }
    if (q.zeit) ui.meta.textContent += ' · ' + q.zeit + ' s pro Frage';
    ui.scoreNum.textContent = points();
    renderSteps();
    const done = state.phase === 'result';
    ui.play.hidden = done;
    ui.result.hidden = !done;
    if (done) renderResult(); else renderQuestion();
  }

  function renderSteps() {
    const items = state.quiz.fragen.map((q, i) => {
      const li = document.createElement('li');
      const a = state.answers[i];
      if (a != null) li.className = istRichtig(q, a) ? 'is-right' : 'is-wrong';
      else if (i === state.index && state.phase === 'play') li.className = 'is-current';
      return li;
    });
    ui.steps.replaceChildren(...items);
  }

  function renderQuestion() {
    const fragen = state.quiz.fragen;
    const i = state.index;
    const item = fragen[i];
    const chosen = state.answers[i];
    const answered = chosen != null;
    const mehrere = item.art === 'mehrere';
    const wf = item.art === 'wahrfalsch';
    const richtige = richtigeListe(item);

    ui.counter.replaceChildren('Frage ' + (i + 1) + ' von ' + fragen.length + (wf ? ' · Wahr oder falsch?' : ''));
    if (item.herkunftTitel) {
      // Kategorie-Hinweis in der Farbe des Quiz, aus dem die Frage stammt
      const chip = make('span', 'kat-chip', state.quiz.mixQuiz ? 'Kategorie: ' + item.herkunftTitel : 'aus „' + item.herkunftTitel + '“');
      chip.dataset.kat = katVon(item.herkunft);
      ui.counter.append(make('span', 'sep', ' · '), chip);
    }
    ui.question.textContent = item.frage;
    ui.artHint.hidden = !mehrere || answered;

    const buttons = item.antworten.map((text, k) => {
      const b = make('button', 'answer');
      b.type = 'button';
      b.append(make('span', 'letter', wf ? text.charAt(0) : LETTERS[k]), make('span', 'text', text));
      if (answered) {
        b.disabled = true;
        const r = richtige.includes(k);
        const c = chosen.includes(k);
        if (r && (c || !mehrere)) b.classList.add('is-right');
        else if (r) {
          b.classList.add('is-missed');
          b.append(make('span', 'tag-missed', 'fehlte'));
        } else if (c) b.classList.add('is-wrong');
        else b.classList.add('is-dim');
      } else {
        if (mehrere) {
          const an = state.auswahl.includes(k);
          b.classList.toggle('is-picked', an);
          b.setAttribute('aria-pressed', String(an));
        }
        b.addEventListener('click', () => choose(k));
      }
      return b;
    });
    ui.answers.replaceChildren(...buttons);
    ui.checkRow.hidden = !mehrere || answered;
    ui.check.disabled = !state.auswahl.length;

    ui.feedback.hidden = !answered;
    if (answered) {
      const ok = istRichtig(item, chosen);
      const loesung = wf
        ? 'Die Aussage ist ' + item.antworten[richtige[0]].toLowerCase() + '.'
        : (richtige.length > 1 ? 'Richtig sind: ' : 'Richtig ist: ') + antwortText(item, richtige);
      const anfang = state.zeitUm[i] ? 'Die Zeit ist um! ' : (mehrere ? 'Leider nicht ganz. ' : 'Leider falsch. ');
      ui.feedback.className = 'feedback ' + (ok ? 'ok' : 'no');
      ui.fbTitle.textContent = ok ? (mehrere ? 'Richtig! Du hast alle richtigen Antworten gefunden.' : 'Richtig!') : anfang + loesung;
      ui.fbText.textContent = item.erklaerung || '';
      ui.fbText.hidden = !item.erklaerung;
      ui.next.textContent = i < fragen.length - 1 ? 'Nächste Frage' : 'Ergebnis ansehen';
    }
  }

  function verdict(p, n) {
    const r = n ? p / n : 0;
    if (r === 1) return 'Alles richtig. Stark!';
    if (r >= 0.8) return 'Sehr gut! Fast alles gewusst.';
    if (r >= 0.5) return 'Gut gemacht! Mehr als die Hälfte war richtig.';
    return 'Das war knifflig. Spiel es noch mal, dann klappt es besser.';
  }

  function practiceVerdict(wrong, n) {
    if (wrong === 0) return 'Alles sitzt! Jetzt kannst du jede Frage aus dem Quiz.';
    const rest = 'Noch ' + fragenText(wrong) + ' übrig. Übe sie gleich noch einmal.';
    return wrong < n ? 'Schon besser! ' + rest : rest;
  }

  function renderResult() {
    const q = state.quiz;
    const fragen = q.fragen;
    const p = points();
    const wrong = fragen.length - p;
    ui.resNum.textContent = p;
    ui.resTotal.textContent = fragen.length;
    // Kreis-Diagramm der Quote, füllt sich weich bis zum Ergebnis
    const pct = fragen.length ? Math.round((p / fragen.length) * 100) : 0;
    const umfang = 2 * Math.PI * 52;
    ui.resPct.textContent = pct;
    ui.ring.setAttribute('aria-label', pct + ' Prozent richtig');
    ui.ringFill.style.strokeDasharray = umfang;
    ui.ringFill.style.strokeDashoffset = umfang;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      ui.ringFill.style.strokeDashoffset = umfang * (1 - pct / 100);
    }));
    const rest = fehlerFragen().length;
    let msg = q.uebung ? practiceVerdict(wrong, fragen.length) : verdict(p, fragen.length);
    if (q.fehlerQuiz) {
      if (p === 0) msg = 'Diesmal saß noch keine Frage. Bleib dran! ';
      else msg = (p === 1 ? '1 Frage sitzt jetzt und ist' : p + ' Fragen sitzen jetzt und sind') + ' aus deinen Fehlern raus. ';
      msg += rest ? 'Noch ' + fragenText(rest) + ' gespeichert.' : 'Deine Fehlerliste ist leer. Super!';
    }
    ui.resMsg.textContent = msg;
    ui.practice.hidden = wrong === 0;
    ui.practice.textContent = 'Fehler üben (' + wrong + ')';
    // Beim Fehler-Quiz geht "Noch mal" nur, solange noch Fehler gespeichert sind
    const nochmal = q.quelle !== 'fehler' || rest > 0;
    ui.replay.hidden = !nochmal;
    ui.replay.className = 'btn ' + (wrong || !nochmal ? 'btn-ghost' : 'btn-primary');
    ui.replay.textContent = q.quelle === 'fehler' ? 'Neue Fehler-Runde' : (q.uebung ? 'Neues Spiel' : 'Noch mal spielen');

    const rows = fragen.map((item, i) => {
      const a = state.answers[i];
      const ok = istRichtig(item, a);
      const deine = state.zeitUm[i] ? 'keine, die Zeit war um' : (a && a.length ? antwortText(item, a) : '–');
      const li = make('li', ok ? 'is-right' : 'is-wrong');
      li.append(
        make('span', 'tag', ok ? 'Richtig' : 'Falsch'),
        make('p', 'review-q', (i + 1) + '. ' + item.frage),
        make('p', 'review-a', 'Deine Antwort: ' + deine)
      );
      if (!ok) li.append(make('p', 'review-a', 'Richtig wäre: ' + antwortText(item, richtigeListe(item))));
      if (item.erklaerung) li.append(make('p', 'review-x', item.erklaerung));
      return li;
    });
    ui.review.replaceChildren(...rows);
  }

  // Klick auf eine Antwort. Bei "mehrere" wird nur an- oder abgewählt, gewertet wird mit "Prüfen".
  function choose(k) {
    if (!state || state.phase !== 'play' || state.answers[state.index] != null) return;
    const item = state.quiz.fragen[state.index];
    if (k >= item.antworten.length) return;
    if (item.art !== 'mehrere') {
      werten([k]);
      return;
    }
    const pos = state.auswahl.indexOf(k);
    if (pos >= 0) state.auswahl.splice(pos, 1); else state.auswahl.push(k);
    const b = ui.answers.children[k];
    b.classList.toggle('is-picked', pos < 0);
    b.setAttribute('aria-pressed', String(pos < 0));
    ui.check.disabled = !state.auswahl.length;
  }

  function pruefen() {
    if (state && state.auswahl.length) werten(state.auswahl);
  }

  function werten(liste) {
    if (!state || state.phase !== 'play' || state.answers[state.index] != null) return;
    stopTimer();
    state.answers[state.index] = liste.slice();
    state.auswahl = [];
    const item = state.quiz.fragen[state.index];
    merken(item, istRichtig(item, liste));
    ui.scoreNum.textContent = points();
    renderSteps();
    renderQuestion();
    ui.next.focus();
  }

  // Neue Frage weich einblenden (Klasse kurz entfernen, damit die Animation neu startet)
  function einblenden() {
    ui.play.classList.remove('neu');
    void ui.play.offsetWidth;
    ui.play.classList.add('neu');
  }

  function goNext() {
    if (state.index < state.quiz.fragen.length - 1) {
      state.index++;
      state.auswahl = [];
      render();
      einblenden();
      startTimer();
      if (ui.quiz.getBoundingClientRect().top < 0) ui.quiz.scrollIntoView({ block: 'start' });
      ui.question.focus({ preventScroll: true });
    } else {
      state.phase = 'result';
      spielSpeichern();
      render();
      if (ui.quiz.getBoundingClientRect().top < 0) ui.quiz.scrollIntoView({ block: 'start' });
    }
  }

  // Neues Spiel mit dem gleichen Quiz und neu gezogenen Fragen
  function replay() {
    const quelle = state.quiz.quelle;
    const quiz = quelle === 'fehler' ? fehlerQuiz() : (quelle === 'mix' ? mixQuiz() : remix(quelle));
    // Alles Passende schon gelöst: zurück zu den Einstellungen, dort steht der Hinweis mit „Alle Fragen“
    if (!quiz.fragen.length) {
      stopTimer();
      state = null;
      if (setup) openSetup(setup); else goHome();
      return;
    }
    play(quiz);
  }

  function practice() {
    const q = state.quiz;
    const wrong = q.fragen.filter((item, i) => !istRichtig(item, state.answers[i]));
    if (!wrong.length) return;
    play({
      titel: q.titel,
      stufe: q.stufe,
      uebung: true,
      runde: (q.runde || 0) + 1,
      quelle: q.quelle,
      kat: q.kat,
      mixQuiz: q.mixQuiz,
      zeit: q.zeit,
      fragen: wrong.map((item) => reshuffle(item))
    });
  }

  function goHome() {
    stopTimer();
    state = null;
    setup = null;
    renderHome();
    show('home');
  }

  // ---------- Ereignisse ----------
  ui.create.addEventListener('click', () => openEditor(null));
  ui.mixStart.addEventListener('click', mixSetup);
  ui.setupStart.addEventListener('click', startSetup);
  ui.setupBack.addEventListener('click', goHome);
  ui.restore.addEventListener('click', restoreFertige);
  ui.statsReset.addEventListener('click', resetStatistik);
  ui.alleFragen.addEventListener('change', updateSetup);
  ui.setupAlle.addEventListener('click', () => {
    ui.alleFragen.checked = true;
    updateSetup();
    ui.setupStart.focus();
  });
  ui.edAdd.addEventListener('click', () => {
    const box = addQuestion(null);
    box.querySelector('.ed-frage').focus();
  });
  ui.edForm.addEventListener('submit', saveEditor);
  ui.edCancel.addEventListener('click', () => show('home'));
  ui.edName.addEventListener('input', () => ui.edName.classList.remove('is-invalid'));
  ui.next.addEventListener('click', goNext);
  ui.check.addEventListener('click', pruefen);
  ui.practice.addEventListener('click', practice);
  ui.replay.addEventListener('click', replay);
  ui.other.addEventListener('click', goHome);
  ui.back.addEventListener('click', goHome);
  document.addEventListener('keydown', (e) => {
    // Einstellungs-Bildschirm: Enter startet, Esc geht zurück
    if (!ui.setup.hidden) {
      if (e.key === 'Enter' && !e.repeat) {
        e.preventDefault();
        startSetup();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        goHome();
      }
      return;
    }
    if (!state || state.phase !== 'play' || ui.quiz.hidden) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (state.answers[state.index] != null) return;
    const item = state.quiz.fragen[state.index];
    const key = String(e.key).toLowerCase();
    // Enter prüft bei "mehrere" (außer ein Knopf hat den Fokus, der reagiert selbst auf Enter)
    if (key === 'enter' && item.art === 'mehrere' && (!t || t.tagName !== 'BUTTON')) {
      e.preventDefault();
      pruefen();
      return;
    }
    const map = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 };
    if (item.art === 'wahrfalsch') { map.w = 0; map.f = 1; }
    const k = map[key];
    if (k !== undefined) {
      e.preventDefault();
      choose(k);
    }
  });

  // Gewählte Anzahl und Zeit im Browser merken
  ['anzahl', 'zeit'].forEach((name) => {
    try {
      const saved = localStorage.getItem('quizfabrik-' + name);
      const input = saved && document.querySelector('input[name="' + name + '"][value="' + saved + '"]');
      if (input) input.checked = true;
    } catch (_) { /* ohne Speicher geht es auch */ }
    document.querySelectorAll('input[name="' + name + '"]').forEach((input) => {
      input.addEventListener('change', () => {
        try { localStorage.setItem('quizfabrik-' + name, input.value); } catch (_) { /* egal */ }
        updateSetup();
      });
    });
  });

  // Filter-Häkchen merken; in jeder Gruppe bleibt mindestens eins an
  ['filter-stufe', 'filter-art'].forEach((name) => {
    const inputs = Array.from(document.querySelectorAll('input[name="' + name + '"]'));
    try {
      const saved = JSON.parse(localStorage.getItem('quizfabrik-' + name) || 'null');
      if (Array.isArray(saved) && inputs.some((i) => saved.includes(i.value))) {
        inputs.forEach((i) => { i.checked = saved.includes(i.value); });
      }
    } catch (_) { /* ohne Speicher geht es auch */ }
    inputs.forEach((input) => {
      input.addEventListener('change', () => {
        if (!inputs.some((i) => i.checked)) {
          input.checked = true;
          ui.setupCount.dataset.kind = 'leer';
          ui.setupCount.textContent = 'Mindestens eine ' + (name === 'filter-stufe' ? 'Schwierigkeit' : 'Frageart') + ' muss ausgewählt bleiben.';
          try { localStorage.setItem('quizfabrik-' + name, JSON.stringify(haekchen(name))); } catch (_) { /* egal */ }
          return;
        }
        try { localStorage.setItem('quizfabrik-' + name, JSON.stringify(haekchen(name))); } catch (_) { /* egal */ }
        updateSetup();
      });
    });
  });

  // ---------- Darstellung (Hell / Dunkel / Automatisch) ----------
  // Die Wahl steht als data-theme auf <html>; das kleine Skript im <head> setzt sie schon vor dem ersten Zeichnen
  function themeJetzt() {
    const t = document.documentElement.dataset.theme;
    return t === 'light' || t === 'dark' ? t : 'auto';
  }
  function themeAnzeigen() {
    if (!el('theme-toggle')) return;   // alte, zwischengespeicherte Seite ohne Schalter: Rest der App läuft trotzdem
    const t = THEMES[themeJetzt()];
    setIcon(el('theme-icon'), t.icon);
    el('theme-label').textContent = t.name;
    const text = 'Darstellung: ' + t.name + ' – klicken für ' + THEMES[t.naechstes].name;
    el('theme-toggle').setAttribute('aria-label', text);
    el('theme-toggle').title = text;
  }
  function themeWechseln() {
    const neu = THEMES[themeJetzt()].naechstes;
    const html = document.documentElement;
    // Weicher Farbwechsel nur für einen Moment (bei „Bewegung reduzieren“ verhindert das CSS ihn)
    html.classList.add('theme-wechsel');
    setTimeout(() => html.classList.remove('theme-wechsel'), 400);
    if (neu === 'auto') delete html.dataset.theme; else html.dataset.theme = neu;
    try {
      if (neu === 'auto') localStorage.removeItem('quizfabrik-theme'); else localStorage.setItem('quizfabrik-theme', neu);
    } catch (_) { /* gilt dann nur bis zum Neuladen */ }
    themeAnzeigen();
  }
  if (el('theme-toggle')) el('theme-toggle').addEventListener('click', themeWechseln);
  themeAnzeigen();

  // ---------- Start ----------
  document.querySelectorAll('[data-icon]').forEach((n) => setIcon(n, n.dataset.icon));
  loadQuizze();
})();

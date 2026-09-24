/*!
 * GECA Pub – sito web
 * Progettazione grafica e sviluppo: Federico Bianchi
 * © 2026 Federico Bianchi. Tutti i diritti riservati.
 * Vietata la riproduzione, anche parziale, senza autorizzazione dell'autore.
 */
// ============================================
// GECA Pub – gestione del consenso ai cookie
// Secondo le Linee guida cookie del Garante Privacy (10 giugno 2021):
// - niente cookie non tecnici prima del consenso (la mappa di Google parte solo se accetti)
// - "Accetta" e "Rifiuta" con la stessa evidenza; chiudere con la X equivale a rifiutare
// - il sito resta usabile anche rifiutando (nessun "cookie wall")
// - la scelta viene ricordata e il banner non viene riproposto prima di 6 mesi
// - la scelta si può cambiare in ogni momento dal link "Preferenze cookie" nel footer
// La scelta è salvata nel browser (localStorage): è uno strumento tecnico, consentito senza consenso.
// ============================================

(function () {
  const KEY = 'geca-consenso-cookie';
  const VERSION = 1;                          // aumentare se cambiano i servizi che usano cookie
  const MAX_AGE = 1000 * 60 * 60 * 24 * 182;  // circa 6 mesi

  // ---------- memoria della scelta ----------
  const readConsent = () => {
    try {
      const c = JSON.parse(localStorage.getItem(KEY));
      if (!c || c.version !== VERSION || Date.now() - c.date > MAX_AGE) return null;
      return c;
    } catch (e) {
      return null;
    }
  };
  const saveConsent = (maps) => {
    const c = { version: VERSION, date: Date.now(), maps: Boolean(maps) };
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { /* navigazione privata: vale solo per questa visita */ }
    return c;
  };

  // ---------- mappa di Google (solo pagina principale) ----------
  const mapFrame = document.getElementById('mapFrame');
  let mapPlaceholder = null;

  const applyConsent = (c) => {
    if (!mapFrame) return;
    const loaded = mapFrame.querySelector('iframe');
    if (c && c.maps && !loaded) {
      mapPlaceholder = mapPlaceholder || mapFrame.firstElementChild;
      const iframe = document.createElement('iframe');
      iframe.src = mapFrame.dataset.src;
      iframe.title = 'Mappa: GECA Pub, Via Palestro 14, Como';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.allowFullscreen = true;
      mapFrame.replaceChildren(iframe);
    } else if ((!c || !c.maps) && loaded && mapPlaceholder) {
      // consenso revocato: la mappa viene tolta (i cookie già installati da Google
      // si eliminano dalle impostazioni del browser, come spiegato nella cookie policy)
      mapFrame.replaceChildren(mapPlaceholder);
    }
  };

  // ---------- banner ----------
  let banner = null;

  const closeBanner = () => {
    if (!banner) return;
    banner.classList.remove('open');
    const b = banner;
    banner = null;
    setTimeout(() => b.remove(), 400);
  };

  const choose = (maps) => {
    applyConsent(saveConsent(maps));
    closeBanner();
  };

  const openBanner = () => {
    if (banner) return;
    const current = readConsent();
    banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-labelledby', 'cookieTitle');
    banner.setAttribute('aria-describedby', 'cookieText');
    banner.innerHTML = `
      <button type="button" class="cookie-close" data-choice="reject" aria-label="Chiudi e rifiuta i cookie non necessari">×</button>
      <p class="cookie-title" id="cookieTitle">Cookie</p>
      <p class="cookie-text" id="cookieText">
        Il sito non usa cookie propri di statistica o pubblicità. Solo se lo accetti carichiamo la
        mappa di Google Maps nella sezione Contatti, che può installare cookie di terze parti,
        anche di profilazione. Puoi cambiare idea quando vuoi da "Preferenze cookie" in fondo alla pagina.
        <a href="cookie-policy.html">Leggi la cookie policy</a>.
      </p>
      ${current ? `<p class="cookie-current">Scelta attuale: <strong>${current.maps ? 'accettati' : 'rifiutati'}</strong></p>` : ''}
      <div class="cookie-actions">
        <button type="button" class="cookie-btn" data-choice="reject">Rifiuta</button>
        <button type="button" class="cookie-btn" data-choice="accept">Accetta</button>
      </div>`;
    banner.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-choice]');
      if (btn) choose(btn.dataset.choice === 'accept');
    });
    document.body.appendChild(banner);
    requestAnimationFrame(() => banner && banner.classList.add('open'));
  };

  // ---------- avvio ----------
  const init = () => {
    const c = readConsent();
    applyConsent(c);
    if (!c) openBanner();

    // un solo ascoltatore per tutta la pagina: funziona anche sul riquadro della mappa
    // quando viene rimesso al suo posto dopo una revoca
    document.addEventListener('click', (e) => {
      // "Preferenze cookie" nel footer: riapre il banner
      if (e.target.closest('[data-cookie-prefs]')) openBanner();
      // pulsante nel riquadro della mappa: consenso dato "sul posto"
      if (e.target.closest('[data-cookie-accept-maps]')) choose(true);
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

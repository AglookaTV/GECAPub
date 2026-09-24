/*!
 * GECA Pub – sito web
 * Progettazione grafica e sviluppo: Federico Bianchi
 * © 2026 Federico Bianchi. Tutti i diritti riservati.
 * Vietata la riproduzione, anche parziale, senza autorizzazione dell'autore.
 */
// ============================================
// GECA Pub – interazioni
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  // ---------- Navbar piena dopo lo scroll ----------
  const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Menu mobile ----------
  const setMenu = (open) => {
    navMenu.classList.toggle('open', open);
    navToggle.classList.toggle('open', open);
    navbar.classList.toggle('menu-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri menu');
  };
  navToggle.addEventListener('click', () => setMenu(!navMenu.classList.contains('open')));
  navMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));

  // ---------- Link attivo in base alla sezione visibile ----------
  const sections = ['home', 'servizi', 'birre', 'galleria', 'contatti']
    .map((id) => document.getElementById(id));

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => sectionObserver.observe(s));

  // ---------- Animazione comparsa ----------
  const revealTargets = document.querySelectorAll(
    '.about-media, .about-text, .section-head, .feature-card, .mini-card, .beer-grid, .gallery-item, .contact-info, .reviews-box'
  );
  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  revealTargets.forEach((el) => {
    el.classList.add('reveal');
    revealObserver.observe(el);
  });

  // ---------- Birre: copia delle schede per il nastro continuo ----------
  // Il nastro è fatto da due serie identiche una dopo l'altra: quando la prima è
  // uscita tutta a sinistra si torna indietro di una serie, e a occhio non cambia nulla.
  // (va fatto prima di caricare i loghi, così anche le copie li ricevono)
  const beerGrid = document.getElementById('beerGrid');
  const beerTrack = document.getElementById('beerTrack');
  [...beerTrack.children].forEach((card) => {
    const copy = card.cloneNode(true);
    copy.classList.add('is-clone');
    copy.setAttribute('aria-hidden', 'true');   // gli screen reader leggono le birre una volta sola
    beerTrack.appendChild(copy);
  });

  // ---------- Loghi delle birre ----------
  // Prova img/birre/<nome>.svg e poi .png; se nessuno esiste resta il nome scritto.
  document.querySelectorAll('.beer-coaster[data-logo]').forEach((coaster) => {
    const name = coaster.closest('.beer-card').querySelector('h3').textContent.trim();
    const tryLoad = ([ext, ...rest]) => {
      if (!ext) return;
      const img = new Image();
      img.onload = () => {
        img.alt = `Logo ${name}`;
        coaster.prepend(img);
        coaster.classList.add('has-logo');
      };
      img.onerror = () => tryLoad(rest);
      img.src = `${coaster.dataset.logo}.${ext}`;
    };
    tryLoad(['svg', 'png']);
  });

  // ---------- Birre: nastro a scorrimento continuo ----------
  // Si muove di SPEED pixel al secondo, all'infinito. Rallenta dolcemente fino a fermarsi
  // con il mouse sopra, si può trascinare con il dito o con il mouse (riparte dopo
  // RESUME_DELAY) e resta fermo quando la sezione non è sullo schermo.
  const SPEED = 40;              // px al secondo
  const RESUME_DELAY = 2500;     // ms dopo un trascinamento

  const firstClone = beerTrack.querySelector('.is-clone');
  const setWidth = () => firstClone.offsetLeft - beerTrack.firstElementChild.offsetLeft;
  const wrap = (x) => { const w = setWidth(); return w > 0 ? ((x % w) + w) % w : 0; };

  let pos = 0;                   // spostamento attuale del nastro (px)
  let speed = 0;                 // velocità attuale: segue SPEED con accelerazione morbida
  let hovering = false;
  let inView = false;
  let dragging = false;
  let holdUntil = 0;
  let lastT = null;

  const render = () => { beerTrack.style.transform = `translate3d(${-pos}px, 0, 0)`; };

  const frame = (t) => {
    const dt = lastT === null ? 0 : Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    if (!dragging) {
      const target = hovering || !inView || Date.now() < holdUntil ? 0 : SPEED;
      speed += (target - speed) * Math.min(1, dt * 4);
      if (speed > 0.05) { pos = wrap(pos + speed * dt); render(); }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  // pausa con il mouse sopra (solo mouse: su telefono il "tocco" non deve bloccarlo)
  beerGrid.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hovering = true; });
  beerGrid.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hovering = false; });

  // trascinamento con dito o mouse
  let startX = 0;
  let startPos = 0;
  beerGrid.addEventListener('pointerdown', (e) => {
    dragging = true;
    startX = e.clientX;
    startPos = pos;
    speed = 0;
    beerGrid.classList.add('dragging');
    beerGrid.setPointerCapture(e.pointerId);
  });
  beerGrid.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    pos = wrap(startPos - (e.clientX - startX));
    render();
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    holdUntil = Date.now() + RESUME_DELAY;
    beerGrid.classList.remove('dragging');
  };
  beerGrid.addEventListener('pointerup', endDrag);
  beerGrid.addEventListener('pointercancel', endDrag);

  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; }, { threshold: 0.2 })
    .observe(beerGrid);

  // ---------- Galleria + lightbox ----------
  const items = [...document.querySelectorAll('.gallery-item')];
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const lbCaption = document.getElementById('lbCaption');
  let current = 0;
  let lastFocus = null;

  const show = (index) => {
    current = (index + items.length) % items.length;
    const img = items[current].querySelector('img');
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbCaption.textContent = items[current].querySelector('figcaption')?.textContent ?? '';
  };

  const openLightbox = (index) => {
    lastFocus = document.activeElement;
    show(index);
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.getElementById('lbClose').focus();
  };

  const closeLightbox = () => {
    if (!lightbox.classList.contains('open')) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lastFocus?.focus();
  };

  items.forEach((item, i) => {
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.addEventListener('click', () => openLightbox(i));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(i);
      }
    });
  });

  document.getElementById('lbClose').addEventListener('click', closeLightbox);
  document.getElementById('lbPrev').addEventListener('click', () => show(current - 1));
  document.getElementById('lbNext').addEventListener('click', () => show(current + 1));
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });

  // Swipe su mobile
  let touchX = null;
  lightbox.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  // ---------- Recensioni Google ----------
  // Legge l'elenco in <script id="reviewsData"> (index.html), tiene solo le recensioni
  // da 5 stelle e le mostra una alla volta, cambiando ogni REVIEW_DELAY ms.
  const REVIEW_DELAY = 7000;
  const reviewsList = document.getElementById('reviewsList');
  const reviewsDots = document.getElementById('reviewsDots');
  const reviewsEmpty = document.getElementById('reviewsEmpty');

  let reviews = [];
  try {
    reviews = JSON.parse(document.getElementById('reviewsData').textContent)
      .filter((r) => Number(r.stelle) === 5 && r.testo && r.nome);
  } catch (err) {
    console.warn('Recensioni: elenco non valido in index.html', err);
  }

  if (reviews.length) {
    reviewsEmpty.hidden = true;
    const slides = reviews.map((r, i) => {
      const art = document.createElement('article');
      art.className = 'review';
      art.innerHTML = `
        <div class="stars" aria-label="5 stelle su 5"><span aria-hidden="true">★★★★★</span></div>
        <blockquote></blockquote>
        <div class="review-author">
          <span class="review-avatar" aria-hidden="true"></span>
          <div><strong></strong><span></span></div>
        </div>`;
      // testo inserito con textContent: nessun rischio con caratteri speciali
      art.querySelector('blockquote').textContent = r.testo;
      art.querySelector('.review-avatar').textContent = r.nome.trim().charAt(0).toUpperCase();
      art.querySelector('strong').textContent = r.nome;
      art.querySelector('.review-author div span').textContent = r.quando ? `Google · ${r.quando}` : 'Google';
      reviewsList.appendChild(art);

      if (reviews.length > 1) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', `Recensione ${i + 1} di ${reviews.length}`);
        dot.addEventListener('click', () => { showReview(i); restartReviews(); });
        reviewsDots.appendChild(dot);
      }
      return art;
    });

    let currentReview = 0;
    const showReview = (i) => {
      currentReview = (i + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('active', k === currentReview));
      [...reviewsDots.children].forEach((d, k) => d.setAttribute('aria-selected', String(k === currentReview)));
    };
    let reviewTimer = null;
    const restartReviews = () => {
      clearInterval(reviewTimer);
      if (slides.length > 1) reviewTimer = setInterval(() => showReview(currentReview + 1), REVIEW_DELAY);
    };
    showReview(0);
    restartReviews();
  }

  // ---------- Anno nel footer ----------
  document.getElementById('year').textContent = new Date().getFullYear();
});

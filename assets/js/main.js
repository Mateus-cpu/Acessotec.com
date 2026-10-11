/* Carrosserie de Cornaux — interactions
   Navigation, révélations au défilement, hero, section « sticky », compteurs,
   galerie (lightbox), horaires en direct, formulaire de contact. */
(function () {
  'use strict';

  const d = document;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, ctx) => (ctx || d).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || d).querySelectorAll(sel));

  /* ---------- Navigation ---------- */
  const nav = $('.nav');
  const mobile = $('.nav__mobile');
  const burger = $('.nav__burger');

  function onScrollNav() {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  function closeMenu() {
    if (!nav || !mobile) return;
    nav.classList.remove('is-open');
    mobile.classList.remove('is-open');
    d.body.style.overflow = '';
    if (burger) burger.setAttribute('aria-expanded', 'false');
  }
  if (burger && mobile) {
    burger.addEventListener('click', () => {
      const open = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open);
      mobile.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      d.body.style.overflow = open ? 'hidden' : '';
    });
    $$('a', mobile).forEach(a => a.addEventListener('click', closeMenu));
    d.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 960) closeMenu(); });
  }

  // Active link while scrolling
  const sections = $$('main section[id]');
  const navLinks = $$('.nav__links a[href^="#"]');
  if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
    const map = new Map(navLinks.map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        navLinks.forEach(a => a.classList.remove('is-active'));
        const link = map.get(en.target.id);
        if (link) link.classList.add('is-active');
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(s => io.observe(s));
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('[data-reveal]');
  if (revealEls.length) {
    if (!('IntersectionObserver' in window) || reduceMotion) {
      revealEls.forEach(el => el.classList.add('is-visible'));
    } else {
      // Stagger siblings that share a parent group
      $$('[data-reveal-group]').forEach(group => {
        $$('[data-reveal]', group).forEach((el, i) => el.style.setProperty('--i', String(i)));
      });
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      revealEls.forEach(el => io.observe(el));
    }
  }

  /* ---------- Hero ---------- */
  const hero = $('.hero');
  if (hero) {
    const img = $('.hero__media img');
    const start = () => requestAnimationFrame(() => hero.classList.add('is-loaded'));
    if (img && !img.complete) { img.addEventListener('load', start, { once: true }); img.addEventListener('error', start, { once: true }); setTimeout(start, 1800); }
    else start();

    if (!reduceMotion && img) {
      // parallax through the `translate` property so it composes with the Ken-Burns scale
      const style = d.createElement('style');
      style.textContent = '.hero__media img{translate:0 var(--py,0)}';
      d.head.appendChild(style);
      const content = $('.hero__inner');
      let ticking = false;
      const parallax = () => {
        const y = window.scrollY;
        const h = hero.offsetHeight;
        if (y < h) {
          img.style.setProperty('--py', (y * 0.22) + 'px');
          if (content) {
            content.style.transform = 'translate3d(0,' + (y * 0.12) + 'px,0)';
            content.style.opacity = String(Math.max(0, 1 - y / (h * 0.9)));
          }
        }
        ticking = false;
      };
      window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(parallax); } }, { passive: true });
    }
  }

  /* ---------- Sticky detail section ---------- */
  $$('.detail').forEach(detail => {
    const imgs = $$('.detail__media img', detail);
    const dots = $$('.detail__dots i', detail);
    const caption = $('.detail__caption', detail);
    const steps = $$('.detail__step', detail);
    if (!imgs.length || !steps.length) return;
    const activate = i => {
      imgs.forEach((im, k) => im.classList.toggle('is-active', k === i));
      dots.forEach((dt, k) => dt.classList.toggle('is-active', k === i));
      if (caption && steps[i]) caption.textContent = steps[i].dataset.caption || '';
    };
    activate(0);
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) activate(steps.indexOf(en.target)); });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    steps.forEach(s => io.observe(s));
  });

  /* ---------- Counters ---------- */
  const counters = $$('[data-count]');
  if (counters.length) {
    const run = el => {
      const target = parseFloat(el.dataset.count);
      const decimals = (el.dataset.count.split('.')[1] || '').length;
      const plain = el.dataset.plain !== undefined; // years: no thousands separator
      const dur = reduceMotion ? 0 : 1400;
      const t0 = performance.now();
      const fmt = v => plain ? String(Math.round(v)) : v.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
      const step = now => {
        const p = dur ? Math.min(1, (now - t0) / dur) : 1;
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(target * e);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) counters.forEach(run);
    else {
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
      }, { threshold: 0.6 });
      counters.forEach(c => io.observe(c));
    }
  }

  /* ---------- Marquee: duplicate logos for a seamless loop ---------- */
  $$('.marquee__track').forEach(track => {
    const items = Array.from(track.children);
    items.forEach(it => { const c = it.cloneNode(true); c.classList.add('is-clone'); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
  });

  /* ---------- Lightbox ---------- */
  const lb = $('.lightbox');
  const galleryItems = $$('.gallery__item');
  if (lb && galleryItems.length) {
    const lbImg = $('img', lb);
    const count = $('.lightbox__count', lb);
    let index = 0, lastFocus = null;
    const srcOf = btn => (btn.dataset.full || $('img', btn).currentSrc || $('img', btn).src);
    const show = i => {
      index = (i + galleryItems.length) % galleryItems.length;
      const btn = galleryItems[index];
      lbImg.src = srcOf(btn);
      lbImg.alt = $('img', btn).alt || '';
      if (count) count.textContent = (index + 1) + ' / ' + galleryItems.length;
    };
    const open = i => { lastFocus = d.activeElement; show(i); lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false'); d.body.style.overflow = 'hidden'; $('.lightbox__close', lb).focus(); };
    const close = () => { lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true'); d.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); };
    galleryItems.forEach((btn, i) => btn.addEventListener('click', () => open(i)));
    $('.lightbox__close', lb).addEventListener('click', close);
    $('.lightbox__prev', lb).addEventListener('click', () => show(index - 1));
    $('.lightbox__next', lb).addEventListener('click', () => show(index + 1));
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    d.addEventListener('keydown', e => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });
    // swipe
    let x0 = null;
    lb.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
    });
  }

  /* ---------- Opening hours (Europe/Zurich) ---------- */
  const status = $('[data-hours-status]');
  if (status) {
    try {
      const parts = new Intl.DateTimeFormat('fr-CH', { timeZone: 'Europe/Zurich', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
      const get = t => (parts.find(p => p.type === t) || {}).value;
      const wd = (get('weekday') || '').toLowerCase().replace('.', '');
      const minutes = (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10);
      const weekdays = ['lun', 'mar', 'mer', 'jeu', 'ven'];
      const isWeekday = weekdays.includes(wd);
      const slots = [[7 * 60 + 30, 12 * 60], [13 * 60, 17 * 60 + 30]];
      let open = false, next = '';
      if (isWeekday) {
        for (const [a, b] of slots) { if (minutes >= a && minutes < b) { open = true; next = 'ferme à ' + (b === 12 * 60 ? '12:00' : '17:30'); } }
        if (!open) {
          if (minutes < slots[0][0]) next = 'ouvre à 7:30';
          else if (minutes < slots[1][0]) next = 'réouvre à 13:00';
          else next = wd === 'ven' ? 'ouvre lundi à 7:30' : 'ouvre demain à 7:30';
        }
      } else {
        next = 'ouvre lundi à 7:30';
      }
      status.textContent = (open ? 'Ouvert' : 'Fermé') + ' · ' + next;
      status.classList.toggle('is-open', open);
      status.classList.toggle('is-closed', !open);
    } catch (e) { status.textContent = 'Lun–Ven · 7:30–12:00 / 13:00–17:30'; }
  }

  /* ---------- Contact form (mailto fallback) ---------- */
  const form = $('#contact-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const v = n => (form.elements[n] && form.elements[n].value || '').trim();
      const subject = 'Demande via le site — ' + v('prenom') + ' ' + v('nom');
      const body = [
        'Nom : ' + v('nom'),
        'Prénom : ' + v('prenom'),
        'E-mail : ' + v('email'),
        'Téléphone : ' + (v('telephone') || '—'),
        '',
        v('message')
      ].join('\n');
      const href = 'mailto:' + (form.dataset.to || 'info@cdec.ch') + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      const st = $('.form__status', form);
      if (st) { st.hidden = false; st.textContent = 'Merci ! Votre messagerie s’ouvre avec le message prérempli.'; }
      window.location.href = href;
    });
  }

  /* ---------- Back to top ---------- */
  const toTop = $('.totop');
  if (toTop) {
    const onS = () => toTop.classList.toggle('is-visible', window.scrollY > 800);
    onS();
    window.addEventListener('scroll', onS, { passive: true });
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
  }

  /* ---------- Year ---------- */
  $$('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });

  /* ---------- Social links (filled by the asset workflow if found) ---------- */
  fetch('assets/js/social.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(data => {
    if (!data) return;
    $$('[data-social]').forEach(a => {
      const url = data[a.dataset.social];
      if (url) a.href = url; else a.remove();
    });
  }).catch(() => {});
})();

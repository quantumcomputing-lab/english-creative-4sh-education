/* english.shakespeare.4sh.education — JS */

// ── Hamburger / Mobile Nav ──
const hamburger   = document.querySelector('.hamburger');
const mobileNav   = document.getElementById('mobileNav');
const navOverlay  = document.getElementById('navOverlay');
const navClose    = document.querySelector('.mobile-nav-close');
const mobileLinks = mobileNav?.querySelectorAll('a') ?? [];

function openNav() {
    mobileNav.classList.add('open');
    navOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    hamburger?.setAttribute('aria-expanded', 'true');
    hamburger?.setAttribute('aria-label', 'Close menu');
}
function closeNav() {
    mobileNav.classList.remove('open');
    navOverlay.classList.remove('open');
    document.body.style.overflow = '';
    hamburger?.setAttribute('aria-expanded', 'false');
    hamburger?.setAttribute('aria-label', 'Open menu');
}

hamburger?.addEventListener('click', () => {
    if (mobileNav.classList.contains('open')) closeNav();
    else openNav();
});
navClose?.addEventListener('click', closeNav);
navOverlay?.addEventListener('click', closeNav);
mobileLinks.forEach(link => link.addEventListener('click', closeNav));

// ── "Plays" dropdown (desktop header) ──
const playsDropdown = document.getElementById('playsDropdown');
const playsToggle   = document.getElementById('playsToggle');

playsToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = playsDropdown.classList.toggle('open');
    playsToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});
document.addEventListener('click', (e) => {
    if (playsDropdown?.classList.contains('open') && !playsDropdown.contains(e.target)) {
        playsDropdown.classList.remove('open');
        playsToggle?.setAttribute('aria-expanded', 'false');
    }
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && playsDropdown?.classList.contains('open')) {
        playsDropdown.classList.remove('open');
        playsToggle?.setAttribute('aria-expanded', 'false');
    }
});
playsDropdown?.querySelectorAll('.topics-menu a').forEach(a => a.addEventListener('click', () => {
    playsDropdown.classList.remove('open');
    playsToggle?.setAttribute('aria-expanded', 'false');
}));

// ── Scroll Fade-in (one-time — for headings, CTAs, etc.) ──
const fadeEls = document.querySelectorAll('.fade-in');
const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            fadeObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

fadeEls.forEach(el => fadeObserver.observe(el));

// ── Scene-duo reveal (persistent — replays every time the images
// scroll into or out of view, not just once, unlike .fade-in above) ──
const revealEls = document.querySelectorAll('.reveal-a, .reveal-b');
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        entry.target.classList.toggle('visible', entry.isIntersecting);
    });
}, { threshold: 0.15 });

revealEls.forEach(el => revealObserver.observe(el));

// ── Active nav highlight on scroll ──
const navLinks = document.querySelectorAll('.desktop-nav a');
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            navLinks.forEach(link => link.classList.remove('active'));
            document.querySelector(`.desktop-nav a[href="#${entry.target.id}"]`)?.classList.add('active');
        }
    });
}, { threshold: 0.4 });
document.querySelectorAll('section[id]').forEach(s => sectionObserver.observe(s));

// ── Click-to-WhatsApp CTA tracking ──
document.querySelectorAll('.btn-whatsapp').forEach(btn => {
    btn.addEventListener('click', () => {
        if (typeof gtag === 'function') {
            gtag('event', 'whatsapp_click', { event_category: 'contact', event_label: btn.closest('section')?.id || 'contact' });
        }
    });
});

// ── Back to top ──
const backToTop = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
    if (window.scrollY > 400) backToTop?.classList.add('visible');
    else backToTop?.classList.remove('visible');
}, { passive: true });
backToTop?.addEventListener('click', () => window.scrollTo({ top: 0 }));

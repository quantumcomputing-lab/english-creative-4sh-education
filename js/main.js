/* english.shakespeare.4sh.education — JS */

// ── Shared modal helpers: iOS-safe scroll lock + Tab focus trap ──
// position:fixed + a negative top offset (not plain overflow:hidden) is
// required to actually stop the page rubber-band-scrolling behind a
// fixed overlay on iOS Safari. Used by the founder video/CV modals below.
let _scrollLockY = 0;
function lockBodyScroll() {
    _scrollLockY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${_scrollLockY}px`;
    document.body.style.width = '100%';
}
function unlockBodyScroll() {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, _scrollLockY);
}

// Returns a keydown handler that cycles Tab/Shift+Tab within `container`'s
// focusable elements, so focus can never escape to the page behind an
// open modal -- add it as a keydown listener on open, remove on close.
function trapFocus(container) {
    return function (e) {
        if (e.key !== 'Tab') return;
        const focusable = container.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    };
}

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

// ── Copy-to-clipboard email buttons — replaces mailto: links, which on
// some Android setups pop an app-chooser listing apps that have nothing
// to do with email (e.g. a ride-hailing app registering an overly broad
// intent filter). Copying the address sidesteps OS link/intent
// resolution entirely, and the address is shown as plain text next to
// the main CTA so it's usable even without JS or Clipboard API support. ──
document.querySelectorAll('.js-copy-email').forEach(btn => {
    const label = btn.querySelector('.js-copy-email-label');
    const email = btn.dataset.email;
    const defaultText = label.textContent;
    let resetTimer = null;

    btn.addEventListener('click', async () => {
        if (typeof gtag === 'function') {
            gtag('event', 'consultation_email_copy', { event_category: 'contact', event_label: btn.closest('section')?.id || 'contact' });
        }
        try {
            await navigator.clipboard.writeText(email);
            label.textContent = 'Copied!';
        } catch (err) {
            label.textContent = email; // clipboard unavailable -- at least show the address to copy by hand
        }
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => { label.textContent = defaultText; }, 2000);
    });
});

// ── Match the founder video-card's height to the credentials column ──
// CSS alone (grid stretch feeding an aspect-ratio calc) turned out to be
// an unpredictable circular dependency -- this measures the real
// rendered height directly and sets it as an explicit inline px value,
// which aspect-ratio can then cleanly derive the card's width from. Below
// the 900px breakpoint where .slab-inner stacks to one column, the
// columns aren't side-by-side any more, so the inline height is cleared
// and the card falls back to its own CSS (width-capped, height from
// aspect-ratio).
(function () {
    const card = document.getElementById('founderVideoCard');
    const textCol = document.querySelector('#founder .slab-text');
    if (!card || !textCol) return;

    function syncHeight() {
        if (window.innerWidth <= 900) {
            card.style.height = '';
            return;
        }
        card.style.height = textCol.offsetHeight + 'px';
    }

    syncHeight();
    window.addEventListener('resize', syncHeight);
    window.addEventListener('load', syncHeight);
})();

// ── Founder intro video modal ──
// Single-video fullscreen popup. YouTube IFrame API (not a raw iframe) so
// a blocked/removed/private video shows a clear message instead of a
// silent blank box.
(function () {
    const FOUNDER_VIDEO_ID = 'gwIuTEmreyk'; // https://youtube.com/shorts/gwIuTEmreyk

    const trigger = document.getElementById('founderVideoCard');
    const modal = document.getElementById('videoModal');
    const modalFrame = document.getElementById('videoModalFrame');
    const modalClose = document.getElementById('videoModalClose');
    if (!trigger || !modal || !modalFrame || !modalClose) return;

    let ytApiPromise = null;
    let currentPlayer = null;
    let currentReadyTimeout = null;
    let openSessionId = 0;
    let lastFocusedElement = null;
    const videoModalFocusTrap = trapFocus(modal);

    function loadYouTubeApi() {
        if (ytApiPromise) return ytApiPromise;
        ytApiPromise = new Promise((resolve, reject) => {
            const failTimer = setTimeout(() => reject(new Error('yt-api-timeout')), 6000);
            window.onYouTubeIframeAPIReady = () => { clearTimeout(failTimer); resolve(window.YT); };
            const script = document.createElement('script');
            script.src = 'https://www.youtube.com/iframe_api';
            script.onerror = () => { clearTimeout(failTimer); reject(new Error('yt-api-script-error')); };
            document.head.appendChild(script);
        }).catch(err => {
            ytApiPromise = null;
            throw err;
        });
        return ytApiPromise;
    }

    function errorMessageFor(code) {
        switch (code) {
            case 2:   return "This video link isn't valid.";
            case 5:   return "This video can't be played in this browser right now.";
            case 100: return 'This video was removed or made private.';
            case 101:
            case 150: return "The video owner has disabled playback on other websites.";
            default:  return "This video can't be played right now.";
        }
    }

    function showModalError(ytId, message) {
        if (currentReadyTimeout) { clearTimeout(currentReadyTimeout); currentReadyTimeout = null; }
        currentPlayer = null;
        modalFrame.innerHTML = `
            <div class="video-modal-error">
                <p>${message}</p>
                <a href="https://www.youtube.com/watch?v=${ytId}" target="_blank" rel="noopener">Watch on YouTube instead</a>
            </div>`;
    }

    function openVideoModal(ytId, triggerEl) {
        if (!modal.hidden) return;
        const mySession = ++openSessionId;

        lastFocusedElement = triggerEl || document.activeElement;
        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
        lockBodyScroll();
        modalClose.focus();
        document.addEventListener('keydown', videoModalFocusTrap);

        if (!ytId || ytId === 'REPLACE_WITH_YOUTUBE_ID') {
            modalFrame.innerHTML = `<div class="video-modal-placeholder">Video coming soon.</div>`;
            return;
        }

        modalFrame.innerHTML = `<div class="video-modal-spinner"></div><div id="founder-yt-player-target"></div>`;

        currentReadyTimeout = setTimeout(() => {
            if (mySession !== openSessionId) return;
            showModalError(ytId, "This is taking longer than usual to load — it may be a slow connection, an ad blocker, or a network restriction.");
        }, 9000);

        loadYouTubeApi().then(YT => {
            if (mySession !== openSessionId) return;
            try {
                currentPlayer = new YT.Player('founder-yt-player-target', {
                    videoId: ytId,
                    playerVars: { autoplay: 1, playsinline: 1, rel: 0 },
                    events: {
                        onReady: () => {
                            if (mySession !== openSessionId) return;
                            if (currentReadyTimeout) { clearTimeout(currentReadyTimeout); currentReadyTimeout = null; }
                            const spinner = modalFrame.querySelector('.video-modal-spinner');
                            if (spinner) spinner.remove();
                        },
                        onError: e => {
                            if (mySession !== openSessionId) return;
                            showModalError(ytId, errorMessageFor(e.data));
                        }
                    }
                });
            } catch (err) {
                if (mySession !== openSessionId) return;
                showModalError(ytId, "This video can't be played right now.");
            }
        }, () => {
            if (mySession !== openSessionId) return;
            showModalError(ytId, "This is taking longer than usual to load — it may be a slow connection, an ad blocker, or a network restriction.");
        });
    }

    function closeVideoModal() {
        openSessionId++;
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        unlockBodyScroll();
        document.removeEventListener('keydown', videoModalFocusTrap);
        if (currentReadyTimeout) { clearTimeout(currentReadyTimeout); currentReadyTimeout = null; }
        if (currentPlayer && typeof currentPlayer.destroy === 'function') {
            currentPlayer.destroy();
        }
        currentPlayer = null;
        modalFrame.innerHTML = '';
        if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
            lastFocusedElement.focus();
        }
        lastFocusedElement = null;
    }

    trigger.addEventListener('click', () => openVideoModal(FOUNDER_VIDEO_ID, trigger));
    modalClose.addEventListener('click', closeVideoModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeVideoModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeVideoModal(); });
})();

// ── Founder CV modal — "Connect with me" opens a career-journey summary
//    in place instead of handing off to LinkedIn. ──
(function () {
    const trigger = document.getElementById('openCvModal');
    const modal = document.getElementById('cvModal');
    const modalClose = document.getElementById('cvModalClose');
    if (!trigger || !modal || !modalClose) return;

    let lastFocusedElement = null;
    const cvModalFocusTrap = trapFocus(modal);

    function openCvModal() {
        lastFocusedElement = trigger;
        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
        lockBodyScroll();
        modalClose.focus();
        document.addEventListener('keydown', cvModalFocusTrap);
    }
    function closeCvModal() {
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        unlockBodyScroll();
        document.removeEventListener('keydown', cvModalFocusTrap);
        lastFocusedElement?.focus();
        lastFocusedElement = null;
    }

    trigger.addEventListener('click', openCvModal);
    modalClose.addEventListener('click', closeCvModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeCvModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeCvModal(); });
})();

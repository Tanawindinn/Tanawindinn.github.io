/**
 * BELATEKAVTO - Main Site JavaScript
 * Sticky navbar, mobile menu collapse, certificate lightbox, grab-to-scroll
 */

document.addEventListener('DOMContentLoaded', function () {
  // 1. Sticky Navbar scroll state
  const navbar = document.querySelector('.navbar-fixed-top');
  if (navbar) {
    function checkScroll() {
      if (window.scrollY > 25) {
        navbar.classList.add('is-scrolled');
      } else {
        navbar.classList.remove('is-scrolled');
      }
    }
    window.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();
  }

  // 2. Auto-close mobile navbar on click
  const navCollapse = document.getElementById('navbarSupportedContent');
  if (navCollapse) {
    const navLinks = navCollapse.querySelectorAll('.nav-link:not(.dropdown-toggle), #contacts-btn');
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        if (navCollapse.classList.contains('show')) {
          const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
          if (bsCollapse) {
            bsCollapse.hide();
          } else {
            navCollapse.classList.remove('show');
          }
        }
      });
    });
  }

  // 2.1 Language Dropdown Toggle Handler
  const langToggles = document.querySelectorAll('.lang-toggle');
  langToggles.forEach(function (toggle) {
    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      const parent = toggle.closest('.lang-dropdown');
      const menu = parent ? parent.querySelector('.lang-dropdown-menu') : null;
      if (!menu) return;
      const isOpen = menu.classList.contains('show');
      // Close any other open dropdowns
      document.querySelectorAll('.lang-dropdown-menu.show').forEach(function (m) {
        m.classList.remove('show');
      });
      document.querySelectorAll('.lang-toggle[aria-expanded="true"]').forEach(function (t) {
        t.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        menu.classList.add('show');
        toggle.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Close dropdown on outside click
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.lang-dropdown')) {
      document.querySelectorAll('.lang-dropdown-menu.show').forEach(function (m) {
        m.classList.remove('show');
      });
      document.querySelectorAll('.lang-toggle[aria-expanded="true"]').forEach(function (t) {
        t.setAttribute('aria-expanded', 'false');
      });
    }
  });

  // 3. Smooth scroll for internal anchor links with offset
  document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '#!' || targetId.startsWith('#top')) return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const navHeight = navbar ? navbar.offsetHeight : 70;
        const targetPos = targetEl.getBoundingClientRect().top + window.pageYOffset - navHeight - 10;
        window.scrollTo({
          top: targetPos,
          behavior: 'smooth',
        });
      }
    });
  });

  // 4. Certificate Gallery Grab-to-Scroll for mouse users
  const scrollZone = document.querySelector('.gallery-scroll .scroll-zone');
  if (scrollZone) {
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let hasMoved = false;

    scrollZone.addEventListener('mousedown', function (e) {
      isDown = true;
      hasMoved = false;
      startX = e.pageX - scrollZone.offsetLeft;
      scrollLeft = scrollZone.scrollLeft;
    });

    scrollZone.addEventListener('mouseleave', function () {
      isDown = false;
    });

    scrollZone.addEventListener('mouseup', function () {
      isDown = false;
    });

    scrollZone.addEventListener('mousemove', function (e) {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - scrollZone.offsetLeft;
      const walk = (x - startX) * 1.5;
      if (Math.abs(walk) > 5) hasMoved = true;
      scrollZone.scrollLeft = scrollLeft - walk;
    });

    // 5. Certificate Lightbox Modal
    const certItems = Array.from(document.querySelectorAll('.gallery-scroll .hover-grow'));
    if (certItems.length > 0) {
      // Build lightbox DOM
      let lightbox = document.getElementById('cert-lightbox');
      if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.id = 'cert-lightbox';
        lightbox.className = 'cert-lightbox-overlay';
        lightbox.innerHTML = `
          <div class="cert-lightbox-container">
            <button class="cert-lightbox-btn cert-lightbox-close" aria-label="Close">&times;</button>
            <button class="cert-lightbox-btn cert-lightbox-prev" aria-label="Previous">&#10094;</button>
            <img class="cert-lightbox-img" src="" alt="Certificate" />
            <button class="cert-lightbox-btn cert-lightbox-next" aria-label="Next">&#10095;</button>
            <div class="cert-lightbox-caption"></div>
            <div class="cert-lightbox-counter"></div>
          </div>
        `;
        document.body.appendChild(lightbox);
      }

      const lbImg = lightbox.querySelector('.cert-lightbox-img');
      const lbCaption = lightbox.querySelector('.cert-lightbox-caption');
      const lbCounter = lightbox.querySelector('.cert-lightbox-counter');
      const lbClose = lightbox.querySelector('.cert-lightbox-close');
      const lbPrev = lightbox.querySelector('.cert-lightbox-prev');
      const lbNext = lightbox.querySelector('.cert-lightbox-next');

      let currentIndex = 0;

      function openLightbox(index) {
        currentIndex = (index + certItems.length) % certItems.length;
        const item = certItems[currentIndex];
        const img = item.querySelector('img');
        const p = item.querySelector('p');

        if (img) lbImg.src = img.src;
        if (p) lbCaption.textContent = p.textContent.trim();
        lbCounter.textContent = `${currentIndex + 1} / ${certItems.length}`;

        lightbox.classList.add('is-open');
        document.body.style.overflow = 'hidden';
      }

      function closeLightbox() {
        lightbox.classList.remove('is-open');
        document.body.style.overflow = '';
      }

      function nextCert() {
        openLightbox(currentIndex + 1);
      }

      function prevCert() {
        openLightbox(currentIndex - 1);
      }

      certItems.forEach(function (item, idx) {
        item.addEventListener('click', function (e) {
          if (hasMoved) return; // Prevent opening on mouse drag
          openLightbox(idx);
        });
      });

      lbClose.addEventListener('click', closeLightbox);
      lbNext.addEventListener('click', function (e) {
        e.stopPropagation();
        nextCert();
      });
      lbPrev.addEventListener('click', function (e) {
        e.stopPropagation();
        prevCert();
      });

      lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox || e.target.classList.contains('cert-lightbox-container')) {
          closeLightbox();
        }
      });

      window.addEventListener('keydown', function (e) {
        if (!lightbox.classList.contains('is-open')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') nextCert();
        if (e.key === 'ArrowLeft') prevCert();
      });

      // Touch swipe in lightbox
      let lbTouchStart = 0;
      let lbTouchEnd = 0;
      lightbox.addEventListener('touchstart', function (e) {
        lbTouchStart = e.changedTouches[0].screenX;
      }, { passive: true });
      lightbox.addEventListener('touchend', function (e) {
        lbTouchEnd = e.changedTouches[0].screenX;
        const diff = lbTouchStart - lbTouchEnd;
        if (Math.abs(diff) > 40) {
          if (diff > 0) nextCert();
          else prevCert();
        }
      }, { passive: true });
    }
  }
});


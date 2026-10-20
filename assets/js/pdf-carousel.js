/**
 * BELATEKAVTO - 3D PDF Carousel & Magnifier Lens
 * Modernized, robust, touch-friendly, and accessible
 */

function initPdfCarousel(options) {
  options = options || {};
  const url = options.url || 'assets/images/BELATEKAVTOARTICLE.pdf';
  const pageLabel = options.pageLabel || 'Страница';
  const ofLabel = options.ofLabel || 'из';

  const containerEl = document.querySelector('.container-carousel');
  const slotCurr = document.getElementById('slot-curr');
  const slotPrev = document.getElementById('slot-prev');
  const slotNext = document.getElementById('slot-next');
  const textLayerDiv = document.getElementById('text-layer');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const pageNumEl = document.getElementById('page_num');
  const pageCountEl = document.getElementById('page_count');
  const lensEl = document.getElementById('magnifier-lens');
  const canvasLens = document.getElementById('canvas-lens');

  if (!containerEl || !slotCurr || !prevBtn || !nextBtn) {
    return;
  }

  const pdfjsLib = window['pdfjs-dist/build/pdf'];
  if (!pdfjsLib) {
    console.warn('PDF.js library is not loaded.');
    return;
  }

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    options.workerSrc || 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

  let pdfDoc = null;
  let pageNum = 1;
  let pageRendering = false;

  const canvasPrev = document.getElementById('canvas-prev');
  const canvasCurr = document.getElementById('canvas-curr');
  const canvasNext = document.getElementById('canvas-next');

  if (!canvasPrev || !canvasCurr || !canvasNext) return;

  const ctxs = {
    prev: canvasPrev.getContext('2d'),
    curr: canvasCurr.getContext('2d'),
    next: canvasNext.getContext('2d'),
  };

  const renderTasks = { prev: null, curr: null, next: null };

  function getIndices(centerNum, total) {
    let prev = centerNum - 1;
    if (prev < 1) prev = total;

    let next = centerNum + 1;
    if (next > total) next = 1;

    return { prev, curr: centerNum, next };
  }

  function renderSingleCanvas(pageNumber, ctx, isMain) {
    const key = isMain ? 'curr' : (ctx === ctxs.prev ? 'prev' : 'next');
    if (renderTasks[key]) {
      try {
        renderTasks[key].cancel();
      } catch (e) {}
    }

    return pdfDoc.getPage(pageNumber).then(function (page) {
      const containerHeight = containerEl.offsetHeight || 600;
      const targetDisplayHeight = Math.max(300, containerHeight * 0.92);

      const baseViewport = page.getViewport({ scale: 1 });
      const requiredScaleToFit = targetDisplayHeight / baseViewport.height;

      const RENDER_QUALITY_MULTIPLIER = 2.0;
      const finalRenderScale = requiredScaleToFit * RENDER_QUALITY_MULTIPLIER;

      const viewport = page.getViewport({ scale: finalRenderScale });

      const canvas = ctx.canvas;
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const canvasWidthInCSS = viewport.width / RENDER_QUALITY_MULTIPLIER;
      const canvasHeightInCSS = viewport.height / RENDER_QUALITY_MULTIPLIER;

      canvas.style.width = canvasWidthInCSS + 'px';
      canvas.style.height = canvasHeightInCSS + 'px';

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      const task = page.render(renderContext);
      renderTasks[key] = task;

      if (isMain) {
        slotCurr.style.width = canvasWidthInCSS + 'px';
        slotCurr.style.height = canvasHeightInCSS + 'px';

        if (slotPrev) {
          slotPrev.style.width = canvasWidthInCSS + 'px';
          slotPrev.style.height = canvasHeightInCSS + 'px';
        }
        if (slotNext) {
          slotNext.style.width = canvasWidthInCSS + 'px';
          slotNext.style.height = canvasHeightInCSS + 'px';
        }

        if (textLayerDiv) {
          textLayerDiv.style.width = canvasWidthInCSS + 'px';
          textLayerDiv.style.height = canvasHeightInCSS + 'px';
          textLayerDiv.style.setProperty('--scale-factor', requiredScaleToFit);

          task.promise
            .then(function () {
              textLayerDiv.innerHTML = '';
              page.getTextContent().then(function (textContent) {
                if (pdfjsLib.renderTextLayer) {
                  pdfjsLib.renderTextLayer({
                    textContent: textContent,
                    container: textLayerDiv,
                    viewport: page.getViewport({ scale: requiredScaleToFit }),
                    textDivs: [],
                  });
                }
              });
            })
            .catch(function () {});
        }
      }

      return task.promise;
    }).catch(function (err) {
      if (err && err.name !== 'RenderingCancelledException') {
        console.error('PDF page render error:', err);
      }
    });
  }

  function updateCarousel(newNum) {
    if (!pdfDoc) return;
    pageRendering = true;
    pageNum = newNum;

    const indices = getIndices(pageNum, pdfDoc.numPages);

    Promise.all([
      renderSingleCanvas(indices.prev, ctxs.prev, false),
      renderSingleCanvas(indices.curr, ctxs.curr, true),
      renderSingleCanvas(indices.next, ctxs.next, false),
    ]).then(function () {
      pageRendering = false;
    });

    if (pageNumEl) pageNumEl.textContent = pageNum;
  }

  // Magnifying Glass
  const MAGNIFY_FACTOR = 2.0;
  const LENS_SIZE = 360;

  if (lensEl && canvasLens) {
    const lensCtx = canvasLens.getContext('2d');
    canvasLens.width = LENS_SIZE * MAGNIFY_FACTOR;
    canvasLens.height = LENS_SIZE * MAGNIFY_FACTOR;

    function handleMagnifier(e) {
      if (window.innerWidth < 768) return; // Disable lens on mobile

      const pos = slotCurr.getBoundingClientRect();
      const x = e.clientX - pos.left;
      const y = e.clientY - pos.top;

      if (x < 0 || y < 0 || x > pos.width || y > pos.height) {
        lensEl.style.opacity = 0;
        return;
      }

      const lensOffset = LENS_SIZE / 2;
      lensEl.style.left = (x - lensOffset) + 'px';
      lensEl.style.top = (y - lensOffset) + 'px';
      lensEl.style.opacity = 1;

      const sourceWidth = LENS_SIZE;
      const sourceHeight = LENS_SIZE;

      const sX = x * MAGNIFY_FACTOR - sourceWidth / 2;
      const sY = y * MAGNIFY_FACTOR - sourceHeight / 2;

      lensCtx.drawImage(
        canvasCurr,
        sX,
        sY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvasLens.width,
        canvasLens.height
      );
    }

    slotCurr.addEventListener('mousemove', handleMagnifier);
    slotCurr.addEventListener('mouseleave', function () {
      lensEl.style.opacity = 0;
    });
  }

  // Navigation handlers
  function goPrev() {
    if (!pdfDoc || pageRendering) return;
    let newPage = pageNum - 1;
    if (newPage < 1) newPage = pdfDoc.numPages;
    updateCarousel(newPage);
  }

  function goNext() {
    if (!pdfDoc || pageRendering) return;
    let newPage = pageNum + 1;
    if (newPage > pdfDoc.numPages) newPage = 1;
    updateCarousel(newPage);
  }

  prevBtn.addEventListener('click', goPrev);
  nextBtn.addEventListener('click', goNext);

  if (slotPrev) slotPrev.addEventListener('click', goPrev);
  if (slotNext) slotNext.addEventListener('click', goNext);

  // Keyboard navigation
  window.addEventListener('keydown', function (e) {
    const rect = containerEl.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (!inView) return;

    if (e.key === 'ArrowLeft') {
      goPrev();
    } else if (e.key === 'ArrowRight') {
      goNext();
    }
  });

  // Touch swipe support for mobile
  let touchStartX = 0;
  let touchEndX = 0;

  containerEl.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  containerEl.addEventListener('touchend', function (e) {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goNext();
      } else {
        goPrev();
      }
    }
  }, { passive: true });

  // Resize handler
  let resizeTimeout;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function () {
      if (pdfDoc) updateCarousel(pageNum);
    }, 200);
  });

  // Load the PDF
  pdfjsLib.getDocument(url).promise.then(function (loadedDoc) {
    pdfDoc = loadedDoc;
    if (pageCountEl) pageCountEl.textContent = pdfDoc.numPages;
    updateCarousel(pageNum);
  }).catch(function (error) {
    console.error('Error loading PDF document:', error);
    const fallback = document.querySelector('.pdf-fallback-card');
    if (fallback) fallback.classList.add('is-visible');
  });
}


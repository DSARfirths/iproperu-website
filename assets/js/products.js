import { productsData } from './products-data.js';

const PRODUCTS_GRID_SELECTOR = '.products-grid.catalog-grid';
const FILTERS_CONTAINER_SELECTOR = '.product-filters';

let currentFilter = 'all';
let filtersInitialized = false;

const pauseVideoElement = (video) => {
    if (video && !video.paused) {
        video.pause();
    }
};

function applyFilter(filterValue, container) {
    const productCards = container.querySelectorAll('.product-card');

    productCards.forEach(card => {
        const matches = filterValue === 'all' || card.dataset.category === filterValue;
        card.style.display = matches ? '' : 'none';

        if (!matches) {
            const video = card.querySelector('.product-video');
            pauseVideoElement(video);
        }
    });
}

function setupFilters(filtersContainer, productsContainer) {
    if (!filtersContainer || !productsContainer || filtersInitialized) {
        return;
    }

    const activeButton = filtersContainer.querySelector('.filter-btn.active');
    if (activeButton && activeButton.dataset.filter) {
        currentFilter = activeButton.dataset.filter;
    }

    filtersContainer.addEventListener('click', (event) => {
        const button = event.target instanceof Element ? event.target.closest('.filter-btn') : null;
        if (!button) {
            return;
        }

        event.preventDefault();

        const nextFilter = button.dataset.filter || 'all';
        if (currentFilter !== nextFilter) {
            currentFilter = nextFilter;
        }

        const buttons = filtersContainer.querySelectorAll('.filter-btn');
        buttons.forEach(btn => {
            btn.classList.toggle('active', btn === button);
        });

        applyFilter(currentFilter, productsContainer);
    });

    filtersInitialized = true;
    applyFilter(currentFilter, productsContainer);
}

function initializeProductMedia(container) {
    const productCards = Array.from(container.querySelectorAll('.product-card'));
    if (productCards.length === 0) {
        return;
    }

    const productVideoItems = productCards
        .map(card => {
            const video = card.querySelector('.product-video');
            const control = card.querySelector('.audio-toggle');
            return video ? { card, video, control } : null;
        })
        .filter(Boolean);

    if (productVideoItems.length === 0) {
        return;
    }

    const attemptPlay = (video) => {
        const playPromise = video.play();
        if (playPromise && typeof playPromise.then === 'function') {
            playPromise.catch(() => {});
        }
    };

    const updateAudioControl = (item) => {
        const { card, video, control } = item;
        const isMuted = video.muted;
        card.classList.toggle('product-card--with-audio', !isMuted);

        if (control) {
            control.setAttribute('aria-pressed', String(!isMuted));
            control.setAttribute('aria-label', isMuted ? 'Activar audio del producto' : 'Desactivar audio del producto');

            const icon = control.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-volume-high', !isMuted);
                icon.classList.toggle('fa-volume-xmark', isMuted);
            }
        }
    };

    const muteOtherVideos = (currentVideo) => {
        productVideoItems.forEach(item => {
            if (item.video !== currentVideo && !item.video.muted) {
                item.video.muted = true;
                updateAudioControl(item);
            }
        });
    };

    productVideoItems.forEach(item => {
        const { card, video, control } = item;

        const handlePlayRequest = () => attemptPlay(video);
        const handlePauseRequest = () => pauseVideoElement(video);

        card.addEventListener('pointerenter', handlePlayRequest);
        card.addEventListener('pointerleave', handlePauseRequest);
        card.addEventListener('pointercancel', handlePauseRequest);
        card.addEventListener('pointerdown', handlePlayRequest);
        card.addEventListener('pointerup', (event) => {
            const targetElement = event.target instanceof Element ? event.target : null;
            const interactedWithAudioToggle = targetElement ? targetElement.closest('.audio-toggle') : null;

            if (event.pointerType === 'touch' && !interactedWithAudioToggle) {
                handlePauseRequest();
            }
        });
        card.addEventListener('mouseenter', handlePlayRequest);
        card.addEventListener('mouseleave', handlePauseRequest);
        card.addEventListener('focusin', handlePlayRequest);
        card.addEventListener('focusout', handlePauseRequest);

        if (control) {
            control.addEventListener('click', (event) => {
                event.stopPropagation();

                if (video.muted) {
                    muteOtherVideos(video);
                    video.muted = false;
                    handlePlayRequest();
                } else {
                    video.muted = true;
                }

                updateAudioControl(item);
            });
        }

        video.addEventListener('volumechange', () => {
            updateAudioControl(item);
            if (!video.muted) {
                muteOtherVideos(video);
            }
        });

        updateAudioControl(item);
    });
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.category = product.category;

    const videoSrc = product.videoSrc || '';
    const posterSrc = product.posterSrc || '';
    const whatsappLink = product.whatsappLink || '#';
    const ctaLabel = product.ctaLabel || 'Consultar disponibilidad';
    const specs = product.specs || '';

    card.innerHTML = `
        <div class="product-media">
            <video class="product-video" src="${videoSrc}" poster="${posterSrc}" playsinline muted loop preload="metadata"></video>
            <button type="button" class="audio-toggle" aria-label="Activar audio del producto" aria-pressed="false">
                <i class="fa-solid fa-volume-xmark" aria-hidden="true"></i>
            </button>
        </div>
        <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <p class="product-spec">${specs}</p>
            <a href="${whatsappLink}" target="_blank" class="product-cta">
                <i class="fab fa-whatsapp"></i> ${ctaLabel}
            </a>
        </div>
    `;

    return card;
}

export function renderProducts(products, { container = document.querySelector(PRODUCTS_GRID_SELECTOR) } = {}) {
    if (!container) {
        return;
    }

    container.innerHTML = '';
    const fragment = document.createDocumentFragment();

    products.forEach(product => {
        const card = createProductCard(product);
        fragment.appendChild(card);
    });

    container.appendChild(fragment);
    initializeProductMedia(container);
    applyFilter(currentFilter, container);

    container.dispatchEvent(new CustomEvent('products:rendered', { bubbles: true }));
}

document.addEventListener('DOMContentLoaded', () => {
    const productsContainer = document.querySelector(PRODUCTS_GRID_SELECTOR);
    if (!productsContainer) {
        return;
    }

    const filtersContainer = document.querySelector(FILTERS_CONTAINER_SELECTOR);
    if (filtersContainer) {
        const activeButton = filtersContainer.querySelector('.filter-btn.active');
        if (activeButton && activeButton.dataset.filter) {
            currentFilter = activeButton.dataset.filter;
        }
    }

    renderProducts(productsData, { container: productsContainer });

    if (filtersContainer) {
        setupFilters(filtersContainer, productsContainer);
    }
});

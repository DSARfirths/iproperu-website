import { productsData } from './products-data.js';

const PRODUCTS_GRID_SELECTOR = '.products-grid.catalog-grid';
const FILTERS_CONTAINER_SELECTOR = '.product-filters';
const DEFAULT_FILTER_VALUE = 'all';

let filtersInitialized = false;
const filterState = {};

const deriveFilterOptions = (products, key) => {
    const uniqueValues = [];
    const seen = new Set();

    products.forEach(product => {
        const value = product?.[key];
        if (!value || value === DEFAULT_FILTER_VALUE || seen.has(value)) {
            return;
        }

        seen.add(value);
        uniqueValues.push(value);
    });

    return [DEFAULT_FILTER_VALUE, ...uniqueValues];
};

const CATEGORY_LABEL_OVERRIDES = {
    iphone: 'iPhone',
    'android-honor': 'Android · HONOR',
    'android-infinix': 'Android · Infinix',
    'android-motorola': 'Android · Motorola',
    'android-nubia': 'Android · Nubia',
    'android-redmi': 'Android · Redmi',
    'android-samsung': 'Android · Samsung',
    'android-zte': 'Android · ZTE',
    accesorios: 'Accesorios'
};

const formatCategoryLabel = (category) => {
    if (category === DEFAULT_FILTER_VALUE) {
        return 'Todos';
    }

    if (CATEGORY_LABEL_OVERRIDES[category]) {
        return CATEGORY_LABEL_OVERRIDES[category];
    }

    return category
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ');
};

const formatBrandLabel = (brand) => {
    if (brand === DEFAULT_FILTER_VALUE) {
        return 'Todas las marcas';
    }

    return brand;
};

const FILTERS_CONFIG = [
    {
        type: 'category',
        dataKey: 'category',
        containerSelector: '.product-filters__row--categories',
        formatLabel: formatCategoryLabel
    },
    {
        type: 'brand',
        dataKey: 'brand',
        containerSelector: '.product-filters__row--brands',
        formatLabel: formatBrandLabel
    }
];

const FILTER_TYPES = new Set(FILTERS_CONFIG.map(({ type }) => type));

FILTERS_CONFIG.forEach(({ type }) => {
    if (type && !(type in filterState)) {
        filterState[type] = DEFAULT_FILTER_VALUE;
    }
});

const ensureFilterRow = (filtersContainer, { containerSelector, type }) => {
    const selector = containerSelector || `.product-filters__row--${type}`;
    let row = selector ? filtersContainer.querySelector(selector) : null;

    if (!row) {
        row = document.createElement('div');
        row.className = 'product-filters__row';

        if (selector) {
            if (selector.startsWith('.')) {
                row.classList.add(selector.slice(1));
            } else if (selector.startsWith('#')) {
                row.id = selector.slice(1);
            } else {
                row.classList.add(selector);
            }
        }

        filtersContainer.appendChild(row);
    } else if (!row.classList.contains('product-filters__row')) {
        row.classList.add('product-filters__row');
    }

    return row;
};

const renderFilterButtons = ({ container, options, activeValue, type, formatLabel }) => {
    if (!container) {
        return;
    }

    container.innerHTML = '';

    const fragment = document.createDocumentFragment();

    const labelFormatter = typeof formatLabel === 'function' ? formatLabel : (value) => value;

    options.forEach(filterValue => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'filter-btn';
        button.dataset.filterType = type;
        button.dataset.filterValue = filterValue;
        button.textContent = labelFormatter(filterValue);

        if (filterValue === activeValue) {
            button.classList.add('active');
        }

        fragment.appendChild(button);
    });

    container.appendChild(fragment);
};

const synchronizeActiveFilter = (filtersContainer) => {
    if (!filtersContainer) {
        return;
    }

    const buttons = filtersContainer.querySelectorAll('.filter-btn');
    buttons.forEach(button => {
        const filterType = button.dataset.filterType || 'category';
        const filterValue = button.dataset.filterValue || DEFAULT_FILTER_VALUE;
        const activeValue = filterType && filterType in filterState
            ? filterState[filterType]
            : DEFAULT_FILTER_VALUE;
        const isActive = activeValue === filterValue;

        button.classList.toggle('active', isActive);
    });
};

const pauseVideoElement = (video) => {
    if (video && !video.paused) {
        video.pause();
    }
};

function applyFilters(container) {
    const productCards = container.querySelectorAll('.product-card');

    productCards.forEach(card => {
        const matches = FILTERS_CONFIG.every(({ type, dataKey }) => {
            const activeValue = filterState[type] ?? DEFAULT_FILTER_VALUE;
            if (activeValue === DEFAULT_FILTER_VALUE) {
                return true;
            }

            const datasetKey = dataKey in card.dataset ? dataKey : type;
            const cardValue = card.dataset[datasetKey] || DEFAULT_FILTER_VALUE;
            return cardValue === activeValue;
        });
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

    filtersContainer.addEventListener('click', (event) => {
        const button = event.target instanceof Element ? event.target.closest('.filter-btn') : null;
        if (!button) {
            return;
        }

        event.preventDefault();

        const filterType = button.dataset.filterType || 'category';
        const nextFilter = button.dataset.filterValue || DEFAULT_FILTER_VALUE;

        if (!FILTER_TYPES.has(filterType)) {
            return;
        }

        if (filterState[filterType] === nextFilter) {
            return;
        }

        filterState[filterType] = nextFilter;

        synchronizeActiveFilter(filtersContainer);

        applyFilters(productsContainer);
    });

    filtersInitialized = true;
    synchronizeActiveFilter(filtersContainer);
    applyFilters(productsContainer);
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
    card.dataset.brand = product.brand || DEFAULT_FILTER_VALUE;

    const videoSrc = product.videoSrc || '';
    const posterSrc = product.posterSrc || '';
    const whatsappLink = product.whatsappLink || '#';
    const ctaLabel = product.ctaLabel || 'Consultar disponibilidad';
    const specs = product.specs || '';
    const brand = product.brand || '';

    card.innerHTML = `
        <div class="product-media">
            <video class="product-video" src="${videoSrc}" poster="${posterSrc}" playsinline muted loop preload="metadata"></video>
            <button type="button" class="audio-toggle" aria-label="Activar audio del producto" aria-pressed="false">
                <i class="fa-solid fa-volume-xmark" aria-hidden="true"></i>
            </button>
        </div>
        <div class="product-info">
            ${brand ? `<span class="product-brand">${brand}</span>` : ''}
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
    applyFilters(container);

    container.dispatchEvent(new CustomEvent('products:rendered', { bubbles: true }));
}

document.addEventListener('DOMContentLoaded', () => {
    const productsContainer = document.querySelector(PRODUCTS_GRID_SELECTOR);
    if (!productsContainer) {
        return;
    }

    const filtersContainer = document.querySelector(FILTERS_CONTAINER_SELECTOR);

    if (filtersContainer) {
        FILTERS_CONFIG.forEach((filterConfig) => {
            const { type, dataKey, containerSelector, formatLabel } = filterConfig;
            const filterOptions = deriveFilterOptions(productsData, dataKey);
            const filterRow = ensureFilterRow(filtersContainer, filterConfig);

            renderFilterButtons({
                container: filterRow,
                options: filterOptions,
                activeValue: filterState[type],
                type,
                formatLabel
            });
        });

        synchronizeActiveFilter(filtersContainer);
    }

    renderProducts(productsData, { container: productsContainer });

    if (filtersContainer) {
        setupFilters(filtersContainer, productsContainer);
    }
});

import { productsData } from './products-data.js';

const PRODUCTS_GRID_SELECTOR = '.products-grid.catalog-grid';
const FILTERS_CONTAINER_SELECTOR = '.product-filters';
const DEFAULT_FILTER_VALUE = 'all';

let filtersInitialized = false;
const filterState = {};

const FAMILY_LABEL_OVERRIDES = {
    telefonos: 'Teléfonos',
    accesorios: 'Accesorios'
};

const PLATFORM_LABEL_OVERRIDES = {
    iphone: 'iPhone',
    android: 'Android',
    accesorios: 'Accesorios'
};

const toTitleCase = (value = '') => value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

const formatFamilyLabel = (family) => {
    if (family === DEFAULT_FILTER_VALUE) {
        return 'Todas las familias';
    }

    if (FAMILY_LABEL_OVERRIDES[family]) {
        return FAMILY_LABEL_OVERRIDES[family];
    }

    return toTitleCase(family);
};

const formatPlatformLabel = (platform) => {
    if (platform === DEFAULT_FILTER_VALUE) {
        return 'Todos los sistemas';
    }

    if (PLATFORM_LABEL_OVERRIDES[platform]) {
        return PLATFORM_LABEL_OVERRIDES[platform];
    }

    return toTitleCase(platform);
};

const formatBrandLabel = (brand) => {
    if (brand === DEFAULT_FILTER_VALUE) {
        return 'Todas las marcas';
    }

    return brand;
};

const FILTERS_CONFIG = [
    {
        type: 'family',
        dataKey: 'family',
        containerSelector: '.product-filters__row--families',
        formatLabel: formatFamilyLabel
    },
    {
        type: 'platform',
        dataKey: 'platform',
        containerSelector: '.product-filters__row--platforms',
        formatLabel: formatPlatformLabel,
        dependsOn: ['family']
    },
    {
        type: 'brand',
        dataKey: 'brand',
        containerSelector: '.product-filters__row--brands',
        formatLabel: formatBrandLabel,
        dependsOn: ['family', 'platform']
    }
];

const FILTER_CONFIG_BY_TYPE = new Map(FILTERS_CONFIG.map(config => [config.type, config]));
const PRIMARY_FILTER_TYPE = FILTERS_CONFIG[0]?.type || 'family';

const getFilterDataKey = (type) => {
    const config = FILTER_CONFIG_BY_TYPE.get(type);
    return config?.dataKey || type;
};

const deriveFilterOptions = (products, config) => {
    const { dataKey, dependsOn = [] } = config || {};
    const uniqueValues = [];
    const seen = new Set();

    const matchesDependencies = (product) => dependsOn.every((dependencyType) => {
        const dependencyKey = getFilterDataKey(dependencyType);
        const activeValue = filterState[dependencyType] ?? DEFAULT_FILTER_VALUE;

        if (!activeValue || activeValue === DEFAULT_FILTER_VALUE) {
            return true;
        }

        return product?.[dependencyKey] === activeValue;
    });

    products.forEach(product => {
        if (!product || !matchesDependencies(product)) {
            return;
        }

        const value = product?.[dataKey];
        if (!value || value === DEFAULT_FILTER_VALUE || seen.has(value)) {
            return;
        }

        seen.add(value);
        uniqueValues.push(value);
    });

    return [DEFAULT_FILTER_VALUE, ...uniqueValues];
};

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

const renderFilterButtons = ({ container, options, activeValue, type, formatLabel, disabled = false }) => {
    if (!container) {
        return;
    }

    container.innerHTML = '';

    const isDisabled = Boolean(disabled);
    container.classList.toggle('product-filters__row--disabled', isDisabled);
    container.hidden = isDisabled;

    if (isDisabled) {
        container.setAttribute('aria-hidden', 'true');
        return;
    }

    container.removeAttribute('aria-hidden');

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
        const filterType = button.dataset.filterType || PRIMARY_FILTER_TYPE;
        const filterValue = button.dataset.filterValue || DEFAULT_FILTER_VALUE;
        const activeValue = filterType && filterType in filterState
            ? filterState[filterType]
            : DEFAULT_FILTER_VALUE;
        const isActive = activeValue === filterValue;

        button.classList.toggle('active', isActive);
    });
};

const renderAllFilters = (filtersContainer, products = productsData) => {
    if (!filtersContainer) {
        return;
    }

    FILTERS_CONFIG.forEach((filterConfig) => {
        const { type, formatLabel } = filterConfig;
        const filterRow = ensureFilterRow(filtersContainer, filterConfig);
        const options = deriveFilterOptions(products, filterConfig);
        const hasSelectableOptions = options.length > 1;

        const currentValue = filterState[type] ?? DEFAULT_FILTER_VALUE;
        const nextValue = options.includes(currentValue)
            ? currentValue
            : DEFAULT_FILTER_VALUE;

        if (nextValue !== currentValue) {
            filterState[type] = nextValue;
        }

        renderFilterButtons({
            container: filterRow,
            options,
            activeValue: nextValue,
            type,
            formatLabel,
            disabled: !hasSelectableOptions
        });
    });

    synchronizeActiveFilter(filtersContainer);
};

const loadVideoSource = (video) => {
    if (!video || !video.dataset || !video.dataset.src) {
        return;
    }

    const source = video.dataset.src;
    if (source) {
        video.src = source;
        video.removeAttribute('data-src');
        video.load();
    }
};

const attemptPlay = (video) => {
    if (!video) {
        return;
    }

    const playPromise = video.play();
    if (playPromise && typeof playPromise.then === 'function') {
        playPromise.catch(() => {});
    }
};

const findVideoToggle = (video) => {
    return video?.closest('.product-slide')?.querySelector('.product-video-toggle') || null;
};

const updateVideoToggleState = (button, isPlaying) => {
    if (!button) {
        return;
    }

    const playing = Boolean(isPlaying);
    button.classList.toggle('is-playing', playing);
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-label', playing ? 'Pausar video del producto' : 'Reproducir video del producto');

    const icon = button.querySelector('i');
    if (icon) {
        icon.classList.toggle('fa-play', !playing);
        icon.classList.toggle('fa-pause', playing);
    }
};

const syncVideoToggle = (video) => {
    const toggleButton = findVideoToggle(video);
    const isPlaying = Boolean(video) && !video.paused && !video.ended;
    updateVideoToggleState(toggleButton, isPlaying);
};

let videoVisibilityObserver = null;

const getVideoVisibilityObserver = () => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
        return null;
    }

    if (!videoVisibilityObserver) {
        videoVisibilityObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                const isVisible = entry.isIntersecting;

                if (!video) {
                    return;
                }

                video.dataset.isVisible = String(isVisible);
                const shouldLoop = video.dataset.loop === 'true';
                video.loop = Boolean(isVisible && shouldLoop);

                if (!isVisible) {
                    if (!video.paused) {
                        video.pause();
                    }
                    if (shouldLoop) {
                        try {
                            video.currentTime = 0;
                        } catch (error) {
                            // Some browsers may throw if currentTime is not yet available.
                        }
                    }
                    syncVideoToggle(video);
                    return;
                }

                if (video.dataset.userActivated === 'true' && video.dataset.activeSlide === 'true') {
                    loadVideoSource(video);
                    attemptPlay(video);
                }
            });
        }, {
            threshold: 0.55
        });
    }

    return videoVisibilityObserver;
};

const pauseVideoElement = (video, { resetTime = false, disengageObserver = false } = {}) => {
    if (!video) {
        return;
    }

    if (!video.paused) {
        video.pause();
    }

    if (resetTime) {
        try {
            video.currentTime = 0;
        } catch (error) {
            // Ignore if resetting currentTime is not supported at the moment.
        }
    }

    video.dataset.userActivated = 'false';
    video.loop = false;

    if (disengageObserver && videoVisibilityObserver) {
        videoVisibilityObserver.unobserve(video);
    }

    syncVideoToggle(video);
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
            const videos = card.querySelectorAll('.product-video');
            videos.forEach(video => {
                pauseVideoElement(video, { resetTime: true, disengageObserver: true });
            });
        } else {
            const activeVideo = card.querySelector('.product-slide.product-slide--active .product-video');
            if (activeVideo) {
                activeVideo.dataset.activeSlide = 'true';
                const observer = getVideoVisibilityObserver();
                if (observer) {
                    observer.observe(activeVideo);
                }
            }
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

        const filterType = button.dataset.filterType || PRIMARY_FILTER_TYPE;
        const nextFilter = button.dataset.filterValue || DEFAULT_FILTER_VALUE;

        if (!FILTER_TYPES.has(filterType)) {
            return;
        }

        if (filterState[filterType] === nextFilter) {
            return;
        }

        filterState[filterType] = nextFilter;

        renderAllFilters(filtersContainer);

        applyFilters(productsContainer);
    });

    filtersInitialized = true;
    renderAllFilters(filtersContainer);
    applyFilters(productsContainer);
}

function initializeProductGalleries(container) {
    const cards = Array.from(container.querySelectorAll('.product-card'));
    if (cards.length === 0) {
        return;
    }

    const observer = getVideoVisibilityObserver();

    cards.forEach(card => {
        const slider = card.querySelector('.product-slider');
        const track = slider?.querySelector('.product-slider__track');

        if (!slider || !track) {
            return;
        }

        const slides = Array.from(track.querySelectorAll('.product-slide'));
        if (slides.length === 0) {
            return;
        }

        const prevButton = slider.querySelector('.product-slider__nav--prev');
        const nextButton = slider.querySelector('.product-slider__nav--next');
        const thumbnails = Array.from(slider.querySelectorAll('.product-slider__thumbnail'));

        let activeIndex = 0;

        const clampIndex = (index) => Math.max(0, Math.min(index, slides.length - 1));

        const updateActiveSlide = (nextIndex) => {
            const newIndex = clampIndex(nextIndex);
            if (newIndex === activeIndex) {
                return;
            }

            activeIndex = newIndex;
            track.style.transform = `translateX(-${activeIndex * 100}%)`;

            slides.forEach((slide, index) => {
                const isActive = index === activeIndex;
                slide.classList.toggle('product-slide--active', isActive);
                slide.setAttribute('aria-hidden', String(!isActive));

                const video = slide.querySelector('.product-video');
                if (!video) {
                    return;
                }

                video.dataset.activeSlide = String(isActive);

                if (isActive) {
                    if (observer) {
                        observer.observe(video);
                    }
                } else {
                    if (observer) {
                        observer.unobserve(video);
                    }
                    pauseVideoElement(video, { resetTime: true });
                }
            });

            thumbnails.forEach((thumbnail, index) => {
                const isActive = index === activeIndex;
                thumbnail.classList.toggle('is-active', isActive);
                thumbnail.setAttribute('aria-pressed', String(isActive));
            });

            if (prevButton) {
                prevButton.disabled = activeIndex === 0;
            }

            if (nextButton) {
                nextButton.disabled = activeIndex === slides.length - 1;
            }
        };

        const initializeSlide = (slide, index) => {
            slide.dataset.slideIndex = String(index);
            slide.classList.toggle('product-slide--active', index === activeIndex);
            slide.setAttribute('aria-hidden', String(index !== activeIndex));

            const video = slide.querySelector('.product-video');
            if (!video) {
                return;
            }

            video.dataset.activeSlide = String(index === activeIndex);
            video.dataset.userActivated = 'false';

            const toggleButton = findVideoToggle(video);

            if (toggleButton) {
                toggleButton.addEventListener('click', () => {
                    if (video.paused || video.ended) {
                        video.dataset.userActivated = 'true';
                        loadVideoSource(video);
                        attemptPlay(video);
                    } else {
                        video.dataset.userActivated = 'false';
                        video.pause();
                    }
                });
            }

            video.addEventListener('play', () => {
                updateVideoToggleState(toggleButton, true);
            });

            video.addEventListener('pause', () => {
                updateVideoToggleState(toggleButton, false);
            });

            video.addEventListener('click', () => {
                if (video.paused || video.ended) {
                    video.dataset.userActivated = 'true';
                    loadVideoSource(video);
                    attemptPlay(video);
                } else {
                    video.dataset.userActivated = 'false';
                    video.pause();
                }
            });

            if (observer && index === activeIndex) {
                observer.observe(video);
            } else if (!observer && index === activeIndex && video.dataset.userActivated === 'true') {
                loadVideoSource(video);
                attemptPlay(video);
            }

            syncVideoToggle(video);
        };

        slides.forEach(initializeSlide);

        if (prevButton) {
            prevButton.addEventListener('click', () => {
                updateActiveSlide(activeIndex - 1);
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                updateActiveSlide(activeIndex + 1);
            });
        }

        thumbnails.forEach(thumbnail => {
            thumbnail.addEventListener('click', () => {
                const index = Number.parseInt(thumbnail.dataset.slideIndex || '0', 10);
                updateActiveSlide(index);
            });
        });

        track.style.transform = `translateX(-${activeIndex * 100}%)`;

        if (prevButton) {
            prevButton.disabled = activeIndex === 0;
        }

        if (nextButton) {
            nextButton.disabled = activeIndex === slides.length - 1;
        }

        thumbnails.forEach((thumbnail, index) => {
            const isActive = index === activeIndex;
            thumbnail.classList.toggle('is-active', isActive);
            thumbnail.setAttribute('aria-pressed', String(isActive));
        });
    });
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.family = product.family || DEFAULT_FILTER_VALUE;
    card.dataset.platform = product.platform || DEFAULT_FILTER_VALUE;
    card.dataset.brand = product.brand || DEFAULT_FILTER_VALUE;

    const mediaItems = Array.isArray(product.media) ? product.media : [];
    const whatsappLink = product.whatsappLink || '#';
    const ctaLabel = product.ctaLabel || 'Consultar disponibilidad';
    const specs = product.specs || '';
    const brand = product.brand || '';

    const mediaContainer = document.createElement('div');
    mediaContainer.className = 'product-media';

    if (mediaItems.length > 0) {
        const slider = document.createElement('div');
        slider.className = 'product-slider';

        const viewport = document.createElement('div');
        viewport.className = 'product-slider__viewport';

        const track = document.createElement('div');
        track.className = 'product-slider__track';

        viewport.appendChild(track);
        slider.appendChild(viewport);

        const shouldRenderNavigation = mediaItems.length > 1;
        const thumbnailsContainer = shouldRenderNavigation ? document.createElement('div') : null;

        if (thumbnailsContainer) {
            thumbnailsContainer.className = 'product-slider__thumbnails';
        }

        mediaItems.forEach((item, index) => {
            const slide = document.createElement('div');
            slide.className = 'product-slide';
            slide.dataset.mediaType = item?.type || 'image';

            if (item?.type === 'video') {
                const video = document.createElement('video');
                video.className = 'product-video';
                video.playsInline = true;
                video.muted = true;
                video.preload = 'none';
                video.setAttribute('webkit-playsinline', 'true');

                if (item?.poster) {
                    video.poster = item.poster;
                }

                if (item?.src) {
                    video.dataset.src = item.src;
                }

                if (item?.loop) {
                    video.dataset.loop = 'true';
                }

                slide.appendChild(video);

                const toggleButton = document.createElement('button');
                toggleButton.type = 'button';
                toggleButton.className = 'product-video-toggle';
                toggleButton.setAttribute('aria-label', 'Reproducir video del producto');
                toggleButton.setAttribute('aria-pressed', 'false');
                toggleButton.innerHTML = '<i class="fa-solid fa-play" aria-hidden="true"></i>';

                slide.appendChild(toggleButton);
            } else {
                const image = document.createElement('img');
                image.className = 'product-image';
                image.loading = 'lazy';
                image.alt = item?.alt || product.name;
                image.src = item?.src || '';
                slide.appendChild(image);
            }

            track.appendChild(slide);

            if (thumbnailsContainer) {
                const thumbnailButton = document.createElement('button');
                thumbnailButton.type = 'button';
                thumbnailButton.className = 'product-slider__thumbnail';
                thumbnailButton.dataset.slideIndex = String(index);
                thumbnailButton.setAttribute('aria-label', `Mostrar vista ${index + 1} de ${product.name}`);

                const thumbSource = item?.thumbnail || item?.poster || item?.src;
                if (thumbSource) {
                    const thumbImage = document.createElement('img');
                    thumbImage.loading = 'lazy';
                    thumbImage.src = thumbSource;
                    thumbImage.alt = `Vista ${index + 1} de ${product.name}`;
                    thumbnailButton.appendChild(thumbImage);
                }

                if (item?.type === 'video') {
                    const thumbIcon = document.createElement('span');
                    thumbIcon.className = 'product-slider__thumbnail-icon';
                    thumbIcon.innerHTML = '<i class="fa-solid fa-play" aria-hidden="true"></i>';
                    thumbnailButton.appendChild(thumbIcon);
                }

                thumbnailsContainer.appendChild(thumbnailButton);
            }
        });

        if (shouldRenderNavigation) {
            const prevButton = document.createElement('button');
            prevButton.type = 'button';
            prevButton.className = 'product-slider__nav product-slider__nav--prev';
            prevButton.setAttribute('aria-label', 'Ver elemento anterior');
            prevButton.innerHTML = '<i class="fa-solid fa-chevron-left" aria-hidden="true"></i>';

            const nextButton = document.createElement('button');
            nextButton.type = 'button';
            nextButton.className = 'product-slider__nav product-slider__nav--next';
            nextButton.setAttribute('aria-label', 'Ver siguiente elemento');
            nextButton.innerHTML = '<i class="fa-solid fa-chevron-right" aria-hidden="true"></i>';

            slider.appendChild(prevButton);
            slider.appendChild(nextButton);
        }

        if (thumbnailsContainer) {
            slider.appendChild(thumbnailsContainer);
        }

        mediaContainer.appendChild(slider);
    } else {
        mediaContainer.classList.add('product-media--empty');
    }

    const info = document.createElement('div');
    info.className = 'product-info';

    if (brand) {
        const brandBadge = document.createElement('span');
        brandBadge.className = 'product-brand';
        brandBadge.textContent = brand;
        info.appendChild(brandBadge);
    }

    const title = document.createElement('h3');
    title.className = 'product-name';
    title.textContent = product.name;
    info.appendChild(title);

    if (specs) {
        const specsElement = document.createElement('p');
        specsElement.className = 'product-spec';
        specsElement.textContent = specs;
        info.appendChild(specsElement);
    }

    const cta = document.createElement('a');
    cta.href = whatsappLink;
    cta.target = '_blank';
    cta.className = 'product-cta';
    cta.innerHTML = `<i class="fab fa-whatsapp"></i> ${ctaLabel}`;

    info.appendChild(cta);

    card.appendChild(mediaContainer);
    card.appendChild(info);

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
    initializeProductGalleries(container);
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
        renderAllFilters(filtersContainer, productsData);
    }

    renderProducts(productsData, { container: productsContainer });

    if (filtersContainer) {
        setupFilters(filtersContainer, productsContainer);
    }
});

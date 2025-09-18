// --- main.js ---
// Este script maneja la lógica principal de la página, incluyendo la activación de enlaces de
document.addEventListener('DOMContentLoaded', () => {
    // --- FUNCIÓN GENERAL PARA ACTIVAR ENLACE DE NAVEGACIÓN ---
    // Esta función se llama desde partials-loader.js después de cargar el header
    window.initializeActiveNavLinks = function () {
        const navLinks = document.querySelectorAll('.nav-link');
        const currentPage = window.location.pathname.split('/').pop(); // Obtiene 'index.html', 'servicios.html', etc.

        navLinks.forEach(link => {
            const linkPage = link.getAttribute('href').split('/').pop();
            if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
                link.classList.add('active');
            }
        });
    };

    // --- LÓGICA DEL MENÚ MÓVIL ---
    // Espera a que el header se cargue con partials-loader
    function setupMobileMenu() {
        const hamburgerBtn = document.querySelector('.hamburger-menu');
        const mobileNav = document.querySelector('.mobile-nav-container');
        const closeBtn = document.querySelector('.close-menu');
        const overlay = document.querySelector('.nav-overlay');

        if (hamburgerBtn && mobileNav && closeBtn && overlay) {
            const setMenuState = (isOpen) => {
                mobileNav.classList.toggle('is-open', isOpen);
                overlay.classList.toggle('is-open', isOpen);
                document.body.classList.toggle('no-scroll', isOpen);
                hamburgerBtn.classList.toggle('is-active', isOpen);
                hamburgerBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                hamburgerBtn.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
                mobileNav.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
                overlay.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
            };

            const closeMenu = () => setMenuState(false);
            const toggleMenu = () => setMenuState(!mobileNav.classList.contains('is-open'));

            hamburgerBtn.addEventListener('click', toggleMenu);
            closeBtn.addEventListener('click', closeMenu);
            overlay.addEventListener('click', closeMenu);

            const mobileNavLinks = mobileNav.querySelectorAll('.nav-link');
            mobileNavLinks.forEach(link => {
                link.addEventListener('click', closeMenu);
            });

            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && mobileNav.classList.contains('is-open')) {
                    closeMenu();
                }
            });

            setMenuState(false);
        }
    }

    // --- INICIALIZACIÓN DEL MENÚ MÓVIL ---
    // Nos aseguramos de que el menú se active después de que el header (parcial) se haya cargado.
    if (window.partialsLoaded) {
        // Si el loader de parciales ya existe, nos "enganchamos" a su promesa.
        window.partialsLoaded.then(setupMobileMenu);
    } else {
        // Si no, es probable que no se estén usando parciales en esta página.
        // Intentamos configurar el menú directamente, ya que el DOM está listo.
        setupMobileMenu();
    }

    // --- LÓGICA DE HEADER OCULTABLE AL HACER SCROLL ---
    const header = document.querySelector('.main-header');
    if (header) {
        let lastScrollY = window.scrollY;

        window.addEventListener('scroll', () => {
            // No ocultar el header si el menú móvil está abierto
            if (document.body.classList.contains('no-scroll')) {
                return;
            }

            const currentScrollY = window.scrollY;

            if (currentScrollY > lastScrollY && currentScrollY > header.offsetHeight) {
                // Scrolling down -> Ocultar header
                header.classList.add('header-hidden');
            } else {
                // Scrolling up -> Mostrar header
                header.classList.remove('header-hidden');
            }
            lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY;
        });
    }

    // --- LÓGICA DEL CARRUSEL (Solo para index.html) ---
    const carouselContainer = document.querySelector('.carousel-container');
    if (carouselContainer) {
        const slides = document.querySelectorAll('.carousel-slide');
        const dots = document.querySelectorAll('.dot');
        const prevButton = document.querySelector('.carousel-button.prev');
        const nextButton = document.querySelector('.carousel-button.next');
        let currentSlide = 0;
        let slideInterval;

        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.classList.remove('active-slide');
                dots[i].classList.remove('active-dot');
            });

            currentSlide = (index + slides.length) % slides.length; // Bucle infinito

            slides[currentSlide].classList.add('active-slide');
            dots[currentSlide].classList.add('active-dot');
        }

        function next() {
            showSlide(currentSlide + 1);
        }

        function prev() {
            showSlide(currentSlide - 1);
        }

        function startCarousel() {
            stopCarousel(); // Previene múltiples intervalos
            slideInterval = setInterval(next, 5000);
        }

        function stopCarousel() {
            clearInterval(slideInterval);
        }

        nextButton.addEventListener('click', () => { stopCarousel(); next(); startCarousel(); });
        prevButton.addEventListener('click', () => { stopCarousel(); prev(); startCarousel(); });
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => { stopCarousel(); showSlide(index); startCarousel(); });
        });

        startCarousel();
    }

    // --- LÓGICA DE SERVICIOS (Solo para servicios.html) ---
    const classifierCards = document.querySelectorAll('.classifier-card');
    const detailsContainer = document.getElementById('service-details-container');
    if (classifierCards.length > 0 && detailsContainer) {
        const renderServiceDetail = (card, { scroll = true } = {}) => {
            // Activar visualmente la tarjeta seleccionada
            classifierCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            const targetId = card.dataset.target.substring(1); // ej: "detail-pantallas"
            const templateKey = targetId.replace('detail-', '');
            const templateId = `template-${templateKey}`;
            const template = document.getElementById(templateId);

            if (template) {
                detailsContainer.innerHTML = template.innerHTML;
                const anchor = detailsContainer.querySelector(`#${targetId}`);
                if (scroll) {
                    (anchor || detailsContainer).scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                // Es crucial volver a activar los listeners del modal para el nuevo contenido
                setupModalTriggers();
            }
        };

        classifierCards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                renderServiceDetail(card);
            });
        });

        const activateFromHash = () => {
            const hash = window.location.hash;
            if (!hash) {
                return;
            }

            const matchingCard = Array.from(classifierCards).find(card => card.dataset.target === hash);
            if (matchingCard) {
                renderServiceDetail(matchingCard);
            }
        };

        // Activar la categoría correspondiente si llegamos con hash en la URL
        activateFromHash();
        window.addEventListener('hashchange', activateFromHash);

        // Mostrar una categoría por defecto si no existe hash en la URL
        if (!window.location.hash && classifierCards[0]) {
            renderServiceDetail(classifierCards[0], { scroll: false });
        }
    }

    // --- LÓGICA DEL MODAL DE WHATSAPP ---
    const modal = document.getElementById('whatsapp-modal');
    function setupModalTriggers() {
        if (!modal) return;
        const serviceCtaButtons = document.querySelectorAll('.cta-button-service');
        const continueBtn = document.getElementById('modal-continue-btn');

        serviceCtaButtons.forEach(button => {
            if (button.dataset.modalBound === 'true') {
                return;
            }

            button.addEventListener('click', () => {
                const whatsappLink = button.dataset.whatsappLink;
                if (whatsappLink) {
                    if (continueBtn) {
                        continueBtn.href = whatsappLink;
                    }
                    modal.classList.add('active');
                }
            });

            button.dataset.modalBound = 'true';
        });
    }
    // Cierra el modal
    if (modal) {
        const closeModalElements = modal.querySelectorAll('.modal-close-btn, .modal-btn-secondary');
        closeModalElements.forEach(el => {
            el.addEventListener('click', (e) => {
                // Asegura que el clic en el contenido no cierre el modal
                if (e.target === el) {
                    modal.classList.remove('active');
                }
            });
        });

        // Cerrar al hacer clic fuera del contenido
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.classList.remove('active');
            }
        });

        // Cerrar con la tecla Escape
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modal.classList.contains('active')) {
                modal.classList.remove('active');
            }
        });
    }

    // --- LÓGICA DE FILTROS DE PRODUCTOS (Solo para productos.html) ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');
    if (filterButtons.length > 0 && productCards.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Estilo del botón activo
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                const filter = button.dataset.filter;

                productCards.forEach(card => {
                    if (filter === 'all' || card.dataset.category === filter) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    if (productCards.length > 0) {
        const productVideoItems = Array.from(productCards)
            .map(card => {
                const video = card.querySelector('.product-video');
                const control = card.querySelector('.audio-toggle');
                return video ? { card, video, control } : null;
            })
            .filter(Boolean);

        if (productVideoItems.length > 0) {
            const attemptPlay = (video) => {
                const playPromise = video.play();
                if (playPromise && typeof playPromise.then === 'function') {
                    playPromise.catch(() => {});
                }
            };

            const pauseVideo = (video) => {
                if (!video.paused) {
                    video.pause();
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
                const handlePauseRequest = () => pauseVideo(video);

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
    }

    // Inicializar listeners en la carga inicial de la página
    setupModalTriggers();
});

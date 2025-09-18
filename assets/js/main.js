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

        // Comprobamos si los elementos existen para evitar errores
        if (hamburgerBtn && mobileNav && closeBtn && overlay) {
            const openMenu = () => {
                mobileNav.classList.add('is-open');
                overlay.classList.add('is-open');
                document.body.classList.add('no-scroll');
            };

            const closeMenu = () => {
                mobileNav.classList.remove('is-open');
                overlay.classList.remove('is-open');
                document.body.classList.remove('no-scroll');
            };

            hamburgerBtn.addEventListener('click', openMenu);
            closeBtn.addEventListener('click', closeMenu);
            overlay.addEventListener('click', closeMenu);

            // Cierra el menú al hacer clic en un enlace
            const mobileNavLinks = mobileNav.querySelectorAll('.nav-link');
            mobileNavLinks.forEach(link => {
                link.addEventListener('click', closeMenu);
            });
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

    // Inicializar listeners en la carga inicial de la página
    setupModalTriggers();
});
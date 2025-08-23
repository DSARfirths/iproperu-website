document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA DEL CARRUSEL (SOLO PARA INDEX.HTML) ---
    const carousel = document.querySelector('.carousel-container');
    if (carousel) {
        const slides = document.querySelectorAll('.carousel-slide');
        const dots = document.querySelectorAll('.dot');
        const prevButton = document.querySelector('.carousel-button.prev');
        const nextButton = document.querySelector('.carousel-button.next');
        
        let currentSlide = 0;
        let slideInterval;

        function showSlide(index) {
            slides.forEach(slide => slide.classList.remove('active-slide'));
            dots.forEach(dot => dot.classList.remove('active-dot'));

            if (index >= slides.length) {
                currentSlide = 0;
            } else if (index < 0) {
                currentSlide = slides.length - 1;
            } else {
                currentSlide = index;
            }

            slides[currentSlide].classList.add('active-slide');
            dots[currentSlide].classList.add('active-dot');
        }

        function nextSlide() {
            showSlide(currentSlide + 1);
        }

        function startCarousel() {
            slideInterval = setInterval(nextSlide, 5000);
        }

        function stopCarousel() {
            clearInterval(slideInterval);
        }

        nextButton.addEventListener('click', () => {
            stopCarousel();
            nextSlide();
            startCarousel();
        });

        prevButton.addEventListener('click', () => {
            stopCarousel();
            showSlide(currentSlide - 1);
            startCarousel();
        });

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                stopCarousel();
                showSlide(index);
                startCarousel();
            });
        });

        showSlide(currentSlide);
        startCarousel();
    }
    // --- LÓGICA DEL ACORDEÓN DE SERVICIOS ---
    const classifierCards = document.querySelectorAll('.classifier-card');
    const detailsContainer = document.getElementById('service-details-container');

    if (classifierCards.length > 0 && detailsContainer) {
        classifierCards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();

                const targetId = card.dataset.target.substring(1); // ej: "detail-pantallas" -> "template-pantallas"
                const template = document.getElementById(`template-${targetId.split('-')[1]}`);
                
                if (template) {
                    // Limpia el contenedor y añade el nuevo contenido
                    detailsContainer.innerHTML = template.innerHTML;
                    
                    // Scroll suave hacia el contenido
                    detailsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

                    // Activa el listener para el nuevo botón del modal
                    setupModalTriggers();
                }
            });
        });
    }

    // --- LÓGICA DEL MODAL DE WHATSAPP ---
    const modal = document.getElementById('whatsapp-modal');
    if (modal) {
        const closeModalBtns = modal.querySelectorAll('.modal-close-btn, .modal-btn-secondary');
        const continueBtn = document.getElementById('modal-continue-btn');

        function showModal(whatsappLink) {
            continueBtn.href = whatsappLink;
            modal.classList.add('active');
        }

        function closeModal() {
            modal.classList.remove('active');
        }

        closeModalBtns.forEach(btn => btn.addEventListener('click', closeModal));
        
        // Cierra el modal si se hace clic en el overlay
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Esta función se llamará cada vez que se cargue nuevo contenido
        function setupModalTriggers() {
            const serviceCtaButtons = document.querySelectorAll('.cta-button-service');
            serviceCtaButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const whatsappLink = button.dataset.whatsappLink;
                    showModal(whatsappLink);
                });
            });
        }
    }

});
document.addEventListener("DOMContentLoaded", function() {
    loadPartial("header.header", "header.html", () => {
        setActiveNavLink();
        setupMobileMenu(); // <-- AÑADIMOS LA LLAMADA AQUÍ
    });
    loadPartial("footer.footer", "footer.html");
    loadPartial("#modal-placeholder", "contact-modal.html", setupModalTriggers);
});

function loadPartial(selector, url, callback) {
    const element = document.querySelector(selector);
    if (element) {
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error(`Could not load ${url}`);
                return response.text();
            })
            .then(data => {
                element.innerHTML = data;
                if (callback) callback();
            })
            .catch(error => console.error(error));
    }
}

function setActiveNavLink() {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const navLinks = document.querySelectorAll(".nav__link");
    navLinks.forEach(link => {
        if (link.tagName === 'A') {
            const linkPage = link.getAttribute("href");
            if (linkPage === currentPage) {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        }
    });
}

// ===== NUEVA FUNCIÓN PARA EL MENÚ MÓVIL =====
function setupMobileMenu() {
    const navMenu = document.getElementById('nav-menu'),
          navToggle = document.getElementById('nav-toggle'),
          navClose = document.getElementById('nav-close');

    // Mostrar menú
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.add('show-menu');
        });
    }

    // Ocultar menú
    if (navClose) {
        navClose.addEventListener('click', () => {
            navMenu.classList.remove('show-menu');
        });
    }
}
// ===============================================

function setupModalTriggers() {
    const modal = document.querySelector(".modal__overlay");
    const closeModalBtn = document.querySelector(".modal__close");
    const openModalBtn = document.getElementById("contact-modal-trigger");
    const initialView = document.getElementById("initial-choice");
    const formView = document.getElementById("form-view");
    const showFormBtn = document.getElementById("show-form-btn");
    const backToChoiceBtn = document.getElementById("back-to-choice-btn");

    if (openModalBtn) {
        openModalBtn.addEventListener("click", () => {
            modal.classList.add("show-modal");
            initialView.style.display = "block";
            formView.style.display = "none";
        });
    }
    
    const closeModal = () => modal.classList.remove("show-modal");
    if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target.classList.contains("modal__overlay")) closeModal();
        });
    }
    
    if (showFormBtn) {
        showFormBtn.addEventListener("click", () => {
            initialView.style.display = "none";
            formView.style.display = "block";
        });
    }

    if (backToChoiceBtn) {
        backToChoiceBtn.addEventListener("click", () => {
            formView.style.display = "none";
            initialView.style.display = "block";
        });
    }
}
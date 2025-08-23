document.addEventListener("DOMContentLoaded", () => {
    // Función para cargar un archivo HTML en un elemento específico
    const loadPartial = async (elementId, filePath) => {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: No se pudo cargar el archivo ${filePath}`);
            }
            const content = await response.text();
            const element = document.getElementById(elementId);
            if (element) {
                element.innerHTML = content;
            } else {
                console.warn(`Elemento con id '${elementId}' no encontrado.`);
            }
        } catch (error) {
            console.error('Error cargando el componente parcial:', error);
        }
    };

    // Carga el header y el footer simultáneamente
    window.partialsLoaded = Promise.all([
        loadPartial('header-placeholder', '/partials/header.html'),
        loadPartial('footer-placeholder', '/partials/footer.html')
    ]).then(() => {
        document.body.classList.remove('hidden');
        if (typeof initializeActiveNavLinks === 'function') {
            initializeActiveNavLinks();
        }
    });
});
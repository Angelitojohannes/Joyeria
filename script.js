// =========================================================
// CONFIGURACIÓN DE TU GOOGLE SHEET Y WHATSAPP
// =========================================================
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTxzIXoFPeKLjyvXhqqGKOz6ttFaB4U7rwzrTonLIRuNAg2I_uhbh1CPqjYH0Wi1zjAMWCTRClJnQ8E/pub?output=csv';
const WHATSAPP_NUMBER = '584143425080';

let productosGlobales = [];
let categoriasMapGlobal = {};
let observerScrollCards = null;

document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    configurarMenuMovil();
});

// Configuración del Menú Móvil
function configurarMenuMovil() {
    const menuBtn = document.getElementById('menuBtn');
    const navMenu = document.getElementById('navMenu');

    if (menuBtn && navMenu) {
        menuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('hidden');
            navMenu.classList.toggle('flex');
            navMenu.classList.toggle('flex-col');
            navMenu.classList.toggle('absolute');
            navMenu.classList.toggle('top-16');
            navMenu.classList.toggle('right-4');
            navMenu.classList.toggle('bg-white');
            navMenu.classList.toggle('p-4');
            navMenu.classList.toggle('rounded-2xl');
            navMenu.classList.toggle('shadow-xl');
        });
    }
}

// Cargar productos desde Google Sheets
async function cargarProductos() {
    const contenedor = document.getElementById('contenedor-coleccion');
    if (!contenedor) return;

    try {
        const respuesta = await fetch(SPREADSHEET_URL);
        if (!respuesta.ok) throw new Error("No se pudo obtener la información de Google Sheets.");

        const csvText = await respuesta.text();
        productosGlobales = parsearCSVRobusto(csvText);

        if (productosGlobales.length === 0) {
            contenedor.innerHTML = `<p class="text-center text-stone-500 py-10 font-clean">No hay productos registrados en la tabla.</p>`;
            return;
        }

        // Agrupar dinámicamente por categoría
        categoriasMapGlobal = {};

        productosGlobales.forEach(prod => {
            let catNombre = prod.categoria && prod.categoria.trim() !== '' ? prod.categoria.trim() : 'General';
            let catKey = catNombre.toLowerCase();
            let catTitulo = catNombre.charAt(0).toUpperCase() + catNombre.slice(1);

            if (!categoriasMapGlobal[catKey]) {
                categoriasMapGlobal[catKey] = {
                    titulo: catTitulo,
                    items: []
                };
            }
            categoriasMapGlobal[catKey].items.push(prod);
        });

        actualizarBotonesCategorias(categoriasMapGlobal);
        cargarProductosDestacados();

    } catch (error) {
        console.error('Error al cargar datos:', error);
        contenedor.innerHTML = `
            <div class="text-center py-12 px-4">
                <p class="text-red-500 font-clean text-sm mb-2">⚠️ No se pudo conectar con el Google Sheet.</p>
                <p class="text-stone-500 font-clean text-xs">Verifica que la URL en SPREADSHEET_URL sea la versión publicada en CSV.</p>
            </div>
        `;
    }
}

// VISTA HOME: Muestra 4 productos destacados
function cargarProductosDestacados() {
    const contenedor = document.getElementById('contenedor-coleccion');
    if (!contenedor) return;

    let destacados = productosGlobales.filter(p => {
        const est = (p.estado || '').toLowerCase();
        return est.includes('destacado') || p.destacado === 'si' || p.destacado === 'true';
    });

    if (destacados.length === 0) {
        destacados = productosGlobales.slice(0, 4);
    } else {
        destacados = destacados.slice(0, 4);
    }

    contenedor.innerHTML = `
        <div class="max-w-7xl mx-auto px-3 sm:px-6 py-8 sm:py-12">
            <div class="text-center mb-6 sm:mb-10">
                <span class="font-clean text-xs uppercase tracking-[0.2em] text-[#c47b68] font-semibold">Selección Especial</span>
                <h3 class="font-editorial text-2xl md:text-3xl text-stone-900 uppercase font-semibold mt-1">
                    Productos Destacados
                </h3>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
                ${destacados.map((p, idx) => crearCardProducto(p, idx)).join('')}
            </div>
        </div>
    `;

    inicializarAnimacionCards();
}

// VISTA POR CATEGORÍA
function cargarCategoriaEspecifica(catKey) {
    const contenedor = document.getElementById('contenedor-coleccion');
    if (!contenedor || !categoriasMapGlobal[catKey]) return;

    const grupo = categoriasMapGlobal[catKey];

    contenedor.innerHTML = `
        <div class="w-full bg-[#f2e6df]/70 py-8 sm:py-12 px-4 sm:px-6 text-center border-b border-stone-200/60 mb-6 sm:mb-10">
            <h1 class="font-editorial text-2xl sm:text-3xl md:text-4xl text-stone-900 font-semibold tracking-widest uppercase">
                ${grupo.titulo}
            </h1>
            <p class="font-clean text-xs uppercase tracking-[0.2em] text-[#c47b68] mt-2 font-medium">
                Presencia & Prestigio
            </p>
        </div>

        <div class="max-w-7xl mx-auto px-3 sm:px-6 pb-16 sm:pb-20">
            <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
                ${grupo.items.map((p, idx) => crearCardProducto(p, idx)).join('')}
            </div>
        </div>
    `;

    contenedor.scrollIntoView({ behavior: 'smooth' });
    inicializarAnimacionCards();
}

// Botones de filtro de categoría
function actualizarBotonesCategorias(categoriasMap) {
    const contenedorCategorias = document.querySelector('#categorias .flex-wrap');
    if (!contenedorCategorias) return;

    let htmlBotones = `
        <button 
            onclick="cargarProductosDestacados()" 
            class="font-clean px-4 sm:px-6 py-2 sm:py-2.5 bg-white/80 backdrop-blur-sm border border-stone-200 rounded-full text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-stone-700 hover:bg-stone-900 hover:text-white transition-all shadow-sm font-medium cursor-pointer active:scale-95"
        >
            ✨ Todos
        </button>
    `;

    for (const key in categoriasMap) {
        const titulo = categoriasMap[key].titulo;

        htmlBotones += `
            <button 
                onclick="cargarCategoriaEspecifica('${key}')" 
                class="font-clean px-4 sm:px-6 py-2 sm:py-2.5 bg-white/80 backdrop-blur-sm border border-stone-200 rounded-full text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-stone-700 hover:bg-stone-900 hover:text-white transition-all shadow-sm font-medium cursor-pointer active:scale-95"
            >
                ✨ ${titulo}
            </button>
        `;
    }

    contenedorCategorias.innerHTML = htmlBotones;
}

// Normalización de imágenes
function normalizarUrlImagen(url) {
    if (!url) return 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop';

    url = url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    if (url.includes('postimg.cc/') && !url.includes('i.postimg.cc/')) {
        url = url.replace('postimg.cc/', 'i.postimg.cc/');
    }

    if (url.includes('res.cloudinary.com') && !url.includes('f_auto')) {
        url = url.replace('/upload/', '/upload/f_auto,q_auto,w_600/');
    }

    return url;
}

// Genera la tarjeta (card) para cada producto
function crearCardProducto(producto, index = 0) {
    const estado = (producto.estado || 'disponible').toLowerCase().trim();
    const esAgotado = estado === 'agotado' || estado === 'no disponible' || estado === 'sin stock';

    const urlImagen = normalizarUrlImagen(producto.imagen);
    const tituloLimpio = (producto.titulo || 'Producto').replace(/'/g, "\\'");

    const mensajeWA = encodeURIComponent(`¡Hola Meilingbeauty! ✨ Me encantó el producto *${producto.titulo}* ($${producto.precio}) y quisiera solicitar información.\n\n📷 Ver foto:\n${urlImagen}\n\n(Ref: #${producto.id || 'N/A'})`);
    const urlWA = `https://wa.me/${WHATSAPP_NUMBER}?text=${mensajeWA}`;

    const iconoWhatsapp = `
        <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current mr-1 sm:mr-1.5 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.758.459 3.474 1.33 4.982L2 22l5.213-1.333a9.96 9.96 0 004.798 1.233h.005c5.505 0 9.988-4.477 9.989-9.984a9.94 9.94 0 00-2.923-7.062A9.94 9.94 0 0012.012 2zm0 1.761a8.2 8.2 0 015.823 2.41 8.2 8.2 0 012.41 5.813c0 4.536-3.69 8.223-8.228 8.223h-.004a8.18 8.18 0 01-3.953-1.02l-.283-.168-2.934.75.782-2.858-.184-.294a8.19 8.19 0 01-1.258-4.394c0-4.536 3.69-8.223 8.228-8.223zm4.512 11.666c-.247-.124-1.464-.723-1.691-.806-.227-.082-.392-.124-.557.124-.165.248-.64.806-.784.971-.144.165-.289.186-.536.062-.247-.124-1.045-.385-1.991-1.228-.737-.657-1.235-1.469-1.38-1.717-.144-.247-.015-.38.109-.503.111-.11.247-.289.371-.433.124-.144.165-.289.247-.413.083-.165.042-.31-.02-.433-.062-.124-.557-1.341-.763-1.836-.201-.482-.405-.417-.557-.425l-.474-.008c-.165 0-.433.062-.66.31-.227.247-.866.846-.866 2.064 0 1.218.887 2.394 1.01 2.56.124.165 1.747 2.668 4.232 3.742.591.255 1.053.407 1.413.521.593.188 1.133.162 1.56.098.476-.071 1.464-.598 1.67-.1.175.206.577.33.619.866.042.536.042.845-.083.969-.124z"/>
        </svg>
    `;

    const esPrioritario = index < 4;
    const atributoLoading = esPrioritario ? 'eager' : 'lazy';
    const atributoPriority = esPrioritario ? 'fetchpriority="high"' : 'fetchpriority="low"';

    return `
        <div 
            class="scroll-card-reveal bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 border border-stone-200/70 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between relative group"
        >
            ${esAgotado ? `
                <span class="absolute top-3 right-3 sm:top-6 sm:right-6 bg-stone-800/85 text-white font-clean text-[9px] sm:text-[10px] uppercase tracking-wider sm:tracking-widest px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full backdrop-blur-xs z-10 pointer-events-none">
                    Agotado
                </span>
            ` : ''}

            <div class="overflow-hidden rounded-xl sm:rounded-2xl mb-2 sm:mb-4 bg-stone-200/60 aspect-square relative group">
                <div class="skeleton-loader absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
                <img 
                    src="${urlImagen}" 
                    alt="${producto.titulo || 'Producto'}"
                    width="400"
                    height="400"
                    loading="${atributoLoading}"
                    ${atributoPriority}
                    decoding="async"
                    onload="this.previousElementSibling.classList.add('hidden'); this.classList.remove('opacity-0');"
                    onerror="this.onerror=null; this.previousElementSibling.classList.add('hidden'); this.classList.remove('opacity-0'); this.src='https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop';"
                    onclick="abrirModal('${urlImagen}', '${tituloLimpio}')"
                    class="w-full h-full object-cover cursor-zoom-in transition-all duration-500 group-hover:scale-105 opacity-0 ${esAgotado ? 'grayscale-[30%] opacity-60' : ''}"
                />
            </div>

            <div class="space-y-0.5 sm:space-y-1 mb-2.5 sm:mb-4 flex-grow flex flex-col justify-between">
                <div>
                    <span class="font-clean text-[9px] sm:text-[10px] uppercase tracking-wider sm:tracking-widest text-[#c47b68] font-semibold block truncate">
                        ${producto.categoria || 'General'}
                    </span>
                    <h3 class="font-editorial text-xs sm:text-base text-stone-900 font-medium leading-snug line-clamp-2 mt-0.5 min-h-[2rem] sm:min-h-0" title="${producto.titulo || ''}">
                        ${producto.titulo || 'Producto sin nombre'}
                    </h3>
                </div>
                <p class="font-clean text-stone-700 font-semibold text-xs sm:text-sm md:text-base pt-1">
                    $${producto.precio || '0'}
                </p>
            </div>

            <div class="pt-1 sm:pt-2 mt-auto">
                ${esAgotado ? `
                    <div class="w-full py-2 sm:py-2.5 px-2 sm:px-4 bg-stone-200/80 text-stone-500 rounded-xl sm:rounded-full font-clean text-[10px] sm:text-xs font-medium text-center uppercase tracking-wider cursor-not-allowed">
                        Agotado ✨
                    </div>
                ` : `
                    <a 
                        href="${urlWA}" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        class="w-full py-2 sm:py-2.5 px-2 sm:px-4 bg-[#e8927c] hover:bg-[#d8806a] text-white rounded-xl sm:rounded-full font-clean text-[10.5px] sm:text-xs font-medium transition-all duration-300 shadow-sm hover:shadow-md flex items-center justify-center tracking-normal sm:tracking-wider group-hover:scale-[1.02] active:scale-95"
                    >
                        ${iconoWhatsapp}
                        <span class="sm:hidden">¡Pedir WhatsApp!</span>
                        <span class="hidden sm:inline">¡Pedir por WhatsApp!</span>
                    </a>
                `}
            </div>
        </div>
    `;
}

// Observador para la animación de aparición notoria al hacer scroll (scroll reveal)
function inicializarAnimacionCards() {
    const cards = document.querySelectorAll('.scroll-card-reveal');
    if (!cards.length) return;

    if (!('IntersectionObserver' in window)) {
        cards.forEach(card => card.classList.add('is-visible'));
        return;
    }

    if (observerScrollCards) {
        observerScrollCards.disconnect();
    }

    observerScrollCards = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target;
                
                // Desfase sutil entre columnas contiguas para un efecto fluido y escalonado
                const rect = card.getBoundingClientRect();
                const isSecondCol = rect.left > (window.innerWidth / 2);
                const delay = isSecondCol ? 90 : 0;

                setTimeout(() => {
                    card.classList.add('is-visible');
                }, delay);

                obs.unobserve(card);
            }
        });
    }, {
        root: null,
        rootMargin: '0px 0px -30px 0px',
        threshold: 0.08
    });

    cards.forEach(card => {
        if (!card.classList.contains('is-visible')) {
            observerScrollCards.observe(card);
        }
    });

    // Medida de seguridad: Si tras 2.5s alguna card no se ha revelado, mostrarla
    setTimeout(() => {
        document.querySelectorAll('.scroll-card-reveal:not(.is-visible)').forEach(c => c.classList.add('is-visible'));
    }, 2500);
}

// Parser de CSV
function parsearCSVRobusto(textoCSV) {
    const lineas = textoCSV.split(/\r?\n/).filter(f => f.trim() !== '');
    if (lineas.length < 2) return [];

    function dividirLineaCSV(linea, delimitador) {
        const resultado = [];
        let celdaActual = '';
        let dentroDeComillas = false;

        for (let i = 0; i < linea.length; i++) {
            const char = linea[i];

            if (char === '"' || char === "'") {
                dentroDeComillas = !dentroDeComillas;
            } else if (char === delimitador && !dentroDeComillas) {
                resultado.push(celdaActual.trim().replace(/^["']|["']$/g, ''));
                celdaActual = '';
            } else {
                celdaActual += char;
            }
        }
        resultado.push(celdaActual.trim().replace(/^["']|["']$/g, ''));
        return resultado;
    }

    const delimitador = lineas[0].includes(';') ? ';' : ',';
    
    const encabezados = dividirLineaCSV(lineas[0], delimitador).map(h => 
        h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    );

    const listaProductos = [];

    for (let i = 1; i < lineas.length; i++) {
        const valores = dividirLineaCSV(lineas[i], delimitador);
        if (valores.length >= 2) {
            const prod = {};
            encabezados.forEach((encabezado, idx) => {
                let val = valores[idx] !== undefined ? valores[idx] : '';

                if (encabezado.includes('id') || encabezado.includes('ref')) {
                    prod.id = val;
                } else if (encabezado.includes('titulo') || encabezado.includes('nombre') || encabezado.includes('producto')) {
                    prod.titulo = val;
                } else if (encabezado.includes('precio') || encabezado.includes('monto')) {
                    prod.precio = val;
                } else if (encabezado.includes('imagen') || encabezado.includes('foto') || encabezado.includes('url')) {
                    prod.imagen = val;
                } else if (encabezado.includes('cat') || encabezado.includes('tipo')) {
                    prod.categoria = val;
                } else if (encabezado.includes('est') || encabezado.includes('disponib')) {
                    prod.estado = val;
                } else {
                    prod[encabezado] = val;
                }
            });

            if (prod.titulo && prod.titulo.trim() !== '' && prod.titulo.toLowerCase() !== 'undefined') {
                listaProductos.push(prod);
            }
        }
    }

    return listaProductos;
}

// MODAL DE IMAGEN
function abrirModal(imagenUrl, nombreProducto) {
    const modal = document.getElementById('modalImagen');
    const imgModal = document.getElementById('imagenModalSrc');
    const tituloModal = document.getElementById('tituloModal');

    if (!modal || !imgModal || !tituloModal) return;

    imgModal.src = imagenUrl;
    tituloModal.innerText = nombreProducto || '';

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function cerrarModal() {
    const modal = document.getElementById('modalImagen');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

document.getElementById('modalImagen')?.addEventListener('click', function(e) {
    if (e.target === this) {
        cerrarModal();
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        cerrarModal();
    }
});

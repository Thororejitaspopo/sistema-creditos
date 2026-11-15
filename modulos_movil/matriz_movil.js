// =========================================================
// ⚡ MOTOR MATRIZ GERENCIAL MÓVIL
// Archivo: modulos_movil/matriz_movil.js
// =========================================================

// 1. Filtro Visual para las Listas (Ruta y Alertas)
function filtrarListaMovil(idContenedor, textoBusqueda) {
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;
    
    const tarjetas = contenedor.children;
    const busquedaUpper = textoBusqueda.toUpperCase().trim();
    
    for (let i = 0; i < tarjetas.length; i++) {
        const tarjeta = tarjetas[i];
        if (tarjeta.innerText.includes('⏳') || tarjeta.innerText.includes('✅')) continue;
        
        const textoTarjeta = tarjeta.innerText.toUpperCase();
        if (textoTarjeta.includes(busquedaUpper)) {
            tarjeta.style.display = 'block';
        } else {
            tarjeta.style.display = 'none';
        }
    }
}

// 2. Cerebro Financiero (Conexión a Supabase - Estructura inicial)
async function cargarMatrizGlobalMovil() {
    console.log("Iniciando carga de la Matriz Gerencial en el móvil...");
    
    // Aquí pondremos toda la lógica pesada de Supabase para calcular:
    // - Caja Matriz
    // - Capital en la calle
    // - Ganancia Proyectada
    // - Armar la Ruta de Cobro
    // - Armar las Alertas de Cartera
}
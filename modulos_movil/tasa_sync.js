// =========================================================================
// ⚙️ SINCRONIZADOR EN LA NUBE DE TASA BASE (PC <-> CELULAR)
// Archivo: modulos_movil/tasa_sync.js
// =========================================================================

window.tasaBaseGlobal = 20;

window.cargarTasaBaseNube = async function() {
    try {
        const supa = window.supabaseClient;
        if (!supa) return;

        const { data, error } = await supa
            .from('configuracion')
            .select('tasa_base')
            .eq('id', 1)
            .single();

        if (!error && data && data.tasa_base !== null) {
            window.tasaBaseGlobal = parseFloat(data.tasa_base);
            aplicarTasaEnPantalla(window.tasaBaseGlobal);
        }
    } catch (e) {
        console.error("Error cargando tasa base:", e);
    }
};

window.actualizarTasaBaseNube = async function(nuevoValor) {
    const tasa = parseFloat(nuevoValor);
    if (isNaN(tasa) || tasa < 0) return;

    window.tasaBaseGlobal = tasa;
    aplicarTasaEnPantalla(tasa);

    try {
        const supa = window.supabaseClient;
        if (!supa) return;

        await supa
            .from('configuracion')
            .upsert({ id: 1, tasa_base: tasa });
    } catch (e) {
        console.error("Error guardando tasa base en nube:", e);
    }
};

function aplicarTasaEnPantalla(tasa) {
    // Actualiza todos los posibles inputs de Tasa Base e Interés en PC y Móvil
    const ids = [
        'menu-tasa-base', 'tasa-base-global', 'input-tasa-base', 'tasa-base-movil',
        'cred-interes', 'cred-interes-movil', 'cred-tasa-interes-movil'
    ];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = tasa;
    });

    // Si está en el módulo de crédito, recalcula cuotas al instante
    if (typeof calcularProyeccionCredito === 'function') calcularProyeccionCredito();
    if (typeof calcularProyeccionCreditoMovil === 'function') calcularProyeccionCreditoMovil();
}

// Se sincroniza automáticamente al abrir la página
window.addEventListener('load', () => {
    setTimeout(() => {
        if (typeof window.cargarTasaBaseNube === 'function') {
            window.cargarTasaBaseNube();
        }
    }, 600);
});
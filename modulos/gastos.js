// =========================================================================
// 💸 MÓDULO DE GASTOS VARIOS (SISTEMA ALPHA V5)
// =========================================================================

window.cargarGastosDeHoy = async function() {
    const contenedorLista = document.getElementById('lista-gastos-hoy');
    const lblTotal = document.getElementById('total-gastos-hoy-txt');
    
    if (!contenedorLista) return;

    contenedorLista.innerHTML = '<div style="text-align: center; padding: 20px; color: #94a3b8;">Buscando gastos del día...</div>';
    lblTotal.innerText = '$0.00';

    try {
        // Obtenemos la fecha local exacta para no mezclar gastos de días anteriores
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const inicioDiaISO = hoy.toISOString();

        const { data, error } = await supabaseClient
            .from('gastos_varios')
            .select('*')
            .gte('fecha_gasto', inicioDiaISO)
            .order('fecha_gasto', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            contenedorLista.innerHTML = '<div style="text-align: center; padding: 20px; color: #10b981; font-weight: bold;">No hay gastos registrados hoy. ¡Excelente control!</div>';
            return;
        }

        let html = '';
        let total = 0;

        data.forEach(gasto => {
            total += parseFloat(gasto.monto);
            const fechaFormat = new Date(gasto.fecha_gasto).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
            
            html += `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 11px; color: #0284c7; font-weight: bold; margin-bottom: 3px; text-transform: uppercase;">${gasto.categoria}</div>
                    <div style="font-size: 13px; color: #0f172a; font-weight: 600;">${gasto.concepto}</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 3px;">🕒 Registrado a las ${fechaFormat}</div>
                </div>
                <div style="font-size: 16px; font-weight: 900; color: #ef4444;">
                    -$${parseFloat(gasto.monto).toFixed(2)}
                </div>
            </div>`;
        });

        contenedorLista.innerHTML = html;
        lblTotal.innerText = `$${total.toFixed(2)}`;

    } catch (error) {
        console.error("Error al cargar gastos:", error);
        contenedorLista.innerHTML = '<div style="color: red; text-align: center; padding: 10px;">Error de conexión con la Bóveda.</div>';
    }
};

window.registrarGastoDiario = async function() {
    const categoria = document.getElementById('gasto-categoria').value;
    const monto = parseFloat(document.getElementById('gasto-monto').value);
    const concepto = document.getElementById('gasto-concepto').value.trim();

    if (!categoria) {
        alert("⚠️ Es obligatorio seleccionar una categoría para clasificar el gasto.");
        return;
    }
    if (isNaN(monto) || monto <= 0) {
        alert("⚠️ El monto debe ser un valor numérico superior a $0.00.");
        return;
    }
    if (concepto === "") {
        alert("⚠️ Ingrese un detalle exacto para la auditoría (Ej: Compra de llanta trasera).");
        return;
    }

    const confirmacion = confirm(`¿Autoriza registrar un egreso de $${monto.toFixed(2)} por "${concepto}"?`);
    if (!confirmacion) return;

    try {
        const { error } = await supabaseClient
            .from('gastos_varios')
            .insert([{ 
                categoria: categoria, 
                monto: monto, 
                concepto: concepto,
                registrado_por: 'ADMINISTRACIÓN' 
            }]);

        if (error) throw error;

        alert("✅ Egreso procesado correctamente. Este valor se deducirá en el Cierre de Caja del día.");
        
        // Limpiamos los campos para dejar todo ordenado
        document.getElementById('gasto-categoria').value = "";
        document.getElementById('gasto-monto').value = "";
        document.getElementById('gasto-concepto').value = "";

        // Actualizamos el panel de la derecha al instante
        cargarGastosDeHoy();

    } catch (error) {
        console.error("Error al procesar el egreso:", error);
        alert("❌ Falla en el servidor: " + error.message);
    }
};

// ⚙️ Este interceptor hace que la lista se cargue sola cuando usted haga clic en "Gastos Varios" en el menú
document.addEventListener('DOMContentLoaded', () => {
    const originalCambiarModuloGastos = window.cambiarModulo;
    if (typeof originalCambiarModuloGastos === 'function') {
        window.cambiarModulo = function(idModulo) {
            originalCambiarModuloGastos(idModulo);
            if (idModulo === 'gastos') {
                cargarGastosDeHoy();
            }
        };
    }
});
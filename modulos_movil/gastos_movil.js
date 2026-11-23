// =========================================================================
// 💸 MÓDULO DE GASTOS VARIOS (CLON MÓVIL EXACTO DE PC)
// Archivo: modulos_movil/gastos_movil.js
// =========================================================================

window.cargarGastosDeHoyMovil = async function() {
    const contenedorLista = document.getElementById('lista-gastos-hoy-movil');
    const lblTotal = document.getElementById('total-gastos-hoy-txt-movil');
    if (!contenedorLista) return;

    contenedorLista.innerHTML = '<div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 13px;">⏳ Buscando gastos del día...</div>';
    if (lblTotal) lblTotal.innerText = '$0.00';

    try {
        const supa = window.supabaseClient;
        if (!supa) throw new Error("Base de datos no conectada.");

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const inicioDiaISO = hoy.toISOString();

        const { data, error } = await supa
            .from('gastos_varios')
            .select('*')
            .gte('fecha_gasto', inicioDiaISO)
            .order('fecha_gasto', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            contenedorLista.innerHTML = '<div style="text-align: center; padding: 20px; color: #10b981; font-weight: bold; font-size: 13px;">✨ No hay gastos registrados hoy. ¡Excelente control!</div>';
            return;
        }

        let html = '';
        let total = 0;

        data.forEach(gasto => {
            total += parseFloat(gasto.monto || 0);
            const fechaFormat = new Date(gasto.fecha_gasto).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });

            html += `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #ef4444; padding: 12px; border-radius: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                <div style="min-width: 0;">
                    <div style="font-size: 10px; color: #0284c7; font-weight: 900; margin-bottom: 3px; text-transform: uppercase;">${gasto.categoria}</div>
                    <div style="font-size: 13px; color: #0f172a; font-weight: 700; word-break: break-word;">${gasto.concepto}</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 3px;">🕒 Registrado a las ${fechaFormat}</div>
                </div>
                <div style="font-size: 16px; font-weight: 900; color: #ef4444; white-space: nowrap;">
                    -$${parseFloat(gasto.monto).toFixed(2)}
                </div>
            </div>`;
        });

        contenedorLista.innerHTML = html;
        if (lblTotal) lblTotal.innerText = `$${total.toFixed(2)}`;

    } catch (error) {
        console.error("Error al cargar gastos:", error);
        contenedorLista.innerHTML = '<div style="color: #ef4444; text-align: center; padding: 15px; font-size: 13px;">❌ Error de conexión con la Bóveda.</div>';
    }
};

window.registrarGastoDiarioMovil = async function() {
    const categoria = document.getElementById('gasto-categoria-movil').value;
    const monto = parseFloat(document.getElementById('gasto-monto-movil').value);
    const concepto = document.getElementById('gasto-concepto-movil').value.trim();

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

    if (!confirm(`¿Autoriza registrar un egreso de $${monto.toFixed(2)} por "${concepto}"?`)) return;

    try {
        const supa = window.supabaseClient;
        const { error } = await supa
            .from('gastos_varios')
            .insert([{
                categoria: categoria,
                monto: monto,
                concepto: concepto,
                registrado_por: 'ADMINISTRACIÓN'
            }]);

        if (error) throw error;

        alert("✅ Egreso procesado correctamente. Este valor se deducirá en el Cierre de Caja del día.");

        document.getElementById('gasto-categoria-movil').value = "";
        document.getElementById('gasto-monto-movil').value = "";
        document.getElementById('gasto-concepto-movil').value = "";

        window.cargarGastosDeHoyMovil();

    } catch (error) {
        console.error("Error al procesar el egreso:", error);
        alert("❌ Falla en el servidor: " + error.message);
    }
};
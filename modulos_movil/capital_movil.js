// =========================================================================
// 🏛️ MÓDULO MASTER DE CAPITAL (CLON MÓVIL EXACTO DE PC)
// Archivo: modulos_movil/capital_movil.js
// =========================================================================

window.diasAtrasCapitalMovil = 0;
window.modoFiltroCapitalMovil = 'DIARIO';
window.filtroMemoriaCapitalMovil = "";

// 1. CARGAR SALDOS EN VIVO Y SELECTOR DE CAJAS
window.inicializarModuloCapitalMovil = async function() {
    try {
        const supa = window.supabaseClient;
        if (!supa) throw new Error("Base de datos no conectada.");

        const { data: cajas, error } = await supa.from('cajas_capital').select('*');
        if (error) throw error;

        const selector = document.getElementById('cap-caja-destino-movil');
        if (!selector) return;

        selector.innerHTML = '<option value="" selected disabled>-- Seleccione Caja o Banco --</option>';

        if (!cajas || cajas.length === 0) {
            alert("Aviso de Auditoría: No existen cajas configuradas en 'cajas_capital'.");
            return;
        }

        let capitalGeneral = 0;
        let capitalEfectivo = 0;
        let capitalBanco = 0;

        cajas.forEach(caja => {
            const nombreLimpio = (caja.nombre_caja || '').toLowerCase();
            const saldoMonto = parseFloat(caja.saldo_actual || 0);

            if (nombreLimpio.includes('matriz') || nombreLimpio.includes('central') || nombreLimpio.includes('banco principal')) {
                capitalGeneral += saldoMonto;
                if (caja.tipo === 'efectivo') capitalEfectivo += saldoMonto;
                else if (caja.tipo === 'banco') capitalBanco += saldoMonto;

                const opt = document.createElement('option');
                opt.value = caja.id;
                opt.textContent = `${caja.nombre_caja} ($${saldoMonto.toFixed(2)})`;
                selector.appendChild(opt);
            }
        });

        const txtGen = document.getElementById('saldo-general-txt-movil');
        if (txtGen) txtGen.textContent = `$${capitalGeneral.toFixed(2)}`;

        const txtEfe = document.getElementById('saldo-efectivo-txt-movil');
        if (txtEfe) txtEfe.textContent = `$${capitalEfectivo.toFixed(2)}`;

        const txtBan = document.getElementById('saldo-bancos-txt-movil');
        if (txtBan) txtBan.textContent = `$${capitalBanco.toFixed(2)}`;

        await window.cargarHistorialCapitalMovil();

    } catch (error) {
        console.error('Error en sincronización de capital móvil:', error.message);
    }
};

// 2. PROCESAR INGRESOS Y RETIROS
window.procesarTransaccionCapitalMovil = async function(tipoAccion) {
    const cajaId = document.getElementById('cap-caja-destino-movil').value;
    const montoInput = document.getElementById('cap-monto-movil').value;
    const concepto = document.getElementById('cap-concepto-movil').value.trim();

    if (!cajaId || !montoInput || !concepto) {
        alert('⚠️ Error: Todos los campos son estrictamente obligatorios.');
        return;
    }

    const montoFlotante = parseFloat(montoInput);
    if (montoFlotante <= 0 || isNaN(montoFlotante)) {
        alert('⚠️ Por favor, digite un monto numérico válido y mayor a cero.');
        return;
    }

    if (!confirm(`¿Confirma ${tipoAccion === 'INGRESAR' ? 'INGRESAR' : 'RETIRAR'} $${montoFlotante.toFixed(2)} por concepto de "${concepto}"?`)) return;

    try {
        const supa = window.supabaseClient;
        const { data: caja, error: errFetch } = await supa
            .from('cajas_capital')
            .select('saldo_actual, nombre_caja')
            .eq('id', cajaId)
            .single();
        if (errFetch) throw errFetch;

        let saldoActualizado = parseFloat(caja.saldo_actual || 0);
        let montoParaHistorial = montoFlotante;

        if (tipoAccion === 'INGRESAR') {
            saldoActualizado += montoFlotante;
        } else if (tipoAccion === 'RETIRAR') {
            if (montoFlotante > saldoActualizado) {
                alert(`❌ Fondos Insuficientes: No puede retirar $${montoFlotante.toFixed(2)} de "${caja.nombre_caja}".`);
                return;
            }
            saldoActualizado -= montoFlotante;
            montoParaHistorial = -montoFlotante;
        }

        const { error: errHist } = await supa
            .from('historial_capital')
            .insert([{ caja_id: parseInt(cajaId), monto: montoParaHistorial, concepto: concepto }]);
        if (errHist) throw errHist;

        const { error: errUpd } = await supa
            .from('cajas_capital')
            .update({ saldo_actual: saldoActualizado })
            .eq('id', cajaId);
        if (errUpd) throw errUpd;

        alert(`✅ ¡Transacción de ${tipoAccion === 'INGRESAR' ? 'ingreso' : 'retiro'} ejecutada correctamente!`);
        document.getElementById('cap-monto-movil').value = '';
        document.getElementById('cap-concepto-movil').value = '';

        window.limpiarFiltrosCapitalMovil();
        await window.inicializarModuloCapitalMovil();

    } catch (error) {
        console.error('Error en transacción capital:', error.message);
        alert('❌ Operación cancelada por seguridad: ' + error.message);
    }
};

// 3. MÁQUINA DEL TIEMPO Y HISTORIAL
window.cambiarFiltroCapitalMovil = async function(valor) {
    window.modoFiltroCapitalMovil = valor;
    window.diasAtrasCapitalMovil = 0;
    await window.cargarHistorialCapitalMovil();
};

window.cambiarPaginaHistorialCapitalMovil = async function(direccion) {
    window.diasAtrasCapitalMovil += direccion;
    if (window.diasAtrasCapitalMovil < 0) window.diasAtrasCapitalMovil = 0;
    await window.cargarHistorialCapitalMovil();
};

window.cargarHistorialCapitalMovil = async function() {
    const contenedor = document.getElementById('historial-capital-lista-movil');
    if (!contenedor) return;

    contenedor.innerHTML = '<div style="text-align:center; padding:25px; color:#94a3b8; font-size:12px;">⏳ Consultando auditoría...</div>';

    try {
        let inicioISO, finISO, nombreDiaMostrado;
        const hoy = new Date();
        const dNombres = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
        const mNombres = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

        if (window.modoFiltroCapitalMovil === 'DIARIO') {
            const fObj = new Date();
            fObj.setDate(fObj.getDate() - window.diasAtrasCapitalMovil);
            fObj.setHours(0, 0, 0, 0);
            inicioISO = fObj.toISOString();

            const fFin = new Date(fObj);
            fFin.setHours(23, 59, 59, 999);
            finISO = fFin.toISOString();

            nombreDiaMostrado = `${dNombres[fObj.getDay()].toUpperCase()} ${String(fObj.getDate()).padStart(2,'0')} DE ${mNombres[fObj.getMonth()].toUpperCase()} ${fObj.getFullYear()}`;
        } else if (window.modoFiltroCapitalMovil === 'MES_ACTUAL') {
            const fIni = new Date(hoy.getFullYear(), hoy.getMonth(), 1, 0, 0, 0, 0);
            const fFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59, 999);
            inicioISO = fIni.toISOString();
            finISO = fFin.toISOString();
            nombreDiaMostrado = `MES DE ${mNombres[hoy.getMonth()].toUpperCase()} ${hoy.getFullYear()}`;
        } else if (window.modoFiltroCapitalMovil === 'MES_ANTERIOR') {
            let mAnt = hoy.getMonth() - 1, aAnt = hoy.getFullYear();
            if (mAnt < 0) { mAnt = 11; aAnt--; }
            const fIni = new Date(aAnt, mAnt, 1, 0, 0, 0, 0);
            const fFin = new Date(aAnt, mAnt + 1, 0, 23, 59, 59, 999);
            inicioISO = fIni.toISOString();
            finISO = fFin.toISOString();
            nombreDiaMostrado = `MES DE ${mNombres[mAnt].toUpperCase()} ${aAnt}`;
        } else {
            inicioISO = new Date(2020, 0, 1).toISOString();
            finISO = new Date(2050, 11, 31).toISOString();
            nombreDiaMostrado = `TODO EL HISTORIAL ACUMULADO`;
        }

        const { data: movimientos, error } = await window.supabaseClient
            .from('historial_capital')
            .select(`id, created_at, monto, concepto, cajas_capital ( nombre_caja )`)
            .gte('created_at', inicioISO)
            .lte('created_at', finISO)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const contadorDiv = document.getElementById('contador-movimientos-capital-movil');
        if (contadorDiv) {
            contadorDiv.innerText = `Movimientos: ${movimientos ? movimientos.length : 0}`;
            contadorDiv.style.background = '#f1f5f9';
            contadorDiv.style.color = '#475569';
        }

        if (!movimientos || movimientos.length === 0) {
            const emoji = window.modoFiltroCapitalMovil === 'DIARIO' ? '😴' : '📭';
            contenedor.innerHTML = `
                <div style="background: #111827; border-radius: 10px; border: 1px dashed #374151; text-align: center; padding: 30px 15px;">
                    <span style="font-size: 24px;">${emoji}</span><br>
                    <span style="color: #9ca3af; font-weight: bold; font-size: 12px;">Sin movimientos en ${nombreDiaMostrado.toLowerCase()}.</span>
                </div>`;
            window.renderizarPaginacionHistorialCapitalMovil(nombreDiaMostrado);
            return;
        }

        contenedor.innerHTML = movimientos.map(mov => {
            const numMonto = parseFloat(mov.monto);
            const esIngreso = numMonto >= 0;
            const montoFormateado = `$${esIngreso ? '+' : '-'}${Math.abs(numMonto).toFixed(2)}`;
            const colorMonto = esIngreso ? '#10b981' : '#ef4444';

            const fObj = new Date(mov.created_at || new Date());
            let h = fObj.getHours(), min = String(fObj.getMinutes()).padStart(2, '0');
            const ampm = h >= 12 ? 'p. m.' : 'a. m.'; h = h % 12 || 12;
            const fechaTXT = `${dNombres[fObj.getDay()]} ${String(fObj.getDate()).padStart(2,'0')} ${mNombres[fObj.getMonth()]} ${fObj.getFullYear()} | ${String(h).padStart(2,'0')}:${min} ${ampm}`;

            const textoConcepto = mov.concepto || 'MOVIMIENTO MANUAL';
            const partes = textoConcepto.split('|');
            const tituloPrincipal = partes.length > 1 ? partes[partes.length - 1].trim().toUpperCase() : textoConcepto.toUpperCase();
            const subTitulo = partes.length > 1 ? partes.slice(0, partes.length - 1).join(' | ').trim() : 'MOVIMIENTO DIRECTO';

            const nombreCaja = (mov.cajas_capital?.nombre_caja || 'CAJA').toUpperCase();
            const esBanco = nombreCaja.includes('BANCO') || nombreCaja.includes('TRANSF');
            const bgCaja = esBanco ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.1)';
            const textCaja = esBanco ? '#38bdf8' : '#e5e7eb';
            const labelCaja = esBanco ? 'TRANSFERENCIA' : 'EFECTIVO';

            return `
            <div class="movimiento-item-movil" style="background: #111827; border: 1px solid #374151; border-left: 4px solid ${colorMonto}; border-radius: 10px; padding: 12px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 6px;">
                    <div style="color: #f3f4f6; font-size: 12px; font-weight: 900; line-height: 1.3;">ID #${mov.id} - ${tituloPrincipal}</div>
                    <div style="color: ${colorMonto}; font-size: 15px; font-weight: 900; white-space: nowrap;">${montoFormateado}</div>
                </div>
                <div style="display: inline-block; background: rgba(56, 189, 248, 0.1); color: #38bdf8; padding: 3px 7px; border-radius: 5px; font-size: 10px; font-weight: bold; margin-bottom: 8px; border: 1px solid rgba(56, 189, 248, 0.2);">
                    ${subTitulo}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #374151; padding-top: 7px; font-size: 10px; color: #9ca3af;">
                    <span>📅 ${fechaTXT}</span>
                    <span style="background: ${bgCaja}; color: ${textCaja}; padding: 2px 7px; border-radius: 4px; font-weight: 900;">${labelCaja}</span>
                </div>
            </div>`;
        }).join('');

        window.renderizarPaginacionHistorialCapitalMovil(nombreDiaMostrado);
        if (window.filtroMemoriaCapitalMovil !== "") window.aplicarFiltroAlHistorialMovil();

    } catch (error) {
        contenedor.innerHTML = `<div style="color:#ef4444; text-align:center; padding:15px; font-size:12px;">❌ Error: ${error.message}</div>`;
    }
};

window.renderizarPaginacionHistorialCapitalMovil = function(fechaTexto) {
    const cont = document.getElementById('paginacion-historial-controles-movil');
    if (!cont) return;

    if (window.modoFiltroCapitalMovil !== 'DIARIO') {
        cont.innerHTML = `
            <div style="text-align: center; margin-top: 10px; padding: 10px; background: #1f2937; border-radius: 8px; border: 1px solid #374151;">
                <span style="color: #38bdf8; font-weight: 900; font-size: 11px;">📅 ${fechaTexto}</span>
            </div>`;
        return;
    }

    const esHoy = window.diasAtrasCapitalMovil === 0;
    cont.innerHTML = `
        <div style="margin-top: 12px; padding: 12px; background: #1f2937; border-radius: 10px; border: 1px solid #374151; text-align: center;">
            <div style="color: #38bdf8; font-weight: 900; font-size: 11px; margin-bottom: 10px;">📅 ${fechaTexto}</div>
            <div style="display: flex; justify-content: space-between; gap: 10px;">
                <button onclick="cambiarPaginaHistorialCapitalMovil(1)" style="flex: 1; background: #374151; color: white; border: 1px solid #4b5563; padding: 9px; border-radius: 8px; font-weight: bold; font-size: 12px;">⬅️ Día Anterior</button>
                <button ${esHoy ? 'disabled' : 'onclick="cambiarPaginaHistorialCapitalMovil(-1)"'} style="flex: 1; background: ${esHoy ? '#111827' : '#374151'}; color: ${esHoy ? '#4b5563' : 'white'}; border: 1px ${esHoy ? 'dashed #374151' : 'solid #4b5563'}; padding: 9px; border-radius: 8px; font-weight: bold; font-size: 12px;">Día Siguiente ➡️</button>
            </div>
        </div>`;
};

// 4. BUSCADOR UNIVERSAL
window.filtrarHistorialCapitalMovil = function(termino) {
    window.filtroMemoriaCapitalMovil = (termino || '').trim();
    window.aplicarFiltroAlHistorialMovil();
};

window.limpiarFiltrosCapitalMovil = function() {
    window.filtroMemoriaCapitalMovil = "";
    window.diasAtrasCapitalMovil = 0;
    window.modoFiltroCapitalMovil = 'DIARIO';

    const sel = document.getElementById('filtro-tiempo-capital-movil');
    if (sel) sel.value = 'DIARIO';
    const inp = document.getElementById('input-buscar-general-capital-movil');
    if (inp) inp.value = '';

    window.cargarHistorialCapitalMovil();
};

window.aplicarFiltroAlHistorialMovil = function() {
    const cont = document.getElementById('historial-capital-lista-movil');
    if (!cont) return;
    const items = cont.querySelectorAll('.movimiento-item-movil');
    let visibles = 0;
    const term = window.filtroMemoriaCapitalMovil.toUpperCase();

    items.forEach(it => {
        if (term === "" || it.innerText.toUpperCase().includes(term)) {
            it.style.display = 'block';
            visibles++;
        } else {
            it.style.display = 'none';
        }
    });

    const cDiv = document.getElementById('contador-movimientos-capital-movil');
    if (cDiv) {
        cDiv.innerText = term !== "" ? `Búsqueda: ${visibles} resultados` : `Movimientos: ${visibles}`;
        cDiv.style.background = term !== "" ? '#e0f2fe' : '#f1f5f9';
        cDiv.style.color = term !== "" ? '#0369a1' : '#475569';
    }
};
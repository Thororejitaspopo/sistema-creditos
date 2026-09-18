// =========================================================================
// 6. MOTOR MASTER DEL MÓDULO DE CAPITAL (SISTEMA ALPHA V5)
// =========================================================================

/**
 * CARGAR SALDOS EN VIVO Y CALCULAR EL CAPITAL GENERAL
 */
async function inicializarModuloCapital() {
    try {
        const { data: cajas, error } = await supabaseClient.from('cajas_capital').select('*');
        if (error) throw error;

        const selector = document.getElementById('cap-caja-destino');
        if (!selector) return;

        selector.innerHTML = '<option value="" selected disabled>-- Seleccione Caja o Banco --</option>';

        if (!cajas || cajas.length === 0) {
            alert("Aviso de Auditoría: No existen cajas configuradas en la tabla 'cajas_capital'.");
            return;
        }

        let capitalGeneralAcumulado = 0; 
        let capitalEfectivo = 0;         
        let capitalBanco = 0;            

        cajas.forEach(caja => {
            const nombreLimpio = caja.nombre_caja.toLowerCase();
            const saldoMonto = parseFloat(caja.saldo_actual || 0);

            if (nombreLimpio.includes('matriz') || nombreLimpio.includes('central') || nombreLimpio.includes('banco principal')) {
                capitalGeneralAcumulado += saldoMonto;
                if (caja.tipo === 'efectivo') capitalEfectivo += saldoMonto;
                else if (caja.tipo === 'banco') capitalBanco += saldoMonto;

                const option = document.createElement('option');
                option.value = caja.id;
                option.textContent = `${caja.nombre_caja} ($${saldoMonto.toFixed(2)})`;
                selector.appendChild(option);
            }
        });

        const txtGeneral = document.getElementById('saldo-general-txt');
        if (txtGeneral) txtGeneral.textContent = `$${capitalGeneralAcumulado.toFixed(2)}`;

        const txtEfectivo = document.getElementById('saldo-efectivo-txt');
        if (txtEfectivo) txtEfectivo.textContent = `$${capitalEfectivo.toFixed(2)}`;

        const txtBancos = document.getElementById('saldo-bancos-txt');
        if (txtBancos) txtBancos.textContent = `$${capitalBanco.toFixed(2)}`;

        await cargarHistorialCapital();

        if (typeof cargarSaldosEnSelectorCredito === 'function') {
            await cargarSaldosEnSelectorCredito();
        }

    } catch (error) {
        console.error('Error crítico en la sincronización de capital:', error.message);
    }
}

/**
 * EJECUTAR TRANSACCIÓN DE CAPITAL (INGRESOS Y RETIROS)
 */
async function procesarTransaccionCapital(tipoAccion) {
    const cajaId = document.getElementById('cap-caja-destino').value;
    const montoInput = document.getElementById('cap-monto').value;
    const concepto = document.getElementById('cap-concepto').value.trim();

    if (!cajaId || !montoInput || !concepto) {
        alert('Error: Todos los campos son estrictamente obligatorios.');
        return;
    }

    let montoFlotante = parseFloat(montoInput);
    if (montoFlotante <= 0 || isNaN(montoFlotante)) {
        alert('Por favor, digite un monto numérico válido y mayor a cero.');
        return;
    }

    try {
        const { data: caja, error: errorFetch } = await supabaseClient
            .from('cajas_capital')
            .select('saldo_actual, nombre_caja')
            .eq('id', cajaId)
            .single();

        if (errorFetch) throw errorFetch;

        let saldoActualizado = parseFloat(caja.saldo_actual || 0);
        let montoParaHistorial = montoFlotante;

        if (tipoAccion === 'INGRESAR') {
            saldoActualizado += montoFlotante;
        } else if (tipoAccion === 'RETIRAR') {
            if (montoFlotante > saldoActualizado) {
                alert(`Fondos Insuficientes: No puede retirar $${montoFlotante.toFixed(2)} de la caja "${caja.nombre_caja}".`);
                return;
            }
            saldoActualizado -= montoFlotante;
            montoParaHistorial = -montoFlotante; 
        }

        const { error: errorHistorial } = await supabaseClient
            .from('historial_capital')
            .insert([{ caja_id: parseInt(cajaId), monto: montoParaHistorial, concepto: concepto }]);

        if (errorHistorial) throw errorHistorial;

        const { error: errorUpdate } = await supabaseClient
            .from('cajas_capital')
            .update({ saldo_actual: saldoActualizado })
            .eq('id', cajaId);

        if (errorUpdate) throw errorUpdate;

        alert(`¡Transacción de ${tipoAccion === 'INGRESAR' ? 'ingreso' : 'retiro'} ejecutada correctamente!`);
        document.getElementById('cap-monto').value = '';
        document.getElementById('cap-concepto').value = '';

        limpiarFiltros(); 
        await inicializarModuloCapital(); 

    } catch (error) {
        console.error('Error al procesar la transacción:', error.message);
        alert('La operación fue cancelada por seguridad: ' + error.message);
    }
}

// =========================================================================
// MÁQUINA DEL TIEMPO Y FILTROS INTELIGENTES
// =========================================================================
window.diasAtrasCapital = 0; 
window.modoFiltroCapital = 'DIARIO';

window.cambiarFiltroCapital = async function(valor) {
    window.modoFiltroCapital = valor;
    window.diasAtrasCapital = 0; 
    await cargarHistorialCapital();
};

/**
 * RENDERIZAR HISTORIAL DETALLADO
 */
async function cargarHistorialCapital() {
    const contenedorHistorial = document.getElementById('historial-capital-lista');
    if (!contenedorHistorial) return; 

    try {
        let inicioISO, finISO, nombreDiaMostrado;
        const hoy = new Date();
        const dNombres = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
        const mNombres = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

        if (window.modoFiltroCapital === 'DIARIO') {
            const fechaObjetivo = new Date();
            fechaObjetivo.setDate(fechaObjetivo.getDate() - window.diasAtrasCapital);
            fechaObjetivo.setHours(0, 0, 0, 0);
            inicioISO = fechaObjetivo.toISOString();
            
            const fechaFin = new Date(fechaObjetivo);
            fechaFin.setHours(23, 59, 59, 999);
            finISO = fechaFin.toISOString();
            
            nombreDiaMostrado = `${dNombres[fechaObjetivo.getDay()].toUpperCase()} ${String(fechaObjetivo.getDate()).padStart(2,'0')} DE ${mNombres[fechaObjetivo.getMonth()].toUpperCase()} DEL ${fechaObjetivo.getFullYear()}`;
        
        } else if (window.modoFiltroCapital === 'MES_ACTUAL') {
            const fIni = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            fIni.setHours(0,0,0,0);
            inicioISO = fIni.toISOString();
            
            const fFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
            fFin.setHours(23,59,59,999);
            finISO = fFin.toISOString();
            
            nombreDiaMostrado = `TODO EL MES DE ${mNombres[hoy.getMonth()].toUpperCase()} ${hoy.getFullYear()}`;
        
        } else if (window.modoFiltroCapital === 'MES_ANTERIOR') {
            let mAnt = hoy.getMonth() - 1;
            let aAnt = hoy.getFullYear();
            if(mAnt < 0) { mAnt = 11; aAnt--; }
            
            const fIni = new Date(aAnt, mAnt, 1);
            fIni.setHours(0,0,0,0);
            inicioISO = fIni.toISOString();
            
            const fFin = new Date(aAnt, mAnt + 1, 0);
            fFin.setHours(23,59,59,999);
            finISO = fFin.toISOString();
            
            nombreDiaMostrado = `TODO EL MES DE ${mNombres[mAnt].toUpperCase()} ${aAnt}`;
        
        } else {
            inicioISO = new Date(2020, 0, 1).toISOString();
            finISO = new Date(2050, 11, 31).toISOString();
            nombreDiaMostrado = `TODO EL HISTORIAL ACUMULADO`;
        }

        const { data: movimientos, error } = await supabaseClient
            .from('historial_capital')
            .select(`id, created_at, monto, concepto, cajas_capital ( nombre_caja )`)
            .gte('created_at', inicioISO)
            .lte('created_at', finISO)
            .order('created_at', { ascending: false }); 

        if (error) throw error;

        const contadorDiv = document.getElementById('contador-movimientos-capital');
        if (contadorDiv) {
            contadorDiv.innerText = `Movimientos: ${movimientos ? movimientos.length : 0}`;
            contadorDiv.style.background = '#f1f5f9';
            contadorDiv.style.color = '#475569';
        }

        if (!movimientos || movimientos.length === 0) {
            let emoji = window.modoFiltroCapital === 'DIARIO' ? '😴' : '📭';
            contenedorHistorial.innerHTML = `
                <div style="background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px dashed #374151; text-align: center; padding: 40px 0; margin-top: 10px;">
                    <span style="font-size: 24px;">${emoji}</span><br>
                    <span style="color: #9ca3af; font-weight: bold; font-size: 13px;">No se registraron movimientos en ${nombreDiaMostrado.toLowerCase()}.</span>
                </div>`;
            renderizarPaginacionHistorial(nombreDiaMostrado); 
            return;
        }

        contenedorHistorial.innerHTML = `
            <div style="display: flex; padding: 15px 20px; background: #1f2937; border-bottom: 2px solid #374151; color: #9ca3af; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; border-radius: 8px 8px 0 0;">
                <div style="flex: 2; min-width: 250px;">DESCRIPCIÓN DE LA OPERACIÓN</div>
                <div style="flex: 1; text-align: center; min-width: 180px;">FECHA EXACTA</div>
                <div style="flex: 1; text-align: center; min-width: 120px;">CAJA AFECTADA</div>
                <div style="flex: 1; text-align: right; min-width: 100px;">VALOR NETO ($)</div>
            </div>
        `;

        movimientos.forEach(mov => {
            const numMonto = parseFloat(mov.monto);
            const esIngreso = numMonto >= 0;
            const signo = esIngreso ? '+' : '-';
            const montoFormateado = `$${signo}${Math.abs(numMonto).toFixed(2)}`;
            const colorMonto = esIngreso ? '#10b981' : '#ef4444'; 

            const fechaObjeto = new Date(mov.created_at || new Date()); 
            let h = fechaObjeto.getHours(), min = String(fechaObjeto.getMinutes()).padStart(2, '0');
            const ampm = h >= 12 ? 'p. m.' : 'a. m.';
            h = h % 12; h = h ? h : 12;
            const fechaTXT = `${dNombres[fechaObjeto.getDay()].toLowerCase()} ${String(fechaObjeto.getDate()).padStart(2,'0')} ${mNombres[fechaObjeto.getMonth()]} ${fechaObjeto.getFullYear()}`;
            const horaTXT = `${String(h).padStart(2,'0')}:${min} ${ampm}`;

            let textoConcepto = mov.concepto || 'MOVIMIENTO MANUAL';
            let partes = textoConcepto.split('|');
            let tituloPrincipal = "OPERACIÓN DE CAPITAL";
            let subTitulo = textoConcepto;
            
            if (partes.length > 1) {
                tituloPrincipal = partes[partes.length - 1].trim().toUpperCase(); 
                subTitulo = partes.slice(0, partes.length - 1).join(' | ').trim(); 
            } else {
                tituloPrincipal = textoConcepto.toUpperCase();
                subTitulo = "MOVIMIENTO DIRECTO";
            }

            let nombreCaja = (mov.cajas_capital?.nombre_caja || 'CAJA DESCONOCIDA').toUpperCase();
            let esBanco = nombreCaja.includes('BANCO') || nombreCaja.includes('TRANSF');
            let bgCaja = esBanco ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 255, 255, 0.1)';
            let textCaja = esBanco ? '#38bdf8' : '#e5e7eb';
            let labelCaja = esBanco ? 'TRANSFERENCIA' : 'EFECTIVO';

            const itemHTML = `
                <div class="movimiento-item" style="display: flex !important; align-items: center !important; padding: 16px 20px; border-bottom: 1px solid #374151; background: transparent; transition: background 0.2s; width: 100%; gap: 15px;" onmouseover="this.style.background='#1f2937'" onmouseout="this.style.background='transparent'">
                    <div style="flex: 2; display: flex; align-items: center; gap: 12px; min-width: 250px;">
                        <span style="height: 10px; width: 10px; background-color: ${colorMonto}; border-radius: 50%; box-shadow: 0 0 6px ${colorMonto}; flex-shrink: 0;"></span>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            <strong style="color: #f3f4f6; font-size: 13px; font-weight: 900;">ID #${mov.id} - ${tituloPrincipal}</strong>
                            <div style="display: inline-block; background: rgba(56, 189, 248, 0.1); color: #38bdf8; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; width: fit-content; border: 1px solid rgba(56, 189, 248, 0.2); letter-spacing: 0.5px;">
                                ${subTitulo}
                            </div>
                        </div>
                    </div>
                    <div style="flex: 1; color: #9ca3af; font-size: 12px; font-weight: 600; min-width: 180px; text-align: center; white-space: nowrap;">
                        ${fechaTXT} | ${horaTXT}
                    </div>
                    <div style="flex: 1; display: flex; justify-content: center; min-width: 120px;">
                        <span style="background: ${bgCaja}; color: ${textCaja}; padding: 5px 12px; border-radius: 6px; font-size: 10px; font-weight: 900; letter-spacing: 0.5px;">
                            ${labelCaja}
                        </span>
                    </div>
                    <div style="flex: 1; text-align: right; min-width: 100px;">
                        <span style="color: ${colorMonto}; font-size: 17px; font-weight: 900;">${montoFormateado}</span>
                    </div>
                </div>
            `;
            contenedorHistorial.insertAdjacentHTML('beforeend', itemHTML);
        });

        renderizarPaginacionHistorial(nombreDiaMostrado);
        
        if (window.filtroMemoriaCapital !== "") aplicarFiltroAlHistorial();

    } catch (error) {
        console.error('Error al pintar el log de auditoría:', error.message);
    }
}

/**
 * BOTONES INFERIORES SEGÚN EL FILTRO
 */
function renderizarPaginacionHistorial(fechaMostradaTexto) {
    const contenedorPaginas = document.getElementById('paginacion-historial-controles');
    if (!contenedorPaginas) return;

    if (window.modoFiltroCapital !== 'DIARIO') {
        contenedorPaginas.innerHTML = `
            <div style="text-align: center; margin-top: 20px; padding: 15px 20px; background: #1f2937; border-radius: 8px; border: 1px solid #374151;">
                <span style="color: #38bdf8; font-weight: 900; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; text-shadow: 0 0 10px rgba(56,189,248,0.3);">
                    📅 MOSTRANDO: ${fechaMostradaTexto}
                </span>
            </div>
        `;
        return;
    }

    const esHoy = window.diasAtrasCapital === 0;

    contenedorPaginas.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding: 15px 20px; background: #1f2937; border-radius: 8px; border: 1px solid #374151;">
            <button onclick="cambiarPaginaHistorial(1)" style="background: #374151; color: white; border: 1px solid #4b5563; padding: 8px 15px; border-radius: 6px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s;" onmouseover="this.style.background='#4b5563'" onmouseout="this.style.background='#374151'">
                ⬅️ Día Anterior
            </button>
            <span style="color: #38bdf8; font-weight: 900; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; text-shadow: 0 0 10px rgba(56,189,248,0.3);">
                📅 MOSTRANDO: ${fechaMostradaTexto}
            </span>
            <button ${esHoy ? 'disabled style="background: #111827; color: #4b5563; border: 1px dashed #374151; padding: 8px 15px; border-radius: 6px; font-weight: bold; cursor: not-allowed; display: flex; align-items: center; gap: 8px;"' : 'onclick="cambiarPaginaHistorial(-1)" style="background: #374151; color: white; border: 1px solid #4b5563; padding: 8px 15px; border-radius: 6px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s;" onmouseover="this.style.background=\'#4b5563\'" onmouseout="this.style.background=\'#374151\'"'}>
                Día Siguiente ➡️
            </button>
        </div>
    `;
}

async function cambiarPaginaHistorial(direccion) {
    if (typeof window.diasAtrasCapital === 'undefined') window.diasAtrasCapital = 0;
    window.diasAtrasCapital += direccion;
    if (window.diasAtrasCapital < 0) window.diasAtrasCapital = 0;
    await cargarHistorialCapital();
}

// =========================================================================
// 🔍 BUSCADOR UNIVERSAL INTELIGENTE (NIVEL INTERNACIONAL)
// =========================================================================

// Usamos window para blindarlo contra errores si se pega dos veces
window.filtroMemoriaCapital = "";

window.filtrarHistorial = function(termino) {
    window.filtroMemoriaCapital = termino.trim();
    aplicarFiltroAlHistorial();
}

window.limpiarFiltros = function() {
    window.filtroMemoriaCapital = ""; 
    window.diasAtrasCapital = 0; 
    window.modoFiltroCapital = 'DIARIO';
    
    const selectFiltro = document.getElementById('filtro-tiempo-capital');
    if(selectFiltro) selectFiltro.value = 'DIARIO';
    
    // Intentamos limpiar ambos inputs por si acaso
    const buscadorGeneral = document.getElementById('input-buscar-general');
    if (buscadorGeneral) buscadorGeneral.value = ''; 
    const buscadorViejo = document.getElementById('input-buscar-id');
    if (buscadorViejo) buscadorViejo.value = ''; 
    
    cargarHistorialCapital();
}

function aplicarFiltroAlHistorial() {
    const contenedor = document.getElementById('historial-capital-lista');
    if (!contenedor) return;

    const items = contenedor.querySelectorAll('.movimiento-item');
    let registrosVisibles = 0;

    items.forEach(item => {
        const textoFila = item.innerText.toUpperCase();
        const terminoBuscado = window.filtroMemoriaCapital.toUpperCase();

        if (terminoBuscado === "" || textoFila.includes(terminoBuscado)) {
            item.style.setProperty('display', 'flex', 'important');
            registrosVisibles++;
        } else {
            item.style.setProperty('display', 'none', 'important');
        }
    });

    const contadorDiv = document.getElementById('contador-movimientos-capital');
    if (contadorDiv) {
        if (window.filtroMemoriaCapital !== "") {
            contadorDiv.innerText = `Búsqueda: ${registrosVisibles} resultados`;
            contadorDiv.style.background = '#e0f2fe'; 
            contadorDiv.style.color = '#0369a1';
        } else {
            contadorDiv.innerText = `Movimientos: ${registrosVisibles}`;
            contadorDiv.style.background = '#f1f5f9'; 
            contadorDiv.style.color = '#475569';
        }
    }
}
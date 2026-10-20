// =========================================================================
// 💎 MÓDULO DE BÓVEDA DE INTERESES Y UTILIDADES (VERSIÓN SILICON VALLEY)
// =========================================================================

// VARIABLES GLOBALES (MEMORIA Y MÁQUINA DEL TIEMPO)
// let memoriaBovedaAlpha = [];
window.memoriaBovedaAlpha = [];
let mesSeleccionadoBoveda = 'diario'; // Arranca por defecto en "HOY"
window.diasAtrasBoveda = 0;
window.filtroMemoriaBoveda = "";

window.cargarModuloInteres = async function() {
    const contenedor = document.getElementById('mod-interes'); 
    if (!contenedor) return;

    contenedor.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 300px; animation: pulse 2s infinite;">
            <div style="text-align: center; color: #64748b;">
                <span style="font-size: 50px; display: block; margin-bottom: 15px;">🚀</span>
                <p style="font-weight: 900; font-size: 16px; letter-spacing: 1px;">Sincronizando Bóveda Satelital...</p>
                <p style="font-size: 12px; margin-top: 5px;">Calculando flujos de Efectivo y Banco en tiempo real...</p>
            </div>
        </div>`;

    try {
        const { data: historialTodos } = await supabaseClient.from('creditos').select('id, cliente_id').order('id', { ascending: true });
        const mapNumCreditoLocal = {};
        if (historialTodos) {
            const conteoPorCliente = {};
            historialTodos.forEach(c => {
                conteoPorCliente[c.cliente_id] = (conteoPorCliente[c.cliente_id] || 0) + 1;
                mapNumCreditoLocal[c.id] = conteoPorCliente[c.cliente_id];
            });
        }

        const { data: ingresos } = await supabaseClient
            .from('historial_pagos')
            .select(`id, numero_pago, fecha_pago, monto_interes, abono_total, forma_pago, id_credito, creditos (id, cliente_id, clientes (nombres, apellidos, cedula))`)
            .gt('monto_interes', 0);

        const { data: movimientosManuales, error: errManuales } = await supabaseClient
            .from('movimientos_utilidad')
            .select('*');

        if (errManuales) throw errManuales;

        memoriaBovedaAlpha = [];

        if (ingresos) {
            ingresos.forEach(ing => {
                const f = new Date(ing.fecha_pago);
                const cli = (ing.creditos && ing.creditos.clientes) ? ing.creditos.clientes : {};
                const fechaTxt = formatearFechaNasa(f);
                const nombreCompleto = `${cli.nombres || 'CLIENTE'} ${cli.apellidos || 'DESCONOCIDO'}`.toUpperCase();
                const iN = (cli.nombres || 'X').trim().charAt(0).toUpperCase();
                const iA = (cli.apellidos || 'X').trim().charAt(0).toUpperCase();
                const u4 = (cli.cedula || '0000').trim().slice(-4);
                
                const numLocal = mapNumCreditoLocal[ing.id_credito] || 1;
                const creCifrado = typeof cifrarNumeroCredito === 'function' ? cifrarNumeroCredito(numLocal).toUpperCase() : '';

                const rawMetodo = (ing.forma_pago || 'EFECTIVO').toUpperCase();
                const metodoOficial = (rawMetodo.includes('TRANSF') || rawMetodo.includes('BANCO') || rawMetodo.includes('DEP')) ? 'BANCO' : 'EFECTIVO';
                const numPagoTxt = ing.numero_pago ? `PAGO #${ing.numero_pago} | ` : '';
                
                memoriaBovedaAlpha.push({
                    esManual: false,
                    id_credito: ing.id_credito,
                    ganancia: parseFloat(ing.monto_interes) || 0,
                    mesNum: f.getMonth(),
                    anioNum: f.getFullYear(),
                    fechaTxt: fechaTxt,
                    nombre: nombreCompleto,
                    ref: `${numPagoTxt}REF: ${iN}${iA}-${u4}`, 
                    etiquetaCRE: creCifrado ? `CRE #${numLocal} [${creCifrado}]` : `CRE #${numLocal}`,
                    metodo: metodoOficial, 
                    metodoVisual: rawMetodo, 
                    fechaRealObj: f 
                });
            });
        }

        if (movimientosManuales) {
            movimientosManuales.forEach(mov => {
                const f = new Date(mov.fecha);
                const fechaTxt = formatearFechaNasa(f);
                const esRetiro = mov.tipo === 'RETIRO';
                const gananciaAjustada = esRetiro ? -Math.abs(mov.monto) : Math.abs(mov.monto);

                let metodoOrigen = 'EFECTIVO'; 
                if (mov.concepto && mov.concepto.toLowerCase().includes('[banco]')) metodoOrigen = 'BANCO';
                if (mov.origen) metodoOrigen = mov.origen.toUpperCase();

                memoriaBovedaAlpha.push({
                    esManual: true,
                    ganancia: gananciaAjustada,
                    mesNum: f.getMonth(),
                    anioNum: f.getFullYear(),
                    fechaTxt: fechaTxt,
                    nombre: esRetiro ? '💸 EGRESO / RETIRO DE UTILIDAD' : '📥 REINGRESO / DEVOLUCIÓN',
                    ref: 'AJUSTE MANUAL DE GERENCIA',
                    etiquetaCRE: mov.concepto.toUpperCase().replace('[BANCO]', '').replace('[EFECTIVO]', ''),
                    metodo: metodoOrigen, 
                    metodoVisual: mov.tipo,
                    fechaRealObj: f 
                });
            });
        }

        memoriaBovedaAlpha.sort((a, b) => b.fechaRealObj - a.fechaRealObj);
        renderizarBovedaVisual();

    } catch (error) {
        console.error("Error Bóveda:", error);
        contenedor.innerHTML = `<div style="text-align:center; padding:30px; color:red; font-weight:bold;">❌ Error de conexión: ${error.message}</div>`;
    }
};

function formatearFechaNasa(f) {
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    let horas = f.getHours();
    let minutos = String(f.getMinutes()).padStart(2, '0');
    const ampm = horas >= 12 ? 'p. m.' : 'a. m.';
    horas = horas % 12; horas = horas ? horas : 12;
    return `${dias[f.getDay()]} ${String(f.getDate()).padStart(2, '0')} ${meses[f.getMonth()]} ${f.getFullYear()} | ${String(horas).padStart(2, '0')}:${minutos} ${ampm}`;
}

// =========================================================================
// 🚀 MOTOR VISUAL: EL DASHBOARD CON BÚSQUEDA Y MÁQUINA DEL TIEMPO
// =========================================================================
window.renderizarBovedaVisual = function() {
    const contenedor = document.getElementById('mod-interes'); 
    if (!contenedor) return;

    const mesesNombresLargos = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const mesActualJS = new Date().getMonth();
    const anioActualJS = new Date().getFullYear();
    
    const mesesDisponibles = new Set();
    memoriaBovedaAlpha.forEach(item => {
        mesesDisponibles.add(`${item.anioNum}-${item.mesNum}`);
    });

    const historialMeses = Array.from(mesesDisponibles).sort((a, b) => {
        const [anioA, mesA] = a.split('-'); const [anioB, mesB] = b.split('-');
        if (anioA !== anioB) return anioB - anioA;
        return mesB - mesA;
    });

    // SELECTOR DE TIEMPO
    let opcionesSelectorHTML = `<option value="diario" ${mesSeleccionadoBoveda === 'diario' ? 'selected' : ''}>📅 Por Día (Máquina del Tiempo)</option>`;
    opcionesSelectorHTML += `<option value="actual" ${mesSeleccionadoBoveda === 'actual' ? 'selected' : ''}>🗓️ Mes Actual (${mesesNombresLargos[mesActualJS]} ${anioActualJS})</option>`;
    
    historialMeses.forEach(codigoMes => {
        const [anio, mes] = codigoMes.split('-');
        if (parseInt(anio) === anioActualJS && parseInt(mes) === mesActualJS) return;
        opcionesSelectorHTML += `<option value="${codigoMes}" ${mesSeleccionadoBoveda === codigoMes ? 'selected' : ''}>🗓️ ${mesesNombresLargos[mes]} ${anio}</option>`;
    });
    opcionesSelectorHTML += `<option value="todos" ${mesSeleccionadoBoveda === 'todos' ? 'selected' : ''}>🌍 Ver Todo el Historial</option>`;

    // FILTRADO LÓGICO
    let datosFiltrados = [];
    let tituloFiltro = "";

    if (mesSeleccionadoBoveda === 'diario') {
        const fechaObj = new Date();
        fechaObj.setDate(fechaObj.getDate() - window.diasAtrasBoveda);
        const dStr = fechaObj.getDate();
        const mStr = fechaObj.getMonth();
        const yStr = fechaObj.getFullYear();
        
        datosFiltrados = memoriaBovedaAlpha.filter(item => {
            const f = item.fechaRealObj;
            return f.getDate() === dStr && f.getMonth() === mStr && f.getFullYear() === yStr;
        });
        
        const dNombres = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
        tituloFiltro = `${dNombres[fechaObj.getDay()].toUpperCase()} ${String(dStr).padStart(2,'0')} DE ${mesesNombresLargos[mStr].toUpperCase()} DEL ${yStr}`;
    }
    else if (mesSeleccionadoBoveda === 'actual') {
        datosFiltrados = memoriaBovedaAlpha.filter(item => item.mesNum === mesActualJS && item.anioNum === anioActualJS);
        tituloFiltro = `Balance generado en ${mesesNombresLargos[mesActualJS]}`;
    } else if (mesSeleccionadoBoveda === 'todos') {
        datosFiltrados = [...memoriaBovedaAlpha];
        tituloFiltro = "Balance histórico total";
    } else {
        const [anioFiltro, mesFiltro] = mesSeleccionadoBoveda.split('-');
        datosFiltrados = memoriaBovedaAlpha.filter(item => item.mesNum === parseInt(mesFiltro) && item.anioNum === parseInt(anioFiltro));
        tituloFiltro = `Balance de ${mesesNombresLargos[mesFiltro]} ${anioFiltro}`;
    }

    const utilidadNetaGeneral = memoriaBovedaAlpha.reduce((sum, item) => sum + item.ganancia, 0);
    const utilidadFiltradaTotal = datosFiltrados.reduce((sum, item) => sum + item.ganancia, 0);
    const utilidadFiltradaEfectivo = datosFiltrados.filter(i => i.metodo === 'EFECTIVO').reduce((sum, item) => sum + item.ganancia, 0);
    const utilidadFiltradaBanco = datosFiltrados.filter(i => i.metodo === 'BANCO').reduce((sum, item) => sum + item.ganancia, 0);
    const transaccionesReales = datosFiltrados.filter(item => !item.esManual).length;

    // GENERACIÓN DE TABLA CON CLASE "movimiento-boveda-item" PARA EL BUSCADOR
    let filasTablaHTML = '';
    if (datosFiltrados.length > 0) {
        datosFiltrados.forEach(item => {
            if (item.esManual) {
                const esRetiro = item.ganancia < 0;
                const colorFondo = esRetiro ? '#fef2f2' : '#f0fdf4';
                const colorTexto = esRetiro ? '#dc2626' : '#16a34a';
                const icono = esRetiro ? '📉' : '📈';

                filasTablaHTML += `
                    <tr class="movimiento-boveda-item" style="background: ${colorFondo}; border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 16px 15px;">
                            <div style="font-weight: 900; color: ${colorTexto}; margin-bottom: 6px; font-size: 13px;">${icono} ${item.nombre}</div>
                            <div style="font-size: 11px; color: #475569; font-weight: bold;">
                                Detalle: <span style="color: #0f172a;">${item.etiquetaCRE}</span>
                            </div>
                        </td>
                        <td style="padding: 16px 15px; font-size: 12px; color: #475569; font-weight: 600;">${item.fechaTxt}</td>
                        <td style="padding: 16px 15px; font-size: 12px; text-align: center;">
                            <span style="padding: 5px 12px; border-radius: 6px; font-weight: 900; font-size: 10px; background: ${item.metodo === 'BANCO' ? '#dbeafe' : '#f1f5f9'}; color: ${item.metodo === 'BANCO' ? '#0369a1' : '#334155'};">
                                ${item.metodo}
                            </span>
                        </td>
                        <td style="padding: 16px 15px; text-align: right; color: ${colorTexto}; font-weight: 900; font-size: 17px;">
                            ${esRetiro ? '' : '+'}$${item.ganancia.toFixed(2)}
                        </td>
                    </tr>`;
            } else {
                const metodoEstilo = item.metodo === 'BANCO' 
                    ? 'background: #ede9fe; color: #6d28d9; border: 1px solid #c4b5fd;' 
                    : 'background: #dcfce7; color: #166534; border: 1px solid #bbf7d0;';

                filasTablaHTML += `
                    <tr class="movimiento-boveda-item" style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                        <td style="padding: 16px 15px;">
                            <div style="font-weight: 900; color: #0f172a; margin-bottom: 6px; font-size: 13px;">${item.nombre}</div>
                            <div style="font-size: 10px; background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 6px; display: inline-block; font-weight: bold; border: 1px solid #bae6fd; letter-spacing: 0.5px;">
                                ${item.ref} | CRÉDITO #${item.id_credito} | ${item.etiquetaCRE}
                            </div>
                        </td>
                        <td style="padding: 16px 15px; font-size: 12px; color: #475569; font-weight: 600;">${item.fechaTxt}</td>
                        <td style="padding: 16px 15px; font-size: 12px; text-align: center;">
                            <span style="padding: 5px 12px; border-radius: 6px; font-weight: 900; font-size: 10px; letter-spacing: 0.5px; ${metodoEstilo}">
                                ${item.metodoVisual}
                            </span>
                        </td>
                        <td style="padding: 16px 15px; text-align: right; color: #10b981; font-weight: 900; font-size: 17px;">+$${item.ganancia.toFixed(2)}</td>
                    </tr>`;
            }
        });
    } else {
        filasTablaHTML = `<tr><td colspan="4" style="text-align: center; padding: 40px; color: #94a3b8; font-weight: 600; font-size: 14px;">No hay registros en esta fecha.</td></tr>`;
    }

    // BOTONES DE TIEMPO
    let botonesTiempoHTML = '';
    if (mesSeleccionadoBoveda === 'diario') {
        const esHoy = window.diasAtrasBoveda === 0;
        botonesTiempoHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 25px; background: #f8fafc; border-top: 1px solid #e2e8f0;">
                <button onclick="cambiarDiaBoveda(1)" style="background: #e2e8f0; color: #334155; border: 1px solid #cbd5e1; padding: 8px 15px; border-radius: 6px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s;" onmouseover="this.style.background='#cbd5e1'" onmouseout="this.style.background='#e2e8f0'">
                    ⬅️ Día Anterior
                </button>
                <span style="color: #0369a1; font-weight: 900; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                    📅 MOSTRANDO: ${tituloFiltro}
                </span>
                <button ${esHoy ? 'disabled style="background: #f1f5f9; color: #94a3b8; border: 1px dashed #cbd5e1; padding: 8px 15px; border-radius: 6px; font-weight: bold; cursor: not-allowed; display: flex; align-items: center; gap: 8px;"' : 'onclick="cambiarDiaBoveda(-1)" style="background: #e2e8f0; color: #334155; border: 1px solid #cbd5e1; padding: 8px 15px; border-radius: 6px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s;" onmouseover="this.style.background=\'#cbd5e1\'" onmouseout="this.style.background=\'#e2e8f0\'"'}>
                    Día Siguiente ➡️
                </button>
            </div>
        `;
    } else {
        botonesTiempoHTML = `
            <div style="text-align: center; padding: 15px 25px; background: #f8fafc; border-top: 1px solid #e2e8f0;">
                <span style="color: #0369a1; font-weight: 900; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                    📅 MOSTRANDO: ${tituloFiltro}
                </span>
            </div>
        `;
    }

    // INYECCIÓN DEL DOM
    contenedor.innerHTML = `
        <div style="animation: fadeIn 0.4s ease-in-out; padding-bottom: 40px;">
            
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; padding: 30px; margin-bottom: 25px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2); color: white; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; border: 1px solid #334155;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 12px; font-size: 28px; border: 1px solid rgba(255,255,255,0.05);">💎</div>
                    <div>
                        <h2 style="margin: 0 0 5px 0; font-size: 26px; font-weight: 900; letter-spacing: 0.5px;">BÓVEDA DE UTILIDADES ALPHA</h2>
                        <p style="margin: 0; color: #94a3b8; font-size: 13px; font-weight: 500;">Control exacto de ganancias divididas por Efectivo y Bancos.</p>
                    </div>
                </div>
                <div style="text-align: right; background: rgba(0,0,0,0.2); padding: 15px 25px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                    <div style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: 900; letter-spacing: 1px; margin-bottom: 5px;">Utilidad Neta (Todo el tiempo)</div>
                    <div style="font-size: 42px; font-weight: 900; color: #10b981; line-height: 1; text-shadow: 0 0 20px rgba(16, 185, 129, 0.4);">$${utilidadNetaGeneral.toFixed(2)}</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, minmax(250px, 1fr)); gap: 15px; margin-bottom: 25px;">
                <div style="background: #0f172a; padding: 20px; border-radius: 10px; border-left: 6px solid #10b981; color: white; display: flex; flex-direction: column; justify-content: center;">
                    <span style="font-size: 11px; font-weight: bold; color: #94a3b8; letter-spacing: 1px; margin-bottom: 5px;">UTILIDAD EN EFECTIVO</span>
                    <span style="font-size: 28px; font-weight: 900; color: #10b981;">$${utilidadFiltradaEfectivo.toFixed(2)}</span>
                </div>
                <div style="background: #0f172a; padding: 20px; border-radius: 10px; border-left: 6px solid #3b82f6; color: white; display: flex; flex-direction: column; justify-content: center;">
                    <span style="font-size: 11px; font-weight: bold; color: #94a3b8; letter-spacing: 1px; margin-bottom: 5px;">UTILIDAD EN BANCOS</span>
                    <span style="font-size: 28px; font-weight: 900; color: #3b82f6;">$${utilidadFiltradaBanco.toFixed(2)}</span>
                </div>
                <div style="background: #0f172a; padding: 20px; border-radius: 10px; border-left: 6px solid #f59e0b; color: white; display: flex; flex-direction: column; justify-content: center;">
                    <span style="font-size: 11px; font-weight: bold; color: #94a3b8; letter-spacing: 1px; margin-bottom: 5px;">UTILIDAD PERIODO (TOTAL)</span>
                    <span style="font-size: 28px; font-weight: 900; color: #fcd34d;">$${utilidadFiltradaTotal.toFixed(2)}</span>
                </div>
            </div>

            <div style="background: #0f172a; padding: 25px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #334155; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 15px 0; color: white; font-size: 16px; border-bottom: 1px dashed #334155; padding-bottom: 10px;">
                    💼 Registrar Gasto o Reingreso de Utilidad
                </h3>
                <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 180px;">
                        <label style="color: #94a3b8; font-size: 11px; font-weight: bold; text-transform: uppercase;">Afectar Caja de:</label>
                        <select id="input-origen-utilidad" style="width: 100%; padding: 12px; background: #1e293b; border: 1px solid #475569; border-radius: 8px; color: white; margin-top: 5px; font-size: 14px; font-weight: bold; box-sizing: border-box;">
                            <option value="EFECTIVO">💵 EFECTIVO MATRIZ</option>
                            <option value="BANCO">🏦 BANCO PRINCIPAL</option>
                        </select>
                    </div>
                    <div style="flex: 1; min-width: 150px;">
                        <label style="color: #94a3b8; font-size: 11px; font-weight: bold; text-transform: uppercase;">Monto ($)</label>
                        <input type="number" id="input-monto-utilidad" placeholder="0.00" style="width: 100%; padding: 12px; background: #1e293b; border: 1px solid #475569; border-radius: 8px; color: white; margin-top: 5px; font-size: 16px; font-weight: bold; box-sizing: border-box;">
                    </div>
                    <div style="flex: 2; min-width: 250px;">
                        <label style="color: #94a3b8; font-size: 11px; font-weight: bold; text-transform: uppercase;">Concepto / Detalle (Ej: Llantas de Moto)</label>
                        <input type="text" id="input-concepto-utilidad" placeholder="Ej: Compra de repuestos" style="width: 100%; padding: 12px; background: #1e293b; border: 1px solid #475569; border-radius: 8px; color: white; margin-top: 5px; font-size: 14px; box-sizing: border-box;">
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 15px; margin-top: 20px;">
                    <button onclick="procesarMovimientoUtilidad('RETIRO')" style="background: #ef4444; color: white; border: none; padding: 12px 25px; border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer; box-shadow: 0 4px 6px rgba(239,68,68,0.2);">
                        💸 RETIRAR (GASTO)
                    </button>
                    <button onclick="procesarMovimientoUtilidad('INGRESO')" style="background: #10b981; color: white; border: none; padding: 12px 25px; border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer; box-shadow: 0 4px 6px rgba(16,185,129,0.2);">
                        📥 REINGRESAR
                    </button>
                </div>
            </div>

            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px 25px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px;">⏱️</span>
                    <strong style="color: #334155; font-size: 14px;">Filtro de Tiempo:</strong>
                    <select onchange="cambiarFiltroBoveda(this.value)" style="background: #f8fafc; border: 1px solid #cbd5e1; color: #0f172a; padding: 8px 15px; border-radius: 8px; font-weight: 900; font-size: 13px; cursor: pointer; outline: none; margin-left: 10px;">
                        ${opcionesSelectorHTML}
                    </select>
                </div>
                <div style="display: flex; gap: 10px;">
                    <span id="contador-abonos-boveda" style="background: #f1f5f9; color: #475569; font-weight: bold; font-size: 12px; padding: 8px 15px; border-radius: 8px; border: 1px solid #cbd5e1;">Abonos cobrados: ${transaccionesReales}</span>
                    <button onclick="sincronizarYLimpiarBoveda()" style="background: #0f172a; border: none; color: white; padding: 8px 15px; border-radius: 8px; font-size: 12px; font-weight: 900; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 14px;">🔄</span> Sincronizar
                    </button>
                </div>
            </div>

            <div style="background: white; border: 1px solid #cbd5e1; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); overflow: hidden;">
                
                <div style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 20px 25px; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 18px;">📊</span>
                    <h3 style="margin: 0; font-size: 16px; color: #0f172a; font-weight: 900;">Auditoría de Entradas y Salidas</h3>
                </div>
                
                <!-- 🔍 EL NUEVO BUSCADOR UNIVERSAL INCRUSTADO -->
                <div style="padding: 15px 25px; border-bottom: 1px solid #e2e8f0; background: #ffffff; display: flex; gap: 10px;">
                    <input type="text" id="input-buscar-interes" onkeyup="filtrarBovedaEnVivo(this.value)" value="${window.filtroMemoriaBoveda}" placeholder="🔍 Buscar cliente, crédito (CRE #[Y]), efectivo, fecha..." style="padding: 10px 15px; border-radius: 6px; border: 1px solid #cbd5e1; background: #f8fafc; color: #0f172a; width: 100%; max-width: 550px; outline: none; font-size: 13px; font-weight: bold;">
                    <button onclick="filtrarBovedaEnVivo(document.getElementById('input-buscar-interes').value)" style="background: #0ea5e9; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 13px;">Buscar</button>
                </div>

                <div style="overflow-x: auto; max-height: 600px; overflow-y: auto;">
                    <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
                        <thead style="position: sticky; top: 0; background: #f1f5f9; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                            <tr>
                                <th style="padding: 15px; font-size: 11px; color: #475569; text-transform: uppercase; font-weight: 900; letter-spacing: 1px; border-bottom: 2px solid #e2e8f0; text-align: left;">DESCRIPCIÓN DE LA OPERACIÓN</th>
                                <th style="padding: 15px; font-size: 11px; color: #475569; text-transform: uppercase; font-weight: 900; letter-spacing: 1px; border-bottom: 2px solid #e2e8f0; text-align: left;">FECHA EXACTA</th>
                                <th style="padding: 15px; font-size: 11px; color: #475569; text-transform: uppercase; font-weight: 900; letter-spacing: 1px; border-bottom: 2px solid #e2e8f0; text-align: center;">CAJA AFECTADA</th>
                                <th style="padding: 15px; font-size: 11px; color: #475569; text-transform: uppercase; font-weight: 900; letter-spacing: 1px; border-bottom: 2px solid #e2e8f0; text-align: right;">VALOR NETO ($)</th>
                            </tr>
                        </thead>
                        <tbody id="tbody-auditoria-boveda">
                            ${filasTablaHTML}
                        </tbody>
                    </table>
                </div>
                
                <!-- BOTONES DE MÁQUINA DEL TIEMPO -->
                ${botonesTiempoHTML}

            </div>
            
        </div>
    `;

    // Si había un filtro escrito antes de dibujar, lo vuelve a aplicar para no perderlo
    if (window.filtroMemoriaBoveda !== "") {
        window.filtrarBovedaEnVivo(window.filtroMemoriaBoveda);
    }
};

// =========================================================================
// CONTROLES DE LA BÓVEDA (BÚSQUEDA Y NAVEGACIÓN)
// =========================================================================

window.cambiarFiltroBoveda = function(valor) {
    mesSeleccionadoBoveda = valor;
    window.diasAtrasBoveda = 0;
    window.renderizarBovedaVisual();
};

window.cambiarDiaBoveda = function(direccion) {
    window.diasAtrasBoveda += direccion;
    if (window.diasAtrasBoveda < 0) window.diasAtrasBoveda = 0;
    window.renderizarBovedaVisual();
}

window.sincronizarYLimpiarBoveda = function() {
    window.filtroMemoriaBoveda = "";
    window.diasAtrasBoveda = 0;
    mesSeleccionadoBoveda = 'diario';
    cargarModuloInteres();
}

window.filtrarBovedaEnVivo = function(termino) {
    window.filtroMemoriaBoveda = termino.trim().toUpperCase();
    const tbody = document.getElementById('tbody-auditoria-boveda');
    if (!tbody) return;

    const filas = tbody.querySelectorAll('.movimiento-boveda-item');
    let visibles = 0;

    filas.forEach(fila => {
        const texto = fila.innerText.toUpperCase();
        if (window.filtroMemoriaBoveda === "" || texto.includes(window.filtroMemoriaBoveda)) {
            fila.style.display = ''; 
            visibles++;
        } else {
            fila.style.display = 'none';
        }
    });

    const contador = document.getElementById('contador-abonos-boveda');
    if (contador) {
        if (window.filtroMemoriaBoveda !== "") {
            contador.innerText = `Búsqueda: ${visibles} resultados`;
            contador.style.background = '#e0f2fe';
            contador.style.color = '#0369a1';
        } else {
            contador.innerText = `Mostrando: ${visibles} registros`;
            contador.style.background = '#f1f5f9';
            contador.style.color = '#475569';
        }
    }
}

// =========================================================================
// INGRESOS MANUALES Y EXPORTACIÓN (EXCEL / PDF)
// =========================================================================

window.procesarMovimientoUtilidad = async function(tipo) {
    const monto = parseFloat(document.getElementById('input-monto-utilidad').value);
    let concepto = document.getElementById('input-concepto-utilidad').value.trim();
    const origen = document.getElementById('input-origen-utilidad').value;

    if (isNaN(monto) || monto <= 0) {
        alert("⚠️ Por favor ingrese un monto válido mayor a $0.00");
        return;
    }
    if (concepto === "") {
        alert("⚠️ Es obligatorio ingresar un concepto o detalle (Ej: 'Pago llantas moto').");
        return;
    }

    concepto = `${concepto} [${origen}]`;

    const accion = tipo === 'RETIRO' ? 'RETIRAR' : 'INGRESAR';
    const confirmacion = confirm(`¿Está seguro de ${accion} $${monto.toFixed(2)} de su UTILIDAD EN ${origen}?\n\nDetalle: ${concepto}`);
    if (!confirmacion) return;

    try {
        const { error } = await supabaseClient.from('movimientos_utilidad').insert([{
            tipo: tipo,
            monto: monto,
            concepto: concepto,
            fecha: new Date().toISOString()
        }]);

        if (error) throw error;

        alert(`✅ Operación exitosa. ${tipo} de $${monto.toFixed(2)} procesado correctamente en su utilidad de ${origen}.`);
        cargarModuloInteres();
        
    } catch(error) {
        console.error("Error al guardar movimiento:", error);
        alert("❌ Ocurrió un error en la base de datos: " + error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const originalCambiarModulo = window.cambiarModulo;
    if (typeof originalCambiarModulo === 'function') {
        window.cambiarModulo = function(idModulo) {
            originalCambiarModulo(idModulo);
            if (idModulo === 'interes') {
                cargarModuloInteres();
            }
        };
    }
});

window.exportarUtilidadesExcel = async function() {
    alert("⏳ Generando archivo Excel... Por favor, espere.");
    try {
        if (typeof XLSX === 'undefined') throw new Error("La librería Excel no está cargada.");
        if (!memoriaBovedaAlpha || memoriaBovedaAlpha.length === 0) await cargarModuloInteresEnSegundoPlano();
        if (memoriaBovedaAlpha.length === 0) {
            alert("⚠️ No hay movimientos registrados en absoluto."); return;
        }

        const filtroElegido = document.getElementById('filtro-mes-reportes') ? document.getElementById('filtro-mes-reportes').value : 'todos';
        let datosAExportar = memoriaBovedaAlpha;
        
        if (filtroElegido === 'actual') {
            const mesHoy = new Date().getMonth(); const anioHoy = new Date().getFullYear();
            datosAExportar = memoriaBovedaAlpha.filter(i => i.mesNum === mesHoy && i.anioNum === anioHoy);
        } else if (filtroElegido !== 'todos') {
            const [anioF, mesF] = filtroElegido.split('-');
            datosAExportar = memoriaBovedaAlpha.filter(i => i.mesNum === parseInt(mesF) && i.anioNum === parseInt(anioF));
        }

        if (datosAExportar.length === 0) {
            alert("⚠️ No hay ingresos o gastos en el mes que seleccionó."); return;
        }

        const datosExcel = datosAExportar.map(item => {
            return {
                "FECHA EXACTA": item.fechaTxt,
                "TIPO DE OPERACIÓN": item.esManual ? item.metodoVisual : "COBRO DE INTERÉS",
                "CLIENTE / CONCEPTO": item.nombre,
                "DETALLE (REF / CRE)": item.esManual ? item.etiquetaCRE : `${item.ref.replace(' | ', ' ')} | CRÉDITO #${item.id_credito} | ${item.etiquetaCRE}`,
                "MÉTODO DE PAGO": item.esManual ? "AJUSTE MANUAL" : item.metodoVisual,
                "CAJA AFECTADA": item.metodo,
                "VALOR NETO ($)": item.ganancia
            };
        });

        const hoja = XLSX.utils.json_to_sheet(datosExcel);
        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, hoja, "Flujo Filtrado");

        const anchos = [ { wch: 25 }, { wch: 20 }, { wch: 35 }, { wch: 45 }, { wch: 15 }, { wch: 15 }, { wch: 15 } ];
        hoja['!cols'] = anchos;

        const fechaDescarga = new Date().toISOString().split('T')[0];
        XLSX.writeFile(libro, `Reporte_Utilidades_${filtroElegido}_${fechaDescarga}.xlsx`);

    } catch (error) { console.error("Error al exportar Excel:", error); alert("❌ Error: " + error.message); }
};

window.exportarUtilidadesPDF = async function() {
    alert("⏳ Generando reporte PDF corporativo... Por favor, espere.");
    try {
        if (typeof window.jspdf === 'undefined') throw new Error("La librería jsPDF no está cargada.");
        const { jsPDF } = window.jspdf;
        if (!memoriaBovedaAlpha || memoriaBovedaAlpha.length === 0) await cargarModuloInteresEnSegundoPlano();

        const filtroElegido = document.getElementById('filtro-mes-reportes') ? document.getElementById('filtro-mes-reportes').value : 'todos';
        let datosAExportar = memoriaBovedaAlpha;
        let tituloPeriodo = "TODO EL HISTORIAL ACUMULADO";
        
        if (filtroElegido === 'actual') {
            const mesHoy = new Date().getMonth(); const anioHoy = new Date().getFullYear();
            datosAExportar = memoriaBovedaAlpha.filter(i => i.mesNum === mesHoy && i.anioNum === anioHoy);
            tituloPeriodo = `MES ACTUAL (${new Date().toLocaleDateString('es-EC', { month: 'long', year: 'numeric' }).toUpperCase()})`;
        } else if (filtroElegido !== 'todos') {
            const [anioF, mesF] = filtroElegido.split('-');
            datosAExportar = memoriaBovedaAlpha.filter(i => i.mesNum === parseInt(mesF) && i.anioNum === parseInt(anioF));
            const nombreMesFiltro = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][parseInt(mesF)];
            tituloPeriodo = `PERIODO: ${nombreMesFiltro.toUpperCase()} ${anioF}`;
        }

        if (datosAExportar.length === 0) {
            alert("⚠️ No hay registros en el mes seleccionado para exportar."); return;
        }

        let totalAcumulado = 0; let totalEfectivo = 0; let totalBancos = 0;
        datosAExportar.forEach(item => {
            totalAcumulado += item.ganancia;
            if(item.metodo === 'EFECTIVO') totalEfectivo += item.ganancia;
            if(item.metodo === 'BANCO') totalBancos += item.ganancia;
        });

        const doc = new jsPDF('landscape');
        doc.setFontSize(22); doc.setTextColor(15, 23, 42); doc.text("SISTEMA ALPHA V5", 14, 20);
        doc.setFontSize(14); doc.setTextColor(16, 185, 129); doc.text(`REPORTE DE FLUJO DE UTILIDADES - ${tituloPeriodo}`, 14, 28);
        doc.setFontSize(10); doc.setTextColor(100, 100, 100); 
        doc.text(`Generado el: ${new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, 34);

        doc.setDrawColor(200, 200, 200); doc.line(14, 38, 283, 38); 

        doc.setFontSize(12); doc.setTextColor(15, 23, 42); doc.setFont(undefined, 'bold');
        doc.text("RESUMEN DE UTILIDAD NETA", 14, 48); doc.setFont(undefined, 'normal');

        doc.setFontSize(10);
        doc.text(`Total en Efectivo Matriz:`, 14, 55); doc.text(`$${totalEfectivo.toFixed(2)}`, 65, 55);
        doc.text(`Total en Banco Principal:`, 14, 61); doc.text(`$${totalBancos.toFixed(2)}`, 65, 61);
        
        doc.setFont(undefined, 'bold'); doc.setTextColor(16, 185, 129); 
        doc.text(`BALANCE TOTAL GENERAL:`, 14, 70); doc.setFontSize(14); doc.text(`$${totalAcumulado.toFixed(2)}`, 65, 70);

        const filasTabla = datosAExportar.map(item => [
            item.fechaTxt,
            item.esManual ? item.metodoVisual : 'Cobro Cliente',
            item.nombre,
            item.esManual ? item.etiquetaCRE : `${item.ref.replace(' | ', ' ')} | CRE #${item.id_credito}`,
            item.metodo,
            `$${item.ganancia.toFixed(2)}`
        ]);

        doc.autoTable({
            startY: 80,
            head: [['Fecha Exacta', 'Operación', 'Cliente / Concepto', 'Referencia / Detalle', 'Caja', 'Valor Neto']],
            body: filasTabla,
            theme: 'striped', headStyles: { fillColor: [15, 23, 42] }, styles: { fontSize: 8, cellPadding: 3 },
            columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 25 }, 2: { cellWidth: 50 }, 3: { cellWidth: 80 }, 4: { cellWidth: 20 }, 5: { halign: 'right', fontStyle: 'bold', cellWidth: 20 } },
            didParseCell: function(data) {
                if (data.section === 'body' && data.column.index === 5) {
                    data.cell.styles.textColor = data.cell.raw.toString().includes('$-') ? [220, 38, 38] : [16, 185, 129];
                }
            }
        });

        doc.setFontSize(9); doc.setTextColor(150, 150, 150);
        doc.text(`Reporte Oficial - Sistema Alpha V5 - Filtro: ${tituloPeriodo}`, 14, (doc.lastAutoTable.finalY || 85) + 15);
        doc.save(`Reporte_Utilidades_${filtroElegido}.pdf`);

    } catch (error) { console.error("Error al exportar PDF:", error); alert("❌ Error: " + error.message); }
};

async function cargarModuloInteresEnSegundoPlano() {
    try {
        const { data: historialTodos } = await supabaseClient.from('creditos').select('id, cliente_id').order('id', { ascending: true });
        const mapNumCreditoLocal = {};
        if (historialTodos) {
            const conteoPorCliente = {};
            historialTodos.forEach(c => { conteoPorCliente[c.cliente_id] = (conteoPorCliente[c.cliente_id] || 0) + 1; mapNumCreditoLocal[c.id] = conteoPorCliente[c.cliente_id]; });
        }

        const { data: ingresos } = await supabaseClient.from('historial_pagos').select(`id, numero_pago, fecha_pago, monto_interes, abono_total, forma_pago, id_credito, creditos (id, cliente_id, clientes (nombres, apellidos, cedula))`).gt('monto_interes', 0);
        const { data: movManuales } = await supabaseClient.from('movimientos_utilidad').select('*');

        memoriaBovedaAlpha = [];

        if (ingresos) {
            ingresos.forEach(ing => {
                const f = new Date(ing.fecha_pago);
                const cli = (ing.creditos && ing.creditos.clientes) ? ing.creditos.clientes : {};
                const d=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'], m=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
                let h=f.getHours(), min=String(f.getMinutes()).padStart(2,'0'), am=h>=12?'p. m.':'a. m.'; h=h%12; h=h?h:12;
                const iN = (cli.nombres||'X').trim().charAt(0).toUpperCase(), iA = (cli.apellidos||'X').trim().charAt(0).toUpperCase(), u4 = (cli.cedula||'0000').trim().slice(-4);
                const nLocal = mapNumCreditoLocal[ing.id_credito] || 1;
                const creC = typeof cifrarNumeroCredito==='function' ? cifrarNumeroCredito(nLocal).toUpperCase() : '';

                const rawMetodo = (ing.forma_pago||'EFECTIVO').toUpperCase();
                const metodoOficial = (rawMetodo.includes('TRANSF') || rawMetodo.includes('BANCO') || rawMetodo.includes('DEP')) ? 'BANCO' : 'EFECTIVO';
                const numPagoTxt = ing.numero_pago ? `PAGO #${ing.numero_pago} | ` : '';

                memoriaBovedaAlpha.push({
                    esManual: false, id_credito: ing.id_credito, ganancia: parseFloat(ing.monto_interes) || 0,
                    mesNum: f.getMonth(),      
                    anioNum: f.getFullYear(),  
                    fechaTxt: `${d[f.getDay()]} ${String(f.getDate()).padStart(2,'0')} ${m[f.getMonth()]} ${f.getFullYear()} | ${String(h).padStart(2,'0')}:${min} ${am}`,
                    nombre: `${cli.nombres||'CLIENTE'} ${cli.apellidos||'DESCONOCIDO'}`.toUpperCase(),
                    ref: `${numPagoTxt}REF: ${iN}${iA}-${u4}`, 
                    etiquetaCRE: creC ? `CRE #${nLocal} [${creC}]` : `CRE #${nLocal}`,
                    metodo: metodoOficial, metodoVisual: rawMetodo, fechaRealObj: f 
                });
            });
        }

        if (movManuales) {
            movManuales.forEach(mov => {
                const f = new Date(mov.fecha);
                const d=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'], m=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
                let h=f.getHours(), min=String(f.getMinutes()).padStart(2,'0'), am=h>=12?'p. m.':'a. m.'; h=h%12; h=h?h:12;
                const esRetiro = mov.tipo === 'RETIRO';

                let metodoOrigen = 'EFECTIVO'; 
                if (mov.concepto && mov.concepto.toLowerCase().includes('[banco]')) metodoOrigen = 'BANCO';
                if (mov.origen) metodoOrigen = mov.origen.toUpperCase();

                memoriaBovedaAlpha.push({
                    esManual: true, ganancia: esRetiro ? -Math.abs(mov.monto) : Math.abs(mov.monto),
                    mesNum: f.getMonth(),      
                    anioNum: f.getFullYear(),  
                    fechaTxt: `${d[f.getDay()]} ${String(f.getDate()).padStart(2,'0')} ${m[f.getMonth()]} ${f.getFullYear()} | ${String(h).padStart(2,'0')}:${min} ${am}`,
                    nombre: esRetiro ? '💸 EGRESO / RETIRO DE UTILIDAD' : '📥 REINGRESO / DEVOLUCIÓN',
                    ref: 'AJUSTE MANUAL DE GERENCIA', etiquetaCRE: mov.concepto.toUpperCase().replace('[BANCO]', '').replace('[EFECTIVO]', ''),
                    metodo: metodoOrigen, metodoVisual: mov.tipo, fechaRealObj: f 
                });
            });
        }
        memoriaBovedaAlpha.sort((a, b) => b.fechaRealObj - a.fechaRealObj);
    } catch (e) { console.error("Error background:", e); }
}
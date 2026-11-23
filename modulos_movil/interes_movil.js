// =========================================================================
// 💎 MÓDULO DE BÓVEDA DE INTERESES Y UTILIDADES (CLON MÓVIL EXACTO DE PC)
// Archivo: modulos_movil/interes_movil.js
// =========================================================================

window.memoriaBovedaAlphaMovil = [];
window.mesSeleccionadoBovedaMovil = 'diario';
window.diasAtrasBovedaMovil = 0;
window.filtroMemoriaBovedaMovil = "";

function formatearFechaNasaMovil(f) {
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    let horas = f.getHours();
    const minutos = String(f.getMinutes()).padStart(2, '0');
    const ampm = horas >= 12 ? 'p. m.' : 'a. m.';
    horas = horas % 12 || 12;
    return `${dias[f.getDay()]} ${String(f.getDate()).padStart(2, '0')} ${meses[f.getMonth()]} ${f.getFullYear()} | ${String(horas).padStart(2, '0')}:${minutos} ${ampm}`;
}

// 1. CARGAR DATOS DESDE SUPABASE
window.cargarModuloInteresMovil = async function() {
    const contenedor = document.getElementById('mod-interes-movil');
    if (!contenedor) return;

    contenedor.innerHTML = `
        <div style="text-align:center; padding:50px 20px; color:#64748b;">
            <span style="font-size:42px; display:block; margin-bottom:10px;">🚀</span>
            <div style="font-weight:900; font-size:15px;">Sincronizando Bóveda Satelital...</div>
            <div style="font-size:12px; margin-top:4px;">Calculando flujos de Efectivo y Banco...</div>
        </div>`;

    try {
        const supa = window.supabaseClient;
        if (!supa) throw new Error("Base de datos no conectada.");

        const { data: historialTodos } = await supa.from('creditos').select('id, cliente_id').order('id', { ascending: true });
        const mapNumCreditoLocal = {};
        if (historialTodos) {
            const conteo = {};
            historialTodos.forEach(c => {
                conteo[c.cliente_id] = (conteo[c.cliente_id] || 0) + 1;
                mapNumCreditoLocal[c.id] = conteo[c.cliente_id];
            });
        }

        const { data: ingresos } = await supa
            .from('historial_pagos')
            .select(`id, numero_pago, fecha_pago, monto_interes, abono_total, forma_pago, id_credito, creditos (id, cliente_id, clientes (nombres, apellidos, cedula))`)
            .gt('monto_interes', 0);

        const { data: movimientosManuales, error: errManuales } = await supa
            .from('movimientos_utilidad')
            .select('*');
        if (errManuales) throw errManuales;

        window.memoriaBovedaAlphaMovil = [];

        if (ingresos) {
            ingresos.forEach(ing => {
                const f = new Date(ing.fecha_pago);
                const cli = (ing.creditos && ing.creditos.clientes) ? ing.creditos.clientes : {};
                const iN = (cli.nombres || 'X').trim().charAt(0).toUpperCase();
                const iA = (cli.apellidos || 'X').trim().charAt(0).toUpperCase();
                const u4 = (cli.cedula || '0000').trim().slice(-4);
                const numLocal = mapNumCreditoLocal[ing.id_credito] || 1;
                const creCif = typeof cifrarNumeroCreditoMovil === 'function' ? cifrarNumeroCreditoMovil(numLocal).toUpperCase() : '';

                const rawMetodo = (ing.forma_pago || 'EFECTIVO').toUpperCase();
                const metodoOficial = (rawMetodo.includes('TRANSF') || rawMetodo.includes('BANCO') || rawMetodo.includes('DEP')) ? 'BANCO' : 'EFECTIVO';
                const numPagoTxt = ing.numero_pago ? `PAGO #${ing.numero_pago} | ` : '';

                window.memoriaBovedaAlphaMovil.push({
                    esManual: false,
                    id_credito: ing.id_credito,
                    ganancia: parseFloat(ing.monto_interes) || 0,
                    mesNum: f.getMonth(),
                    anioNum: f.getFullYear(),
                    fechaTxt: formatearFechaNasaMovil(f),
                    nombre: `${cli.nombres || 'CLIENTE'} ${cli.apellidos || 'DESCONOCIDO'}`.toUpperCase(),
                    ref: `${numPagoTxt}REF: ${iN}${iA}-${u4}`,
                    etiquetaCRE: creCif ? `CRE #${numLocal} [${creCif}]` : `CRE #${numLocal}`,
                    metodo: metodoOficial,
                    metodoVisual: rawMetodo,
                    fechaRealObj: f
                });
            });
        }

        if (movimientosManuales) {
            movimientosManuales.forEach(mov => {
                const f = new Date(mov.fecha);
                const esRetiro = mov.tipo === 'RETIRO';
                let metodoOrigen = 'EFECTIVO';
                if (mov.concepto && mov.concepto.toLowerCase().includes('[banco]')) metodoOrigen = 'BANCO';
                if (mov.origen) metodoOrigen = mov.origen.toUpperCase();

                window.memoriaBovedaAlphaMovil.push({
                    esManual: true,
                    ganancia: esRetiro ? -Math.abs(mov.monto) : Math.abs(mov.monto),
                    mesNum: f.getMonth(),
                    anioNum: f.getFullYear(),
                    fechaTxt: formatearFechaNasaMovil(f),
                    nombre: esRetiro ? '💸 EGRESO / RETIRO DE UTILIDAD' : '📥 REINGRESO / DEVOLUCIÓN',
                    ref: 'AJUSTE MANUAL DE GERENCIA',
                    etiquetaCRE: (mov.concepto || '').toUpperCase().replace('[BANCO]', '').replace('[EFECTIVO]', '').trim(),
                    metodo: metodoOrigen,
                    metodoVisual: mov.tipo,
                    fechaRealObj: f
                });
            });
        }

        window.memoriaBovedaAlphaMovil.sort((a, b) => b.fechaRealObj - a.fechaRealObj);
        window.renderizarBovedaVisualMovil();

    } catch (error) {
        contenedor.innerHTML = `<div style="text-align:center; padding:30px; color:#ef4444; font-weight:bold;">❌ Error: ${error.message}</div>`;
    }
};

// 2. RENDERIZAR DASHBOARD MÓVIL
window.renderizarBovedaVisualMovil = function() {
    const contenedor = document.getElementById('mod-interes-movil');
    if (!contenedor) return;

    const mesesLargos = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const mesActualJS = new Date().getMonth();
    const anioActualJS = new Date().getFullYear();

    const mesesDisp = new Set();
    window.memoriaBovedaAlphaMovil.forEach(i => mesesDisp.add(`${i.anioNum}-${i.mesNum}`));
    const historialMeses = Array.from(mesesDisp).sort((a, b) => {
        const [aA, mA] = a.split('-'); const [aB, mB] = b.split('-');
        return aA !== aB ? aB - aA : mB - mA;
    });

    let opcionesHTML = `<option value="diario" ${window.mesSeleccionadoBovedaMovil === 'diario' ? 'selected' : ''}>📅 Por Día (Máquina del Tiempo)</option>`;
    opcionesHTML += `<option value="actual" ${window.mesSeleccionadoBovedaMovil === 'actual' ? 'selected' : ''}>🗓️ Mes Actual (${mesesLargos[mesActualJS]} ${anioActualJS})</option>`;
    historialMeses.forEach(cod => {
        const [anio, mes] = cod.split('-');
        if (parseInt(anio) === anioActualJS && parseInt(mes) === mesActualJS) return;
        opcionesHTML += `<option value="${cod}" ${window.mesSeleccionadoBovedaMovil === cod ? 'selected' : ''}>🗓️ ${mesesLargos[mes]} ${anio}</option>`;
    });
    opcionesHTML += `<option value="todos" ${window.mesSeleccionadoBovedaMovil === 'todos' ? 'selected' : ''}>🌍 Ver Todo el Historial</option>`;

    let datosFiltrados = [];
    let tituloFiltro = "";

    if (window.mesSeleccionadoBovedaMovil === 'diario') {
        const fObj = new Date();
        fObj.setDate(fObj.getDate() - window.diasAtrasBovedaMovil);
        const dStr = fObj.getDate(), mStr = fObj.getMonth(), yStr = fObj.getFullYear();
        datosFiltrados = window.memoriaBovedaAlphaMovil.filter(i => {
            const f = i.fechaRealObj;
            return f.getDate() === dStr && f.getMonth() === mStr && f.getFullYear() === yStr;
        });
        const dNom = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
        tituloFiltro = `${dNom[fObj.getDay()].toUpperCase()} ${String(dStr).padStart(2,'0')} DE ${mesesLargos[mStr].toUpperCase()} ${yStr}`;
    } else if (window.mesSeleccionadoBovedaMovil === 'actual') {
        datosFiltrados = window.memoriaBovedaAlphaMovil.filter(i => i.mesNum === mesActualJS && i.anioNum === anioActualJS);
        tituloFiltro = `Balance de ${mesesLargos[mesActualJS]} ${anioActualJS}`;
    } else if (window.mesSeleccionadoBovedaMovil === 'todos') {
        datosFiltrados = [...window.memoriaBovedaAlphaMovil];
        tituloFiltro = "Balance Histórico Total";
    } else {
        const [aF, mF] = window.mesSeleccionadoBovedaMovil.split('-');
        datosFiltrados = window.memoriaBovedaAlphaMovil.filter(i => i.mesNum === parseInt(mF) && i.anioNum === parseInt(aF));
        tituloFiltro = `Balance de ${mesesLargos[mF]} ${aF}`;
    }

    const utilidadNetaGeneral = window.memoriaBovedaAlphaMovil.reduce((s, i) => s + i.ganancia, 0);
    const utilidadTotal = datosFiltrados.reduce((s, i) => s + i.ganancia, 0);
    const utilidadEfectivo = datosFiltrados.filter(i => i.metodo === 'EFECTIVO').reduce((s, i) => s + i.ganancia, 0);
    const utilidadBanco = datosFiltrados.filter(i => i.metodo === 'BANCO').reduce((s, i) => s + i.ganancia, 0);
    const abonosReales = datosFiltrados.filter(i => !i.esManual).length;

    const cardsHTML = datosFiltrados.length > 0 ? datosFiltrados.map(item => {
        if (item.esManual) {
            const esRetiro = item.ganancia < 0;
            const bg = esRetiro ? '#fef2f2' : '#f0fdf4';
            const borde = esRetiro ? '#ef4444' : '#16a34a';
            const colorTxt = esRetiro ? '#dc2626' : '#16a34a';
            return `
            <div class="movimiento-boveda-item-movil" style="background:${bg}; border:1px solid #e2e8f0; border-left:4px solid ${borde}; border-radius:10px; padding:12px; margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                    <div style="font-weight:900; color:${colorTxt}; font-size:12px;">${esRetiro ? '📉' : '📈'} ${item.nombre}</div>
                    <div style="font-weight:900; color:${colorTxt}; font-size:15px; white-space:nowrap;">${esRetiro ? '' : '+'}$${item.ganancia.toFixed(2)}</div>
                </div>
                <div style="font-size:11px; color:#334155; font-weight:bold; margin:6px 0;">Detalle: ${item.etiquetaCRE}</div>
                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed #cbd5e1; padding-top:6px; font-size:10px; color:#64748b;">
                    <span>📅 ${item.fechaTxt}</span>
                    <span style="padding:2px 7px; border-radius:4px; font-weight:900; background:${item.metodo === 'BANCO' ? '#dbeafe' : '#e2e8f0'}; color:${item.metodo === 'BANCO' ? '#0369a1' : '#334155'};">${item.metodo}</span>
                </div>
            </div>`;
        } else {
            const metStyle = item.metodo === 'BANCO'
                ? 'background:#ede9fe; color:#6d28d9;'
                : 'background:#dcfce7; color:#166534;';
            return `
            <div class="movimiento-boveda-item-movil" style="background:white; border:1px solid #e2e8f0; border-left:4px solid #10b981; border-radius:10px; padding:12px; margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:6px;">
                    <div style="font-weight:900; color:#0f172a; font-size:13px;">${item.nombre}</div>
                    <div style="font-weight:900; color:#10b981; font-size:16px; white-space:nowrap;">+$${item.ganancia.toFixed(2)}</div>
                </div>
                <div style="font-size:10px; background:#e0f2fe; color:#0369a1; padding:3px 7px; border-radius:5px; display:inline-block; font-weight:bold; margin-bottom:8px;">
                    ${item.ref} | CRÉDITO #${item.id_credito} | ${item.etiquetaCRE}
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed #e2e8f0; padding-top:6px; font-size:10px; color:#64748b;">
                    <span>📅 ${item.fechaTxt}</span>
                    <span style="padding:2px 7px; border-radius:4px; font-weight:900; ${metStyle}">${item.metodoVisual}</span>
                </div>
            </div>`;
        }
    }).join('') : `<div style="text-align:center; padding:30px 15px; color:#94a3b8; font-size:13px; font-weight:600;">No hay registros en esta fecha.</div>`;

    const esHoy = window.diasAtrasBovedaMovil === 0;
    const botonesTiempoHTML = window.mesSeleccionadoBovedaMovil === 'diario' ? `
        <div style="margin-top:12px; padding:12px; background:#f8fafc; border-radius:10px; border:1px solid #e2e8f0; text-align:center;">
            <div style="color:#0369a1; font-weight:900; font-size:11px; margin-bottom:10px;">📅 ${tituloFiltro}</div>
            <div style="display:flex; gap:10px;">
                <button onclick="cambiarDiaBovedaMovil(1)" style="flex:1; background:#e2e8f0; color:#334155; border:1px solid #cbd5e1; padding:9px; border-radius:8px; font-weight:bold; font-size:12px;">⬅️ Día Anterior</button>
                <button ${esHoy ? 'disabled' : 'onclick="cambiarDiaBovedaMovil(-1)"'} style="flex:1; background:${esHoy ? '#f1f5f9' : '#e2e8f0'}; color:${esHoy ? '#94a3b8' : '#334155'}; border:1px ${esHoy ? 'dashed #cbd5e1' : 'solid #cbd5e1'}; padding:9px; border-radius:8px; font-weight:bold; font-size:12px;">Día Siguiente ➡️</button>
            </div>
        </div>` : `
        <div style="margin-top:12px; padding:10px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
            <span style="color:#0369a1; font-weight:900; font-size:11px;">📅 ${tituloFiltro}</span>
        </div>`;

    contenedor.innerHTML = `
        <!-- BLOQUE 1: UTILIDAD NETA GLOBAL -->
        <div style="background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color:white; border-radius:16px; padding:18px; margin-bottom:14px; box-shadow:0 6px 15px rgba(15,23,42,0.2);">
            <div style="font-size:10px; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:0.8px;">💎 UTILIDAD NETA (TODO EL TIEMPO)</div>
            <div style="font-size:30px; font-weight:900; color:#10b981; margin:4px 0 12px 0;">$${utilidadNetaGeneral.toFixed(2)}</div>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; border-top:1px dashed #334155; padding-top:12px; text-align:center;">
                <div>
                    <div style="font-size:9px; color:#94a3b8; font-weight:bold;">EFECTIVO</div>
                    <div style="font-size:14px; font-weight:900; color:#10b981;">$${utilidadEfectivo.toFixed(2)}</div>
                </div>
                <div>
                    <div style="font-size:9px; color:#94a3b8; font-weight:bold;">BANCOS</div>
                    <div style="font-size:14px; font-weight:900; color:#38bdf8;">$${utilidadBanco.toFixed(2)}</div>
                </div>
                <div>
                    <div style="font-size:9px; color:#94a3b8; font-weight:bold;">PERIODO</div>
                    <div style="font-size:14px; font-weight:900; color:#fcd34d;">$${utilidadTotal.toFixed(2)}</div>
                </div>
            </div>
        </div>

        <!-- BLOQUE 2: REGISTRAR RETIRO O REINGRESO -->
        <div style="background:#0f172a; color:white; border-radius:14px; padding:16px; margin-bottom:16px; border:1px solid #334155;">
            <h3 style="margin:0 0 12px 0; font-size:13px; color:white; border-bottom:1px dashed #334155; padding-bottom:8px;">💼 Registrar Gasto o Reingreso de Utilidad</h3>
            <div style="display:grid; grid-template-columns:1.2fr 1fr; gap:8px; margin-bottom:10px;">
                <div>
                    <label style="font-size:10px; color:#94a3b8; font-weight:bold; display:block; margin-bottom:4px;">AFECTAR CAJA DE:</label>
                    <select id="input-origen-utilidad-movil" style="width:100%; padding:10px; background:#1e293b; border:1px solid #475569; border-radius:8px; color:white; font-size:12px; font-weight:bold;">
                        <option value="EFECTIVO">💵 EFECTIVO MATRIZ</option>
                        <option value="BANCO">🏦 BANCO PRINCIPAL</option>
                    </select>
                </div>
                <div>
                    <label style="font-size:10px; color:#94a3b8; font-weight:bold; display:block; margin-bottom:4px;">MONTO ($):</label>
                    <input type="number" id="input-monto-utilidad-movil" step="0.01" placeholder="0.00" style="width:100%; padding:10px; background:#1e293b; border:1px solid #475569; border-radius:8px; color:white; font-size:14px; font-weight:bold; box-sizing:border-box;">
                </div>
            </div>
            <div style="margin-bottom:12px;">
                <label style="font-size:10px; color:#94a3b8; font-weight:bold; display:block; margin-bottom:4px;">CONCEPTO / DETALLE:</label>
                <input type="text" id="input-concepto-utilidad-movil" placeholder="Ej: Compra de repuestos" style="width:100%; padding:10px; background:#1e293b; border:1px solid #475569; border-radius:8px; color:white; font-size:13px; box-sizing:border-box;">
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <button onclick="procesarMovimientoUtilidadMovil('RETIRO')" style="background:#ef4444; color:white; border:none; padding:11px; border-radius:8px; font-weight:900; font-size:12px;">💸 RETIRAR (GASTO)</button>
                <button onclick="procesarMovimientoUtilidadMovil('INGRESO')" style="background:#10b981; color:white; border:none; padding:11px; border-radius:8px; font-weight:900; font-size:12px;">📥 REINGRESAR</button>
            </div>
        </div>

        <!-- BLOQUE 3: AUDITORÍA Y FILTROS -->
        <div style="background:white; border:1px solid #e2e8f0; border-radius:14px; padding:16px; box-shadow:0 2px 8px rgba(15,23,42,0.04);">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f1f5f9; padding-bottom:10px; margin-bottom:12px;">
                <h3 style="font-size:12px; font-weight:900; color:#2563eb; text-transform:uppercase; margin:0;">📊 AUDITORÍA DE UTILIDADES</h3>
                <span id="contador-abonos-boveda-movil" style="background:#f1f5f9; color:#475569; font-weight:bold; font-size:11px; padding:4px 8px; border-radius:20px;">Abonos: ${abonosReales}</span>
            </div>

            <div style="display:grid; grid-template-columns:1fr auto; gap:8px; margin-bottom:10px;">
                <select onchange="cambiarFiltroBovedaMovil(this.value)" style="width:100%; padding:10px; border:1px solid #cbd5e1; border-radius:8px; background:#f8fafc; font-size:12px; font-weight:bold;">
                    ${opcionesHTML}
                </select>
                <button onclick="sincronizarYLimpiarBovedaMovil()" title="Sincronizar" style="padding:0 12px; background:#0f172a; color:white; border:none; border-radius:8px; font-weight:bold;">🔄</button>
            </div>

            <input type="text" id="input-buscar-interes-movil" onkeyup="filtrarBovedaEnVivoMovil(this.value)" value="${window.filtroMemoriaBovedaMovil}" placeholder="🔍 Buscar cliente, CRE #[Y], efectivo..." style="width:100%; padding:10px 12px; border:1px solid #cbd5e1; border-radius:8px; background:#f8fafc; font-size:13px; margin-bottom:12px; box-sizing:border-box;">

            <div id="lista-auditoria-boveda-movil">${cardsHTML}</div>
            ${botonesTiempoHTML}
        </div>
    `;

    if (window.filtroMemoriaBovedaMovil !== "") {
        window.filtrarBovedaEnVivoMovil(window.filtroMemoriaBovedaMovil);
    }
};

// 3. CONTROLES Y MOVIMIENTOS MANUALES
window.cambiarFiltroBovedaMovil = function(valor) {
    window.mesSeleccionadoBovedaMovil = valor;
    window.diasAtrasBovedaMovil = 0;
    window.renderizarBovedaVisualMovil();
};

window.cambiarDiaBovedaMovil = function(dir) {
    window.diasAtrasBovedaMovil += dir;
    if (window.diasAtrasBovedaMovil < 0) window.diasAtrasBovedaMovil = 0;
    window.renderizarBovedaVisualMovil();
};

window.sincronizarYLimpiarBovedaMovil = function() {
    window.filtroMemoriaBovedaMovil = "";
    window.diasAtrasBovedaMovil = 0;
    window.mesSeleccionadoBovedaMovil = 'diario';
    window.cargarModuloInteresMovil();
};

window.filtrarBovedaEnVivoMovil = function(termino) {
    window.filtroMemoriaBovedaMovil = (termino || '').trim().toUpperCase();
    const lista = document.getElementById('lista-auditoria-boveda-movil');
    if (!lista) return;
    let visibles = 0;
    lista.querySelectorAll('.movimiento-boveda-item-movil').forEach(el => {
        if (window.filtroMemoriaBovedaMovil === "" || el.innerText.toUpperCase().includes(window.filtroMemoriaBovedaMovil)) {
            el.style.display = 'block';
            visibles++;
        } else {
            el.style.display = 'none';
        }
    });
    const cont = document.getElementById('contador-abonos-boveda-movil');
    if (cont) {
        cont.innerText = window.filtroMemoriaBovedaMovil !== "" ? `Búsqueda: ${visibles}` : `Registros: ${visibles}`;
        cont.style.background = window.filtroMemoriaBovedaMovil !== "" ? '#e0f2fe' : '#f1f5f9';
        cont.style.color = window.filtroMemoriaBovedaMovil !== "" ? '#0369a1' : '#475569';
    }
};

window.procesarMovimientoUtilidadMovil = async function(tipo) {
    const monto = parseFloat(document.getElementById('input-monto-utilidad-movil').value);
    let concepto = document.getElementById('input-concepto-utilidad-movil').value.trim();
    const origen = document.getElementById('input-origen-utilidad-movil').value;

    if (isNaN(monto) || monto <= 0) { alert("⚠️ Ingrese un monto válido mayor a $0.00"); return; }
    if (!concepto) { alert("⚠️ Es obligatorio ingresar un concepto o detalle."); return; }

    concepto = `${concepto} [${origen}]`;
    const accion = tipo === 'RETIRO' ? 'RETIRAR' : 'INGRESAR';
    if (!confirm(`¿Está seguro de ${accion} $${monto.toFixed(2)} de su UTILIDAD EN ${origen}?\n\nDetalle: ${concepto}`)) return;

    try {
        const { error } = await window.supabaseClient.from('movimientos_utilidad').insert([{
            tipo: tipo,
            monto: monto,
            concepto: concepto,
            fecha: new Date().toISOString()
        }]);
        if (error) throw error;

        alert(`✅ Operación exitosa. ${tipo} de $${monto.toFixed(2)} procesado en ${origen}.`);
        window.cargarModuloInteresMovil();
    } catch (e) {
        alert("❌ Error en base de datos: " + e.message);
    }
};
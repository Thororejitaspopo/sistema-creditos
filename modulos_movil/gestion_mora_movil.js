// =========================================================================
// ⚖️ MÓDULO MAESTRO DE GESTIÓN DE MORA Y CONVENIOS (CLON MÓVIL)
// Archivo: modulos_movil/gestion_mora_movil.js
// =========================================================================

async function enviarSMSMoraMovil(numero, mensaje) {
    if (typeof invocarSMSDesdeMovil === 'function') {
        return await invocarSMSDesdeMovil(numero, mensaje);
    }
    try {
        const urlMacroDroid = `https://trigger.macrodroid.com/554f217c-000a-4581-896c-551d96459fb2/sms_credito?numero=${encodeURIComponent(numero)}&mensaje=${encodeURIComponent(mensaje)}`;
        await fetch(urlMacroDroid, { mode: 'no-cors' });
        return true;
    } catch (e) {
        console.error("Error SMS Mora Móvil:", e);
        return false;
    }
}

function refrescarVistasTrasMora() {
    setTimeout(() => {
        if (document.getElementById('lista-alertas-movil') && typeof cargarMatrizGlobalMovil === 'function') {
            cargarMatrizGlobalMovil();
        }
        if (document.getElementById('contenedor-tabla-mora-movil') && typeof window.cargarTablaGestionMoraMovil === 'function') {
            window.cargarTablaGestionMoraMovil();
        }
    }, 400);
}

// =========================================================================
// 1. LISTADO DE CARTERA (TARJETAS MÓVILES)
// =========================================================================
window.cargarTablaGestionMoraMovil = async function() {
    const contenedor = document.getElementById('contenedor-tabla-mora-movil');
    const selectorBuscador = document.getElementById('buscador-gestion-mora-movil');
    if (!contenedor) return;

    const clienteSeleccionado = selectorBuscador ? selectorBuscador.value : '';
    contenedor.innerHTML = '<div style="text-align:center; padding:25px; color:#64748b; font-size:13px;">⏳ Escaneando cartera y calculando saldos reales...</div>';

    try {
        const supa = window.supabaseClient;
        if (!supa) throw new Error("Base de datos no conectada.");

        const { data: creditosActivos, error } = await supa
            .from('creditos')
            .select(`id, monto_capital, total_pagar, monto_mora, saldo_pendiente, fecha_emision, tasa_interes, estado, clientes!inner(id, nombres, apellidos, cedula), historial_pagos(abono_total)`)
            .in('estado', ['activo', 'congelado'])
            .order('fecha_emision', { ascending: true });

        if (error) throw error;

        const { data: historialTodos } = await supa
            .from('creditos')
            .select('id, cliente_id')
            .order('id', { ascending: true });

        const mapNumCreditoLocal = {};
        if (historialTodos) {
            const conteo = {};
            historialTodos.forEach(c => {
                conteo[c.cliente_id] = (conteo[c.cliente_id] || 0) + 1;
                mapNumCreditoLocal[c.id] = conteo[c.cliente_id];
            });
        }

        if (!creditosActivos || creditosActivos.length === 0) {
            contenedor.innerHTML = `<div style="text-align:center; padding:25px; color:#10b981; font-weight:bold;">✨ Toda tu cartera está limpia. No hay créditos pendientes.</div>`;
            if (selectorBuscador) selectorBuscador.innerHTML = '<option value="">🌍 TODOS LOS CLIENTES ACTIVOS</option>';
            return;
        }

        // Llenar selector de clientes
        if (selectorBuscador) {
            const mapClientes = new Map();
            const clientesUnicos = [];
            creditosActivos.forEach(cre => {
                const cli = cre.clientes;
                if (cli && cli.id && !mapClientes.has(cli.id)) {
                    mapClientes.set(cli.id, true);
                    clientesUnicos.push(cli);
                }
            });
            clientesUnicos.sort((a, b) => a.nombres.localeCompare(b.nombres));

            let opcionesHTML = '<option value="">🌍 TODOS LOS CLIENTES ACTIVOS</option>';
            clientesUnicos.forEach(cli => {
                opcionesHTML += `<option value="${cli.id}">${cli.nombres.toUpperCase()} ${cli.apellidos.toUpperCase()} (${cli.cedula})</option>`;
            });
            selectorBuscador.innerHTML = opcionesHTML;
            if (clienteSeleccionado) selectorBuscador.value = clienteSeleccionado;
        }

        let creditosFiltrados = creditosActivos;
        const valorFiltro = selectorBuscador ? selectorBuscador.value : '';
        if (valorFiltro !== '') {
            creditosFiltrados = creditosFiltrados.filter(cre => cre.clientes && cre.clientes.id.toString() === valorFiltro);
        }

        if (creditosFiltrados.length === 0) {
            contenedor.innerHTML = `<div style="text-align:center; padding:25px; color:#ef4444; font-weight:bold;">🔍 Este cliente no tiene créditos pendientes.</div>`;
            return;
        }

        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

        contenedor.innerHTML = creditosFiltrados.map(cre => {
            const cli = cre.clientes || {};
            const nombreCliente = `${cli.nombres} ${cli.apellidos}`.toUpperCase();
            const refBancaria = `REF: ${(cli.nombres||'').charAt(0).toUpperCase()}${(cli.apellidos||'').charAt(0).toUpperCase()}-${(cli.cedula||'0000').slice(-4)}`;
            const esCongelado = cre.estado === 'congelado';

            const numLocal = mapNumCreditoLocal[cre.id] || 1;
            const creCif = typeof cifrarNumeroCreditoMovil === 'function' ? cifrarNumeroCreditoMovil(numLocal).toUpperCase() : '';
            const etiquetaCRE = creCif ? `CRE #${numLocal} [${creCif}]` : `CRE #${numLocal}`;

            const fEmi = new Date(cre.fecha_emision);
            const fechaTxt = `${dias[fEmi.getDay()]} ${fEmi.getDate()}/${meses[fEmi.getMonth()]}/${fEmi.getFullYear()}`;

            const moraExtra = parseFloat(cre.monto_mora) || 0;
            const deudaTotalReal = (parseFloat(cre.total_pagar) || 0) + moraExtra;
            const totalAbonado = (cre.historial_pagos || []).reduce((s, p) => s + (parseFloat(p.abono_total) || 0), 0);
            const saldoReal = Math.max(0, deudaTotalReal - totalAbonado);
            const tasaOriginal = parseFloat(cre.tasa_interes) || 20;

            return `
            <div style="background: white; border: 1px solid #e2e8f0; border-left: 5px solid ${esCongelado ? '#0284c7' : '#0f172a'}; border-radius: 12px; padding: 14px; margin-bottom: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px;">
                    <div>
                        <div style="font-weight: 900; font-size: 14px; color: #0f172a;">${nombreCliente}</div>
                        <div style="margin-top: 4px; display: flex; flex-wrap: wrap; gap: 4px; align-items: center;">
                            <span style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">ID: ${cre.id} | ${refBancaria} | ${etiquetaCRE}</span>
                            ${esCongelado ? '<span style="background:#e0f2fe; color:#0284c7; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold;">🧊 CONGELADO</span>' : ''}
                        </div>
                    </div>
                </div>

                <div style="font-size: 11px; color: #64748b; margin-bottom: 10px;">📅 Emisión: <b>${fechaTxt}</b></div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px dashed #cbd5e1; margin-bottom: 12px; font-size: 12px;">
                    <div><span style="color:#64748b; font-size:10px; display:block;">CAPITAL INTACTO</span><b>$${parseFloat(cre.monto_capital).toFixed(2)}</b></div>
                    <div style="text-align:right;"><span style="color:#64748b; font-size:10px; display:block;">TOTAL A PAGAR</span><b style="color:#ca8a04;">$${deudaTotalReal.toFixed(2)}</b></div>
                    <div><span style="color:#64748b; font-size:10px; display:block;">ABONOS</span><b style="color:#16a34a;">$${totalAbonado.toFixed(2)}</b></div>
                    <div style="text-align:right;"><span style="color:#64748b; font-size:10px; display:block;">SALDO ACTUAL</span><b style="color:#ef4444; font-size:14px;">$${saldoReal.toFixed(2)}</b></div>
                </div>

                <button onclick="abrirPanelSancionMovil(${cre.id}, '${nombreCliente.replace(/'/g, "\\'")}', ${cre.monto_capital}, ${deudaTotalReal}, ${saldoReal}, ${tasaOriginal}, '${cre.estado}', '${etiquetaCRE}', '${refBancaria}')" style="width: 100%; background: #0f172a; color: white; border: none; padding: 11px; border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer;">
                    ⚙️ GESTIONAR
                </button>
            </div>`;
        }).join('');
    } catch (error) {
        contenedor.innerHTML = `<div style="color:#ef4444; text-align:center; padding:20px;">❌ Error: ${error.message}</div>`;
    }
};

// =========================================================================
// 2. PANEL MODAL DE RESOLUCIÓN DE CARTERA (IDÉNTICO A PC)
// =========================================================================
window.abrirPanelSancionMovil = function(idCredito, nombreCliente, capital, total, saldo, tasaOriginal, estadoActual, etiquetaCRE, refBancaria) {
    const capitalNum = parseFloat(capital) || 1;
    const saldoNum = parseFloat(saldo) || 0;
    const interesPorcentaje = parseFloat(tasaOriginal) || 20;
    const esCongelado = estadoActual === 'congelado';

    const multaSobreCapital = capitalNum * (interesPorcentaje / 100);
    const multaSobreSaldo = saldoNum * (interesPorcentaje / 100);

    const modalId = 'modal-sancion-alpha-movil';
    const previo = document.getElementById(modalId);
    if (previo) previo.remove();

    const nomEsc = nombreCliente.replace(/'/g, "\\'");

    const btnAviso = esCongelado
        ? `<button disabled style="padding:12px; background:#fef08a; color:#a16207; border:none; border-radius:8px; font-weight:bold; opacity:0.7;">📱 Enviar Aviso SMS (BLOQUEADO)</button>`
        : `<button onclick="enviarAvisoGraciaSMSMovil(${idCredito}, '${nomEsc}', ${saldoNum}, '${etiquetaCRE}', '${refBancaria}')" style="padding:12px; background:#eab308; color:#422006; border:none; border-radius:8px; font-weight:bold; display:flex; justify-content:space-between; align-items:center;"><span>📱 Enviar Aviso SMS</span><span style="background:rgba(255,255,255,0.4); padding:3px 8px; border-radius:4px; font-size:11px;">Periodo de Gracia</span></button>`;

    const btnCap = esCongelado
        ? `<button disabled style="padding:12px; background:#fca5a5; color:white; border:none; border-radius:8px; font-weight:bold;">🚨 Mora s/ Capital (BLOQUEADO)</button>`
        : `<button onclick="aplicarMoraSobreCapitalMovil(${idCredito}, ${multaSobreCapital}, ${saldoNum}, '${etiquetaCRE}')" style="padding:12px; background:#dc2626; color:white; border:none; border-radius:8px; font-weight:bold; display:flex; justify-content:space-between; align-items:center;"><span>🚨 Mora s/ Capital</span><span style="background:rgba(255,255,255,0.2); padding:3px 8px; border-radius:4px; font-size:12px;">Sumar $${multaSobreCapital.toFixed(2)}</span></button>`;

    const btnSal = esCongelado
        ? `<button disabled style="padding:12px; background:#fdba74; color:white; border:none; border-radius:8px; font-weight:bold;">⚡ Mora s/ Saldo (BLOQUEADO)</button>`
        : `<button onclick="aplicarMoraSobreSaldoMovil(${idCredito}, ${multaSobreSaldo}, ${saldoNum}, '${etiquetaCRE}')" style="padding:12px; background:#ea580c; color:white; border:none; border-radius:8px; font-weight:bold; display:flex; justify-content:space-between; align-items:center;"><span>⚡ Mora s/ Saldo</span><span style="background:rgba(255,255,255,0.2); padding:3px 8px; border-radius:4px; font-size:12px;">Sumar $${multaSobreSaldo.toFixed(2)}</span></button>`;

    const btnCong = esCongelado
        ? `<button onclick="alternarCongelamientoMovil(${idCredito}, 'activo', '${etiquetaCRE}', ${saldoNum})" style="padding:12px; background:#f59e0b; color:white; border:none; border-radius:8px; font-weight:bold; display:flex; justify-content:space-between; align-items:center;"><span>🔥 Descongelar Cuenta</span><span style="background:rgba(255,255,255,0.2); padding:3px 8px; border-radius:4px; font-size:11px;">Reactivar recargos</span></button>`
        : `<button onclick="alternarCongelamientoMovil(${idCredito}, 'congelado', '${etiquetaCRE}', ${saldoNum})" style="padding:12px; background:#0284c7; color:white; border:none; border-radius:8px; font-weight:bold; display:flex; justify-content:space-between; align-items:center;"><span>🧊 Congelar Cuenta</span><span style="background:rgba(255,255,255,0.2); padding:3px 8px; border-radius:4px; font-size:11px;">Pausar recargos</span></button>`;

    const btnPerd = esCongelado
        ? `<button disabled style="padding:12px; background:#86efac; color:white; border:none; border-radius:8px; font-weight:bold;">🛡️ Perdonar este mes (BLOQUEADO)</button>`
        : `<button onclick="perdonarMoraEsteMesMovil(${idCredito}, '${etiquetaCRE}')" style="padding:12px; background:#10b981; color:white; border:none; border-radius:8px; font-weight:bold; display:flex; justify-content:space-between; align-items:center;"><span>🛡️ Perdonar este mes</span><span style="background:rgba(255,255,255,0.2); padding:3px 8px; border-radius:4px; font-size:11px;">Pausar 30 días</span></button>`;

    const btnRen = esCongelado
        ? `<button disabled style="padding:12px; background:#d8b4fe; color:white; border:none; border-radius:8px; font-weight:bold;">🔄 Renovar Plazo (BLOQUEADO)</button>`
        : `<button onclick="renovarPlazoCreditoMovil(${idCredito}, '${etiquetaCRE}')" style="padding:12px; background:#8b5cf6; color:white; border:none; border-radius:8px; font-weight:bold; display:flex; justify-content:space-between; align-items:center;"><span>🔄 Renovar Plazo (Solo Interés)</span><span style="background:rgba(255,255,255,0.2); padding:3px 8px; border-radius:4px; font-size:11px;">Recalcular</span></button>`;

    const btnHist = `<button onclick="verHistorialMorasMovil(${idCredito}, '${nomEsc}')" style="margin-top:4px; padding:10px; background:#f8fafc; color:#334155; border:1px dashed #94a3b8; border-radius:8px; font-weight:bold; font-size:12px;">📜 Ver Historial de Moras y Perdones</button>`;

    const modalHTML = `
    <div id="${modalId}" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,23,42,0.85); display:flex; justify-content:center; align-items:center; z-index:9999; padding:12px; box-sizing:border-box;">
        <div style="background:white; border-radius:14px; width:100%; max-width:420px; max-height:92vh; overflow-y:auto; box-shadow:0 25px 50px rgba(0,0,0,0.5);">
            <div style="background:#0f172a; padding:16px; text-align:center;">
                <h3 style="margin:0; color:white; font-size:16px;">⚖️ Panel de Resolución de Cartera</h3>
                <p style="margin:6px 0 2px 0; color:#94a3b8; font-size:11px; font-weight:bold;">ID: ${idCredito} | ${refBancaria || 'REF: N/A'}</p>
                <p style="margin:0 0 4px 0; color:#eab308; font-weight:bold; font-size:15px;">${etiquetaCRE || 'CRE #'}</p>
                <p style="margin:0; color:#f8fafc; font-size:13px; text-transform:uppercase;">${nombreCliente}</p>
                ${esCongelado ? '<div style="margin-top:8px; display:inline-block; background:#e0f2fe; color:#0284c7; padding:3px 10px; border-radius:20px; font-size:10px; font-weight:bold;">🧊 CUENTA CONGELADA</div>' : ''}
            </div>
            <div style="padding:14px 16px; background:#f8fafc; border-bottom:1px solid #e2e8f0; font-size:13px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="color:#64748b; font-weight:bold;">Capital Protegido:</span><b>$${capitalNum.toFixed(2)}</b></div>
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;"><span style="color:#64748b; font-weight:bold;">Interés Original:</span><b>${interesPorcentaje}%</b></div>
                <div style="display:flex; justify-content:space-between; padding-top:10px; border-top:2px dashed #cbd5e1;"><span style="color:#ef4444; font-weight:bold;">Saldo Pendiente Actual:</span><b style="color:#ef4444; font-size:18px;">$${saldoNum.toFixed(2)}</b></div>
            </div>
            <div style="padding:14px 16px; display:flex; flex-direction:column; gap:10px;">
                ${btnAviso}${btnCap}${btnSal}${btnCong}${btnPerd}${btnRen}${btnHist}
            </div>
            <div style="padding:12px 16px; background:#f1f5f9; text-align:center;">
                <button onclick="document.getElementById('${modalId}').remove()" style="width:100%; padding:10px; background:white; color:#475569; border:1px solid #cbd5e1; border-radius:8px; font-weight:bold;">Cancelar y Cerrar</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

// =========================================================================
// 3. MOTORES DE RESOLUCIÓN INDIVIDUAL (SUPABASE + SMS)
// =========================================================================
window.notificarResolucionManualSMSMovil = async function(clienteObj, etiquetaCRE, tipoAccion, montoMulta, saldoActual, notaAcuerdo = "", creditoExtra = null) {
    if (!clienteObj || !clienteObj.whatsapp) return;
    try {
        const nombre = `${clienteObj.nombres} ${clienteObj.apellidos}`.toUpperCase();
        const refFinal = `${(clienteObj.nombres||'').trim().charAt(0)}${(clienteObj.apellidos||'').trim().charAt(0)}-${(clienteObj.cedula||'').trim().slice(-4)}`.toUpperCase();

        let creCifradoLimpio = "CRE # ?";
        if (etiquetaCRE) {
            const matchLetra = etiquetaCRE.match(/\[(.*?)\]/);
            creCifradoLimpio = (matchLetra && matchLetra[1]) ? `CRE #${matchLetra[1]}` : etiquetaCRE;
        }

        const ahora = new Date();
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        let h = ahora.getHours(); const m = String(ahora.getMinutes()).padStart(2, '0');
        const ampm = h >= 12 ? 'p.m.' : 'a.m.'; h = h % 12 || 12;
        const fechaHoraSMS = `${dias[ahora.getDay()]} ${String(ahora.getDate()).padStart(2, '0')}/${meses[ahora.getMonth()]}/${ahora.getFullYear()} | ${String(h).padStart(2, '0')}:${m} ${ampm}`;

        const encabezado = `=== SISTEMA ALPHA ===\n${fechaHoraSMS}\n\n🆔 Ref: ${refFinal} | ${creCifradoLimpio}\n👤 Cliente: ${nombre}\n\n`;
        const pie = `\n\nPor favor, comunícate con nosotros para cualquier duda.\n🚫 POR FAVOR, NO RESPONDER A ESTE MENSAJE.`;
        let msjSalida = "";

        if (tipoAccion === 'mora_capital') {
            msjSalida = `${encabezado}Hola, te notificamos que se ha aplicado un recargo por atraso en tu cuenta.\n\n⚠️ Motivo: Mora sobre Capital\n💰 Multa Aplicada: $${parseFloat(montoMulta).toFixed(2)}\n📉 Nuevo Saldo: $${parseFloat(saldoActual).toFixed(2)}${pie}`;
        } else if (tipoAccion === 'mora_saldo') {
            msjSalida = `${encabezado}Hola, te notificamos que se ha aplicado un recargo por atraso en tu cuenta.\n\n⚠️ Motivo: Mora sobre Saldo\n💰 Multa Aplicada: $${parseFloat(montoMulta).toFixed(2)}\n📉 Nuevo Saldo: $${parseFloat(saldoActual).toFixed(2)}${pie}`;
        } else if (tipoAccion === 'congelar') {
            const textoConvenio = notaAcuerdo && notaAcuerdo.trim() !== "" ? `\n🤝 Convenio de Pago: ${notaAcuerdo}` : "";
            msjSalida = `${encabezado}Hola, te informamos que tu crédito ha sido CONGELADO temporalmente.\n\n❄️ Motivo: Congelamiento Preventivo\n📉 Saldo Actual: $${parseFloat(saldoActual).toFixed(2)}${textoConvenio}\n\nTu cuenta ha sido pausada y blindada para no generar nuevos recargos automáticos.${pie}`;
        } else if (tipoAccion === 'perdonar') {
            msjSalida = `${encabezado}Hola, te traemos buenas noticias. Se ha aplicado una extensión a tu crédito.\n\n🛡️ Motivo: Perdón de Mora\n📉 Saldo Actual: $${parseFloat(saldoActual).toFixed(2)}\n\nTe hemos otorgado ${montoMulta || "30 días"} adicionales para regularizar tus pagos sin sufrir recargos.${pie}`;
        } else if (tipoAccion === 'descongelar') {
            const cap = creditoExtra?.monto_capital ? parseFloat(creditoExtra.monto_capital).toFixed(2) : "0.00";
            const cuota = creditoExtra?.valor_cuota ? parseFloat(creditoExtra.valor_cuota).toFixed(2) : "0.00";
            const freq = creditoExtra?.frecuencia_pago || "No definida";
            const tot = creditoExtra?.total_pagar ? parseFloat(creditoExtra.total_pagar).toFixed(2) : "0.00";
            const numC = creditoExtra?.num_cuotas || "0";
            msjSalida = `${encabezado}Hola, te informamos que tu crédito ha sido DESCONGELADO exitosamente y vuelve a estar ACTIVO en nuestro sistema.\n\n📉 Saldo Pendiente Actual: $${parseFloat(saldoActual).toFixed(2)}\n💰 Monto Original: $${cap}\n💵 Cuota: $${cuota}\n🔄 Modalidad: ${freq}\n📊 Total Contrato: $${tot}\n🔢 Cuotas: ${numC}\n\n⚡ Importante: Los recargos automáticos por mora han sido reactivados.${pie}`;
        }

        await enviarSMSMoraMovil(clienteObj.whatsapp.toString(), msjSalida);
    } catch (e) {
        alert("❌ Falló el SMS: " + e.message);
    }
};

async function ejecutarMoraManualMovil(tipo, idCredito, cantidadASumar, saldoActual, etiquetaCRE) {
    const titulo = tipo === 'capital' ? 'MORA SOBRE CAPITAL' : 'MORA SOBRE SALDO';
    if (!confirm(`🚨 ¿Está seguro de sumar $${parseFloat(cantidadASumar).toFixed(2)} por ${titulo}?`)) return;

    try {
        const supa = window.supabaseClient;
        const { data: credito, error: errBusq } = await supa.from('creditos').select('monto_mora, saldo_pendiente, fecha_emision, num_cuotas, frecuencia_pago, fecha_vencimiento_actual, clientes(nombres, apellidos, cedula, whatsapp)').eq('id', idCredito).single();
        if (errBusq) throw errBusq;

        const nuevaMora = (parseFloat(credito.monto_mora) || 0) + parseFloat(cantidadASumar);
        const nuevoSaldo = (parseFloat(saldoActual) || parseFloat(credito.saldo_pendiente)) + parseFloat(cantidadASumar);

        const numeroCuotas = parseInt(credito.num_cuotas) || 1;
        const frecuencia = (credito.frecuencia_pago || '').toLowerCase();
        let diasExtension = 1;

        if (frecuencia.includes('diario') || frecuencia.includes('diaria') || (frecuencia.includes('mensual') && numeroCuotas === 1)) {
            diasExtension = frecuencia.includes('mensual') ? 30 : numeroCuotas;
        } else {
            if (frecuencia.includes('semanal')) diasExtension = 7;
            else if (frecuencia.includes('quincenal')) diasExtension = 15;
            else if (frecuencia.includes('mensual')) diasExtension = 30;
        }

        const fechaBase = new Date(); fechaBase.setHours(0, 0, 0, 0);
        fechaBase.setDate(fechaBase.getDate() + diasExtension);
        const año = fechaBase.getFullYear(), mes = String(fechaBase.getMonth() + 1).padStart(2, '0'), dia = String(fechaBase.getDate()).padStart(2, '0');
        const nuevaFechaVencimiento = `${año}-${mes}-${dia}`;

        const { error } = await supa.from('creditos').update({
            saldo_pendiente: Number(nuevoSaldo.toFixed(2)),
            monto_mora: Number(nuevaMora.toFixed(2)),
            fecha_vencimiento_actual: nuevaFechaVencimiento
        }).eq('id', idCredito);
        if (error) throw error;

        await supa.from('historial_moras').insert({
            credito_id: idCredito,
            tipo_accion: tipo === 'capital' ? 'Mora s/ Capital' : 'Mora s/ Saldo',
            monto_castigo: Number(cantidadASumar.toFixed(2)),
            detalle: `Mora aplicada (Móvil). Nuevo ciclo extendido por ${diasExtension} días. Vence: ${dia}/${mes}/${año}.`
        });

        if (confirm(`💰 MORA APLICADA\n\n¿Deseas enviar la notificación por SMS al cliente?`)) {
            const accionSMS = tipo === 'capital' ? 'mora_capital' : 'mora_saldo';
            await window.notificarResolucionManualSMSMovil(credito.clientes, etiquetaCRE, accionSMS, cantidadASumar, nuevoSaldo);
            await window.notificarResolucionManualSMSMovil({ ...credito.clientes, whatsapp: "0939836191" }, etiquetaCRE, accionSMS, cantidadASumar, nuevoSaldo);
        }

        alert(`✅ Proceso completado. Renovado por ${diasExtension} días.`);
        document.getElementById('modal-sancion-alpha-movil')?.remove();
        refrescarVistasTrasMora();
    } catch (e) {
        alert("❌ Error al procesar: " + e.message);
    }
}

window.aplicarMoraSobreCapitalMovil = (id, cant, saldo, cre) => ejecutarMoraManualMovil('capital', id, cant, saldo, cre);
window.aplicarMoraSobreSaldoMovil = (id, cant, saldo, cre) => ejecutarMoraManualMovil('saldo', id, cant, saldo, cre);

window.perdonarMoraEsteMesMovil = async function(idCredito, etiquetaCRE) {
    if (!confirm("🛡️ ¿Desea PERDONAR LA MORA y extender la fecha sin multas?")) return;
    try {
        const supa = window.supabaseClient;
        const { data: credito, error: errBusq } = await supa.from('creditos').select('total_pagar, monto_mora, num_cuotas, frecuencia_pago, clientes(nombres, apellidos, cedula, whatsapp), historial_pagos(abono_total)').eq('id', idCredito).single();
        if (errBusq) throw errBusq;

        const totalAbonado = (credito.historial_pagos || []).reduce((s, p) => s + (parseFloat(p.abono_total) || 0), 0);
        const saldoReal = Math.max(0, (parseFloat(credito.total_pagar) || 0) + (parseFloat(credito.monto_mora) || 0) - totalAbonado);

        const numC = parseInt(credito.num_cuotas) || 1;
        const freq = (credito.frecuencia_pago || '').toLowerCase();
        let diasExt = numC, txt = `${numC} días`;
        if (freq.includes('mensual')) { diasExt = numC * 30; txt = numC === 1 ? "1 mes" : `${numC} meses`; }
        else if (freq.includes('quincenal')) { diasExt = numC * 15; txt = numC === 1 ? "1 quincena" : `${numC} quincenas`; }
        else if (freq.includes('semanal')) { diasExt = numC * 7; txt = numC === 1 ? "1 semana" : `${numC} semanas`; }

        const fBase = new Date(); fBase.setHours(0, 0, 0, 0); fBase.setDate(fBase.getDate() + diasExt);
        const año = fBase.getFullYear(), mes = String(fBase.getMonth() + 1).padStart(2, '0'), dia = String(fBase.getDate()).padStart(2, '0');

        const { error } = await supa.from('creditos').update({ fecha_vencimiento_actual: `${año}-${mes}-${dia}` }).eq('id', idCredito);
        if (error) throw error;

        await supa.from('historial_moras').insert({
            credito_id: idCredito,
            tipo_accion: 'Perdón de Mora (Social)',
            monto_castigo: 0,
            detalle: `Perdón manual (Móvil). Extendido por ${txt}. Vence: ${dia}/${mes}/${año}.`
        });

        if (confirm(`🛡️ PERDÓN APLICADO\n\n¿Deseas enviar SMS al cliente informándole su nuevo plazo?`)) {
            await window.notificarResolucionManualSMSMovil(credito.clientes, etiquetaCRE, 'perdonar', txt, saldoReal);
            await window.notificarResolucionManualSMSMovil({ ...credito.clientes, whatsapp: "0939836191" }, etiquetaCRE, 'perdonar', txt, saldoReal);
        }

        alert(`✅ Cliente perdonado. Plazo extendido por ${txt}.`);
        document.getElementById('modal-sancion-alpha-movil')?.remove();
        refrescarVistasTrasMora();
    } catch (e) {
        alert("❌ Error al perdonar: " + e.message);
    }
};

window.renovarPlazoCreditoMovil = async function(idCredito, etiquetaCRE) {
    if (!confirm("🔄 RENOVACIÓN DE PLAZO\n\nGenerará el nuevo interés sobre el saldo restante y extenderá el vencimiento.\n\n¿Proceder?")) return;
    try {
        const supa = window.supabaseClient;
        const { data: credito, error: errBusq } = await supa.from('creditos').select('monto_mora, total_pagar, tasa_interes, num_cuotas, frecuencia_pago, valor_cuota, clientes(nombres, apellidos, cedula, whatsapp), historial_pagos(abono_total)').eq('id', idCredito).single();
        if (errBusq) throw errBusq;

        const totalAbonado = (credito.historial_pagos || []).reduce((s, p) => s + (parseFloat(p.abono_total) || 0), 0);
        const saldoReal = (parseFloat(credito.total_pagar) || 0) + (parseFloat(credito.monto_mora) || 0) - totalAbonado;
        if (saldoReal <= 0) { alert("✅ El crédito ya está liquidado."); return; }

        const tasa = parseFloat(credito.tasa_interes) || 20;
        const nuevoInteres = saldoReal * (tasa / 100);
        const nuevoSaldo = saldoReal + nuevoInteres;
        const numC = parseInt(credito.num_cuotas) || 1;
        const freq = (credito.frecuencia_pago || '').toLowerCase();

        let diasExt = numC, txt = `${numC} días`;
        if (freq.includes('mensual')) { diasExt = numC * 30; txt = numC === 1 ? "1 mes" : `${numC} meses`; }
        else if (freq.includes('quincenal')) { diasExt = numC * 15; txt = numC === 1 ? "1 quincena" : `${numC} quincenas`; }
        else if (freq.includes('semanal')) { diasExt = numC * 7; txt = numC === 1 ? "1 semana" : `${numC} semanas`; }

        const fBase = new Date(); fBase.setHours(0, 0, 0, 0); fBase.setDate(fBase.getDate() + diasExt);
        const año = fBase.getFullYear(), mes = String(fBase.getMonth() + 1).padStart(2, '0'), dia = String(fBase.getDate()).padStart(2, '0');

        const { error } = await supa.from('creditos').update({
            total_pagar: Number((totalAbonado + nuevoSaldo).toFixed(2)),
            saldo_pendiente: Number(nuevoSaldo.toFixed(2)),
            monto_mora: 0,
            valor_cuota: Number((parseFloat(credito.valor_cuota) || 0).toFixed(2)),
            fecha_vencimiento_actual: `${año}-${mes}-${dia}`
        }).eq('id', idCredito);
        if (error) throw error;

        await supa.from('historial_moras').insert({
            credito_id: idCredito,
            tipo_accion: 'Refinanciamiento de Plazo',
            monto_castigo: Number(nuevoInteres.toFixed(2)),
            detalle: `Renovación (Móvil) sobre $${saldoReal.toFixed(2)}. Interés: $${nuevoInteres.toFixed(2)}. Vence: ${dia}/${mes}/${año}.`
        });

        if (confirm(`✅ REFINANCIADO\n\nNuevo Saldo: $${nuevoSaldo.toFixed(2)}\nVence: ${dia}/${mes}/${año}\n\n¿Enviar SMS al cliente?`)) {
            await window.notificarResolucionManualSMSMovil(credito.clientes, etiquetaCRE, 'mora_saldo', nuevoInteres, nuevoSaldo);
            await window.notificarResolucionManualSMSMovil({ ...credito.clientes, whatsapp: "0939836191" }, etiquetaCRE, 'mora_saldo', nuevoInteres, nuevoSaldo);
        }

        alert("✅ Refinanciamiento completado.");
        document.getElementById('modal-sancion-alpha-movil')?.remove();
        refrescarVistasTrasMora();
    } catch (e) {
        alert("❌ Error al renovar: " + e.message);
    }
};

window.alternarCongelamientoMovil = async function(idCredito, nuevoEstado, etiquetaCRE, saldoAmarilloReal) {
    const msg = nuevoEstado === 'congelado'
        ? "¿Está seguro de CONGELAR esta cuenta? Se detendrán los recargos automáticos."
        : "¿Está seguro de DESCONGELAR esta cuenta? Volverá a estar activa.";
    if (!confirm(msg)) return;

    let notaAcuerdo = '', nuevaFechaVencimiento = undefined;

    if (nuevoEstado === 'congelado') {
        const res = await new Promise((resolve) => {
            const div = document.createElement('div');
            div.innerHTML = `
            <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.75); z-index:99999; display:flex; justify-content:center; align-items:center; padding:15px; box-sizing:border-box;">
                <div style="background:white; padding:22px; border-radius:14px; width:100%; max-width:380px;">
                    <h3 style="margin-top:0; color:#1e293b; font-size:17px;">🧊 CONVENIO DE PAGO</h3>
                    <p style="color:#64748b; font-size:12px; margin-bottom:15px;">Ingrese el monto y frecuencia para calcular la próxima fecha automáticamente.</p>
                    <label style="display:block; font-weight:bold; font-size:12px; margin-bottom:5px;">Monto a Cobrar ($) (Opcional):</label>
                    <input type="number" id="input-acuerdo-monto-movil" placeholder="Ej: 25" style="width:100%; padding:12px; border:2px solid #0284c7; border-radius:8px; box-sizing:border-box; margin-bottom:14px; font-size:16px; font-weight:bold;">
                    <label style="display:block; font-weight:bold; font-size:12px; margin-bottom:5px;">Frecuencia del Convenio:</label>
                    <select id="select-acuerdo-frec-movil" style="width:100%; padding:12px; border:1px solid #cbd5e1; border-radius:8px; margin-bottom:20px; font-size:14px; font-weight:bold;">
                        <option value="mensual">📊 Mensual (+30 días)</option>
                        <option value="quincenal">🌓 Quincenal (+15 días)</option>
                        <option value="semanal">🗓️ Semanal (+7 días)</option>
                        <option value="diario">📆 Diario (+1 día)</option>
                    </select>
                    <div style="display:flex; gap:10px;">
                        <button id="btn-ok-ac-movil" style="flex:1; background:#0284c7; color:white; border:none; padding:12px; border-radius:8px; font-weight:bold;">Aceptar</button>
                        <button id="btn-no-ac-movil" style="flex:1; background:#ef4444; color:white; border:none; padding:12px; border-radius:8px; font-weight:bold;">Cancelar</button>
                    </div>
                </div>
            </div>`;
            document.body.appendChild(div);
            document.getElementById('btn-ok-ac-movil').onclick = () => {
                const monto = document.getElementById('input-acuerdo-monto-movil').value;
                const frec = document.getElementById('select-acuerdo-frec-movil').value;
                div.remove(); resolve({ cancelado: false, monto, frec });
            };
            document.getElementById('btn-no-ac-movil').onclick = () => { div.remove(); resolve({ cancelado: true }); };
        });

        if (res.cancelado) return;
        if (res.monto) {
            notaAcuerdo = `${res.monto} ${res.frec}`;
            let dias = res.frec === 'quincenal' ? 15 : res.frec === 'semanal' ? 7 : res.frec === 'diario' ? 1 : 30;
            const fBase = new Date(); fBase.setHours(0, 0, 0, 0); fBase.setDate(fBase.getDate() + dias);
            nuevaFechaVencimiento = `${fBase.getFullYear()}-${String(fBase.getMonth() + 1).padStart(2, '0')}-${String(fBase.getDate()).padStart(2, '0')}`;
        } else {
            notaAcuerdo = ""; nuevaFechaVencimiento = null;
        }
    }

    try {
        const supa = window.supabaseClient;
        const { data: credito, error: errBusq } = await supa.from('creditos').select('monto_capital, valor_cuota, frecuencia_pago, total_pagar, num_cuotas, clientes(nombres, apellidos, cedula, whatsapp)').eq('id', idCredito).single();
        if (errBusq) throw errBusq;

        const datosGuardar = { estado: nuevoEstado, acuerdo_pago: notaAcuerdo };
        if (nuevoEstado === 'congelado' && nuevaFechaVencimiento !== undefined) {
            datosGuardar.fecha_vencimiento_actual = nuevaFechaVencimiento;
        } else if (nuevoEstado === 'activo') {
            datosGuardar.acuerdo_pago = "";
            const hoy = new Date();
            datosGuardar.fecha_vencimiento_actual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
        }

        const { error } = await supa.from('creditos').update(datosGuardar).eq('id', idCredito);
        if (error) throw error;

        const accion = nuevoEstado === 'congelado' ? 'congelar' : 'descongelar';
        if (confirm(`¿Deseas enviar SMS al cliente notificando que su cuenta fue ${nuevoEstado === 'congelado' ? 'CONGELADA' : 'DESCONGELADA'}?`)) {
            await window.notificarResolucionManualSMSMovil(credito.clientes, etiquetaCRE, accion, 0, saldoAmarilloReal, notaAcuerdo, nuevoEstado === 'activo' ? credito : null);
            await window.notificarResolucionManualSMSMovil({ ...credito.clientes, whatsapp: "0939836191" }, etiquetaCRE, accion, 0, saldoAmarilloReal, notaAcuerdo, nuevoEstado === 'activo' ? credito : null);
        }

        alert(nuevoEstado === 'congelado' ? "🧊 Cuenta CONGELADA exitosamente." : "🔥 Cuenta DESCONGELADA.");
        document.getElementById('modal-sancion-alpha-movil')?.remove();
        refrescarVistasTrasMora();
    } catch (e) {
        alert("❌ Error al cambiar estado: " + e.message);
    }
};

window.verHistorialMorasMovil = async function(idCredito, nombreCliente) {
    try {
        const supa = window.supabaseClient;
        const { data: historial, error } = await supa.from('historial_moras').select('*').eq('credito_id', idCredito).order('fecha_registro', { ascending: false });
        if (error) throw error;

        const cuerpo = (!historial || historial.length === 0)
            ? `<div style="text-align:center; padding:20px; color:#10b981; font-weight:bold;">✅ Sin moras registradas.</div>`
            : historial.map(h => {
                const fecha = new Date(h.fecha_registro).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
                return `<div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #e2e8f0; font-size:12px;">
                    <div><b style="color:#0f172a; display:block;">${h.tipo_accion}</b><span style="color:#64748b; font-size:11px;">${fecha}</span></div>
                    <b style="color:#ef4444;">$${parseFloat(h.monto_castigo).toFixed(2)}</b>
                </div>`;
            }).join('');

        const idM = 'modal-visor-moras-movil';
        document.getElementById(idM)?.remove();
        document.body.insertAdjacentHTML('beforeend', `
        <div id="${idM}" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,23,42,0.85); display:flex; justify-content:center; align-items:center; z-index:10000; padding:15px; box-sizing:border-box;">
            <div style="background:white; border-radius:12px; width:100%; max-width:420px; overflow:hidden;">
                <div style="background:#1e293b; padding:14px 16px; display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; color:white; font-size:15px;">📜 Historial de Castigos</h3>
                    <button onclick="document.getElementById('${idM}').remove()" style="background:none; border:none; color:#94a3b8; font-size:22px;">&times;</button>
                </div>
                <div style="padding:12px 16px; background:#f8fafc; border-bottom:1px solid #e2e8f0; font-size:13px;"><b>${nombreCliente}</b></div>
                <div style="max-height:300px; overflow-y:auto; padding:8px 16px;">${cuerpo}</div>
                <div style="padding:12px 16px; background:#f1f5f9; text-align:center;">
                    <button onclick="document.getElementById('${idM}').remove()" style="width:100%; padding:10px; background:white; border:1px solid #cbd5e1; border-radius:8px; font-weight:bold;">Cerrar</button>
                </div>
            </div>
        </div>`);
    } catch (e) {
        alert("❌ Error al cargar historial.");
    }
};

window.enviarAvisoGraciaSMSMovil = async function(idCredito, nombreCliente, saldoActual, etiquetaCRE, refBancaria) {
    if (!confirm(`📲 ¿Enviar Aviso de Periodo de Gracia por SMS a ${nombreCliente}?`)) return;
    try {
        const supa = window.supabaseClient;
        const { data: credito, error } = await supa.from('creditos').select('fecha_vencimiento_actual, fecha_emision, frecuencia_pago, num_cuotas, clientes(whatsapp)').eq('id', idCredito).single();
        if (error) throw error;

        const whatsapp = credito.clientes?.whatsapp;
        if (!whatsapp) { alert("❌ Este cliente no tiene número registrado."); return; }

        const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        let fLim = credito.fecha_vencimiento_actual ? new Date(credito.fecha_vencimiento_actual) : new Date(credito.fecha_emision);
        fLim.setHours(0, 0, 0, 0);
        const diasVenc = Math.max(1, Math.round((hoy.getTime() - fLim.getTime()) / (1000 * 60 * 60 * 24)));

        const fEmi = new Date(credito.fecha_emision);
        let fEmiTxt = fEmi.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        fEmiTxt = fEmiTxt.charAt(0).toUpperCase() + fEmiTxt.slice(1);

        const ahora = new Date();
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        let h = ahora.getHours(); const m = String(ahora.getMinutes()).padStart(2, '0');
        const ampm = h >= 12 ? 'p. m.' : 'a. m.'; h = h % 12 || 12;
        const fechaHoraSMS = `${dias[ahora.getDay()]} ${String(ahora.getDate()).padStart(2, '0')}/${meses[ahora.getMonth()]}/${String(ahora.getFullYear()).slice(-2)} | ${String(h).padStart(2, '0')}:${m} ${ampm}`;

        const refLimpia = (refBancaria || '').replace(/^REF:\s*/i, '').split('|')[0].trim();
        const matchCod = (etiquetaCRE || '').match(/\[(.*?)\]/);
        const cifradoFinal = (matchCod && matchCod[1]) ? ` | CRE #${matchCod[1]}` : "";

        const msj = `=== SISTEMA ALPHA (Aviso) ===\n${fechaHoraSMS}\n\n🆔 Ref: ${refLimpia}${cifradoFinal}\n👤 Cliente: ${nombreCliente}\n\nHola, este es un recordatorio automático. Le informamos que su crédito por el saldo de $${saldoActual}, emitido el pasado ${fEmiTxt}, ha superado su fecha límite de pago hace ${diasVenc} días.\n\n🛡️ Estado actual: PERIODO DE GRACIA.\n\nPara evitar que el sistema le aplique multas y recargos financieros, le invitamos a regularizar su cuenta. ¡Agradecemos su puntualidad!\n\n🚫 NO RESPONDER A ESTE MENSAJE AUTOMÁTICO.`;

        await enviarSMSMoraMovil(whatsapp.toString(), msj);
        await enviarSMSMoraMovil("0939836191", msj);
        alert(`✅ Aviso enviado a ${nombreCliente} (${diasVenc} días de atraso).`);
        document.getElementById('modal-sancion-alpha-movil')?.remove();
    } catch (e) {
        alert("❌ Error al enviar aviso: " + e.message);
    }
};
// =========================================================================
// 💳 MÓDULO MAESTRO DE CRÉDITOS (CLON MÓVIL EXACTO DE PC)
// Archivo: modulos_movil/creditos_movil.js
// =========================================================================

window.paginaActualCreditosMovil = 1;
window.itemsPorPaginaCreditosMovil = 3;
window.filtroTextoCreditoMovil = "";
window.clientesCreditoCacheMovil = [];
window.relojCreditoMovilInterval = null;

async function enviarSMSCreditoMovil(numero, mensaje) {
    if (typeof invocarSMSDesdeMovil === 'function') {
        return await invocarSMSDesdeMovil(numero, mensaje);
    }
    try {
        const numLimpio = String(numero).replace(/\D/g, '');
        const url = `https://trigger.macrodroid.com/554f217c-000a-4581-896c-551d96459fb2/sms_credito?numero=${numLimpio}&mensaje=${encodeURIComponent(mensaje)}`;
        await fetch(url, { method: 'GET', mode: 'no-cors' });
        return true;
    } catch (e) {
        console.error("Error SMS Crédito Móvil:", e);
        return false;
    }
}

// 1. RELOJ EN VIVO
window.iniciarRelojCreditoMovil = function() {
    if (window.relojCreditoMovilInterval) clearInterval(window.relojCreditoMovilInterval);
    const actualizar = () => {
        const el = document.getElementById('cred-fecha-servidor-movil');
        if (!el) return;
        const ahora = new Date();
        const fecha = ahora.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const hora = ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        el.innerText = `${fecha.charAt(0).toUpperCase() + fecha.slice(1)}, ${hora}`;
    };
    actualizar();
    window.relojCreditoMovilInterval = setInterval(actualizar, 1000);
};

// 2. CÁLCULO DE PROYECCIÓN EN TIEMPO REAL
window.calcularProyeccionCreditoMovil = function() {
    const inputMonto = document.getElementById('cred-monto-movil');
    const inputTasa = document.getElementById('cred-tasa-interes-movil');
    const inputCuotas = document.getElementById('cred-cuotas-movil');
    if (!inputMonto || !inputTasa || !inputCuotas) return;

    // Limpiar letras del monto
    let valLimpio = inputMonto.value.replace(/[^0-9.]/g, '');
    const pts = valLimpio.split('.');
    if (pts.length > 2) valLimpio = pts[0] + '.' + pts.slice(1).join('');
    if (inputMonto.value !== valLimpio) inputMonto.value = valLimpio;

    const monto = parseFloat(valLimpio) || 0;
    const tasa = parseFloat(inputTasa.value) || 0;
    const cuotas = parseInt(inputCuotas.value) || 1;

    const totalInteres = monto * (tasa / 100);
    const totalPagar = monto + totalInteres;
    const valorCuota = cuotas > 0 ? (totalPagar / cuotas) : 0;

    document.getElementById('lbl-cuota-valor-movil').innerText = `$${valorCuota.toFixed(2)}`;
    document.getElementById('lbl-interes-total-movil').innerText = `$${totalInteres.toFixed(2)}`;
    document.getElementById('lbl-pagar-total-movil').innerText = `$${totalPagar.toFixed(2)}`;
};

// 3. CARGAR CLIENTES Y BUSCADOR EN VIVO
window.cargarClientesDropdownMovil = async function() {
    const selectCliente = document.getElementById('cred-cliente-id-movil');
    if (!selectCliente) return;
    selectCliente.innerHTML = '<option value="">⏳ Cargando clientes...</option>';

    try {
        const { data: clientes, error } = await window.supabaseClient
            .from('clientes')
            .select('id, nombres, apellidos')
            .order('nombres', { ascending: true });
        if (error) throw error;

        window.clientesCreditoCacheMovil = clientes || [];
        window.renderizarOpcionesClientesCreditoMovil(window.clientesCreditoCacheMovil);
    } catch (e) {
        selectCliente.innerHTML = '<option value="">⚠️ Error al cargar clientes</option>';
    }
};

window.renderizarOpcionesClientesCreditoMovil = function(lista) {
    const selectCliente = document.getElementById('cred-cliente-id-movil');
    if (!selectCliente) return;
    selectCliente.innerHTML = '<option value="">-- Seleccione un cliente activo --</option>';
    lista.forEach(cli => {
        const opt = document.createElement('option');
        opt.value = cli.id;
        opt.textContent = `🆔 ${cli.id} - ${cli.nombres} ${cli.apellidos}`.toUpperCase();
        selectCliente.appendChild(opt);
    });
};

window.filtrarClientesCreditoMovil = function(texto) {
    const termino = (texto || '').toLowerCase().trim();
    if (!termino) {
        window.renderizarOpcionesClientesCreditoMovil(window.clientesCreditoCacheMovil);
        return;
    }
    const filtrados = window.clientesCreditoCacheMovil.filter(c =>
        `${c.id} ${c.nombres} ${c.apellidos}`.toLowerCase().includes(termino)
    );
    window.renderizarOpcionesClientesCreditoMovil(filtrados);
};

// 4. CARGAR SALDOS DE CAJAS EN VIVO
window.cargarSaldosEnSelectorCreditoMovil = async function() {
    const combo = document.getElementById('cred-forma-entrega-movil');
    if (!combo) return;
    const prev = combo.value;
    combo.innerHTML = '<option value="">⏳ Cargando cajas...</option>';

    try {
        const { data: cajas, error } = await window.supabaseClient
            .from('cajas_capital')
            .select('id, nombre_caja, saldo_actual')
            .order('id', { ascending: true });
        if (error) throw error;

        combo.innerHTML = '<option value="">-- Seleccione forma de entrega --</option>';
        (cajas || []).forEach(c => {
            combo.insertAdjacentHTML('beforeend', `<option value="${c.id}">${c.nombre_caja} ($${parseFloat(c.saldo_actual).toFixed(2)})</option>`);
        });
        if (prev) combo.value = prev;
    } catch (e) {
        combo.innerHTML = '<option value="">⚠️ Error al cargar cajas</option>';
    }
};

// 5. GUARDAR NUEVO CRÉDITO (LÓGICA EXACTA DE PC)
window.guardarNuevoCreditoMovil = async function() {
    const supa = window.supabaseClient;
    const selectorCliente = document.getElementById('cred-cliente-id-movil');
    const clienteId = selectorCliente.value;
    const monto = parseFloat(document.getElementById('cred-monto-movil').value);
    const tasa = parseFloat(document.getElementById('cred-tasa-interes-movil').value);
    const cuotas = parseInt(document.getElementById('cred-cuotas-movil').value);
    const comboEntrega = document.getElementById('cred-forma-entrega-movil');
    const cajaId = comboEntrega.value;
    const comboModalidad = document.getElementById('cred-modalidad-movil');
    const modalidadTextoOrig = comboModalidad.options[comboModalidad.selectedIndex].text;
    const modalidadText = modalidadTextoOrig.toUpperCase();

    if (!clienteId || !monto || isNaN(monto) || !cuotas || !cajaId) {
        alert("⚠️ Por favor, complete todos los campos obligatorios antes de aprobar.");
        return;
    }
    if (monto <= 0) {
        alert("⚠️ El monto del crédito debe ser mayor a cero.");
        return;
    }

    const totalInteres = parseFloat(((monto * tasa) / 100).toFixed(2));
    const totalPagar = parseFloat((monto + totalInteres).toFixed(2));
    const valorCuota = parseFloat((totalPagar / cuotas).toFixed(2));

    // Fecha de vencimiento inicial (Radar)
    let fechaVencimientoCalculada = null;
    if (!modalidadText.includes('DIARIO')) {
        const fNac = new Date();
        if (modalidadText.includes('SEMANAL')) fNac.setDate(fNac.getDate() + 7);
        else if (modalidadText.includes('QUINCENAL')) fNac.setDate(fNac.getDate() + 15);
        else if (modalidadText.includes('MENSUAL')) fNac.setMonth(fNac.getMonth() + 1);
        fechaVencimientoCalculada = fNac.toISOString().split('T')[0];
    }

    try {
        // Verificar saldo de caja
        const { data: caja, error: errCaja } = await supa.from('cajas_capital').select('saldo_actual, nombre_caja').eq('id', parseInt(cajaId)).single();
        if (errCaja) throw errCaja;
        if (monto > parseFloat(caja.saldo_actual)) {
            alert(`❌ Fondos insuficientes en [${caja.nombre_caja}].\nDisponible: $${parseFloat(caja.saldo_actual).toFixed(2)}`);
            return;
        }

        // Verificar límite de créditos del cliente
        const { data: infoCliente, error: errCli } = await supa.from('clientes').select('nivel, limite_creditos, whatsapp, nombres, apellidos, cedula').eq('id', parseInt(clienteId)).single();
        if (errCli) throw errCli;

        const { data: creditosCliente, error: errCont } = await supa.from('creditos').select('id, estado').eq('cliente_id', parseInt(clienteId));
        if (errCont) throw errCont;

        const activos = creditosCliente.filter(c => c.estado === 'activo');
        const limiteMax = parseInt(infoCliente.limite_creditos) || 2;
        if (activos.length >= limiteMax) {
            alert(`❌ Límite de créditos alcanzado.\nNivel: ${infoCliente.nivel || 'Sin Nivel'}\nActivos: ${activos.length} / Máx: ${limiteMax}`);
            return;
        }

        const numeroCredito = creditosCliente.length + 1;

        // Insertar crédito
        const { data: resCred, error: errIns } = await supa.from('creditos').insert([{
            cliente_id: parseInt(clienteId),
            caja_id: parseInt(cajaId),
            monto_capital: monto,
            tasa_interes: tasa,
            total_interes: totalInteres,
            total_pagar: totalPagar,
            saldo_pendiente: totalPagar,
            num_cuotas: cuotas,
            valor_cuota: valorCuota,
            estado: 'activo',
            usuario_registro: 'Administrador (Móvil)',
            frecuencia_pago: modalidadTextoOrig,
            forma_entrega: comboEntrega.options[comboEntrega.selectedIndex].text,
            fecha_vencimiento_actual: fechaVencimientoCalculada
        }]).select();
        if (errIns) throw errIns;

        const nuevoCreditoId = resCred && resCred.length > 0 ? resCred[0].id : null;

        // Descontar de caja
        const nuevoSaldoCaja = parseFloat(caja.saldo_actual) - monto;
        const { error: errUpd } = await supa.from('cajas_capital').update({ saldo_actual: nuevoSaldoCaja }).eq('id', parseInt(cajaId));
        if (errUpd) throw errUpd;

        const codBancario = `${infoCliente.nombres.charAt(0).toUpperCase()}${infoCliente.apellidos.charAt(0).toUpperCase()}-${infoCliente.cedula.slice(-4)}`;
        const codCifrado = typeof cifrarNumeroCreditoMovil === 'function' ? cifrarNumeroCreditoMovil(numeroCredito).toUpperCase() : '?';
        const codigoOficial = `${codBancario} | CRE #${numeroCredito} [${codCifrado}]`;
        const codigoSMS = `${codBancario} | CRE #${codCifrado}`;
        const nombreCompleto = `${infoCliente.nombres.toUpperCase()} ${infoCliente.apellidos.toUpperCase()}`;

        // Registrar auditoría en historial_capital
        await supa.from('historial_capital').insert([{
            caja_id: parseInt(cajaId),
            credito_id: nuevoCreditoId,
            monto: -monto,
            concepto: `DESEMBOLSO: ${codigoOficial} - ${nombreCompleto}`
        }]);

        alert(`🚀 ¡${codigoOficial} aprobado, registrado y descontado con éxito!`);

        // Envío de SMS Voucher
        if (infoCliente.whatsapp) {
            const modalidadNombre = modalidadTextoOrig.replace(/.*Cobro\s+/i, "").replace(/📅/g, "").trim();
            const ahora = new Date();
            const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            let h = ahora.getHours(); const m = String(ahora.getMinutes()).padStart(2, '0');
            const ampm = h >= 12 ? 'p.m.' : 'a.m.'; h = h % 12 || 12;
            const fechaHoraSMS = `${dias[ahora.getDay()]} ${String(ahora.getDate()).padStart(2, '0')}/${meses[ahora.getMonth()]}/${ahora.getFullYear()} | ${String(h).padStart(2, '0')}:${m} ${ampm}`;

            const msjVoucher = `=== SISTEMA ALPHA ===\n${fechaHoraSMS}\n\n🆔 Ref: ${codigoSMS}\n👤 Cliente: ${nombreCompleto}\n\n💰 Monto: $${monto.toFixed(2)}\n💵 Cuota: $${valorCuota.toFixed(2)}\n🔄 Modalidad: ${modalidadNombre}\n📊 Total: $${totalPagar.toFixed(2)}\n🔢 Cuotas: ${cuotas}\n\nConserva este msj. ¡Gracias!\n🚫 POR FAVOR, NO RESPONDER A ESTE MENSAJE.`;

            await enviarSMSCreditoMovil(infoCliente.whatsapp, msjVoucher);
            await new Promise(r => setTimeout(r, 2000));
            const numGerente = "0939836191";
            if (infoCliente.whatsapp.trim() !== numGerente) {
                await enviarSMSCreditoMovil(numGerente, `[COPIA NUEVO CRÉDITO]\n\n${msjVoucher}`);
            }
        }

        // Limpiar formulario y recargar
        document.getElementById('cred-cliente-buscar-movil').value = '';
        window.renderizarOpcionesClientesCreditoMovil(window.clientesCreditoCacheMovil);
        document.getElementById('cred-cliente-id-movil').value = '';
        document.getElementById('cred-monto-movil').value = '';
        document.getElementById('cred-cuotas-movil').value = '30';
        document.getElementById('cred-forma-entrega-movil').value = '';
        window.calcularProyeccionCreditoMovil();
        await window.cargarSaldosEnSelectorCreditoMovil();
        await window.cargarHistorialCreditosMovil();

    } catch (e) {
        console.error(e);
        alert("❌ Error al registrar crédito: " + e.message);
    }
};

// 6. HISTORIAL DE CRÉDITOS PAGINADO + BUSCADOR
window.buscarCreditoEnVivoMovil = function() {
    const inp = document.getElementById('buscador-creditos-movil');
    if (inp) {
        window.filtroTextoCreditoMovil = inp.value.trim();
        window.paginaActualCreditosMovil = 1;
        window.cargarHistorialCreditosMovil();
    }
};

window.cambiarPaginaCreditosMovil = function(nuevaPag) {
    window.paginaActualCreditosMovil = nuevaPag;
    window.cargarHistorialCreditosMovil();
};

window.cargarHistorialCreditosMovil = async function() {
    const contenedor = document.getElementById('lista-creditos-movil');
    if (!contenedor) return;
    contenedor.innerHTML = '<div style="text-align:center; padding:15px; color:#94a3b8; font-size:12px;">⏳ Cargando créditos...</div>';

    const supa = window.supabaseClient;
    const desde = (window.paginaActualCreditosMovil - 1) * window.itemsPorPaginaCreditosMovil;
    const hasta = desde + window.itemsPorPaginaCreditosMovil - 1;

    let consulta = supa
        .from('creditos')
        .select(`id, cliente_id, monto_capital, total_pagar, monto_mora, tasa_interes, fecha_emision, frecuencia_pago, valor_cuota, forma_entrega, num_cuotas, estado, clientes!inner(nombres, apellidos, cedula, estado)`, { count: 'exact' })
        .eq('clientes.estado', 'activo')
        .in('estado', ['activo', 'congelado']);

    if (window.filtroTextoCreditoMovil !== "") {
        consulta = consulta.or(
            `nombres.ilike.%${window.filtroTextoCreditoMovil}%,apellidos.ilike.%${window.filtroTextoCreditoMovil}%,cedula.ilike.%${window.filtroTextoCreditoMovil}%`,
            { foreignTable: 'clientes' }
        );
    }

    const { data, error, count } = await consulta.order('id', { ascending: false }).range(desde, hasta);
    if (error) { contenedor.innerHTML = '<div style="color:#ef4444; text-align:center;">❌ Error al cargar.</div>'; return; }

    if (!data || data.length === 0) {
        contenedor.innerHTML = `<div style="text-align:center; color:#94a3b8; padding:15px; font-size:12px;">No hay créditos registrados.</div>`;
        return;
    }

    const idsVisibles = data.map(c => c.id);
    const pagosPorCred = {};
    const { data: histPagos } = await supa.from('historial_pagos').select('id_credito, abono_total').in('id_credito', idsVisibles);
    (histPagos || []).forEach(p => {
        pagosPorCred[p.id_credito] = (pagosPorCred[p.id_credito] || 0) + parseFloat(p.abono_total || 0);
    });

    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

    const procesados = await Promise.all(data.map(async c => {
        const { data: todos } = await supa.from('creditos').select('id').eq('cliente_id', c.cliente_id).order('id', { ascending: true });
        const numCre = todos ? (todos.findIndex(tc => tc.id === c.id) + 1) : 1;
        const codCif = typeof cifrarNumeroCreditoMovil === 'function' ? cifrarNumeroCreditoMovil(numCre).toUpperCase() : '?';
        const codBanc = `${(c.clientes?.nombres||'X').charAt(0).toUpperCase()}${(c.clientes?.apellidos||'X').charAt(0).toUpperCase()}-${(c.clientes?.cedula||'0000').slice(-4)}`;
        c.codigoOficial = `${codBanc} | CRE #${numCre} [${codCif}]`;
        c.totalAbonado = pagosPorCred[c.id] || 0;
        return c;
    }));

    const ahoraMs = new Date().getTime();
    const htmlCards = procesados.map(c => {
        const fObj = new Date(c.fecha_emision);
        const esEditable = (ahoraMs - fObj.getTime()) < 86400000;
        let h = fObj.getHours(); const m = String(fObj.getMinutes()).padStart(2, '0');
        const ampm = h >= 12 ? 'p. m.' : 'a. m.'; h = h % 12 || 12;
        const fechaTxt = `${dias[fObj.getDay()]}, ${String(fObj.getDate()).padStart(2, '0')}/${meses[fObj.getMonth()]}/${fObj.getFullYear()} | ${String(h).padStart(2, '0')}:${m} ${ampm}`;
        const nombre = `${c.clientes.nombres} ${c.clientes.apellidos}`.toUpperCase();
        const moraExtra = parseFloat(c.monto_mora) || 0;
        const deudaTotal = (parseFloat(c.total_pagar) - c.totalAbonado) + moraExtra;
        const esCong = c.estado === 'congelado';

        return `
        <div style="background:white; border:1px solid #e2e8f0; border-left:5px solid ${esCong ? '#0284c7' : '#10b981'}; border-radius:10px; padding:12px; margin-bottom:10px; box-shadow:0 2px 4px rgba(0,0,0,0.03);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:6px; margin-bottom:6px;">
                <div>
                    <div style="font-weight:900; font-size:13px; color:#1e293b;">${nombre} ${esCong ? '<span style="background:#e0f2fe; color:#0284c7; padding:2px 5px; border-radius:4px; font-size:9px;">🧊 CONG.</span>' : ''}</div>
                    <span style="display:inline-block; margin-top:3px; color:#0284c7; background:#e0f2fe; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold;">🆔 ID:${c.id} | ${c.codigoOficial}</span>
                </div>
                <div style="display:flex; gap:10px; font-size:16px;">
                    <button onclick="reenviarVoucherMovil(${c.id})" style="border:none; background:none; padding:0; cursor:pointer;" title="Reenviar">📩</button>
                    ${esEditable ? `
                        <button onclick="editarCreditoMovil(${c.id}, ${c.monto_capital})" style="border:none; background:none; padding:0; cursor:pointer;" title="Editar">✏️</button>
                        <button onclick="anularCreditoMovil(${c.id}, ${c.monto_capital})" style="border:none; background:none; padding:0; cursor:pointer;" title="Anular">🚫</button>
                    ` : ''}
                </div>
            </div>
            <div style="font-size:10px; color:#64748b; margin-bottom:8px;">📅 ${fechaTxt}</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; background:#f8fafc; padding:8px; border-radius:6px; font-size:11px; margin-bottom:8px;">
                <div>Capital: <b>$${parseFloat(c.monto_capital).toFixed(2)}</b></div>
                <div>Interés: <b>${c.tasa_interes || 0}%</b></div>
                <div>Cuota: <b>$${parseFloat(c.valor_cuota || 0).toFixed(2)}</b></div>
                <div style="color:#0284c7;">Total: <b>$${parseFloat(c.total_pagar).toFixed(2)}</b></div>
                ${moraExtra > 0 ? `<div style="grid-column:span 2; color:#b91c1c; font-weight:bold;">🚨 Mora: $${moraExtra.toFixed(2)} | Deuda: $${deudaTotal.toFixed(2)}</div>` : ''}
            </div>
           <div style="font-size:10px; color:#475569; border-top:1px dashed #cbd5e1; padding-top:6px;">
                <div>🔄 ${c.frecuencia_pago || 'N/A'}</div>
                <div style="margin-top:3px;">🔢 ${c.num_cuotas || 'N/A'} cuotas</div>
                <div style="margin-top:3px;">💳 ${c.forma_entrega || 'N/A'}</div>
            </div>
        </div>`;
    }).join('');

    const totalPags = Math.ceil(count / window.itemsPorPaginaCreditosMovil);
    const pagHTML = totalPags > 1 ? `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; padding-top:10px; border-top:1px dashed #cbd5e1;">
            <button onclick="cambiarPaginaCreditosMovil(${window.paginaActualCreditosMovil - 1})" ${window.paginaActualCreditosMovil === 1 ? 'disabled' : ''} style="padding:6px 12px; font-size:12px; font-weight:bold; background:white; border:1px solid #cbd5e1; border-radius:6px;">◀ Ant</button>
            <span style="font-size:11px; font-weight:bold; color:#475569;">Pág. ${window.paginaActualCreditosMovil} de ${totalPags}</span>
            <button onclick="cambiarPaginaCreditosMovil(${window.paginaActualCreditosMovil + 1})" ${window.paginaActualCreditosMovil >= totalPags ? 'disabled' : ''} style="padding:6px 12px; font-size:12px; font-weight:bold; background:white; border:1px solid #cbd5e1; border-radius:6px;">Sig ▶</button>
        </div>` : '';

    contenedor.innerHTML = htmlCards + pagHTML;
};

// 7. EDITAR CRÉDITO (24H)
window.editarCreditoMovil = async function(id, montoActual) {
    const entrada = prompt(`✏️ EDITAR CRÉDITO #${id}\n\nMonto actual: $${parseFloat(montoActual).toFixed(2)}\nIngrese el nuevo monto de capital:`, montoActual);
    if (!entrada) return;
    const nuevoMonto = parseFloat(entrada);
    if (isNaN(nuevoMonto) || nuevoMonto <= 0) { alert("❌ Monto inválido."); return; }

    try {
        const supa = window.supabaseClient;
        const { data: cred, error: errF } = await supa.from('creditos').select('tasa_interes, monto_capital, caja_id, valor_cuota, cliente_id, fecha_emision, frecuencia_pago, num_cuotas').eq('id', id).single();
        if (errF) throw errF;
        if ((new Date().getTime() - new Date(cred.fecha_emision).getTime()) > 86400000) { alert("❌ Superó las 24 horas. No es editable."); return; }

        const { data: cli } = await supa.from('clientes').select('nombres, apellidos, cedula, whatsapp').eq('id', cred.cliente_id).single();
        const { data: caja } = await supa.from('cajas_capital').select('nombre_caja, saldo_actual').eq('id', cred.caja_id).single();

        const capAnt = parseFloat(cred.monto_capital);
        const saldoDisp = parseFloat(caja.saldo_actual);
        if (nuevoMonto > capAnt && saldoDisp < (nuevoMonto - capAnt)) {
            alert(`❌ Fondos insuficientes en [${caja.nombre_caja}].`);
            return;
        }

        const tasa = parseFloat(cred.tasa_interes || 0);
        const nuevoTotal = nuevoMonto + (nuevoMonto * (tasa / 100));
        const totalAnt = capAnt + (capAnt * (tasa / 100));
        const nuevaCuota = totalAnt > 0 ? (nuevoTotal * parseFloat(cred.valor_cuota || 0)) / totalAnt : 0;

        await supa.from('creditos').update({ monto_capital: nuevoMonto, total_pagar: nuevoTotal, saldo_pendiente: nuevoTotal, valor_cuota: nuevaCuota }).eq('id', id);
        await supa.from('cajas_capital').update({ saldo_actual: saldoDisp + (capAnt - nuevoMonto) }).eq('id', cred.caja_id);

        const nomComp = `${cli.nombres.toUpperCase()} ${cli.apellidos.toUpperCase()}`;
        await supa.from('historial_capital').update({ monto: -nuevoMonto, concepto: `DESEMBOLSO CORREGIDO #${id} - ${nomComp} | 🟡 (CORREGIDO)` }).eq('credito_id', Number(id));

        if (cli.whatsapp) {
            const msj = `=== SISTEMA ALPHA ===\n👤 Cliente: ${nomComp}\n\nHola, los datos de tu crédito #${id} han sido MODIFICADOS.\n💰 Nuevo Monto: $${nuevoMonto.toFixed(2)}\n💵 Nueva Cuota: $${nuevaCuota.toFixed(2)}\n📊 Total: $${nuevoTotal.toFixed(2)}\n\n🚫 NO RESPONDER A ESTE MENSAJE.`;
            await enviarSMSCreditoMovil(cli.whatsapp, msj);
            if (cli.whatsapp.trim() !== "0939836191") await enviarSMSCreditoMovil("0939836191", `[COPIA EDICIÓN CRÉDITO]\n\n${msj}`);
        }

        alert("✅ Crédito corregido y caja ajustada.");
        await window.cargarSaldosEnSelectorCreditoMovil();
        await window.cargarHistorialCreditosMovil();
    } catch (e) {
        alert("❌ Error al editar: " + e.message);
    }
};

// 8. ANULAR CRÉDITO (24H)
window.anularCreditoMovil = async function(idCredito, capitalPrestado) {
    if (!confirm(`⚠️ ¿Anular el crédito #${idCredito}?\nSe devolverán $${capitalPrestado} a la caja de origen.`)) return;
    try {
        const supa = window.supabaseClient;
        const { data: cred } = await supa.from('creditos').select('*').eq('id', idCredito).single();
        const { data: cli } = await supa.from('clientes').select('nombres, apellidos, cedula, whatsapp').eq('id', cred.cliente_id).single();

        const idCaja = (cred.forma_entrega || '').toLowerCase().includes('banco') ? 2 : 1;
        const { data: caja } = await supa.from('cajas_capital').select('saldo_actual').eq('id', idCaja).single();
        await supa.from('cajas_capital').update({ saldo_actual: parseFloat(caja.saldo_actual) + parseFloat(capitalPrestado) }).eq('id', idCaja);

        const nomComp = `${cli.nombres.toUpperCase()} ${cli.apellidos.toUpperCase()}`;
        await supa.from('historial_capital').insert([{ caja_id: idCaja, monto: capitalPrestado, concepto: `🟢 REVERSIÓN: Anulación Crédito #${idCredito} - ${nomComp}` }]);
        await supa.from('creditos').update({ estado: 'inactivo' }).eq('id', idCredito);

        if (cli.whatsapp) {
            const msj = `=== SISTEMA ALPHA ===\n👤 Cliente: ${nomComp}\n\nHola, tu crédito #${idCredito} ha sido ANULADO.\n💰 Monto devuelto: $${parseFloat(capitalPrestado).toFixed(2)}\n\n🚫 NO RESPONDER A ESTE MENSAJE.`;
            await enviarSMSCreditoMovil(cli.whatsapp, msj);
            await new Promise(r => setTimeout(r, 2000));
            if (cli.whatsapp.trim() !== "0939836191") await enviarSMSCreditoMovil("0939836191", `[ALERTA ANULACIÓN CRÉDITO]\n\n${msj}`);
        }

        alert("✅ Crédito anulado y capital devuelto a caja.");
        await window.cargarSaldosEnSelectorCreditoMovil();
        await window.cargarHistorialCreditosMovil();
    } catch (e) {
        alert("❌ Error al anular: " + e.message);
    }
};

// 9. REENVIAR VOUCHER SMS (CLON EXACTO DE COMPUTADORA)
window.reenviarVoucherMovil = async function(idCredito) {
    try {
        const supa = window.supabaseClient;
        const { data: credito, error: errCred } = await supa.from('creditos').select('*').eq('id', idCredito).single();
        if (errCred) throw errCred;

        const { data: cliente, error: errCli } = await supa.from('clientes').select('*').eq('id', credito.cliente_id).single();
        if (errCli) throw errCli;

        const inicialN = cliente.nombres.charAt(0).toUpperCase();
        const inicialA = cliente.apellidos.charAt(0).toUpperCase();
        const ultimos4 = cliente.cedula.slice(-4);
        const codigoClienteBancario = `${inicialN}${inicialA}-${ultimos4}`;

        const { data: todosCreditos } = await supa
            .from('creditos')
            .select('id')
            .eq('cliente_id', cliente.id)
            .order('id', { ascending: true });

        let numeroCredito = 1;
        if (todosCreditos) {
            const index = todosCreditos.findIndex(c => c.id === idCredito);
            if (index !== -1) numeroCredito = index + 1;
        }

        const codigoCifrado = typeof cifrarNumeroCreditoMovil === 'function' ? cifrarNumeroCreditoMovil(numeroCredito).toUpperCase() : '?';
        const codigoCreditoOficial = `${codigoClienteBancario} | CRE #${numeroCredito} [${codigoCifrado}]`;
        const codigoCreditoSMS = `${codigoClienteBancario} | CRE #${codigoCifrado}`;
        const nombreCompleto = `${cliente.nombres.toUpperCase()} ${cliente.apellidos.toUpperCase()}`;

        const numeroEnvio = prompt(`📱 REENVÍO DE RESPALDO (${codigoCreditoOficial})\n\nTeléfono registrado:\nSi cambió de chip, pon el nuevo número aquí:`, cliente.whatsapp || "");
        if (!numeroEnvio || numeroEnvio.trim() === "") return;

        const cobrar = confirm(`💰 TIPO DE REENVÍO\n\n¿Deseas cobrar los $0.50 de penalidad?\n\n🟢 ACEPTAR = Cobrar $0.50 (Perdió el chip)\n🔴 CANCELAR = Envío GRATIS (Fallo de internet)`);

        let etiquetaMensaje = "";
        if (cobrar) {
            const { data: cajaData } = await supa.from('cajas_capital').select('saldo_actual').eq('id', 1).single();
            const nuevoSaldoCaja = parseFloat(cajaData.saldo_actual) + 0.50;
            await supa.from('cajas_capital').update({ saldo_actual: nuevoSaldoCaja }).eq('id', 1);

            await supa.from('historial_capital').insert([{
                caja_id: 1,
                monto: 0.50,
                concepto: `🟢 INGRESO: Penalidad por reenvío de voucher - ${codigoCreditoOficial} - ${nombreCompleto}`
            }]);

            etiquetaMensaje = "[COPIA DE RESPALDO] val 0.50ctv\n";
        }

        const modalidad = (credito.frecuencia_pago || "Fija").replace(/.*Cobro\s+/i, "").replace("📅", "").trim();

        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

        // Fecha actual del reenvío
        const ahora = new Date();
        let horasA = ahora.getHours();
        const minutosA = String(ahora.getMinutes()).padStart(2, '0');
        const ampmA = horasA >= 12 ? 'p.m.' : 'a.m.';
        horasA = String(horasA % 12 || 12).padStart(2, '0');
        const fechaHoraSMS = `${dias[ahora.getDay()]} ${String(ahora.getDate()).padStart(2, '0')}/${meses[ahora.getMonth()]}/${ahora.getFullYear()} | ${horasA}:${minutosA} ${ampmA}`;

        // Fecha original de emisión con hora y segundos
        let fechaEmisionTexto = "N/A";
        if (credito.fecha_emision) {
            let fEmi = new Date(credito.fecha_emision);
            if (isNaN(fEmi.getTime()) && typeof credito.fecha_emision === 'string') {
                fEmi = new Date(credito.fecha_emision.replace(/-/g, '/').replace('T', ' ').split('.')[0]);
            }
            if (!isNaN(fEmi.getTime())) {
                let hE = fEmi.getHours();
                const mE = String(fEmi.getMinutes()).padStart(2, '0');
                const sE = String(fEmi.getSeconds()).padStart(2, '0');
                const ampmE = hE >= 12 ? 'p.m.' : 'a.m.';
                hE = String(hE % 12 || 12).padStart(2, '0');
                fechaEmisionTexto = `${dias[fEmi.getDay()]} ${String(fEmi.getDate()).padStart(2, '0')}/${meses[fEmi.getMonth()]}/${fEmi.getFullYear()} | ${hE}:${mE}:${sE} ${ampmE}`;
            }
        }

        // Bloque de mora si aplica
        const moraExtra = parseFloat(credito.monto_mora) || 0;
        let bloqueMora = "";
        if (moraExtra > 0) {
            const deudaTotal = parseFloat(credito.total_pagar) + moraExtra;
            bloqueMora = `\n⚠️ Mora: $${moraExtra.toFixed(2)}\n👉 Deuda Total: $${deudaTotal.toFixed(2)}`;
        }

        const msjReenvio = `=== SISTEMA ALPHA ===\n${etiquetaMensaje}${fechaHoraSMS}\n\n🆔 Ref: ${codigoCreditoSMS}\n👤 Cliente: ${nombreCompleto}\n📅 Emitido: ${fechaEmisionTexto}\n\nHola, aqui tienes el respaldo de tu credito.\n\n💰 Monto: $${parseFloat(credito.monto_capital).toFixed(2)}\n💵 Cuota: $${parseFloat(credito.valor_cuota).toFixed(2)}\n🔄 Modalidad: ${modalidad}\n📊 Total: $${parseFloat(credito.total_pagar).toFixed(2)}\n🔢 Nro Cuotas: ${credito.num_cuotas}${bloqueMora}\n\nConserva este msj. ¡Gracias!\n🚫 POR FAVOR, NO RESPONDER A ESTE MENSAJE.`;

        await enviarSMSCreditoMovil(numeroEnvio.trim(), msjReenvio);
        await new Promise(r => setTimeout(r, 2000));

        const numeroGerente = "0939836191";
        if (numeroEnvio.trim() !== numeroGerente) {
            const estadoCobro = cobrar ? "COBRADO $0.50" : "GRATIS";
            await enviarSMSCreditoMovil(numeroGerente, `[AVISO REENVÍO ${estadoCobro}]\n\n${msjReenvio}`);
        }

        alert(cobrar ? `✅ Copia cobrada ($0.50) y enviada a: ${numeroEnvio}` : `✅ Mensaje enviado de cortesía (Gratis) a: ${numeroEnvio}`);
    } catch (e) {
        console.error("Error al reenviar voucher:", e);
        alert("❌ Error al intentar reenviar el mensaje: " + e.message);
    }
};
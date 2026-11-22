// =========================================================================
// 🗑️ CENTRO DE DEPURACIÓN Y RESTAURACIÓN (CLON MÓVIL)
// Archivo: modulos_movil/depuracion_movil.js
// =========================================================================

async function enviarSMSDepuracionMovil(numero, mensaje) {
    if (typeof invocarSMSDesdeMovil === 'function') {
        return await invocarSMSDesdeMovil(numero, mensaje);
    }
    try {
        const numLimpio = String(numero).replace(/\D/g, '');
        const url = `https://trigger.macrodroid.com/554f217c-000a-4581-896c-551d96459fb2/sms_credito?numero=${numLimpio}&mensaje=${encodeURIComponent(mensaje)}`;
        await fetch(url, { method: 'GET', mode: 'no-cors' });
        return true;
    } catch (e) {
        console.error("Error SMS Depuración Móvil:", e);
        return false;
    }
}

window.cargarPapeleraMovil = async function(categoria) {
    const contenedor = document.getElementById('contenedor-papelera-movil');
    if (!contenedor) return;

    const buscadorGlobal = document.getElementById('input-buscador-global-papelera-movil');
    if (buscadorGlobal) buscadorGlobal.value = '';

    // Resaltar pestaña activa
    document.querySelectorAll('.btn-tab-papelera-movil').forEach(btn => {
        btn.style.opacity = btn.dataset.cat === categoria ? '1' : '0.6';
        btn.style.transform = btn.dataset.cat === categoria ? 'scale(1.03)' : 'scale(1)';
    });

    const supa = window.supabaseClient;
    if (!supa) {
        contenedor.innerHTML = '<p style="color:#ef4444; text-align:center;">❌ Base de datos no conectada.</p>';
        return;
    }

    const formatearFechaAlpha = (fechaISO) => {
        if (!fechaISO) return 'N/A';
        const f = new Date(fechaISO);
        if (isNaN(f.getTime())) return 'Fecha inválida';
        const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        let hora = f.getHours();
        const ampm = hora >= 12 ? 'pm' : 'am';
        hora = hora % 12 || 12;
        const min = f.getMinutes().toString().padStart(2, '0');
        return `${dias[f.getDay()]} ${f.getDate()}/${meses[f.getMonth()]}/${f.getFullYear()} | h ${hora}:${min} ${ampm}`;
    };

    // =====================================================================
    // SECCIÓN A: CLIENTES ARCHIVADOS
    // =====================================================================
    if (categoria === 'clientes') {
        contenedor.innerHTML = '<p style="color:#64748b; font-size:13px; text-align:center;">⏳ Buscando clientes en el archivo...</p>';
        try {
            const { data: archivados, error } = await supa
                .from('clientes')
                .select('*')
                .eq('estado', 'inactivo')
                .order('id', { ascending: false });

            if (error) throw error;
            if (!archivados || archivados.length === 0) {
                contenedor.innerHTML = `<div style="text-align:center; padding:20px; color:#10b981; font-weight:bold;">✨ El archivo de clientes está limpio.</div>`;
                return;
            }

            contenedor.innerHTML = archivados.map(c => {
                const nombreCompleto = `${c.nombres} ${c.apellidos}`.toUpperCase();
                const nomEsc = nombreCompleto.replace(/'/g, "\\'");
                const textoBusqueda = `${nombreCompleto} ${c.cedula} ${c.id}`.toLowerCase();

                return `
                <div class="item-papelera-global-movil" data-busqueda="${textoBusqueda}" style="background:#fff; border:1px solid #e2e8f0; border-left:5px solid #64748b; border-radius:10px; padding:14px; margin-bottom:12px; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <div>
                            <span style="background:#f1f5f9; color:#475569; font-size:10px; padding:3px 6px; border-radius:4px; font-weight:bold;">ID CLI: ${c.id}</span>
                            <h3 style="margin:6px 0 4px 0; font-size:14px; color:#1e293b;">${nombreCompleto}</h3>
                            <p style="margin:0; font-size:12px; color:#64748b;">🆔 Cédula: ${c.cedula}</p>
                        </div>
                        <span style="font-size:20px;">👥</span>
                    </div>
                    <div style="margin-top:12px; display:flex; gap:8px; border-top:1px dashed #cbd5e1; padding-top:10px;">
                        <button onclick="reactivarClienteDesdePapeleraMovil(${c.id}, '${nomEsc}')" style="flex:1; padding:10px; background:#10b981; color:white; border:none; border-radius:6px; font-weight:bold; font-size:12px;">♻️ Restaurar</button>
                        <button onclick="forzarEliminacionClienteMovil(${c.id}, '${nomEsc}')" style="padding:10px 14px; background:#ef4444; color:white; border:none; border-radius:6px;">💥</button>
                    </div>
                </div>`;
            }).join('');
        } catch (e) { contenedor.innerHTML = `<p style="color:#ef4444; text-align:center;">❌ Error: ${e.message}</p>`; }
    }

    // =====================================================================
    // SECCIÓN B: CRÉDITOS ANULADOS
    // =====================================================================
    else if (categoria === 'creditos') {
        contenedor.innerHTML = '<p style="color:#64748b; font-size:13px; text-align:center;">⏳ Abriendo bóveda de créditos anulados...</p>';
        try {
            const { data: anulados, error } = await supa
                .from('creditos')
                .select(`id, monto_capital, tasa_interes, total_pagar, valor_cuota, num_cuotas, frecuencia_pago, forma_entrega, fecha_emision, cliente_id, clientes!inner(nombres, apellidos, cedula)`)
                .eq('estado', 'inactivo')
                .order('id', { ascending: false });

            if (error) throw error;
            if (!anulados || anulados.length === 0) {
                contenedor.innerHTML = `<div style="text-align:center; padding:20px; color:#0284c7; font-weight:bold;">✨ No hay créditos anulados en la bitácora.</div>`;
                return;
            }

            const { data: todos } = await supa.from('creditos').select('id, cliente_id').order('id', { ascending: true });
            const mapaNum = {};
            if (todos) {
                const conteos = {};
                todos.forEach(c => { conteos[c.cliente_id] = (conteos[c.cliente_id] || 0) + 1; mapaNum[c.id] = conteos[c.cliente_id]; });
            }

            contenedor.innerHTML = anulados.map(cre => {
                const cli = cre.clientes || {};
                const nombreCliente = `${cli.nombres} ${cli.apellidos}`.toUpperCase();
                const nomEsc = nombreCliente.replace(/'/g, "\\'");
                const refFinal = `REF: ${(cli.nombres||'X').trim().charAt(0).toUpperCase()}${(cli.apellidos||'X').trim().charAt(0).toUpperCase()}-${(cli.cedula||'0000').trim().slice(-4)}`;
                const numCre = mapaNum[cre.id] || '?';
                const creCif = typeof cifrarNumeroCreditoMovil === 'function' ? cifrarNumeroCreditoMovil(numCre).toUpperCase() : '?';
                const etiquetaCRE = `CRE #${numCre} [${creCif}]`;

                const capital = parseFloat(cre.monto_capital) || 0;
                const total = parseFloat(cre.total_pagar) || 0;
                const interes = cre.tasa_interes || 0;
                const cuota = parseFloat(cre.valor_cuota) || 0;
                const textoBusqueda = `${nombreCliente} ${cli.cedula} ${refFinal} ${cre.id} ${capital}`.toLowerCase();

                return `
                <div class="item-papelera-global-movil" data-busqueda="${textoBusqueda}" style="background:#fff; border:1px solid #cbd5e1; border-left:5px solid #ef4444; border-radius:10px; padding:14px; margin-bottom:12px; box-shadow:0 3px 6px rgba(0,0,0,0.06);">
                    <div style="display:flex; gap:5px; align-items:center; flex-wrap:wrap; border-bottom:1px solid #e2e8f0; padding-bottom:8px; margin-bottom:8px;">
                        <span style="background:#f1f5f9; color:#334155; font-size:10px; padding:3px 6px; border-radius:5px; font-weight:900;">${refFinal}</span>
                        <span style="background:#fee2e2; color:#b91c1c; font-size:10px; padding:3px 6px; border-radius:5px; font-weight:900;">CRÉDITO #${cre.id}</span>
                        <span style="background:#fef08a; color:#854d0e; font-size:10px; padding:3px 6px; border-radius:5px; font-weight:900;">${etiquetaCRE}</span>
                        <span style="background:#fef2f2; color:#ef4444; font-size:10px; padding:3px 6px; border-radius:5px; font-weight:900; border:1px dashed #ef4444;">🚫 ANULADO</span>
                    </div>

                    <h3 style="margin:0 0 3px 0; font-size:15px; color:#0f172a; font-weight:900;">👤 ${nombreCliente}</h3>
                    <p style="margin:0 0 8px 0; font-size:11px; color:#64748b;">🆔 Cédula: ${cli.cedula}</p>

                    <div style="background:#f8fafc; padding:10px; border-radius:8px; border:1px dashed #94a3b8; margin-bottom:10px; font-size:12px;">
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:6px;">
                            <div>Capital: <b>$${capital.toFixed(2)}</b></div>
                            <div>Interés: <b>${interes}%</b></div>
                            <div>Cuota: <b>$${cuota.toFixed(2)}</b></div>
                            <div style="color:#b91c1c; font-weight:900;">💰 Total: $${total.toFixed(2)}</div>
                        </div>
                        <div style="border-top:1px solid #e2e8f0; padding-top:6px; font-size:11px; color:#475569;">
                            <div>🔄 ${cre.frecuencia_pago || 'No especificada'}</div>
                            <div style="margin-top:2px;">🔢 N° de Cuotas: <b>${cre.num_cuotas || '0'}</b></div>
                        </div>
                    </div>

                    <div style="background:#fef2f2; padding:8px 10px; border-radius:6px; border-left:3px solid #ef4444; margin-bottom:12px; font-size:11px; color:#7f1d1d;">
                        🗓️ Emisión original: <b>${formatearFechaAlpha(cre.fecha_emision)}</b>
                    </div>

                    <div style="display:flex; gap:8px;">
                        <button onclick="reactivarCreditoDesdePapeleraMovil(${cre.id}, ${cre.monto_capital}, '${(cre.forma_entrega||'').replace(/'/g, "\\'")}', '${nomEsc}')" style="flex:1; padding:10px; background:#0284c7; color:white; border:none; border-radius:6px; font-weight:bold; font-size:12px;">♻️ Restaurar Crédito</button>
                        <button onclick="forzarEliminacionCreditoMovil(${cre.id})" style="padding:10px 14px; background:#ef4444; color:white; border:none; border-radius:6px;">💥</button>
                    </div>
                </div>`;
            }).join('');
        } catch (e) { contenedor.innerHTML = `<p style="color:#ef4444; text-align:center;">❌ Error: ${e.message}</p>`; }
    }

    // =====================================================================
    // SECCIÓN C: BÓVEDA DE PAGOS ELIMINADOS
    // =====================================================================
    else if (categoria === 'pagos_eliminados') {
        contenedor.innerHTML = '<p style="color:#64748b; font-size:13px; text-align:center;">⏳ Abriendo bóveda de pagos...</p>';
        try {
            const { data: pagosBorrados, error } = await supa
                .from('auditoria_pagos_eliminados')
                .select('*')
                .order('fecha_eliminacion', { ascending: false });

            if (error) throw error;
            if (!pagosBorrados || pagosBorrados.length === 0) {
                contenedor.innerHTML = `<div style="text-align:center; padding:20px; color:#f59e0b; font-weight:bold;">✨ La bóveda está limpia. No hay abonos anulados.</div>`;
                return;
            }

            const idsCred = [...new Set(pagosBorrados.map(p => p.id_credito))];
            const dicCli = {};
            if (idsCred.length > 0) {
                const { data: cData } = await supa.from('creditos').select('id, clientes(nombres, apellidos, cedula)').in('id', idsCred);
                (cData || []).forEach(c => { dicCli[c.id] = c.clientes; });
            }

            contenedor.innerHTML = pagosBorrados.map(pago => {
                const cli = dicCli[pago.id_credito] || {};
                const nombreCliente = cli.nombres ? `${cli.nombres} ${cli.apellidos}`.toUpperCase() : 'CLIENTE DESCONOCIDO';
                const refFinal = `REF: ${(cli.nombres||'X').trim().charAt(0).toUpperCase()}${(cli.apellidos||'X').trim().charAt(0).toUpperCase()}-${(cli.cedula||'0000').trim().slice(-4)}`;
                const metodo = pago.forma_pago ? pago.forma_pago.toUpperCase() : 'EFECTIVO';
                const creCif = pago.codigo_cre || 'CRE #?';
                const textoBusqueda = `${nombreCliente} ${cli.cedula||''} ${refFinal} ${pago.id_credito} ${creCif} ${metodo}`.toLowerCase();

                return `
                <div class="item-papelera-global-movil" data-busqueda="${textoBusqueda}" style="background:#fff; border:1px solid #cbd5e1; border-left:5px solid #f59e0b; border-radius:10px; padding:14px; margin-bottom:12px;">
                    <div style="display:flex; gap:5px; flex-wrap:wrap; margin-bottom:8px;">
                        <span style="background:#f1f5f9; color:#334155; font-size:10px; padding:3px 6px; border-radius:5px; font-weight:900;">${refFinal}</span>
                        <span style="background:#e0f2fe; color:#0369a1; font-size:10px; padding:3px 6px; border-radius:5px; font-weight:900;">${creCif}</span>
                        <span style="background:#fee2e2; color:#b91c1c; font-size:10px; padding:3px 6px; border-radius:5px; font-weight:900;">PAGO #${pago.numero_pago}</span>
                        <span style="background:#dcfce7; color:#15803d; font-size:10px; padding:3px 6px; border-radius:5px; font-weight:900;">${metodo}</span>
                    </div>
                    <h3 style="margin:0 0 4px 0; font-size:14px; color:#0f172a; font-weight:900;">👤 ${nombreCliente}</h3>
                    <div style="font-size:11px; color:#64748b; margin-bottom:8px;">📅 Pago original: <b>${pago.fecha_pago_original ? formatearFechaAlpha(pago.fecha_pago_original) : 'N/A'}</b></div>
                    <div style="background:#f8fafc; padding:10px; border-radius:8px; border:1px dashed #94a3b8; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <div style="font-size:10px; color:#475569; font-weight:bold;">Monto Reversado</div>
                            <div style="font-size:20px; color:#ef4444; font-weight:900;">$${parseFloat(pago.abono_total).toFixed(2)}</div>
                        </div>
                        <div style="text-align:right; font-size:10px; color:#64748b;">
                            <div>🗑️ ${formatearFechaAlpha(pago.fecha_eliminacion)}</div>
                            <div style="margin-top:4px; background:#e2e8f0; color:#334155; padding:2px 6px; border-radius:4px; display:inline-block; font-weight:bold;">📝 ${pago.motivo_eliminacion || 'Auditoría'}</div>
                        </div>
                    </div>
                </div>`;
            }).join('');
        } catch (e) { contenedor.innerHTML = `<p style="color:#ef4444; text-align:center;">❌ Error: ${e.message}</p>`; }
    }

    // =====================================================================
    // SECCIÓN D: CRÉDITOS FINALIZADOS (PAGADOS)
    // =====================================================================
    else if (categoria === 'finalizados') {
        contenedor.innerHTML = '<p style="color:#64748b; font-size:13px; text-align:center;">⏳ Abriendo bóveda histórica...</p>';
        try {
            const { data: finalizados, error } = await supa
                .from('creditos')
                .select(`id, monto_capital, total_pagar, monto_mora, fecha_emision, frecuencia_pago, num_cuotas, valor_cuota, cliente_id, clientes!inner(nombres, apellidos, cedula)`)
                .eq('estado', 'finalizado');

            if (error) throw error;
            if (!finalizados || finalizados.length === 0) {
                contenedor.innerHTML = `<div style="text-align:center; padding:20px; color:#8b5cf6; font-weight:bold;">✨ Aún no hay créditos finalizados.</div>`;
                return;
            }

            const { data: todos } = await supa.from('creditos').select('id, cliente_id').order('id', { ascending: true });
            const mapaNum = {};
            if (todos) {
                const conteos = {};
                todos.forEach(c => { conteos[c.cliente_id] = (conteos[c.cliente_id] || 0) + 1; mapaNum[c.id] = conteos[c.cliente_id]; });
            }

            const idsCred = finalizados.map(c => c.id);
            const ultimosPagos = {};
            const { data: pagos } = await supa.from('historial_pagos').select('id_credito, fecha_pago').in('id_credito', idsCred).order('fecha_pago', { ascending: false });
            (pagos || []).forEach(p => { if (!ultimosPagos[p.id_credito]) ultimosPagos[p.id_credito] = p.fecha_pago; });

            finalizados.sort((a, b) => (ultimosPagos[b.id] ? new Date(ultimosPagos[b.id]).getTime() : 0) - (ultimosPagos[a.id] ? new Date(ultimosPagos[a.id]).getTime() : 0));

            contenedor.innerHTML = finalizados.map(cre => {
                const cli = cre.clientes || {};
                const nombreCliente = `${cli.nombres} ${cli.apellidos}`.toUpperCase();
                const nomEsc = nombreCliente.replace(/'/g, "\\'");
                const refFinal = `REF: ${(cli.nombres||'X').trim().charAt(0).toUpperCase()}${(cli.apellidos||'X').trim().charAt(0).toUpperCase()}-${(cli.cedula||'0000').trim().slice(-4)}`;
                const numCre = mapaNum[cre.id] || '?';
                const creCif = typeof cifrarNumeroCreditoMovil === 'function' ? cifrarNumeroCreditoMovil(numCre).toUpperCase() : '?';
                const etiquetaCRE = `CRE #${numCre} [${creCif}]`;

                const capital = parseFloat(cre.monto_capital) || 1;
                const total = parseFloat(cre.total_pagar) || 1;
                const mora = parseFloat(cre.monto_mora) || 0;
                const textoBusqueda = `${nombreCliente} ${cli.cedula} ${refFinal} ${cre.id}`.toLowerCase();

                return `
                <div class="item-papelera-global-movil" data-busqueda="${textoBusqueda}" style="background:#fff; border:1px solid #cbd5e1; border-left:5px solid #8b5cf6; border-radius:10px; padding:14px; margin-bottom:12px;">
                    <div style="display:flex; gap:5px; flex-wrap:wrap; border-bottom:1px solid #e2e8f0; padding-bottom:8px; margin-bottom:8px;">
                        <span style="background:#f1f5f9; color:#334155; font-size:10px; padding:3px 6px; border-radius:5px; font-weight:900;">${refFinal}</span>
                        <span style="background:#ede9fe; color:#5b21b6; font-size:10px; padding:3px 6px; border-radius:5px; font-weight:900;">CRÉDITO #${cre.id}</span>
                        <span style="background:#fef08a; color:#854d0e; font-size:10px; padding:3px 6px; border-radius:5px; font-weight:900;">${etiquetaCRE}</span>
                        <span style="background:#dcfce7; color:#166534; font-size:10px; padding:3px 6px; border-radius:5px; font-weight:900;">✅ PAGADO 100%</span>
                    </div>

                    <h3 style="margin:0 0 3px 0; font-size:14px; color:#0f172a; font-weight:900;">👤 ${nombreCliente}</h3>
                    <p style="margin:0 0 8px 0; font-size:11px; color:#64748b;">🆔 Cédula: ${cli.cedula}</p>

                    <div style="background:#f8fafc; padding:10px; border-radius:8px; border:1px dashed #94a3b8; margin-bottom:10px; font-size:12px;">
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
                            <div>Capital: <b>$${capital.toFixed(2)}</b></div>
                            <div style="color:#166534; font-weight:900;">💰 Total: $${total.toFixed(2)}</div>
                            ${mora > 0 ? `<div style="grid-column:span 2; color:#ef4444; font-size:11px; font-weight:bold;">+ Mora $${mora.toFixed(2)} 👉 Cancelado: $${(total+mora).toFixed(2)}</div>` : ''}
                        </div>
                    </div>

                    <div style="background:#f1f5f9; padding:8px 10px; border-radius:6px; font-size:11px; margin-bottom:12px;">
                        <div>🗓️ Inicio: <b>${formatearFechaAlpha(cre.fecha_emision)}</b></div>
                        <div style="margin-top:4px; color:#166534; font-weight:bold;">🏆 Cancelación: ${ultimosPagos[cre.id] ? formatearFechaAlpha(ultimosPagos[cre.id]) : 'Sin pagos'}</div>
                    </div>

                    <button onclick="verHistorialPagosFinalizadoMovil(${cre.id}, '${nomEsc}')" style="width:100%; padding:10px; background:#0f172a; color:white; border:none; border-radius:6px; font-weight:bold; font-size:12px;">📑 Ver Historial de Pagos</button>
                </div>`;
            }).join('');
        } catch (e) { contenedor.innerHTML = `<p style="color:#ef4444; text-align:center;">❌ Error: ${e.message}</p>`; }
    }


// =====================================================================
    // SECCIÓN E: PERSONAL INACTIVO (COBRADORES Y SUPERVISORES)
    // =====================================================================
    else if (categoria === 'personal') {
        contenedor.innerHTML = `
            <div style="background: white; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 28px 16px; text-align: center;">
                <div style="font-size: 32px; margin-bottom: 8px;">👔</div>
                <div style="font-weight: 900; color: #334155; font-size: 14px; margin-bottom: 4px;">Bóveda de Personal Inactivo</div>
                <div style="color: #64748b; font-size: 12px;">✨ No hay cobradores ni supervisores inactivos registrados aún. Cuando desactives personal del sistema, aparecerán aquí para restaurarlos o auditarlos.</div>
            </div>`;
    }
};
// BUSCADOR GLOBAL
window.filtrarPapeleraGlobalMovil = function() {
    const txt = (document.getElementById('input-buscador-global-papelera-movil')?.value || '').toLowerCase();
    document.querySelectorAll('.item-papelera-global-movil').forEach(t => {
        t.style.display = (t.getAttribute('data-busqueda') || '').includes(txt) ? 'block' : 'none';
    });
};

// ACCIONES DE CLIENTES
window.reactivarClienteDesdePapeleraMovil = async function(id, nombre) {
    if (!confirm(`♻️ ¿Restaurar al cliente [${nombre}]?`)) return;
    try {
        const { error } = await window.supabaseClient.from('clientes').update({ estado: 'activo' }).eq('id', id);
        if (error) throw error;
        alert(`✅ Cliente ${nombre} restaurado.`);
        window.cargarPapeleraMovil('clientes');
    } catch (e) { alert("❌ Error: " + e.message); }
};

window.forzarEliminacionClienteMovil = async function(id, nombre) {
    if (!confirm(`⚠️ ALERTA CRÍTICA ⚠️\n¿Destruir permanentemente a [${nombre}]?`)) return;
    if (prompt(`Escribe ELIMINAR para confirmar:`) !== 'ELIMINAR') { alert("Cancelado."); return; }
    try {
        const { error } = await window.supabaseClient.from('clientes').delete().eq('id', id);
        if (error) throw error;
        alert("💥 Registro destruido permanentemente.");
        window.cargarPapeleraMovil('clientes');
    } catch (e) { alert("❌ Error: " + e.message); }
};

// ACCIONES DE CRÉDITOS
window.reactivarCreditoDesdePapeleraMovil = async function(idCredito, capital, formaEntrega, nombreCliente) {
    if (!confirm(`♻️ ¿RE-ACTIVAR el crédito #${idCredito} de [${nombreCliente}]?\nSe descontarán $${capital} de la caja.`)) return;
    try {
        const supa = window.supabaseClient;
        const { data: credito, error: errCred } = await supa.from('creditos').select('*').eq('id', idCredito).single();
        if (errCred) throw errCred;
        const { data: cliente, error: errCli } = await supa.from('clientes').select('nombres, apellidos, cedula, whatsapp').eq('id', credito.cliente_id).single();
        if (errCli) throw errCli;

        const codBanc = `${cliente.nombres.charAt(0).toUpperCase()}${cliente.apellidos.charAt(0).toUpperCase()}-${cliente.cedula.slice(-4)}`;
        const { data: todos } = await supa.from('creditos').select('id').eq('cliente_id', credito.cliente_id).order('id', { ascending: true });
        const numCre = todos ? (todos.findIndex(c => c.id === idCredito) + 1) : 1;
        const codCif = typeof cifrarNumeroCreditoMovil === 'function' ? cifrarNumeroCreditoMovil(numCre).toUpperCase() : '?';
        const codigoOficial = `${codBanc} | CRE #${numCre} [${codCif}]`;
        const codigoSMS = `${codBanc} | CRE #${codCif}`;
        const nomLimpio = `${cliente.nombres.toUpperCase()} ${cliente.apellidos.toUpperCase()}`;

        const idCaja = (formaEntrega || '').toLowerCase().includes('banco') ? 2 : 1;
        const { data: caja } = await supa.from('cajas_capital').select('saldo_actual').eq('id', idCaja).single();
        if (parseFloat(caja.saldo_actual) < parseFloat(capital)) {
            alert(`❌ Fondos insuficientes en caja. Disponible: $${caja.saldo_actual}`);
            return;
        }

        await supa.from('cajas_capital').update({ saldo_actual: parseFloat(caja.saldo_actual) - parseFloat(capital) }).eq('id', idCaja);
        await supa.from('historial_capital').insert([{ caja_id: idCaja, monto: -parseFloat(capital), concepto: `🔴 RESTAURACIÓN: Re-activación - ${codigoOficial} - ${nomLimpio}` }]);
        await supa.from('creditos').update({ estado: 'activo' }).eq('id', idCredito);

        if (cliente.whatsapp) {
            const modalidad = (credito.frecuencia_pago || "Fija").replace(/.*Cobro\s+/i, "").replace("📅", "").trim();
            const msj = `=== SISTEMA ALPHA ===\n\n🆔 Ref: ${codigoSMS}\n👤 Cliente: ${nomLimpio}\n\nHola, te informamos que tu crédito ha sido RESTAURADO y está ACTIVO.\n💰 Monto: $${parseFloat(credito.monto_capital).toFixed(2)}\n💵 Cuota: $${parseFloat(credito.valor_cuota).toFixed(2)}\n🔄 Modalidad: ${modalidad}\n📊 Total: $${parseFloat(credito.total_pagar).toFixed(2)}\n🔢 Cuotas: ${credito.num_cuotas}\n\n🚫 NO RESPONDER A ESTE MENSAJE.`;
            await enviarSMSDepuracionMovil(cliente.whatsapp, msj);
            await new Promise(r => setTimeout(r, 2000));
            if (cliente.whatsapp.trim() !== "0939836191") await enviarSMSDepuracionMovil("0939836191", `[ALERTA RESTAURACIÓN CRÉDITO]\n\n${msj}`);
        }

        alert("✅ Crédito reactivado exitosamente.");
        window.cargarPapeleraMovil('creditos');
    } catch (e) { alert("❌ Error al restaurar: " + e.message); }
};

window.forzarEliminacionCreditoMovil = async function(idCredito) {
    if (!confirm(`⚠️ ¿Destruir permanentemente el crédito anulado #${idCredito}?`)) return;
    if (prompt("🔒 Escribe ELIMINAR para purgar el registro:") !== 'ELIMINAR') { alert("Cancelado."); return; }
    try {
        await window.supabaseClient.from('creditos').delete().eq('id', idCredito);
        alert("💥 Registro eliminado para siempre.");
        window.cargarPapeleraMovil('creditos');
    } catch (e) { alert("❌ Error: " + e.message); }
};

// VISOR DE PAGOS FINALIZADOS
window.verHistorialPagosFinalizadoMovil = async function(idCredito, nombreCliente) {
    try {
        const { data: pagos, error } = await window.supabaseClient.from('historial_pagos').select('*').eq('id_credito', idCredito).order('numero_pago', { ascending: true });
        if (error) throw error;
        if (!pagos || pagos.length === 0) { alert(`⚠️ Sin pagos registrados para #${idCredito}.`); return; }

        const totalPagado = pagos.reduce((s, p) => s + parseFloat(p.abono_total || 0), 0);
        const filas = pagos.map(p => {
            const f = new Date(p.fecha_pago).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
            return `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #e2e8f0; font-size:12px;">
                <div><b>#${p.numero_pago}</b> • ${f} <span style="background:#e2e8f0; padding:1px 5px; border-radius:4px; font-size:10px;">${(p.forma_pago||'EFECTIVO').toUpperCase()}</span></div>
                <b style="color:#166534;">$${parseFloat(p.abono_total).toFixed(2)}</b>
            </div>`;
        }).join('');

        const modalId = 'modal-hist-finalizado-movil';
        document.getElementById(modalId)?.remove();
        document.body.insertAdjacentHTML('beforeend', `
        <div id="${modalId}" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,23,42,0.8); display:flex; justify-content:center; align-items:center; z-index:9999; padding:15px; box-sizing:border-box;">
            <div style="background:white; border-radius:12px; width:100%; max-width:420px; max-height:85vh; display:flex; flex-direction:column; overflow:hidden;">
                <div style="background:#0f172a; padding:14px 16px; display:flex; justify-content:space-between; align-items:center; color:white;">
                    <div><b style="font-size:15px;">📑 Auditoría de Pagos</b><div style="font-size:11px; color:#94a3b8;">CRÉDITO #${idCredito} - ${nombreCliente}</div></div>
                    <button onclick="document.getElementById('${modalId}').remove()" style="background:#ef4444; color:white; border:none; border-radius:50%; width:28px; height:28px; font-weight:bold;">X</button>
                </div>
                <div style="padding:12px 16px; overflow-y:auto;">${filas}</div>
                <div style="padding:12px 16px; background:#f8fafc; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:11px; font-weight:bold; color:#64748b;">TOTAL RECAUDADO</span>
                    <b style="font-size:18px; color:#166534;">$${totalPagado.toFixed(2)}</b>
                </div>
            </div>
        </div>`);
    } catch (e) { alert("❌ Error: " + e.message); }
};
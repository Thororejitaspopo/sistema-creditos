// =========================================================================
// 👥 MÓDULO MAESTRO DE CLIENTES (CLON MÓVIL EXACTO DE PC)
// Archivo: modulos_movil/clientes_movil.js
// =========================================================================

window.listaClientesGlobalMovil = [];
window.idClienteEditandoMovil = null;
window.paginaActualClientesMovil = 1;
window.clientesPorPaginaMovil = 10;

async function enviarSMSClienteMovil(numero, mensaje) {
    if (typeof invocarSMSDesdeMovil === 'function') {
        return await invocarSMSDesdeMovil(numero, mensaje);
    }
    try {
        const numLimpio = String(numero).replace(/\D/g, '');
        const url = `https://trigger.macrodroid.com/554f217c-000a-4581-896c-551d96459fb2/sms_credito?numero=${numLimpio}&mensaje=${encodeURIComponent(mensaje)}`;
        await fetch(url, { method: 'GET', mode: 'no-cors' });
        return true;
    } catch (e) {
        console.error("Error SMS Cliente Móvil:", e);
        return false;
    }
}

// 1. CARGAR CLIENTES ACTIVOS
window.cargarClientesMovil = async function() {
    const contenedor = document.getElementById('lista-clientes-movil');
    if (!contenedor) return;
    contenedor.innerHTML = '<p style="text-align:center; color:#64748b; font-size:13px; padding:15px;">⏳ Cargando base de datos...</p>';

    try {
        const supa = window.supabaseClient;
        if (!supa) throw new Error("Supabase no conectado.");

        const { data: clientes, error } = await supa
            .from('clientes')
            .select('*')
            .neq('estado', 'inactivo')
            .order('id', { ascending: false });

        if (error) throw error;

        window.listaClientesGlobalMovil = clientes || [];
        window.renderizarListaClientesMovil(window.listaClientesGlobalMovil);
        window.actualizarComboGarantesMovil(window.listaClientesGlobalMovil);
    } catch (e) {
        contenedor.innerHTML = `<p style="text-align:center; color:#ef4444; font-size:13px;">❌ Error: ${e.message}</p>`;
    }
};

window.actualizarComboGarantesMovil = function(clientes) {
    const combo = document.getElementById('cli-garante-movil');
    if (!combo) return;
    const prev = combo.value;
    combo.innerHTML = '<option value="">🚫 Sin Garante / Cliente Directo</option>';
    clientes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.text = `👤 ${c.nombres.toUpperCase()} ${c.apellidos.toUpperCase()} (C.I: ${c.cedula})`;
        combo.appendChild(opt);
    });
    if (prev) combo.value = prev;
};

// 2. ACTUALIZAR LÍMITE SEGÚN NIVEL
window.actualizarLimiteMovil = function() {
    const nivel = document.getElementById('cli-nivel-movil')?.value || '';
    const campo = document.getElementById('cli-limite-movil');
    if (!campo) return;

    let limite = 2;
    if (nivel.includes('Plata')) limite = 4;
    else if (nivel.includes('Oro')) limite = 6;
    else if (nivel.includes('Platino')) limite = 8;
    else if (nivel.includes('Diamante')) limite = 15;
    campo.value = limite;
};

// 3. REGISTRAR O ACTUALIZAR CLIENTE
window.registrarClienteMovil = async function() {
    const supa = window.supabaseClient;
    const idEditando = window.idClienteEditandoMovil;

    const nombres = document.getElementById('cli-nombres-movil').value.trim();
    const apellidos = document.getElementById('cli-apellidos-movil').value.trim();
    const cedula = document.getElementById('cli-cedula-movil').value.trim();
    const whatsapp = document.getElementById('cli-whatsapp-movil').value.trim();
    const correo = document.getElementById('cli-correo-movil').value.trim();
    const sector = document.getElementById('cli-sector-movil').value;
    const ruta = document.getElementById('cli-ruta-movil').value.trim();
    const perfil_cobro = document.getElementById('cli-perfil-mora-movil').value || 'Normal';
    const garanteVal = document.getElementById('cli-garante-movil').value;
    const garante_id = garanteVal ? parseInt(garanteVal) : null;
    const direccion = document.getElementById('cli-direccion-movil').value.trim();
    const referencia = document.getElementById('cli-referencia-movil').value.trim();
    const tel_referencia = document.getElementById('cli-tel-referencia-movil').value.trim();
    const observaciones = document.getElementById('cli-observaciones-movil').value.trim();
    const nivel = document.getElementById('cli-nivel-movil').value;
    const limite_creditos = parseInt(document.getElementById('cli-limite-movil').value) || 2;

    if (!nombres || !apellidos || !cedula || !whatsapp || !correo || !sector || !ruta) {
        alert("❌ Error: Nombres, Apellidos, Cédula, WhatsApp, Correo, Sector y Ruta son OBLIGATORIOS.");
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        alert("⚠️ El formato del correo electrónico no es válido.");
        return;
    }
    if (cedula.length < 10) {
        alert("⚠️ La cédula debe tener al menos 10 dígitos.");
        return;
    }
    if (whatsapp.length !== 10) {
        alert("⚠️ El número de WhatsApp debe tener exactamente 10 dígitos.");
        return;
    }

    const lista = window.listaClientesGlobalMovil;
    if (lista.some(c => c.cedula === cedula && c.id !== idEditando)) {
        alert("⛔ Esta Cédula / RUC ya está registrada con otro cliente.");
        return;
    }

    const numeroGerente = "0939836191";
    if (lista.some(c => c.whatsapp === whatsapp && c.id !== idEditando && c.whatsapp !== numeroGerente)) {
        alert("⛔ Este WhatsApp ya está asignado a otro cliente.");
        return;
    }
    if (lista.some(c => c.correo && c.correo.toLowerCase() === correo.toLowerCase() && c.id !== idEditando)) {
        alert("⛔ Este Correo Electrónico ya está registrado con otro cliente.");
        return;
    }

    // Fechas y código bancario
    const ahora = new Date();
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const nombreDia = dias[ahora.getDay()];
    const diaNum = String(ahora.getDate()).padStart(2, '0');
    const mesNombre = meses[ahora.getMonth()];
    const anio = ahora.getFullYear();
    let h = ahora.getHours(); const min = String(ahora.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'Pm' : 'Am'; h = h % 12 || 12;
    const fechaRegistro = `${nombreDia} ${diaNum}/${mesNombre}/${anio} hora ${h}:${min} ${ampm}`;

    const diaCap = nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1);
    const fechaHoraSMS = `${diaCap} ${diaNum}/${mesNombre}/${String(anio).slice(-2)} | ${ahora.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}`;
    const codigoUnico = `${nombres.charAt(0).toUpperCase()}${apellidos.charAt(0).toUpperCase()}-${cedula.slice(-4)}`;
    const nombreCompleto = `${nombres.toUpperCase()} ${apellidos.toUpperCase()}`;

    // Fotos opcionales
    let urlFotoCliente = null, urlFotoCedula = null;
    if (idEditando !== null) {
        const existe = lista.find(c => c.id === idEditando);
        if (existe) {
            urlFotoCliente = existe.url_foto_cliente;
            urlFotoCedula = existe.url_foto_cedula;
        }
    }

    const inputFotoCli = document.getElementById('cli-foto-perfil-movil');
    if (inputFotoCli && inputFotoCli.files.length > 0) {
        const arch = inputFotoCli.files[0];
        const nomArch = `perfil_${cedula}_${Date.now()}.${arch.name.split('.').pop()}`;
        const { error: errP } = await supa.storage.from('fotos_clientes').upload(nomArch, arch);
        if (errP) { alert("⚠️ Error foto perfil: " + errP.message); return; }
        urlFotoCliente = supa.storage.from('fotos_clientes').getPublicUrl(nomArch).data.publicUrl;
    }

    const inputFotoCed = document.getElementById('cli-foto-cedula-movil');
    if (inputFotoCed && inputFotoCed.files.length > 0) {
        const archC = inputFotoCed.files[0];
        const nomArchC = `cedula_${cedula}_${Date.now()}.${archC.name.split('.').pop()}`;
        const { error: errC } = await supa.storage.from('fotos_clientes').upload(nomArchC, archC);
        if (errC) { alert("⚠️ Error foto cédula: " + errC.message); return; }
        urlFotoCedula = supa.storage.from('fotos_clientes').getPublicUrl(nomArchC).data.publicUrl;
    }

    const datosCliente = {
        nombres, apellidos, cedula, whatsapp, correo, sector, ruta, direccion, referencia,
        tel_referencia, observaciones, nivel, limite_creditos, garante_id, perfil_cobro,
        fecha_ingreso: idEditando === null ? fechaRegistro : (lista.find(c => c.id === idEditando)?.fecha_ingreso || fechaRegistro),
        usuario_registro: 'Administrador (Móvil)',
        url_foto_cliente: urlFotoCliente,
        url_foto_cedula: urlFotoCedula
    };

    try {
        if (idEditando === null) {
            const { error } = await supa.from('clientes').insert([datosCliente]);
            if (error) throw error;

            const cobrar = confirm(`💰 COBRO DE AFILIACIÓN\n\n¿Deseas cobrar $1.00 por ingresar este cliente?\n\n🟢 ACEPTAR = Cobrar $1.00\n🔴 CANCELAR = Gratis`);
            if (cobrar) {
                const { data: caja } = await supa.from('cajas_capital').select('saldo_actual').eq('id', 1).single();
                await supa.from('cajas_capital').update({ saldo_actual: parseFloat(caja.saldo_actual) + 1.00 }).eq('id', 1);
                await supa.from('historial_capital').insert([{ caja_id: 1, monto: 1.00, concepto: `🟢 INGRESO: Afiliación nuevo cliente - ${codigoUnico} ${nombreCompleto}` }]);
            }

            const msj = `=== SISTEMA ALPHA ===\n${fechaHoraSMS}\n\n🆔 ${codigoUnico}\n\nHola ${nombreCompleto}, tu registro ha sido exitoso.\n\nA partir de ahora podrás acceder a nuestra línea de créditos.\n\nConserva este msj. ¡Gracias!\n🚫 POR FAVOR, NO RESPONDER A ESTE MENSAJE.`;
            await enviarSMSClienteMovil(whatsapp, msj);
            if (whatsapp !== numeroGerente) await enviarSMSClienteMovil(numeroGerente, `[COPIA NUEVO] ${codigoUnico}\n\n${msj}`);

            alert(cobrar ? `✅ ¡${codigoUnico} guardado, $1.00 cobrado y SMS enviado!` : `✅ ¡${codigoUnico} guardado (Gratis) y SMS enviado!`);
        } else {
            const { error } = await supa.from('clientes').update(datosCliente).eq('id', idEditando);
            if (error) throw error;

            const cobrar = confirm(`💰 COBRO POR ACTUALIZACIÓN\n\n¿Deseas cobrar $0.50 por actualizar los datos?\n\n🟢 ACEPTAR = Cobrar $0.50\n🔴 CANCELAR = Gratis`);
            if (cobrar) {
                const { data: caja } = await supa.from('cajas_capital').select('saldo_actual').eq('id', 1).single();
                await supa.from('cajas_capital').update({ saldo_actual: parseFloat(caja.saldo_actual) + 0.50 }).eq('id', 1);
                await supa.from('historial_capital').insert([{ caja_id: 1, monto: 0.50, concepto: `🟢 INGRESO: Actualización de datos - ${codigoUnico} ${nombreCompleto}` }]);
            }

            const msj = `=== SISTEMA ALPHA ===\n${fechaHoraSMS}\n\n🆔 ${codigoUnico}\n\nHola ${nombreCompleto}, tus datos han sido actualizados exitosamente en nuestro sistema.\n\nConserva este msj. ¡Gracias!\n🚫 POR FAVOR, NO RESPONDER A ESTE MENSAJE.`;
            await enviarSMSClienteMovil(whatsapp, msj);
            if (whatsapp !== numeroGerente) await enviarSMSClienteMovil(numeroGerente, `[COPIA EDICIÓN] ${codigoUnico}\n\n${msj}`);

            alert(cobrar ? `✅ ¡Datos de ${codigoUnico} actualizados, $0.50 cobrados y SMS enviado!` : `✅ ¡Datos de ${codigoUnico} actualizados (Gratis) y SMS enviado!`);
        }

        window.limpiarFormularioClientesMovil();
        await window.cargarClientesMovil();
    } catch (e) {
        alert("❌ Error al guardar cliente: " + e.message);
    }
};

// 4. LISTADO, BUSCADOR Y PAGINACIÓN
window.filtrarClientesMovil = function() {
    const txt = (document.getElementById('input-buscar-cliente-movil')?.value || '').toLowerCase().trim();
    const filtrados = window.listaClientesGlobalMovil.filter(c =>
        c.nombres.toLowerCase().includes(txt) ||
        c.apellidos.toLowerCase().includes(txt) ||
        (c.cedula || '').includes(txt)
    );
    window.paginaActualClientesMovil = 1;
    window.renderizarListaClientesMovil(filtrados);
};

window.renderizarListaClientesMovil = function(clientes) {
    const contenedor = document.getElementById('lista-clientes-movil');
    const pagCont = document.getElementById('paginacion-clientes-movil');
    if (!contenedor) return;

    if (!clientes || clientes.length === 0) {
        contenedor.innerHTML = '<p style="text-align:center; color:#64748b; font-size:13px; padding:15px;">No hay clientes en el sistema.</p>';
        if (pagCont) pagCont.innerHTML = '';
        return;
    }

    const inicio = (window.paginaActualClientesMovil - 1) * window.clientesPorPaginaMovil;
    const lote = clientes.slice(inicio, inicio + window.clientesPorPaginaMovil);

    contenedor.innerHTML = lote.map(c => {
        const cod = 'CLI-' + String(c.id).padStart(6, '0');
        const inic = ((c.nombres[0] || '') + (c.apellidos[0] || '')).toUpperCase();
        let colorNivel = '#0369a1';
        if ((c.nivel || '').includes('Oro')) colorNivel = '#16a34a';
        else if ((c.nivel || '').includes('Plata')) colorNivel = '#475569';
        else if ((c.nivel || '').includes('Diamante')) colorNivel = '#7c3aed';

        return `
        <div style="background:white; border:1px solid #e2e8f0; border-radius:12px; padding:12px; margin-bottom:10px; box-shadow:0 2px 4px rgba(0,0,0,0.03); display:flex; justify-content:space-between; align-items:center; gap:10px;">
            <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                <div style="width:40px; height:40px; border-radius:50%; background:#e0f2fe; color:#0284c7; font-weight:900; font-size:14px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${inic}</div>
                <div style="min-width:0;">
                    <div style="font-size:10px; font-weight:bold; color:#0284c7;">${cod}</div>
                    <div style="font-size:13px; font-weight:900; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.nombres.toUpperCase()} ${c.apellidos.toUpperCase()}</div>
                    <div style="font-size:11px; color:#64748b;">C.I: ${c.cedula} | ${c.ruta || 'S/R'}</div>
                    <div style="font-size:10px; font-weight:bold; color:${colorNivel};">${c.nivel || 'Bronce'}</div>
                </div>
            </div>
            <div style="display:flex; gap:6px; flex-shrink:0;">
                <button onclick="verClienteMovil(${c.id})" style="background:#f1f5f9; border:none; border-radius:8px; width:34px; height:34px; font-size:15px;">👁️</button>
                <button onclick="prepararEdicionClienteMovil(${c.id})" style="background:#fef3c7; border:none; border-radius:8px; width:34px; height:34px; font-size:15px;">✏️</button>
                <button onclick="redirigirACrearCreditoMovil(${c.id})" style="background:#dcfce7; border:none; border-radius:8px; width:34px; height:34px; font-size:15px;">💳</button>
                <button onclick="eliminarClienteMovil(${c.id})" style="background:#fee2e2; border:none; border-radius:8px; width:34px; height:34px; font-size:15px;">🗑️</button>
            </div>
        </div>`;
    }).join('');

    if (pagCont) {
        const totalPags = Math.ceil(clientes.length / window.clientesPorPaginaMovil);
        if (totalPags <= 1) { pagCont.innerHTML = ''; return; }
        pagCont.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                <button onclick="cambiarPaginaClientesMovil(${window.paginaActualClientesMovil - 1})" ${window.paginaActualClientesMovil === 1 ? 'disabled' : ''} style="padding:7px 14px; background:white; border:1px solid #cbd5e1; border-radius:8px; font-weight:bold; font-size:12px;">◀ Anterior</button>
                <span style="font-size:12px; font-weight:bold; color:#475569;">Pág. ${window.paginaActualClientesMovil} de ${totalPags}</span>
                <button onclick="cambiarPaginaClientesMovil(${window.paginaActualClientesMovil + 1})" ${window.paginaActualClientesMovil >= totalPags ? 'disabled' : ''} style="padding:7px 14px; background:white; border:1px solid #cbd5e1; border-radius:8px; font-weight:bold; font-size:12px;">Siguiente ▶</button>
            </div>`;
    }
};

window.cambiarPaginaClientesMovil = function(pag) {
    window.paginaActualClientesMovil = pag;
    const txt = (document.getElementById('input-buscar-cliente-movil')?.value || '').toLowerCase().trim();
    const lista = txt ? window.listaClientesGlobalMovil.filter(c => c.nombres.toLowerCase().includes(txt) || c.apellidos.toLowerCase().includes(txt) || (c.cedula || '').includes(txt)) : window.listaClientesGlobalMovil;
    window.renderizarListaClientesMovil(lista);
};

// 5. EDITAR, LIMPIAR, VER, ELIMINAR Y ATAJO A CRÉDITO
window.prepararEdicionClienteMovil = function(id) {
    const c = window.listaClientesGlobalMovil.find(x => x.id === id);
    if (!c) return;
    window.idClienteEditandoMovil = id;

    document.getElementById('cli-nombres-movil').value = c.nombres || '';
    document.getElementById('cli-apellidos-movil').value = c.apellidos || '';
    document.getElementById('cli-cedula-movil').value = c.cedula || '';
    document.getElementById('cli-whatsapp-movil').value = c.whatsapp || '';
    document.getElementById('cli-correo-movil').value = c.correo || '';
    document.getElementById('cli-garante-movil').value = c.garante_id || '';
    document.getElementById('cli-sector-movil').value = c.sector || '';
    document.getElementById('cli-ruta-movil').value = c.ruta || '';
    document.getElementById('cli-direccion-movil').value = c.direccion || '';
    document.getElementById('cli-referencia-movil').value = c.referencia || '';
    document.getElementById('cli-tel-referencia-movil').value = c.tel_referencia || '';
    document.getElementById('cli-observaciones-movil').value = c.observaciones || '';
    document.getElementById('cli-nivel-movil').value = c.nivel || '🥉 Bronce(Nuevo)';
    document.getElementById('cli-limite-movil').value = c.limite_creditos || 2;
    document.getElementById('cli-perfil-mora-movil').value = c.perfil_cobro || 'Normal';

    const btn = document.getElementById('btn-guardar-cliente-movil');
    if (btn) {
        btn.innerText = "💾 ACTUALIZAR DATOS ALPHA";
        btn.style.background = "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)";
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.limpiarFormularioClientesMovil = function() {
    window.idClienteEditandoMovil = null;
    ['cli-nombres-movil','cli-apellidos-movil','cli-cedula-movil','cli-whatsapp-movil','cli-correo-movil','cli-garante-movil','cli-sector-movil','cli-ruta-movil','cli-direccion-movil','cli-referencia-movil','cli-tel-referencia-movil','cli-observaciones-movil','cli-foto-perfil-movil','cli-foto-cedula-movil'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('cli-nivel-movil').value = '🥉 Bronce(Nuevo)';
    document.getElementById('cli-limite-movil').value = '2';
    document.getElementById('cli-perfil-mora-movil').value = 'Normal';

    const btn = document.getElementById('btn-guardar-cliente-movil');
    if (btn) {
        btn.innerText = "💾 REGISTRAR CLIENTE ALPHA";
        btn.style.background = "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)";
    }
};

window.verClienteMovil = function(id) {
    const c = window.listaClientesGlobalMovil.find(x => x.id === id);
    if (!c) return;

    let nombreGarante = "🚫 Sin Garante / Cliente Directo";
    if (c.garante_id) {
        const g = window.listaClientesGlobalMovil.find(x => x.id === c.garante_id);
        if (g) nombreGarante = `👤 ${g.nombres.toUpperCase()} ${g.apellidos.toUpperCase()} (C.I: ${g.cedula})`;
    }

    const fotoCli = c.url_foto_cliente ? `<div style="text-align:center; margin-bottom:12px;"><img src="${c.url_foto_cliente}" style="width:90px; height:90px; border-radius:50%; object-fit:cover; border:3px solid #0284c7;"></div>` : '';
    const fotoCed = c.url_foto_cedula ? `<div style="text-align:center; margin-top:12px; background:#f8fafc; padding:8px; border-radius:8px; border:1px dashed #cbd5e1;"><img src="${c.url_foto_cedula}" style="max-width:100%; max-height:140px; border-radius:6px;"><br><a href="${c.url_foto_cedula}" target="_blank" style="font-size:11px; color:#0284c7; font-weight:bold;">👁️ Ver Cédula Completa</a></div>` : '';

    const modalId = 'modal-ver-cliente-movil';
    document.getElementById(modalId)?.remove();
    document.body.insertAdjacentHTML('beforeend', `
    <div id="${modalId}" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,23,42,0.8); display:flex; justify-content:center; align-items:center; z-index:9999; padding:14px; box-sizing:border-box;">
        <div style="background:white; border-radius:14px; width:100%; max-width:420px; max-height:88vh; display:flex; flex-direction:column; overflow:hidden;">
            <div style="background:#0f172a; color:white; padding:14px 16px; display:flex; justify-content:space-between; align-items:center;">
                <b style="font-size:15px;">👤 Ficha del Cliente</b>
                <button onclick="document.getElementById('${modalId}').remove()" style="background:#ef4444; color:white; border:none; border-radius:50%; width:28px; height:28px; font-weight:bold;">X</button>
            </div>
            <div style="padding:14px 16px; overflow-y:auto; font-size:12px; line-height:1.6; color:#334155;">
                ${fotoCli}
                <div><b>Código:</b> <span style="color:#0284c7; font-weight:900;">CLI-${String(c.id).padStart(6,'0')}</span></div>
                <div><b>Nombre:</b> ${c.nombres.toUpperCase()} ${c.apellidos.toUpperCase()}</div>
                <div><b>Cédula:</b> ${c.cedula}</div>
                <div><b>WhatsApp:</b> ${c.whatsapp || 'N/A'}</div>
                <div><b>Correo:</b> ${c.correo || 'N/A'}</div>
                <div><b>Garante:</b> ${nombreGarante}</div>
                <div><b>Sector / Ruta:</b> ${c.sector} (${c.ruta})</div>
                <div><b>Dirección:</b> ${c.direccion || 'N/A'}</div>
                <div><b>Referencia:</b> ${c.referencia || 'N/A'} (${c.tel_referencia || 'N/A'})</div>
                <div><b>Nivel:</b> ${c.nivel} (Límite: ${c.limite_creditos})</div>
                <div><b>Perfil Mora:</b> ${c.perfil_cobro || 'Normal'}</div>
                <div><b>Observaciones:</b> <i>"${c.observaciones || 'Ninguna'}"</i></div>
                ${fotoCed}
                <div style="margin-top:10px; padding-top:8px; border-top:1px solid #e2e8f0; color:#64748b; font-size:11px;">📅 ${c.fecha_ingreso || 'Sin fecha'} • 👤 ${c.usuario_registro || 'Admin'}</div>
            </div>
        </div>
    </div>`);
};

window.eliminarClienteMovil = async function(id) {
    try {
        const supa = window.supabaseClient;
        const { data: creditos, error } = await supa.from('creditos').select('id').eq('cliente_id', id);
        if (error) throw error;

        if (!creditos || creditos.length === 0) {
            if (!confirm("🗑️ Este cliente NO tiene historial de créditos.\n\n¿Deseas ELIMINARLO permanentemente?")) return;
            await supa.from('clientes').delete().eq('id', id);
            alert("✅ Cliente eliminado definitivamente.");
        } else {
            if (!confirm(`📂 Este cliente tiene ${creditos.length} crédito(s) en su historial.\n\n¿Deseas ARCHIVARLO (Inactivarlo) para proteger tu contabilidad?`)) return;
            await supa.from('clientes').update({ estado: 'inactivo' }).eq('id', id);
            alert("✅ Cliente archivado exitosamente.");
        }
        if (window.idClienteEditandoMovil === id) window.limpiarFormularioClientesMovil();
        await window.cargarClientesMovil();
    } catch (e) {
        alert("❌ Error: " + e.message);
    }
};

window.redirigirACrearCreditoMovil = function(clienteId) {
    if (typeof abrirModulo === 'function') {
        abrirModulo('credito');
        setTimeout(() => {
            const sel = document.getElementById('cred-cliente-id-movil');
            if (sel) sel.value = String(clienteId);
        }, 450);
    }
};
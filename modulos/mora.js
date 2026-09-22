
// =========================================================================
// ⚖️ MÓDULO MAESTRO DE GESTIÓN DE MORA Y CONVENIOS (VERSIÓN DEFINITIVA)
// =========================================================================

window.cargarTablaGestionMora = async function() {
    const contenedor = document.getElementById('contenedor-tabla-mora');
    const selectorBuscador = document.getElementById('buscador-gestion-mora');
    if (!contenedor) return;
    
    // 1. CAPTURAMOS EL CLIENTE ELEGIDO EN EL SELECTOR
    const clienteSeleccionado = selectorBuscador ? selectorBuscador.value : '';

    contenedor.innerHTML = '<p style="color:#64748b; font-size:14px; text-align:center;">⏳ Escaneando cartera y calculando saldos reales...</p>';
    
    try {
        // 🔥 TRAEMOS LOS DATOS: ACTIVOS Y CONGELADOS
        const { data: creditosActivos, error } = await supabaseClient
            .from('creditos')
            .select(`id, monto_capital, total_pagar, monto_mora, saldo_pendiente, fecha_emision, tasa_interes, estado, clientes!inner(id, nombres, apellidos, cedula), historial_pagos(abono_total)`)
            .in('estado', ['activo', 'congelado'])
            .order('fecha_emision', { ascending: true });

        if (error) throw error;

        // 🌟 MAGIA NUEVA: Traemos el historial para calcular el "N° de Crédito del Cliente"
        const { data: historialTodos } = await supabaseClient
            .from('creditos')
            .select('id, cliente_id')
            .order('id', { ascending: true });

        const mapNumCreditoLocal = {};
        if (historialTodos) {
            const conteoPorCliente = {};
            historialTodos.forEach(c => {
                conteoPorCliente[c.cliente_id] = (conteoPorCliente[c.cliente_id] || 0) + 1;
                mapNumCreditoLocal[c.id] = conteoPorCliente[c.cliente_id];
            });
        }

        if (!creditosActivos || creditosActivos.length === 0) {
            contenedor.innerHTML = `<p style="color: #10b981; font-weight: bold; text-align:center;">✨ Toda tu cartera está limpia. No hay créditos pendientes.</p>`;
            if (selectorBuscador) selectorBuscador.innerHTML = '<option value="">🌍 TODOS LOS CLIENTES ACTIVOS</option>';
            return;
        }

        // 2. LLENAR EL SELECTOR CON LOS CLIENTES (SIN REPETIR)
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
                const nombreCompleto = `${cli.nombres} ${cli.apellidos}`.toUpperCase();
                opcionesHTML += `<option value="${cli.id}">${nombreCompleto} (${cli.cedula})</option>`;
            });
            
            selectorBuscador.innerHTML = opcionesHTML;
            if (clienteSeleccionado) {
                selectorBuscador.value = clienteSeleccionado;
            }
        }

        // 3. FILTRAMOS LOS RESULTADOS SI ELEGISTE ALGO EN EL SELECTOR
        let creditosFiltrados = creditosActivos || [];
        const valorFiltro = selectorBuscador ? selectorBuscador.value : '';

        if (valorFiltro !== '') {
            creditosFiltrados = creditosFiltrados.filter(cre => cre.clientes && cre.clientes.id.toString() === valorFiltro);
        }

        if (creditosFiltrados.length === 0) {
             contenedor.innerHTML = `<p style="color: #ef4444; font-weight: bold; text-align:center;">🔍 Este cliente no tiene créditos pendientes en este momento.</p>`;
             return;
        }

        // 4. DIBUJAMOS LA TABLA CON LOS DATOS FILTRADOS Y MATEMÁTICAS EXACTAS
        let filasHTML = creditosFiltrados.map(cre => {
            const cli = cre.clientes || {};
            const nombreCliente = `${cli.nombres} ${cli.apellidos}`.toUpperCase();
            
            // ==========================================================
            // 🛡️ REFERENCIA BANCARIA Y NÚMERO DE CRÉDITO DEL CLIENTE
            // ==========================================================
            const inicialN = cli.nombres ? cli.nombres.charAt(0).toUpperCase() : '';
            const inicialA = cli.apellidos ? cli.apellidos.charAt(0).toUpperCase() : '';
            const ultimos4 = cli.cedula ? cli.cedula.slice(-4) : '0000';
            const refBancaria = `REF: ${inicialN}${inicialA}-${ultimos4}`;
            
            const esCongelado = cre.estado === 'congelado';
            const badgeCongelado = esCongelado ? `<span style="background: #e0f2fe; color: #0284c7; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-left: 8px;">🧊 CONGELADO</span>` : '';
            
            const numLocal = mapNumCreditoLocal[cre.id] || 1;
            let creCifrado = typeof cifrarNumeroCredito === 'function' ? cifrarNumeroCredito(numLocal).toUpperCase() : '';
            let etiquetaCRE = creCifrado ? `CRE #${numLocal} [${creCifrado}]` : `CRE #${numLocal}`;

            const fEmi = new Date(cre.fecha_emision);
            const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
            const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            const nombreDia = dias[fEmi.getDay()];
            const diaCap = nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1);
            const fechaTxt = `${diaCap} ${fEmi.getDate()}/${meses[fEmi.getMonth()]}/${fEmi.getFullYear()}`;

            // 🔥 MATEMÁTICA PURA Y DURA ALPHA
            const moraExtra = parseFloat(cre.monto_mora) || 0;
            const prestamoOriginal = parseFloat(cre.total_pagar) || 0;
            
            // 1. Total a Pagar Real: Préstamo original + todas las moras acumuladas
            const deudaTotalReal = prestamoOriginal + moraExtra;

            // 2. Sumamos todo el dinero que el cliente ya abonó
            const pagos = cre.historial_pagos || [];
            const totalAbonado = pagos.reduce((sum, pago) => sum + (parseFloat(pago.abono_total) || 0), 0);
            
            // 3. Saldo Neto Actual = La deuda real menos lo que ya pagó
            let saldoReal = deudaTotalReal - totalAbonado;
            if (saldoReal < 0) saldoReal = 0; 

            const tasaOriginal = parseFloat(cre.tasa_interes) || 20;

            return `
            <tr style="border-bottom: 1px solid #e2e8f0; transition: background 0.2s; ${esCongelado ? 'background: #f8fafc; border-left: 4px solid #0284c7;' : ''}" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='${esCongelado ? '#f8fafc' : 'transparent'}'">
                <td style="padding: 12px; font-size: 12px;">
                    <div style="color: #64748b; font-weight: bold; font-size: 10px; margin-bottom: 4px; letter-spacing: 0.5px;">ID: ${cre.id} | ${refBancaria}</div>
                    <span style="background: #e0f2fe; color: #0369a1; padding: 3px 6px; border-radius: 4px; font-weight: bold;">${etiquetaCRE}</span>
                </td>
                <td style="padding: 12px; font-weight: bold; font-size: 13px;">${nombreCliente} ${badgeCongelado}</td>
                <td style="padding: 12px; font-size: 12px; color: #475569;">${fechaTxt}</td>
                <td style="padding: 12px; text-align: center; font-weight: bold;">$${parseFloat(cre.monto_capital).toFixed(2)}</td>
                <td style="padding: 12px; text-align: center; color: #ca8a04; font-weight: bold;">$${deudaTotalReal.toFixed(2)}</td>
                
                <!-- 🔥 AQUÍ INYECTAMOS LA NUEVA COLUMNA DE ABONOS -->
                <td style="padding: 12px; text-align: center; color: #16a34a; font-weight: bold;">$${totalAbonado.toFixed(2)}</td>
                
                <td style="padding: 12px; text-align: center; color: #ef4444; font-weight: 900;">$${saldoReal.toFixed(2)}</td>
                <td style="padding: 12px; text-align: center;">
                    <button onclick="abrirPanelSancion(${cre.id}, '${nombreCliente.replace(/'/g, "\\'")}', ${cre.monto_capital}, ${deudaTotalReal}, ${saldoReal}, ${tasaOriginal}, '${cre.estado}', '${etiquetaCRE}', '${refBancaria}')" style="background: #0f172a; color: white; border: none; padding: 6px 12px; border-radius: 5px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        ⚙️ GESTIONAR
                    </button>
                </td>
            </tr>`;
        }).join('');

        contenedor.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
            <thead>
                <tr style="background: #f1f5f9; text-align: left; border-bottom: 2px solid #cbd5e1;">
                    <th style="padding: 12px; font-size: 12px;">N° CRÉDITO</th>
                    <th style="padding: 12px; font-size: 12px;">CLIENTE</th>
                    <th style="padding: 12px; font-size: 12px;">EMISIÓN</th>
                    <th style="padding: 12px; font-size: 12px; text-align: center;">CAPITAL INTACTO</th>
                    <th style="padding: 12px; font-size: 12px; text-align: center;">TOTAL A PAGAR</th>
                    <!-- 🔥 CABECERA DE LA NUEVA COLUMNA -->
                    <th style="padding: 12px; font-size: 12px; text-align: center;">ABONOS</th>
                    <th style="padding: 12px; font-size: 12px; text-align: center;">SALDO ACTUAL</th>
                    <th style="padding: 12px; font-size: 12px; text-align: center;">ACCIÓN</th>
                </tr>
            </thead>
            <tbody>${filasHTML}</tbody>
        </table>`;
    } catch (error) {
        contenedor.innerHTML = `<p style="color:red; text-align:center;">❌ Error: ${error.message}</p>`;
    }
};
// =========================================================================
// ⚙️ PANEL VISUAL DE SANCIONES Y CONEXIÓN A BASE DE DATOS
// =========================================================================
// =========================================================================
// ⚙️ PANEL VISUAL DE SANCIONES Y CONEXIÓN A BASE DE DATOS
// =========================================================================
// =========================================================================
// ⚙️ PANEL VISUAL DE SANCIONES Y CONEXIÓN A BASE DE DATOS
// =========================================================================
window.abrirPanelSancion = function(idCredito, nombreCliente, capital, total, saldo, tasaOriginal, estadoActual, etiquetaCRE, refBancaria) {
    const capitalNum = parseFloat(capital) || 1;
    const saldoNum = parseFloat(saldo) || 0; 
    const interesPorcentaje = parseFloat(tasaOriginal) || 20;
    const esCongelado = estadoActual === 'congelado';
    
    const multaSobreCapital = capitalNum * (interesPorcentaje / 100);
    const multaSobreSaldo = saldoNum * (interesPorcentaje / 100);

    const modalId = 'modal-sancion-alpha';
    const modalPrevio = document.getElementById(modalId);
    if (modalPrevio) modalPrevio.remove();

    // 📲 EL NUEVO BOTÓN DE AVISO DE GRACIA (SMS INTERNACIONAL) - CORREGIDO
    const btnAvisoGraciaHTML = esCongelado
        ? `<button disabled style="padding: 12px; background: #fef08a; color: #a16207; border: none; border-radius: 8px; font-weight: bold; cursor: not-allowed; display: flex; justify-content: space-between; align-items: center;"><span>📱 Enviar Aviso SMS (BLOQUEADO)</span></button>`
        : `<button onclick="enviarAvisoGraciaSMS(${idCredito}, '${nombreCliente.replace(/'/g, "\\'")}', ${saldoNum}, '${etiquetaCRE}', '${refBancaria}')" style="padding: 12px; background: #eab308; color: #422006; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(234, 179, 8, 0.2); transition: 0.2s;" onmouseover="this.style.background='#ca8a04'" onmouseout="this.style.background='#eab308'"><span>📱 Enviar Aviso SMS</span><span style="background: rgba(255,255,255,0.4); padding: 3px 8px; border-radius: 4px; font-size: 11px;">Periodo de Gracia</span></button>`;

    const btnCapitalHTML = esCongelado 
        ? `<button disabled style="padding: 12px; background: #fca5a5; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: not-allowed; display: flex; justify-content: space-between; align-items: center;"><span>🚨 Mora s/ Capital (BLOQUEADO)</span></button>`
        : `<button onclick="aplicarMoraSobreCapital(${idCredito}, ${multaSobreCapital}, ${saldoNum}, '${etiquetaCRE}')" style="padding: 12px; background: #dc2626; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.2);"><span>🚨 Mora s/ Capital</span><span style="background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 4px;">Sumar $${multaSobreCapital.toFixed(2)}</span></button>`;

    const btnSaldoHTML = esCongelado
        ? `<button disabled style="padding: 12px; background: #fdba74; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: not-allowed; display: flex; justify-content: space-between; align-items: center;"><span>⚡ Mora s/ Saldo (BLOQUEADO)</span></button>`
        : `<button onclick="aplicarMoraSobreSaldo(${idCredito}, ${multaSobreSaldo}, ${saldoNum}, '${etiquetaCRE}')" style="padding: 12px; background: #ea580c; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(234, 88, 12, 0.2);"><span>⚡ Mora s/ Saldo</span><span style="background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 4px;">Sumar $${multaSobreSaldo.toFixed(2)}</span></button>`;

    const btnCongelarHTML = esCongelado
        ? `<button onclick="alternarCongelamiento(${idCredito}, 'activo', '${etiquetaCRE}', ${saldoNum})" style="padding: 12px; background: #f59e0b; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.2);"><span>🔥 Descongelar Cuenta</span><span style="background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 4px;">Reactivar recargos</span></button>`
        : `<button onclick="alternarCongelamiento(${idCredito}, 'congelado', '${etiquetaCRE}', ${saldoNum})" style="padding: 12px; background: #0284c7; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(2, 132, 199, 0.2);"><span>🧊 Congelar Cuenta</span><span style="background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 4px;">Pausar recargos</span></button>`;

    const btnPerdonarHTML = esCongelado
        ? `<button disabled style="padding: 12px; background: #86efac; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: not-allowed; display: flex; justify-content: space-between; align-items: center;"><span>🛡️ Perdonar este mes (BLOQUEADO)</span></button>`
        : `<button onclick="perdonarMoraEsteMes(${idCredito}, '${etiquetaCRE}')" style="padding: 12px; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);"><span>🛡️ Perdonar este mes</span><span style="background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 4px;">Pausar 30 días</span></button>`;

    const btnRolloverHTML = esCongelado
        ? `<button disabled style="padding: 12px; background: #d8b4fe; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: not-allowed; display: flex; justify-content: space-between; align-items: center;"><span>🔄 Renovar Plazo (BLOQUEADO)</span></button>`
        : `<button onclick="renovarPlazoCredito(${idCredito}, '${etiquetaCRE}')" style="padding: 12px; background: #8b5cf6; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.2); transition: 0.2s;" onmouseover="this.style.background='#7c3aed'" onmouseout="this.style.background='#8b5cf6'"><span>🔄 Renovar Plazo (Solo pagó Interés)</span><span style="background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 4px;">Recalcular</span></button>`;
    
    const btnHistorialHTML = `<button onclick="verHistorialMoras(${idCredito}, '${nombreCliente.replace(/'/g, "\\'")}')" style="margin-top: 5px; padding: 10px; background: #f8fafc; color: #334155; border: 1px dashed #94a3b8; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; transition: all 0.2s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#f8fafc'"><span>📜 Ver Historial de Moras y Perdones</span></button>`;
    
    const modalHTML = `
    <div id="${modalId}" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.8); display: flex; justify-content: center; align-items: center; z-index: 9999; padding: 20px; backdrop-filter: blur(4px);">
        <div style="background: white; border-radius: 12px; width: 100%; max-width: 450px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); overflow: hidden;">
            <div style="background: #0f172a; padding: 20px; text-align: center;">
                <h3 style="margin: 0; color: white; font-size: 18px;">⚖️ Panel de Resolución de Cartera</h3>
                <p style="margin: 8px 0 2px 0; color: #94a3b8; font-size: 11px; font-weight: bold; letter-spacing: 0.5px;">ID: ${idCredito} | ${refBancaria || 'REF: NO-DATA'}</p>
                <p style="margin: 0 0 5px 0; color: #ca8a04; font-weight: bold; font-size: 16px;">${etiquetaCRE || 'CRE #'}</p>
                <p style="margin: 5px 0 0 0; color: #f8fafc; font-size: 14px; text-transform: uppercase;">${nombreCliente}</p>
                ${esCongelado ? '<div style="margin-top: 10px; display: inline-block; background: #e0f2fe; color: #0284c7; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold;">🧊 CUENTA CONGELADA Y PROTEGIDA</div>' : ''}
            </div>
            <div style="padding: 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: #64748b; font-size: 13px; font-weight: bold;">Capital Protegido:</span>
                    <span style="color: #0f172a; font-weight: 900; font-size: 13px;">$${capitalNum.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: #64748b; font-size: 13px; font-weight: bold;">Interés del Contrato Original:</span>
                    <span style="color: #0f172a; font-weight: 900; font-size: 13px;">${interesPorcentaje}%</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 2px dashed #cbd5e1;">
                    <span style="color: #ef4444; font-weight: bold; font-size: 15px;">Saldo Pendiente Actual:</span>
                    <span style="color: #ef4444; font-weight: 900; font-size: 20px;">$${saldoNum.toFixed(2)}</span>
                </div>
            </div>
            <div style="padding: 20px; display: flex; flex-direction: column; gap: 12px;">
                ${btnAvisoGraciaHTML}
                ${btnCapitalHTML}
                ${btnSaldoHTML}
                ${btnCongelarHTML}
                ${btnPerdonarHTML}
                ${btnRolloverHTML}
                ${btnHistorialHTML} 
            </div>
            <div style="padding: 15px 20px; background: #f1f5f9; text-align: center;">
                <button onclick="document.getElementById('${modalId}').remove()" style="padding: 10px 25px; background: white; color: #64748b; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">Cancelar y Cerrar</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

// =========================================================================
// 🔌 MOTORES DE RESOLUCIÓN INDIVIDUAL (CONECTADOS A SUPABASE Y MACRODROID)
// =========================================================================

// =========================================================================
// 🔌 MOTORES DE RESOLUCIÓN INDIVIDUAL (CONECTADOS A SUPABASE Y MACRODROID)
// =========================================================================

// 1. EL BOTÓN ROJO: MORA S/ CAPITAL 
window.aplicarMoraSobreCapital = async function(idCredito, cantidadASumar, saldoActual, etiquetaCRE) { 
    if (!confirm(`🚨 ¿Está seguro de sumar $${parseFloat(cantidadASumar).toFixed(2)} por MORA SOBRE CAPITAL?`)) return; 

    try { 
        const { data: credito, error: errBusq } = await supabaseClient.from('creditos').select('monto_mora, saldo_pendiente, fecha_emision, num_cuotas, frecuencia_pago, fecha_vencimiento_actual, clientes(nombres, apellidos, cedula, whatsapp)').eq('id', idCredito).single(); 
        if (errBusq) throw errBusq; 
        
        const moraAnterior = parseFloat(credito.monto_mora) || 0; 
        const saldoAnterior = parseFloat(saldoActual) || parseFloat(credito.saldo_pendiente); 
        
        const nuevaMora = moraAnterior + parseFloat(cantidadASumar); 
        const nuevoSaldo = saldoAnterior + parseFloat(cantidadASumar); 

        const numeroCuotas = parseInt(credito.num_cuotas) || 1; 
        const frecuencia = (credito.frecuencia_pago || '').toLowerCase(); 
        let fechaBase; 

        if (credito.fecha_vencimiento_actual) { 
            const partes = credito.fecha_vencimiento_actual.split('-'); 
            fechaBase = new Date(partes[0], partes[1] - 1, partes[2]); 
        } else { 
            fechaBase = new Date(credito.fecha_emision);
            let dSum = numeroCuotas; 
            if (frecuencia.includes('semanal')) dSum = 7 * numeroCuotas; 
            else if (frecuencia.includes('quincenal')) dSum = 15 * numeroCuotas; 
            else if (frecuencia.includes('mensual')) dSum = 30 * numeroCuotas; 
            fechaBase.setDate(fechaBase.getDate() + dSum); 
        } 

        if (frecuencia.includes('mensual')) fechaBase.setMonth(fechaBase.getMonth() + 1); 
        else if (frecuencia.includes('quincenal')) fechaBase.setDate(fechaBase.getDate() + 15); 
        else if (frecuencia.includes('semanal')) fechaBase.setDate(fechaBase.getDate() + 7); 
        else fechaBase.setDate(fechaBase.getDate() + 30); 

        // 🔥 LA CURA DEL RADAR: Limpiamos las horas para que el blindaje no falle
        fechaBase.setHours(0,0,0,0);
        const hoy = new Date();
        hoy.setHours(0,0,0,0);
        
        if (fechaBase <= hoy) {
            fechaBase = new Date();
            fechaBase.setDate(fechaBase.getDate() + 30);
        }

        const año = fechaBase.getFullYear(); 
        const mes = String(fechaBase.getMonth() + 1).padStart(2, '0'); 
        const dia = String(fechaBase.getDate()).padStart(2, '0'); 
        const nuevaFechaVencimiento = `${año}-${mes}-${dia}`; 

        const { error } = await supabaseClient.from('creditos').update({  
            saldo_pendiente: Number(nuevoSaldo.toFixed(2)),
            monto_mora: Number(nuevaMora.toFixed(2)), 
            fecha_vencimiento_actual: nuevaFechaVencimiento  
        }).eq('id', idCredito); 

        if (error) throw error; 

        await supabaseClient.from('historial_moras').insert({ 
            credito_id: idCredito, 
            tipo_accion: 'Mora s/ Capital', 
            monto_castigo: Number(cantidadASumar.toFixed(2)), 
            detalle: `Mora aplicada manualmente. Próximo vencimiento: ${dia}/${mes}/${año}.` 
        }); 

        let enviarSMS = confirm(`💰 MORA APLICADA CON ÉXITO\n\n¿Deseas enviar la notificación por SMS a este cliente notificando la mora sobre el capital?\n\n🟢 ACEPTAR = Enviar SMS\n🔴 CANCELAR = Guardar en silencio`); 

        if (enviarSMS && typeof window.notificarResolucionManualSMS === 'function') { 
            await window.notificarResolucionManualSMS(credito.clientes, etiquetaCRE, 'mora_capital', cantidadASumar, nuevoSaldo); 
        } 

        alert("✅ Proceso completado correctamente.\nEl cliente sale de las alertas."); 
        
        if(document.getElementById('modal-sancion-alpha')) document.getElementById('modal-sancion-alpha').remove(); 
        
        setTimeout(() => { 
            if (typeof window.despertarRobotDashboard === 'function') window.despertarRobotDashboard(); 
            if (typeof cargarTablaGestionMora === 'function') cargarTablaGestionMora(); 
        }, 500); 
        
    } catch (error) { 
        console.error("Error en Mora Capital:", error); 
        alert("❌ Error al procesar: " + error.message); 
    } 
}; 

// 2. EL BOTÓN NARANJA: MORA S/ SALDO 
window.aplicarMoraSobreSaldo = async function(idCredito, cantidadASumar, saldoActual, etiquetaCRE) { 
    if (!confirm(`⚡ ¿Está seguro de sumar $${parseFloat(cantidadASumar).toFixed(2)} por MORA SOBRE SALDO?`)) return; 

    try { 
        const { data: credito, error: errBusq } = await supabaseClient.from('creditos').select('monto_mora, saldo_pendiente, fecha_emision, num_cuotas, frecuencia_pago, fecha_vencimiento_actual, clientes(nombres, apellidos, cedula, whatsapp)').eq('id', idCredito).single(); 
        if (errBusq) throw errBusq; 
        
        const moraAnterior = parseFloat(credito.monto_mora) || 0; 
        const saldoAnterior = parseFloat(saldoActual) || parseFloat(credito.saldo_pendiente); 
        
        const nuevaMora = moraAnterior + parseFloat(cantidadASumar); 
        const nuevoSaldo = saldoAnterior + parseFloat(cantidadASumar); 

        const numeroCuotas = parseInt(credito.num_cuotas) || 1; 
        const frecuencia = (credito.frecuencia_pago || '').toLowerCase(); 
        let fechaBase; 

        if (credito.fecha_vencimiento_actual) { 
            const partes = credito.fecha_vencimiento_actual.split('-'); 
            fechaBase = new Date(partes[0], partes[1] - 1, partes[2]); 
        } else { 
            fechaBase = new Date(credito.fecha_emision);
            let dSum = numeroCuotas; 
            if (frecuencia.includes('semanal')) dSum = 7 * numeroCuotas; 
            else if (frecuencia.includes('quincenal')) dSum = 15 * numeroCuotas; 
            else if (frecuencia.includes('mensual')) dSum = 30 * numeroCuotas; 
            fechaBase.setDate(fechaBase.getDate() + dSum); 
        } 

        if (frecuencia.includes('mensual')) fechaBase.setMonth(fechaBase.getMonth() + 1); 
        else if (frecuencia.includes('quincenal')) fechaBase.setDate(fechaBase.getDate() + 15); 
        else if (frecuencia.includes('semanal')) fechaBase.setDate(fechaBase.getDate() + 7); 
        else fechaBase.setDate(fechaBase.getDate() + 30); 

        // 🔥 LA CURA DEL RADAR: Limpiamos las horas
        fechaBase.setHours(0,0,0,0);
        const hoy = new Date();
        hoy.setHours(0,0,0,0);
        
        if (fechaBase <= hoy) {
            fechaBase = new Date();
            fechaBase.setDate(fechaBase.getDate() + 30);
        }

        const año = fechaBase.getFullYear(); 
        const mes = String(fechaBase.getMonth() + 1).padStart(2, '0'); 
        const dia = String(fechaBase.getDate()).padStart(2, '0'); 
        const nuevaFechaVencimiento = `${año}-${mes}-${dia}`; 

        const { error } = await supabaseClient.from('creditos').update({  
            saldo_pendiente: Number(nuevoSaldo.toFixed(2)), 
            monto_mora: Number(nuevaMora.toFixed(2)), 
            fecha_vencimiento_actual: nuevaFechaVencimiento  
        }).eq('id', idCredito); 

        if (error) throw error; 

        await supabaseClient.from('historial_moras').insert({ 
            credito_id: idCredito, 
            tipo_accion: 'Mora s/ Saldo', 
            monto_castigo: Number(cantidadASumar.toFixed(2)), 
            detalle: `Mora aplicada manualmente. Próximo vencimiento: ${dia}/${mes}/${año}.` 
        }); 

        let enviarSMS = confirm(`💰 MORA APLICADA CON ÉXITO\n\n¿Deseas enviar la notificación por SMS a este cliente notificando la mora sobre su saldo?\n\n🟢 ACEPTAR = Enviar SMS\n🔴 CANCELAR = Guardar en silencio`); 

        if (enviarSMS && typeof window.notificarResolucionManualSMS === 'function') { 
            await window.notificarResolucionManualSMS(credito.clientes, etiquetaCRE, 'mora_saldo', cantidadASumar, nuevoSaldo); 
        } 

        alert("✅ Proceso completado correctamente."); 
        
        if(document.getElementById('modal-sancion-alpha')) document.getElementById('modal-sancion-alpha').remove(); 
        
        setTimeout(() => { 
            if (typeof window.despertarRobotDashboard === 'function') window.despertarRobotDashboard(); 
            if (typeof cargarTablaGestionMora === 'function') cargarTablaGestionMora(); 
        }, 500); 

    } catch (error) { 
        console.error("Error en Mora Saldo:", error); 
        alert("❌ Error al procesar: " + error.message); 
    } 
}; 

// 3. EL BOTÓN VERDE: PERDONAR ESTE MES 
window.perdonarMoraEsteMes = async function(idCredito, etiquetaCRE) { 
    if (!confirm("🛡️ ¿Desea PERDONAR LA MORA y patear la fecha para el próximo periodo?")) return; 

    try { 
        const { data: credito, error: errBusq } = await supabaseClient.from('creditos').select('total_pagar, monto_mora, fecha_emision, num_cuotas, frecuencia_pago, fecha_vencimiento_actual, saldo_pendiente, clientes(nombres, apellidos, cedula, whatsapp), historial_pagos(abono_total)').eq('id', idCredito).single(); 
        if (errBusq) throw errBusq; 
        
        const pagos = credito.historial_pagos || [];
        const totalAbonado = pagos.reduce((sum, pago) => sum + (parseFloat(pago.abono_total) || 0), 0);
        const moraActual = parseFloat(credito.monto_mora) || 0;
        const deudaTotalOriginal = parseFloat(credito.total_pagar) || 0;
        
        let saldoMatematicoReal = (deudaTotalOriginal + moraActual) - totalAbonado;
        if (saldoMatematicoReal < 0) saldoMatematicoReal = 0;

        const numeroCuotas = parseInt(credito.num_cuotas) || 1; 
        const frecuencia = (credito.frecuencia_pago || '').toLowerCase(); 
        let fechaBase; 

        if (credito.fecha_vencimiento_actual) { 
            const partes = credito.fecha_vencimiento_actual.split('-'); 
            fechaBase = new Date(partes[0], partes[1] - 1, partes[2]); 
        } else { 
            fechaBase = new Date(credito.fecha_emision);
            let dSum = numeroCuotas; 
            if (frecuencia.includes('semanal')) dSum = 7 * numeroCuotas; 
            else if (frecuencia.includes('quincenal')) dSum = 15 * numeroCuotas; 
            else if (frecuencia.includes('mensual')) dSum = 30 * numeroCuotas; 
            fechaBase.setDate(fechaBase.getDate() + dSum); 
        } 

        if (frecuencia.includes('mensual')) fechaBase.setMonth(fechaBase.getMonth() + 1); 
        else if (frecuencia.includes('quincenal')) fechaBase.setDate(fechaBase.getDate() + 15); 
        else if (frecuencia.includes('semanal')) fechaBase.setDate(fechaBase.getDate() + 7); 
        else fechaBase.setDate(fechaBase.getDate() + 30); 

        // 🔥 LA CURA DEL RADAR: Limpiamos las horas
        fechaBase.setHours(0,0,0,0);
        const hoy = new Date();
        hoy.setHours(0,0,0,0);
        
        if (fechaBase <= hoy) {
            fechaBase = new Date();
            fechaBase.setDate(fechaBase.getDate() + 30);
        }

        const año = fechaBase.getFullYear(); 
        const mes = String(fechaBase.getMonth() + 1).padStart(2, '0'); 
        const dia = String(fechaBase.getDate()).padStart(2, '0'); 
        const nuevaFechaVencimiento = `${año}-${mes}-${dia}`; 

        const { error } = await supabaseClient.from('creditos').update({  
            fecha_vencimiento_actual: nuevaFechaVencimiento  
        }).eq('id', idCredito); 

        if (error) throw error; 

        await supabaseClient.from('historial_moras').insert({ 
            credito_id: idCredito, 
            tipo_accion: 'Perdón de Mora (Social)', 
            monto_castigo: 0.00, 
            detalle: `Perdón manual aplicado. Próximo vencimiento: ${dia}/${mes}/${año}.` 
        }); 

        let enviarSMS = confirm(`🛡️ PERDÓN APLICADO CON ÉXITO\n\n¿Deseas enviar un SMS de aviso al cliente informándole de su nuevo plazo sin recargos?\n\n🟢 ACEPTAR = Enviar SMS\n🔴 CANCELAR = Guardar en silencio`); 

        if (enviarSMS && typeof window.notificarResolucionManualSMS === 'function') { 
            await window.notificarResolucionManualSMS(credito.clientes, etiquetaCRE, 'perdonar', 0, saldoMatematicoReal); 
        } 

        alert("✅ Cliente perdonado y registrado en el historial."); 
        
        if(document.getElementById('modal-sancion-alpha')) document.getElementById('modal-sancion-alpha').remove(); 
        
        setTimeout(() => { 
            if (typeof window.despertarRobotDashboard === 'function') window.despertarRobotDashboard(); 
            if (typeof cargarTablaGestionMora === 'function') cargarTablaGestionMora(); 
        }, 500); 

    } catch (error) { 
        console.error("Error al Perdonar:", error); 
        alert("❌ Error al procesar: " + error.message); 
    } 
};

// =========================================================================
// 🔄 EL BOTÓN MORADO: RENOVAR PLAZO (ROLLOVER) - SILICON VALLEY V2
// =========================================================================
// =========================================================================
// 🔄 EL BOTÓN MORADO: REFINANCIAMIENTO EXACTO (ROLLOVER V4)
// =========================================================================
// =========================================================================
// 🔄 EL BOTÓN MORADO: REFINANCIAMIENTO DE WALL STREET (SUBROGACIÓN V5)
// =========================================================================
// 4. EL BOTÓN MORADO: RENOVAR PLAZO (SOLO PAGO INTERÉS)
window.renovarPlazoCredito = async function(idCredito, etiquetaCRE) {
    if (!confirm(`🔄 RENOVACIÓN DE PLAZO INTELIGENTE\n\nEl sistema mantendrá este mismo crédito y su historial de pagos intacto.\n\nGenerará el nuevo interés sobre el saldo restante y empujará la fecha de vencimiento.\n\n¿Está seguro de proceder?`)) return;

    try {
        // 1. Obtenemos la radiografía (Aseguramos traer valor_cuota para no dañarla)
        const { data: credito, error: errBusq } = await supabaseClient
            .from('creditos')
            .select('monto_capital, monto_mora, total_interes, total_pagar, saldo_pendiente, tasa_interes, fecha_emision, num_cuotas, frecuencia_pago, fecha_vencimiento_actual, valor_cuota, clientes(nombres, apellidos, cedula, whatsapp), historial_pagos(abono_total)')
            .eq('id', idCredito).single();
        
        if (errBusq) throw errBusq;

        // 2. MATEMÁTICA EXACTA: Saldo Real * Porcentaje (Ej: 110 * 20%)
        const pagos = credito.historial_pagos || [];
        const totalAbonado = pagos.reduce((sum, p) => sum + (parseFloat(p.abono_total) || 0), 0);

        const moraAnterior = parseFloat(credito.monto_mora) || 0;
        const totalHistorico = parseFloat(credito.total_pagar) || 0;
        
        let saldoMatematicoReal = (totalHistorico + moraAnterior) - totalAbonado;
        
        if (saldoMatematicoReal <= 0) {
            alert("✅ El cliente ya no tiene deuda. El crédito está liquidado.");
            return;
        }

        const tasa = parseFloat(credito.tasa_interes) || 20;
        
        // El interés generado sobre el dinero vivo (Ej: 110 * 20% = 22)
        const nuevoInteresGenerado = saldoMatematicoReal * (tasa / 100);

        // 🔥 LA CURA DE LA ETIQUETA: Guardamos el recargo como MORA para que la pantalla lo reconozca
        const nuevaMora = moraAnterior + nuevoInteresGenerado;
        
        let nuevoSaldoPendiente = saldoMatematicoReal + nuevoInteresGenerado;

        // 🔥 LA CURA DE LA CUOTA REDONDA: Mantenemos la original intacta (ej: 4.00)
        const cuotaOriginal = parseFloat(credito.valor_cuota) || 0;

        // 5. MAGIA DEL TIEMPO (Empujamos la fecha un periodo más)
        const numeroCuotas = parseInt(credito.num_cuotas) || 1;
        const frecuencia = (credito.frecuencia_pago || '').toLowerCase();
        let fechaBase;
        if (credito.fecha_vencimiento_actual) {
            const partes = credito.fecha_vencimiento_actual.split('-');
            fechaBase = new Date(partes[0], partes[1] - 1, partes[2]);
        } else {
            fechaBase = new Date(credito.fecha_emision);
            let dSum = numeroCuotas;
            if (frecuencia.includes('semanal')) dSum = 7 * numeroCuotas;
            else if (frecuencia.includes('quincenal')) dSum = 15 * numeroCuotas;
            else if (frecuencia.includes('mensual')) dSum = 30 * numeroCuotas;
            fechaBase.setDate(fechaBase.getDate() + dSum);
        }

        if (frecuencia.includes('mensual')) {
            fechaBase.setMonth(fechaBase.getMonth() + 1);
        } else if (frecuencia.includes('quincenal')) {
            fechaBase.setDate(fechaBase.getDate() + 15);
        } else if (frecuencia.includes('semanal')) {
            fechaBase.setDate(fechaBase.getDate() + 7);
        } else {
            fechaBase.setDate(fechaBase.getDate() + 30);
        }

        // BLINDAJE DEL RADAR (Escudo limpia-horas)
        fechaBase.setHours(0,0,0,0);
        const hoy = new Date();
        hoy.setHours(0,0,0,0);
        
        if (fechaBase <= hoy) {
            fechaBase = new Date();
            fechaBase.setDate(fechaBase.getDate() + 30);
        }

        const año = fechaBase.getFullYear();
        const mes = String(fechaBase.getMonth() + 1).padStart(2, '0');
        const dia = String(fechaBase.getDate()).padStart(2, '0');
        const nuevaFechaVencimiento = `${año}-${mes}-${dia}`;

        // 6. INYECTAMOS EN BASE DE DATOS
        const { error } = await supabaseClient.from('creditos').update({ 
            saldo_pendiente: Number(nuevoSaldoPendiente.toFixed(2)),
            monto_mora: Number(nuevaMora.toFixed(2)), // Inyectamos el castigo a la bodega de mora
            valor_cuota: Number(cuotaOriginal.toFixed(2)), // Cuota redonda intacta (Los 4.00)
            fecha_vencimiento_actual: nuevaFechaVencimiento 
        }).eq('id', idCredito);

        if (error) throw error;

        await supabaseClient.from('historial_moras').insert({
            credito_id: idCredito,
            tipo_accion: 'Refinanciamiento de Plazo',
            monto_castigo: Number(nuevoInteresGenerado.toFixed(2)),
            detalle: `Renovación sobre Saldo Real de $${saldoMatematicoReal.toFixed(2)}. Interés cobrado: $${nuevoInteresGenerado.toFixed(2)}. Vence: ${dia}/${mes}/${año}.`
        });

        let enviarSMS = confirm(`✅ CONTRATO REFINANCIADO CON ÉXITO\n\n- Saldo Base: $${saldoMatematicoReal.toFixed(2)}\n- Nuevo Interés (${tasa}%): $${nuevoInteresGenerado.toFixed(2)}\n- NUEVO SALDO TOTAL: $${nuevoSaldoPendiente.toFixed(2)}\n- Vence el ${dia}/${mes}/${año}.\n\n¿Desea enviar un SMS al cliente avisándole de su nuevo saldo y fecha?\n\n🟢 ACEPTAR = Enviar SMS\n🔴 CANCELAR = Guardar silencioso`);

        if (enviarSMS && typeof window.notificarResolucionManualSMS === 'function') {
            // El SMS se va con la matemática impecable
            await window.notificarResolucionManualSMS(credito.clientes, etiquetaCRE, 'mora_saldo', nuevoInteresGenerado, nuevoSaldoPendiente);
        }

        alert("✅ Refinanciamiento completado en el mismo crédito.");
        
        if(document.getElementById('modal-sancion-alpha')) document.getElementById('modal-sancion-alpha').remove();
        
        setTimeout(() => {
            if (typeof window.despertarRobotDashboard === 'function') window.despertarRobotDashboard();
            if (typeof cargarTablaGestionMora === 'function') cargarTablaGestionMora();
        }, 500);

    } catch (error) {
        console.error("Error en Rollover:", error);
        alert("❌ Error al procesar: " + error.message);
    }
};

// =========================================================================
// 🧊 MOTOR PARA CONGELAR/DESCONGELAR CUENTAS (BOTÓN AZUL)
// =========================================================================
// 4. EL BOTÓN AZUL: CONGELAR CUENTA
// 4. EL BOTÓN AZUL / NARANJA: CONGELAR / DESCONGELAR CUENTA
window.alternarCongelamiento = async function(idCredito, nuevoEstado, etiquetaCRE, saldoAmarilloReal) {
    let mensajeConfirmacion = nuevoEstado === 'congelado' 
        ? "¿Está seguro de CONGELAR esta cuenta? Se detendrán los recargos automáticos." 
        : "¿Está seguro de DESCONGELAR esta cuenta? Volverá a estar activa en el radar.";
        
    if (!confirm(mensajeConfirmacion)) return;

    let notaAcuerdo = '';
    if (nuevoEstado === 'congelado') {
        notaAcuerdo = prompt("🤝 CONVENIO DE PAGO (Opcional):\n\nSi llegó a un acuerdo de refinanciamiento con el cliente, escríbalo aquí (Ej: $50 Semanal los viernes).\n\nSi no hay acuerdo, deje esto vacío y presione Aceptar:") || '';
    }

    try {
        const { data: credito, error: errBusq } = await supabaseClient.from('creditos').select('monto_capital, valor_cuota, frecuencia_pago, total_pagar, num_cuotas, clientes(nombres, apellidos, cedula, whatsapp)').eq('id', idCredito).single();
        if (errBusq) throw errBusq;

        const { error } = await supabaseClient.from('creditos').update({ 
            estado: nuevoEstado,
            acuerdo_pago: notaAcuerdo 
        }).eq('id', idCredito);

        if (error) throw error;

        let msjExito = nuevoEstado === 'congelado' 
            ? "🧊 Cuenta CONGELADA exitosamente." + (notaAcuerdo ? `\nAcuerdo guardado: ${notaAcuerdo}` : "")
            : "🔥 Cuenta DESCONGELADA. El cliente vuelve al radar normal.";
            
        if (nuevoEstado === 'congelado') {
            let enviarSMS = confirm(`❄️ CUENTA CONGELADA\n\n¿Deseas enviar un SMS al cliente avisándole que su cuenta está en pausa y adjuntando el convenio de pago (si lo hubo)?\n\n🟢 ACEPTAR = Enviar SMS\n🔴 CANCELAR = Guardar en silencio`);
            if (enviarSMS && typeof window.notificarResolucionManualSMS === 'function') {
                // 🔥 ENVIAMOS EL SALDO AMARILLO DIRECTAMENTE
                await window.notificarResolucionManualSMS(credito.clientes, etiquetaCRE, 'congelar', 0, saldoAmarilloReal, notaAcuerdo, null);
            }
        } else if (nuevoEstado === 'activo') {
            let enviarSMS = confirm(`🔥 CUENTA DESCONGELADA\n\n¿Deseas enviar un SMS al cliente avisándole que su crédito fue RESTAURADO y vuelve a estar ACTIVO?\n\n🟢 ACEPTAR = Enviar SMS\n🔴 CANCELAR = Guardar en silencio`);
            if (enviarSMS && typeof window.notificarResolucionManualSMS === 'function') {
                // 🔥 ENVIAMOS EL SALDO AMARILLO DIRECTAMENTE
                await window.notificarResolucionManualSMS(credito.clientes, etiquetaCRE, 'descongelar', 0, saldoAmarilloReal, "", credito);
            }
        }

        alert(msjExito);
        
        if(document.getElementById('modal-sancion-alpha')) document.getElementById('modal-sancion-alpha').remove();
        if (typeof window.despertarRobotDashboard === 'function') window.despertarRobotDashboard();
        if (typeof cargarTablaGestionMora === 'function') cargarTablaGestionMora();

    } catch (error) {
        console.error("Error al cambiar estado:", error);
        alert("❌ Error al procesar: " + error.message);
    }
};
// =========================================================================
// 🛠️ LÓGICA DE SMS PARA EL PANEL DE RESOLUCIÓN MANUAL (4 BOTONES)
// =========================================================================
// =========================================================================
// 🛠️ LÓGICA DE SMS PARA EL PANEL DE RESOLUCIÓN MANUAL (4 BOTONES)
// =========================================================================
// =========================================================================
// 🛠️ LÓGICA DE SMS PARA EL PANEL DE RESOLUCIÓN MANUAL (4 BOTONES)
// =========================================================================
// =========================================================================
// 🛠️ LÓGICA DE SMS PARA EL PANEL DE RESOLUCIÓN MANUAL (4 BOTONES)
// =========================================================================
// 🔥 Agregamos el parámetro "creditoExtra" al final para recibir los datos de la base de datos
// =========================================================================
// 🛠️ LÓGICA DE SMS PARA EL PANEL DE RESOLUCIÓN MANUAL (4 BOTONES)
// =========================================================================
window.notificarResolucionManualSMS = async function(clienteObj, etiquetaCRE, tipoAccion, montoMulta, saldoActual, notaAcuerdo = "", creditoExtra = null) {
    if (!clienteObj || !clienteObj.whatsapp) {
        alert("⚠️ SMS Cancelado: El cliente no tiene número de WhatsApp registrado.");
        return;
    }
    
    if (typeof enviarSMSAutomatico !== 'function') {
        alert("⚠️ Error Interno: No se encuentra el motor 'enviarSMSAutomatico'.");
        return;
    }

    try {
        const nombre = `${clienteObj.nombres} ${clienteObj.apellidos}`.toUpperCase();
        const iN = (clienteObj.nombres || '').trim().charAt(0);
        const iA = (clienteObj.apellidos || '').trim().charAt(0);
        const u4 = (clienteObj.cedula || '').trim().slice(-4);
        const refFinal = `${iN}${iA}-${u4}`.toUpperCase();

        // 🔥 EL SABUESO DE SEGURIDAD (Protección de Inteligencia de Negocio)
        // Extraemos solo la letra cifrada para ocultar el número total de créditos
        let creCifradoLimpio = "CRE # ?";
        if (etiquetaCRE) {
            const matchLetra = etiquetaCRE.match(/\[(.*?)\]/); // Busca lo que está entre corchetes
            if (matchLetra && matchLetra[1]) {
                creCifradoLimpio = `CRE #${matchLetra[1]}`; // Deja solo CRE #H
            } else {
                creCifradoLimpio = etiquetaCRE; // Respaldo por si acaso
            }
        }

        // 🔥 LA FÓRMULA ALPHA SMS COMPACTA (El Reloj)
        const ahora = new Date();
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        
        const diaSemana = dias[ahora.getDay()];
        const diaNum = String(ahora.getDate()).padStart(2, '0');
        const mesNombre = meses[ahora.getMonth()];
        const anio = ahora.getFullYear(); // Año completo 2026
        
        let horas = ahora.getHours();
        let minutos = String(ahora.getMinutes()).padStart(2, '0');
        const ampm = horas >= 12 ? 'p.m.' : 'a.m.'; // Sin espacios
        horas = horas % 12; horas = horas ? horas : 12;
        const horaFormateada = `${String(horas).padStart(2, '0')}:${minutos} ${ampm}`;

        const fechaHoraSMS = `${diaSemana} ${diaNum}/${mesNombre}/${anio} | ${horaFormateada}`;

        const encabezado = `=== SISTEMA ALPHA ===\n${fechaHoraSMS}\n\n🆔 Ref: ${refFinal} | ${creCifradoLimpio}\n👤 Cliente: ${nombre}\n\n`;
        const pie = `\n\nPor favor, comunícate con nosotros para cualquier duda.\n🚫 POR FAVOR, NO RESPONDER A ESTE MENSAJE.`;
        
        let msjSalida = "";

        if (tipoAccion === 'mora_capital') {
            msjSalida = `${encabezado}Hola, te notificamos que se ha aplicado un recargo por atraso en tu cuenta.\n\n⚠️ Motivo: Mora sobre Capital\n💰 Multa Aplicada: $${parseFloat(montoMulta).toFixed(2)}\n📉 Nuevo Saldo: $${parseFloat(saldoActual).toFixed(2)}${pie}`;
        
        } else if (tipoAccion === 'mora_saldo') {
            msjSalida = `${encabezado}Hola, te notificamos que se ha aplicado un recargo por atraso en tu cuenta.\n\n⚠️ Motivo: Mora sobre Saldo\n💰 Multa Aplicada: $${parseFloat(montoMulta).toFixed(2)}\n📉 Nuevo Saldo: $${parseFloat(saldoActual).toFixed(2)}${pie}`;
        
        } else if (tipoAccion === 'congelar') {
            let textoConvenio = notaAcuerdo && notaAcuerdo.trim() !== "" ? `\n🤝 Convenio de Pago: ${notaAcuerdo}` : "";
            msjSalida = `${encabezado}Hola, te informamos que tu crédito ha sido CONGELADO temporalmente.\n\n❄️ Motivo: Congelamiento Preventivo\n📉 Saldo Actual: $${parseFloat(saldoActual).toFixed(2)}${textoConvenio}\n\nTu cuenta ha sido pausada y blindada para no generar nuevos recargos automáticos.${pie}`;
        
        } else if (tipoAccion === 'perdonar') {
            msjSalida = `${encabezado}Hola, te traemos buenas noticias. Se ha aplicado una extensión a tu crédito.\n\n🛡️ Motivo: Perdón de Mora\n📉 Saldo Actual: $${parseFloat(saldoActual).toFixed(2)}\n\nTe hemos otorgado 30 días adicionales para regularizar tus pagos sin sufrir recargos.${pie}`;
        
        } else if (tipoAccion === 'descongelar') {
            let cap = creditoExtra && creditoExtra.monto_capital ? parseFloat(creditoExtra.monto_capital).toFixed(2) : "0.00";
            let cuota = creditoExtra && creditoExtra.valor_cuota ? parseFloat(creditoExtra.valor_cuota).toFixed(2) : "0.00";
            let freq = creditoExtra && creditoExtra.frecuencia_pago ? creditoExtra.frecuencia_pago : "No definida";
            let tot = creditoExtra && creditoExtra.total_pagar ? parseFloat(creditoExtra.total_pagar).toFixed(2) : "0.00";
            let numC = creditoExtra && creditoExtra.num_cuotas ? creditoExtra.num_cuotas : "0";

            msjSalida = `${encabezado}Hola, te informamos que tu crédito ha sido DESCONGELADO exitosamente y vuelve a estar ACTIVO en nuestro sistema.\n\n📉 Saldo Pendiente Actual: $${parseFloat(saldoActual).toFixed(2)}\n💰 Monto Original: $${cap}\n💵 Cuota: $${cuota}\n🔄 Modalidad: ${freq}\n📊 Total Contrato: $${tot}\n🔢 Cuotas: ${numC}\n\n⚡ Importante: Los recargos automáticos por mora han sido reactivados.\n\nEste es tu soporte oficial. ¡Gracias!${pie}`;
        }

        await enviarSMSAutomatico(clienteObj.whatsapp.toString(), msjSalida);
        console.log("✅ SMS Manual enviado con éxito al número: " + clienteObj.whatsapp);

    } catch (errorSMS) {
        console.error(`❌ Falló el SMS manual: ${errorSMS.message}`);
        alert(`❌ Falló el envío de SMS: ${errorSMS.message}`);
    }
};

// =========================================================================
// ⚡ LA BARREDORA AUTOMÁTICA DE MORAS (NUEVAS REGLAS: 15 PAGOS + HISTORIAL)
// =========================================================================
// =========================================================================
// ⚡ LA BARREDORA AUTOMÁTICA DE MORAS (REGLAS DE ORO: DÍA 11+ Y 15 PAGOS)
// =========================================================================
// =========================================================================
// ⚡ LA BARREDORA AUTOMÁTICA DE MORAS (REGLA DE ORO PERFECTA: SALDO REAL)
// =========================================================================
// =========================================================================
// ⚡ LA BARREDORA AUTOMÁTICA DE MORAS (REGLA DE ORO + DISPARO DE SMS)
// =========================================================================
// =========================================================================
// ⚡ LA BARREDORA AUTOMÁTICA DE MORAS (REGLA DE ORO + DISPARO DE SMS)
// =========================================================================
// =========================================================================
// ⚡ LA BARREDORA AUTOMÁTICA DE MORAS (REGLA DE ORO + SMS CON PAUSA ANTI-SPAM)
// =========================================================================
// =========================================================================
// ⚡ LA BARREDORA AUTOMÁTICA DE MORAS (PRIVACIDAD DE CRE ACTIVADA)
// =========================================================================
// =========================================================================
// ⚡ LA BARREDORA AUTOMÁTICA DE MORAS (CON CONFIRMACIÓN MANUAL DE SMS)
// =========================================================================
window.ejecutarMorasConClave = async function() {
    // 1. Cerradura de Seguridad
    let claveIngresada = prompt("🔒 ACCESO RESTRINGIDO GERENCIAL:\nPor favor, ingrese la clave de autorización para ejecutar los castigos de cartera:");
    if (claveIngresada === null) return; 

    if (claveIngresada !== "Mora") {
        alert("❌ CLAVE INCORRECTA.\nAcceso denegado. Usted no tiene permisos.");
        return;
    }

    alert("✅ CLAVE ACEPTADA.\nIniciando el escaneo de cartera. Por favor presione 'Aceptar' y NO cierre esta ventana hasta que termine el proceso.");

    try {
        const { data: creditos, error: errCreditos } = await supabaseClient
            .from('creditos')
            .select('id, monto_capital, total_pagar, tasa_interes, saldo_pendiente, monto_mora, valor_cuota, fecha_emision, num_cuotas, fecha_vencimiento_actual, estado, clientes_id:cliente_id, clientes(nombres, apellidos, cedula, whatsapp, perfil_cobro), historial_pagos(abono_total)')
            .eq('estado', 'activo');

        if (errCreditos) throw errCreditos;
        if (!creditos || creditos.length === 0) {
            alert("No hay créditos activos para analizar.");
            return;
        }

        // 🌟 MAGIA: Traemos todos para saber el cifrado
        const { data: historialTodos } = await supabaseClient
            .from('creditos')
            .select('id, cliente_id')
            .order('id', { ascending: true });

        const mapNumCreditoLocal = {};
        if (historialTodos) {
            const conteoPorCliente = {};
            historialTodos.forEach(c => {
                conteoPorCliente[c.cliente_id] = (conteoPorCliente[c.cliente_id] || 0) + 1;
                mapNumCreditoLocal[c.id] = conteoPorCliente[c.cliente_id];
            });
        }

        const fechaHoy = new Date();
        const hoyLimpiado = new Date(fechaHoy.getFullYear(), fechaHoy.getMonth(), fechaHoy.getDate());
        
        let castigosAplicados = 0;
        let perfilesSocialesOmitidos = 0;
        let mensajesEnviados = 0;
        
        // 📋 LISTA DE ESPERA PARA LOS SMS
        let listaParaSMS = [];

        for (const c of creditos) {
            // 🛡️ DOBLE SEGURIDAD: Si es congelado, se salta.
            if (c.estado === 'congelado') continue;

            const perfilCliente = c.clientes?.perfil_cobro || 'Normal';
            
            // Calculamos fecha de vencimiento
            let fechaVence;
            if (c.fecha_vencimiento_actual) {
                const partes = c.fecha_vencimiento_actual.split('-');
                fechaVence = new Date(partes[0], partes[1] - 1, partes[2]);
            } else {
                const fechaE = new Date(c.fecha_emision);
                fechaVence = new Date(fechaE.getFullYear(), fechaE.getMonth(), fechaE.getDate());
                fechaVence.setDate(fechaVence.getDate() + (parseInt(c.num_cuotas) || 30));
            }

            const venceLimpiado = new Date(fechaVence.getFullYear(), fechaVence.getMonth(), fechaVence.getDate());
            const diferenciaTiempo = venceLimpiado.getTime() - hoyLimpiado.getTime();
            const diferenciaDias = Math.round(diferenciaTiempo / (1000 * 3600 * 24));

            // 🚨 REGLA MAESTRA: 10 días de gracia. Atacar a partir del DÍA 11 de atraso.
            if (diferenciaDias <= -11) { 
                
                // 🛡️ REGLA PERFIL SOCIAL: Solo los contamos y los saltamos
                if (perfilCliente.toUpperCase().includes('SOCIAL')) {
                    perfilesSocialesOmitidos++;
                    continue; 
                }

                // --- MATEMÁTICA PURA Y DURA ALPHA ---
                const totalPagar = parseFloat(c.total_pagar) || 0;
                const moraAnterior = parseFloat(c.monto_mora) || 0;
                const capital = parseFloat(c.monto_capital) || 0;

                const pagos = c.historial_pagos || [];
                const totalAbonado = pagos.reduce((sum, pago) => sum + (parseFloat(pago.abono_total) || 0), 0);
                
                const cuotaDiaria = parseFloat(c.valor_cuota) || 1;
                const cuotasPagadas = totalAbonado / cuotaDiaria; 

                let saldoNetoRealAnterior = (totalPagar + moraAnterior) - totalAbonado;
                if (saldoNetoRealAnterior < 0) saldoNetoRealAnterior = 0;
                
                const tasaInteres = parseFloat(c.tasa_interes) ? (parseFloat(c.tasa_interes) / 100) : 0.20;
                
                let multaAplicar = 0;
                let tipoAccionGuardar = '';

                // ⚖️ LA REGLA DE ORO
                if (cuotasPagadas <= 15) {
                    multaAplicar = capital * tasaInteres; 
                    tipoAccionGuardar = 'Mora Automática (s/ Capital)';
                } else {
                    multaAplicar = saldoNetoRealAnterior * tasaInteres; 
                    tipoAccionGuardar = 'Mora Automática (s/ Saldo)';
                }

                const nuevaMora = moraAnterior + multaAplicar;
                
                let nuevoSaldoDB = (totalPagar + nuevaMora) - totalAbonado;
                if (nuevoSaldoDB < 0) nuevoSaldoDB = 0;

                // 📅 Pateamos la fecha 30 días para adelante
                let fechaBase = c.fecha_vencimiento_actual ? new Date(c.fecha_vencimiento_actual) : new Date(new Date(c.fecha_emision).getTime() + ((parseInt(c.num_cuotas)||30) * 24 * 60 * 60 * 1000));
                fechaBase.setDate(fechaBase.getDate() + 30);
                const nuevaFechaVencimiento = fechaBase.toISOString().split('T')[0];

                // 💾 Actualizamos Supabase
                await supabaseClient.from('creditos').update({ 
                    saldo_pendiente: Number(nuevoSaldoDB.toFixed(2)),
                    monto_mora: Number(nuevaMora.toFixed(2)),
                    fecha_vencimiento_actual: nuevaFechaVencimiento 
                }).eq('id', c.id);

                // 🧾 Historial de Moras
                await supabaseClient.from('historial_moras').insert({
                    credito_id: c.id,
                    tipo_accion: tipoAccionGuardar,
                    monto_castigo: Number(multaAplicar.toFixed(2)),
                    detalle: `Multa automática (${Math.abs(diferenciaDias)} días atraso). Equivale a ${cuotasPagadas.toFixed(1)} cuotas pagadas. Multa de $${multaAplicar.toFixed(2)}`
                });

                // 📥 ANOTAMOS AL CLIENTE EN LA LISTA DE ESPERA PARA EL SMS
                if (typeof window.notificarMoraSMS === 'function') {
                    const numLocal = mapNumCreditoLocal[c.id] || 1;
                    let creCifrado = typeof cifrarNumeroCredito === 'function' ? cifrarNumeroCredito(numLocal).toUpperCase() : '';
                    let etiquetaCRE = creCifrado ? `CRE # [${creCifrado}]` : `CRE #`;

                    listaParaSMS.push({
                        cliente: c.clientes,
                        etiqueta: etiquetaCRE,
                        multa: multaAplicar,
                        saldo: nuevoSaldoDB,
                        dias: Math.abs(diferenciaDias)
                    });
                }

                castigosAplicados++;
            }
        }

        // 🛑 LA PREGUNTA DEL MILLÓN (FASE 2)
        if (listaParaSMS.length > 0) {
            let enviarMensajes = confirm(`⚠️ Se aplicó la mora exitosamente a ${castigosAplicados} clientes.\n\n¿Desea enviar ahora mismo la notificación por SMS a estos clientes?\n\n- Pulse "Aceptar" para enviar.\n- Pulse "Cancelar" para omitir los SMS.`);
            
            if (enviarMensajes) {
                // Si dijo que sí, disparamos los mensajes de la lista de espera con el freno de 3 segundos
                for (let i = 0; i < listaParaSMS.length; i++) {
                    let datos = listaParaSMS[i];
                    await window.notificarMoraSMS(datos.cliente, datos.etiqueta, datos.multa, datos.saldo, datos.dias);
                    mensajesEnviados++;
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
        }

        alert(`🚀 ¡PROCESO COMPLETADO CON ÉXITO!\n\n- Se aplicó mora a: ${castigosAplicados} clientes.\n- Se enviaron ${mensajesEnviados} SMS de notificación.\n- Se mantuvieron en Alertas a ${perfilesSocialesOmitidos} clientes con perfil SOCIAL para su revisión manual.\n\nEl panel se actualizará ahora.`);
        
        if (typeof window.despertarRobotDashboard === 'function') window.despertarRobotDashboard();

    } catch (error) {
        console.error("Error en barrido automático:", error);
        alert("❌ Ocurrió un error al procesar las moras automáticas: " + error.message);
    }
};
// =========================================================================
// 📜 VISOR DEL HISTORIAL DE MORAS POR CRÉDITO
// =========================================================================
window.verHistorialMoras = async function(idCredito, nombreCliente) {
    try {
        // Buscamos las moras de este crédito en la bóveda, ordenadas por fecha (las más nuevas primero)
        const { data: historial, error } = await supabaseClient
            .from('historial_moras')
            .select('*')
            .eq('credito_id', idCredito)
            .order('fecha_registro', { ascending: false });

        if (error) throw error;

        let tablaHTML = '';

        if (!historial || historial.length === 0) {
            tablaHTML = `<div style="text-align:center; padding: 20px; color: #64748b; font-weight: bold;">✅ Este crédito es impecable. No tiene moras registradas.</div>`;
        } else {
            // Construimos las filas de la tabla
            const filas = historial.map(h => {
                const fecha = new Date(h.fecha_registro).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
                return `
                <tr style="border-bottom: 1px solid #e2e8f0; font-size: 12px;">
                    <td style="padding: 10px; color: #475569;">${fecha}</td>
                    <td style="padding: 10px; font-weight: bold; color: #0f172a;">${h.tipo_accion}</td>
                    <td style="padding: 10px; color: #ef4444; font-weight: bold;">$${parseFloat(h.monto_castigo).toFixed(2)}</td>
                </tr>`;
            }).join('');

            tablaHTML = `
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                    <tr style="background: #f1f5f9; color: #334155; font-size: 11px; text-transform: uppercase;">
                        <th style="padding: 10px; border-bottom: 2px solid #cbd5e1;">Fecha</th>
                        <th style="padding: 10px; border-bottom: 2px solid #cbd5e1;">Tipo de Sanción</th>
                        <th style="padding: 10px; border-bottom: 2px solid #cbd5e1;">Monto</th>
                    </tr>
                </thead>
                <tbody>
                    ${filas}
                </tbody>
            </table>`;
        }

        // Creamos la ventanita visual flotante
        const modalHistorialId = 'modal-visor-moras';
        if (document.getElementById(modalHistorialId)) document.getElementById(modalHistorialId).remove();

        const modalVisor = `
        <div id="${modalHistorialId}" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.85); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 20px; backdrop-filter: blur(4px);">
            <div style="background: white; border-radius: 12px; width: 100%; max-width: 500px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); overflow: hidden;">
                <div style="background: #1e293b; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; color: white; font-size: 16px;">📜 Historial de Castigos</h3>
                    <button onclick="document.getElementById('${modalHistorialId}').remove()" style="background: transparent; border: none; color: #94a3b8; font-size: 20px; cursor: pointer;">&times;</button>
                </div>
                <div style="padding: 15px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <strong style="color: #0f172a; text-transform: uppercase;">${nombreCliente}</strong>
                    <div style="color: #64748b; font-size: 12px; margin-top: 4px;">Revisión de auditoría de multas</div>
                </div>
                <div style="max-height: 300px; overflow-y: auto; padding: 10px 20px;">
                    ${tablaHTML}
                </div>
                <div style="padding: 15px 20px; background: #f1f5f9; text-align: center; border-top: 1px solid #e2e8f0;">
                    <button onclick="document.getElementById('${modalHistorialId}').remove()" style="padding: 8px 25px; background: white; color: #475569; border: 1px solid #cbd5e1; border-radius: 6px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">Cerrar Historial</button>
                </div>
            </div>
        </div>`;
        
        document.body.insertAdjacentHTML('beforeend', modalVisor);

    } catch (error) {
        console.error("Error al cargar historial:", error);
        alert("Ocurrió un error al cargar el historial de moras.");
    }
};
// =========================================================================
// ⚙️ PANEL VISUAL DE SANCIONES Y CONEXIÓN A BASE DE DATOS
// =========================================================================
window.abrirPanelSancion = function(idCredito, nombreCliente, capital, total, saldo, tasaOriginal, estadoActual, etiquetaCRE, refBancaria) {
    const capitalNum = parseFloat(capital) || 1;
    const saldoNum = parseFloat(saldo) || 0; 
    const interesPorcentaje = parseFloat(tasaOriginal) || 20;
    const esCongelado = estadoActual === 'congelado';
    
    const multaSobreCapital = capitalNum * (interesPorcentaje / 100);
    const multaSobreSaldo = saldoNum * (interesPorcentaje / 100);

    const modalId = 'modal-sancion-alpha';
    const modalPrevio = document.getElementById(modalId);
    if (modalPrevio) modalPrevio.remove();

    // 📲 EL NUEVO BOTÓN DE AVISO DE GRACIA (SMS INTERNACIONAL) - CORREGIDO
    const btnAvisoGraciaHTML = esCongelado
        ? `<button disabled style="padding: 12px; background: #fef08a; color: #a16207; border: none; border-radius: 8px; font-weight: bold; cursor: not-allowed; display: flex; justify-content: space-between; align-items: center;"><span>📱 Enviar Aviso SMS (BLOQUEADO)</span></button>`
        : `<button onclick="enviarAvisoGraciaSMS(${idCredito}, '${nombreCliente.replace(/'/g, "\\'")}', ${saldoNum}, '${etiquetaCRE}', '${refBancaria}')" style="padding: 12px; background: #eab308; color: #422006; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(234, 179, 8, 0.2); transition: 0.2s;" onmouseover="this.style.background='#ca8a04'" onmouseout="this.style.background='#eab308'"><span>📱 Enviar Aviso SMS</span><span style="background: rgba(255,255,255,0.4); padding: 3px 8px; border-radius: 4px; font-size: 11px;">Periodo de Gracia</span></button>`;

    const btnCapitalHTML = esCongelado 
        ? `<button disabled style="padding: 12px; background: #fca5a5; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: not-allowed; display: flex; justify-content: space-between; align-items: center;"><span>🚨 Mora s/ Capital (BLOQUEADO)</span></button>`
        : `<button onclick="aplicarMoraSobreCapital(${idCredito}, ${multaSobreCapital}, ${saldoNum}, '${etiquetaCRE}')" style="padding: 12px; background: #dc2626; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.2);"><span>🚨 Mora s/ Capital</span><span style="background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 4px;">Sumar $${multaSobreCapital.toFixed(2)}</span></button>`;

    const btnSaldoHTML = esCongelado
        ? `<button disabled style="padding: 12px; background: #fdba74; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: not-allowed; display: flex; justify-content: space-between; align-items: center;"><span>⚡ Mora s/ Saldo (BLOQUEADO)</span></button>`
        : `<button onclick="aplicarMoraSobreSaldo(${idCredito}, ${multaSobreSaldo}, ${saldoNum}, '${etiquetaCRE}')" style="padding: 12px; background: #ea580c; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(234, 88, 12, 0.2);"><span>⚡ Mora s/ Saldo</span><span style="background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 4px;">Sumar $${multaSobreSaldo.toFixed(2)}</span></button>`;

    const btnCongelarHTML = esCongelado
        ? `<button onclick="alternarCongelamiento(${idCredito}, 'activo', '${etiquetaCRE}', ${saldoNum})" style="padding: 12px; background: #f59e0b; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.2);"><span>🔥 Descongelar Cuenta</span><span style="background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 4px;">Reactivar recargos</span></button>`
        : `<button onclick="alternarCongelamiento(${idCredito}, 'congelado', '${etiquetaCRE}', ${saldoNum})" style="padding: 12px; background: #0284c7; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(2, 132, 199, 0.2);"><span>🧊 Congelar Cuenta</span><span style="background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 4px;">Pausar recargos</span></button>`;

    const btnPerdonarHTML = esCongelado
        ? `<button disabled style="padding: 12px; background: #86efac; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: not-allowed; display: flex; justify-content: space-between; align-items: center;"><span>🛡️ Perdonar este mes (BLOQUEADO)</span></button>`
        : `<button onclick="perdonarMoraEsteMes(${idCredito}, '${etiquetaCRE}')" style="padding: 12px; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);"><span>🛡️ Perdonar este mes</span><span style="background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 4px;">Pausar 30 días</span></button>`;

    const btnRolloverHTML = esCongelado
        ? `<button disabled style="padding: 12px; background: #d8b4fe; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: not-allowed; display: flex; justify-content: space-between; align-items: center;"><span>🔄 Renovar Plazo (BLOQUEADO)</span></button>`
        : `<button onclick="renovarPlazoCredito(${idCredito}, '${etiquetaCRE}')" style="padding: 12px; background: #8b5cf6; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.2); transition: 0.2s;" onmouseover="this.style.background='#7c3aed'" onmouseout="this.style.background='#8b5cf6'"><span>🔄 Renovar Plazo (Solo pagó Interés)</span><span style="background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 4px;">Recalcular</span></button>`;
    
    const btnHistorialHTML = `<button onclick="verHistorialMoras(${idCredito}, '${nombreCliente.replace(/'/g, "\\'")}')" style="margin-top: 5px; padding: 10px; background: #f8fafc; color: #334155; border: 1px dashed #94a3b8; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; transition: all 0.2s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#f8fafc'"><span>📜 Ver Historial de Moras y Perdones</span></button>`;
    
    const modalHTML = `
    <div id="${modalId}" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.8); display: flex; justify-content: center; align-items: center; z-index: 9999; padding: 20px; backdrop-filter: blur(4px);">
        <div style="background: white; border-radius: 12px; width: 100%; max-width: 450px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); overflow: hidden;">
            <div style="background: #0f172a; padding: 20px; text-align: center;">
                <h3 style="margin: 0; color: white; font-size: 18px;">⚖️ Panel de Resolución de Cartera</h3>
                <p style="margin: 8px 0 2px 0; color: #94a3b8; font-size: 11px; font-weight: bold; letter-spacing: 0.5px;">ID: ${idCredito} | ${refBancaria || 'REF: NO-DATA'}</p>
                <p style="margin: 0 0 5px 0; color: #ca8a04; font-weight: bold; font-size: 16px;">${etiquetaCRE || 'CRE #'}</p>
                <p style="margin: 5px 0 0 0; color: #f8fafc; font-size: 14px; text-transform: uppercase;">${nombreCliente}</p>
                ${esCongelado ? '<div style="margin-top: 10px; display: inline-block; background: #e0f2fe; color: #0284c7; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold;">🧊 CUENTA CONGELADA Y PROTEGIDA</div>' : ''}
            </div>
            <div style="padding: 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: #64748b; font-size: 13px; font-weight: bold;">Capital Protegido:</span>
                    <span style="color: #0f172a; font-weight: 900; font-size: 13px;">$${capitalNum.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: #64748b; font-size: 13px; font-weight: bold;">Interés del Contrato Original:</span>
                    <span style="color: #0f172a; font-weight: 900; font-size: 13px;">${interesPorcentaje}%</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 2px dashed #cbd5e1;">
                    <span style="color: #ef4444; font-weight: bold; font-size: 15px;">Saldo Pendiente Actual:</span>
                    <span style="color: #ef4444; font-weight: 900; font-size: 20px;">$${saldoNum.toFixed(2)}</span>
                </div>
            </div>
            <div style="padding: 20px; display: flex; flex-direction: column; gap: 12px;">
                ${btnAvisoGraciaHTML}
                ${btnCapitalHTML}
                ${btnSaldoHTML}
                ${btnCongelarHTML}
                ${btnPerdonarHTML}
                ${btnRolloverHTML}
                ${btnHistorialHTML} 
            </div>
            <div style="padding: 15px 20px; background: #f1f5f9; text-align: center;">
                <button onclick="document.getElementById('${modalId}').remove()" style="padding: 10px 25px; background: white; color: #64748b; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">Cancelar y Cerrar</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};
// este codigo de aqui a bajo es para enviar mensajes cuando al cliente se le aplica mora 
// =========================================================================
// 🚨 LÓGICA INTELIGENTE DE ENVÍO DE SMS (NOTIFICACIÓN DE MORA)
// =========================================================================
// =========================================================================
// 🚨 LÓGICA INTELIGENTE DE ENVÍO DE SMS (NOTIFICACIÓN DE MORA)
// =========================================================================
// =========================================================================
// 🚨 LÓGICA INTELIGENTE DE ENVÍO DE SMS (NOTIFICACIÓN DE MORA)
// =========================================================================
// =========================================================================
// 🚨 LÓGICA INTELIGENTE DE ENVÍO DE SMS (NOTIFICACIÓN DE MORA CON FECHA EXACTA)
// =========================================================================
window.notificarMoraSMS = async function(clienteObj, etiquetaCRE, multaAplicada, nuevoSaldo, diasAtraso) {
    // 1. Validaciones de seguridad
    if (!clienteObj || !clienteObj.whatsapp) {
        console.log("⚠️ SMS Mora cancelado: El cliente no tiene un número registrado.");
        return;
    }
    
    if (typeof enviarSMSAutomatico !== 'function') {
        console.log("⚠️ SMS Mora cancelado: El sistema no detecta la función 'enviarSMSAutomatico'.");
        return;
    }

    try {
        // 2. Construcción de la Referencia Bancaria (Estilo Alpha)
        const nombre = `${clienteObj.nombres} ${clienteObj.apellidos}`.toUpperCase();
        const iN = (clienteObj.nombres || '').trim().charAt(0);
        const iA = (clienteObj.apellidos || '').trim().charAt(0);
        const u4 = (clienteObj.cedula || '').trim().slice(-4);
        const refFinal = `${iN}${iA}-${u4}`.toUpperCase();

        // 3. Formateo de Fecha y Hora (El Mes en Letras como pidió el Gerente)
        const ahora = new Date();
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        
        const diaSemana = dias[ahora.getDay()];
        const diaNum = String(ahora.getDate()).padStart(2, '0');
        const mesNombre = meses[ahora.getMonth()];
        const anioCorto = String(ahora.getFullYear()).slice(-2);
        
        let horas = ahora.getHours();
        let minutos = String(ahora.getMinutes()).padStart(2, '0');
        const ampm = horas >= 12 ? 'p. m.' : 'a. m.';
        horas = horas % 12; 
        horas = horas ? horas : 12;
        const horaFormateada = `${String(horas).padStart(2, '0')}:${minutos} ${ampm}`;

        const fechaHoraSMS = `${diaSemana} ${diaNum}/${mesNombre}/${anioCorto} | ${horaFormateada}`;

        // 4. Armado de la Plantilla de Texto Exacta
        const msjSalida = `=== SISTEMA ALPHA ===\n${fechaHoraSMS}\n\n🆔 Ref: ${refFinal} | ${etiquetaCRE}\n👤 Cliente: ${nombre}\n\nHola, te notificamos que se ha aplicado un recargo por atraso en tu cuenta.\n\n⚠️ Motivo: Mora Automática\n💰 Multa Aplicada: $${parseFloat(multaAplicada).toFixed(2)}\n📉 Nuevo Saldo: $${parseFloat(nuevoSaldo).toFixed(2)}\n⏳ Días de Atraso: ${diasAtraso} días\n\nPor favor, regulariza tu pago lo antes posible.\n🚫 POR FAVOR, NO RESPONDER A ESTE MENSAJE.`;

        // 5. Disparo silencioso a través de su app MacroDroid
        await enviarSMSAutomatico(clienteObj.whatsapp.toString(), msjSalida);
        console.log("✅ SMS de Mora enviado con éxito al número: " + clienteObj.whatsapp);

    } catch (errorSMS) {
        console.error(`❌ Falló el armado o envío del SMS de Mora: ${errorSMS.message}`);
    }
};

// =========================================================================
// 📲 MOTOR DE AVISO DE GRACIA (SMS INTERNACIONAL) - CON LÉXICO Y CRE CIFRADO
// =========================================================================
window.enviarAvisoGraciaSMS = async function(idCredito, nombreCliente, saldoActual, etiquetaCRE, refBancaria) {
    if (!confirm(`📲 ¿Desea enviar el Aviso de Periodo de Gracia por SMS a ${nombreCliente}?\n\nSe le notificará que tiene pocos días para evitar recargos.`)) return;

    try {
        const { data: credito, error: errBusq } = await supabaseClient
            .from('creditos')
            .select('fecha_vencimiento_actual, fecha_emision, clientes(whatsapp)')
            .eq('id', idCredito).single();

        if (errBusq) throw errBusq;

        const cli = credito.clientes || {};
        if (!cli.whatsapp) {
            alert("❌ Imposible enviar SMS: Este cliente no tiene número de WhatsApp registrado.");
            return;
        }

        // 🔥 EXTRAEMOS LA FECHA DE CREACIÓN EXACTA
        const fechaEmision = new Date(credito.fecha_emision);
        const opcionesFecha = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        let fechaEmisionTxt = fechaEmision.toLocaleDateString('es-ES', opcionesFecha);
        fechaEmisionTxt = fechaEmisionTxt.charAt(0).toUpperCase() + fechaEmisionTxt.slice(1);

        const ahora = new Date();
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        
        let horas = ahora.getHours();
        let minutos = String(ahora.getMinutes()).padStart(2, '0');
        const ampm = horas >= 12 ? 'p. m.' : 'a. m.';
        horas = horas % 12; horas = horas ? horas : 12;
        
        const fechaHoraSMS = `${dias[ahora.getDay()]} ${String(ahora.getDate()).padStart(2, '0')}/${meses[ahora.getMonth()]}/${String(ahora.getFullYear()).slice(-2)} | ${String(horas).padStart(2, '0')}:${minutos} ${ampm}`;

        // 1. Limpiamos la referencia bancaria para no repetir "REF:"
        let refLimpia = refBancaria.replace(/^REF:\s*/i, '');
        refLimpia = refLimpia.split('|')[0].trim();

        // 2. 🔥 MAGIA PARA EL CÓDIGO CRE (Extraemos solo las letras entre corchetes, ej: HV)
        let cifradoFinal = "";
        const matchCod = etiquetaCRE.match(/\[(.*?)\]/);
        if (matchCod && matchCod[1]) {
            cifradoFinal = ` | CRE #${matchCod[1]}`; // Esto genera el " | CRE #HV"
        }

        // 🔥 EL NUEVO MENSAJE IMPLACABLE
        const msjAviso = `=== SISTEMA ALPHA (Aviso) ===\n${fechaHoraSMS}\n\n🆔 Ref: ${refLimpia}${cifradoFinal}\n👤 Cliente: ${nombreCliente}\n\nHola, este es un recordatorio automático. Le informamos que su crédito por el saldo de $${saldoActual}, emitido el pasado ${fechaEmisionTxt}, ha superado su fecha límite de pago.\n\n🛡️ Estado actual: PERIODO DE GRACIA.\n\nPara evitar que el sistema le aplique multas y recargos financieros, le invitamos a regularizar su cuenta en los próximos días. ¡Agradecemos su puntualidad!\n\n🚫 NO RESPONDER A ESTE MENSAJE AUTOMÁTICO.`;

        if (typeof enviarSMSAutomatico === 'function') {
            await enviarSMSAutomatico(cli.whatsapp.toString(), msjAviso);
            alert(`✅ Mensaje de Aviso de Gracia enviado exitosamente a ${nombreCliente}.`);
            if(document.getElementById('modal-sancion-alpha')) document.getElementById('modal-sancion-alpha').remove();
        } else {
            alert("❌ La conexión con MacroDroid no se encontró.");
        }

    } catch (error) {
        console.error("Error al enviar Aviso de Gracia:", error);
        alert("❌ Error interno al procesar el SMS: " + error.message);
    }
};
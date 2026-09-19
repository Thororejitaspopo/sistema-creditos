/* ==========================================================================
   MÓDULO DE DEPURACIÓN (PAPELERA GLOBAL)
   ========================================================================== */
/* ==========================================================================
   MÓDULO DE DEPURACIÓN (PAPELERA GLOBAL)
   ========================================================================== */
async function cargarPapelera(categoria) {
    const contenedor = document.getElementById('contenedor-papelera');
    
    // 🧹 Limpiamos el buscador global cada vez que cambias de pestaña
    const buscadorGlobal = document.getElementById('input-buscador-global-papelera');
    if (buscadorGlobal) buscadorGlobal.value = '';

    // =====================================================================
    // SECCIÓN A: CLIENTES ARCHIVADOS
    // =====================================================================
    if (categoria === 'clientes') {
        contenedor.innerHTML = '<p style="color:#64748b; font-size:13px;">Buscando clientes en el archivo...</p>';
        try {
            const { data: archivados, error } = await supabaseClient
                .from('clientes')
                .select('*')
                .eq('estado', 'inactivo')
                .order('id', { ascending: false });

            if (error) throw error;
            if (archivados.length === 0) {
                contenedor.innerHTML = `<p style="color: #10b981; font-weight: bold;">✨ El archivo de clientes está limpio.</p>`;
                return;
            }

            contenedor.innerHTML = archivados.map(c => {
                const nombreCompleto = `${c.nombres} ${c.apellidos}`.toUpperCase();
                const textoBusqueda = `${nombreCompleto} ${c.cedula} ${c.id}`.toLowerCase(); // 🔑 DATO INVISIBLE

                return `
                <div class="item-papelera-global" data-busqueda="${textoBusqueda}" style="background: #fff; border: 1px solid #e2e8f0; border-left: 5px solid #64748b; border-radius: 8px; padding: 15px; margin-bottom: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <span style="background: #f1f5f9; color: #475569; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: bold;">ID CLI: ${c.id}</span>
                            <h3 style="margin: 8px 0 4px 0; font-size: 14px; color: #1e293b;">${nombreCompleto}</h3>
                            <p style="margin: 0; font-size: 12px; color: #64748b;">🆔 Cédula: ${c.cedula}</p>
                        </div>
                        <span style="font-size: 20px;">👥</span>
                    </div>
                    <div style="margin-top: 15px; display: flex; gap: 8px; border-top: 1px dashed #cbd5e1; padding-top: 12px;">
                        <button onclick="reactivarClienteDesdePapelera(${c.id}, '${nombreCompleto}')" style="flex: 1; padding: 8px; background: #10b981; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px;">♻️ Restaurar</button>
                        <button onclick="forzarEliminacionCliente(${c.id}, '${nombreCompleto}')" style="padding: 8px 12px; background: #ef4444; color: white; border: none; border-radius: 5px; cursor: pointer;">💥</button>
                    </div>
                </div>`;
            }).join('');
        } catch (error) { contenedor.innerHTML = `<p style="color:red; font-size:13px;">Error: ${error.message}</p>`; }
    } 
    // =====================================================================
    // 🌟 SECCIÓN B: CRÉDITOS ANULADOS (AHORA CON DISEÑO VIP TIPO "FINALIZADOS")
    // =====================================================================
    else if (categoria === 'creditos') {
        contenedor.innerHTML = '<p style="color:#64748b; font-size:13px;">Abriendo bóveda de auditoría de créditos anulados...</p>';
        try {
            // 1. Ampliamos la consulta para traer todos los datos financieros necesarios
            const { data: anulados, error } = await supabaseClient
                .from('creditos')
                .select(`id, monto_capital, tasa_interes, total_pagar, valor_cuota, num_cuotas, frecuencia_pago, forma_entrega, fecha_emision, cliente_id, clientes!inner(nombres, apellidos, cedula)`)
                .eq('estado', 'inactivo')
                .order('id', { ascending: false });

            if (error) throw error;
            if (anulados.length === 0) {
                contenedor.innerHTML = `<p style="color: #0284c7; font-weight: bold;">✨ No hay alertas ni créditos anulados en la bitácora.</p>`;
                return;
            }

            // 2. Traemos el historial para calcular el número exacto del crédito
            const { data: todosLosCreditos } = await supabaseClient
                .from('creditos')
                .select('id, cliente_id')
                .order('id', { ascending: true });
                
            let mapaNumeroCredito = {};
            if (todosLosCreditos) {
                let conteos = {};
                todosLosCreditos.forEach(c => {
                    if (!conteos[c.cliente_id]) conteos[c.cliente_id] = 0;
                    conteos[c.cliente_id]++;
                    mapaNumeroCredito[c.id] = conteos[c.cliente_id];
                });
            }

            // 3. Formateador de Fechas Fórmula Alpha
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

            contenedor.innerHTML = anulados.map(cre => {
                const cli = cre.clientes || {};
                const nombreCliente = `${cli.nombres} ${cli.apellidos}`.toUpperCase();
                const iN = (cli.nombres || 'X').trim().charAt(0).toUpperCase();
                const iA = (cli.apellidos || 'X').trim().charAt(0).toUpperCase();
                const u4 = (cli.cedula || '0000').trim().slice(-4);
                const refFinal = `REF: ${iN}${iA}-${u4}`;

                // Cálculo del Código CRE
                let numeroCredito = mapaNumeroCredito[cre.id] || '?';
                let creCifrado = typeof cifrarNumeroCredito === 'function' ? cifrarNumeroCredito(numeroCredito).toUpperCase() : '?';
                let etiquetaCRE = `CRE #${numeroCredito} [${creCifrado}]`;

                // Variables financieras
                const capital = parseFloat(cre.monto_capital) || 0;
                const total = parseFloat(cre.total_pagar) || 0;
                const interesPorcentaje = ~~cre.tasa_interes ? cre.tasa_interes : 0;
                const cuota = parseFloat(cre.valor_cuota) || 0;
                const fechaEmisionTxt = formatearFechaAlpha(cre.fecha_emision);

                const textoBusqueda = `${nombreCliente} ${cli.cedula} ${refFinal} ${cre.id} ${capital}`.toLowerCase();

                // 4. EL NUEVO DISEÑO VIP PARA ANULADOS
                return `
                <div class="item-papelera-global" data-busqueda="${textoBusqueda}" style="background: #fff; border: 1px solid #cbd5e1; border-left: 6px solid #ef4444; border-radius: 10px; padding: 15px; margin-bottom: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                    
                    <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 10px; flex-wrap: wrap; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
                        <span style="background: #f1f5f9; color: #334155; font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 900; border: 1px solid #cbd5e1;">${refFinal}</span>
                        <span style="background: #fee2e2; color: #b91c1c; font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 900; border: 1px solid #fecaca;">CRÉDITO #${cre.id}</span>
                        <span style="background: #fef08a; color: #854d0e; font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 900; border: 1px solid #fde047;">${etiquetaCRE}</span>
                        <span style="background: #fef2f2; color: #ef4444; font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 900; border: 1px dashed #ef4444;">🚫 ANULADO</span>
                        <span style="margin-left: auto; font-size: 18px;" title="Caja origen: ${cre.forma_entrega}">💸</span>
                    </div>
                    
                    <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #0f172a; font-weight: 900;">👤 ${nombreCliente}</h3>
                    <p style="margin: 0 0 10px 0; font-size: 12px; color: #64748b;">🆔 Cédula: ${cli.cedula}</p>
                    
                    <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px dashed #94a3b8; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 8px;">
                            <span style="font-size: 13px; color: #334155;"><strong>Capital:</strong> $${capital.toFixed(2)}</span>
                            <span style="font-size: 13px; color: #334155;"><strong>Interés:</strong> ${interesPorcentaje}%</span>
                            <span style="font-size: 13px; color: #334155;"><strong>Cuota:</strong> $${cuota.toFixed(2)}</span>
                            <span style="font-size: 14px; color: #b91c1c; font-weight: 900;">💰 Total a Pagar: $${total.toFixed(2)}</span>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 4px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
                            <span style="font-size: 12px; color: #475569;">🔄 <strong>Frecuencia de Pago:</strong> ${cre.frecuencia_pago || 'No especificada'}</span>
                            <span style="font-size: 12px; color: #475569;">🔢 <strong>N° de Cuotas:</strong> ${cre.num_cuotas || '0'}</span>
                        </div>
                    </div>

                    <div style="background: #fef2f2; padding: 12px; border-radius: 6px; display: flex; flex-direction: column; gap: 8px; border-left: 3px solid #ef4444; margin-bottom: 15px;">
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <span style="font-size: 14px;">🗓️</span>
                            <p style="margin: 0; font-size: 12px; color: #7f1d1d; font-weight: 600;">Fecha de emisión original: <span style="color: #991b1b; font-weight: bold;">${fechaEmisionTxt}</span></p>
                        </div>
                    </div>

                    <div style="display: flex; gap: 8px;">
                        <button onclick="reactivarCreditoDesdePapelera(${cre.id}, ${cre.monto_capital}, '${cre.forma_entrega}', '${nombreCliente.replace(/'/g, "\\'")}')" style="flex: 1; padding: 10px; background: #0284c7; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">♻️ Restaurar Crédito</button>
                        <button onclick="forzarEliminacionCredito(${cre.id})" style="padding: 10px 15px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" title="Destruir Registro">💥</button>
                    </div>

                </div>`;
            }).join('');
        } catch (error) { contenedor.innerHTML = `<p style="color:red; font-size:13px;">Error: ${error.message}</p>`; }
    }
    // =====================================================================
    // 🛡️ SECCIÓN C: BÓVEDA DE PAGOS ELIMINADOS (AUDITORÍA COMPLETA)
    // =====================================================================
    else if (categoria === 'pagos_eliminados') {
        contenedor.innerHTML = '<p style="color:#64748b; font-size:13px;">Abriendo bóveda y cruzando datos de clientes...</p>';
        try {
            const { data: pagosBorrados, error } = await supabaseClient
                .from('auditoria_pagos_eliminados')
                .select('*')
                .order('fecha_eliminacion', { ascending: false });

            if (error) throw error;
            if (pagosBorrados.length === 0) {
                contenedor.innerHTML = `<p style="color: #f59e0b; font-weight: bold;">✨ La bóveda está limpia. No hay abonos anulados.</p>`;
                return;
            }

            const idsCreditos = [...new Set(pagosBorrados.map(p => p.id_credito))];
            let diccionarioClientes = {};
            if (idsCreditos.length > 0) {
                const { data: creditosData } = await supabaseClient.from('creditos').select('id, clientes(nombres, apellidos, cedula)').in('id', idsCreditos);
                if (creditosData) { creditosData.forEach(c => { diccionarioClientes[c.id] = c.clientes; }); }
            }

            contenedor.innerHTML = pagosBorrados.map(pago => {
                const fEli = new Date(pago.fecha_eliminacion);
                const fechaEliminacionTxt = `${fEli.toLocaleDateString('es-EC')} | H:${fEli.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}`;
                
                let fechaOriginalTxt = 'Fecha original no registrada';
                if (pago.fecha_pago_original) {
                    const fOri = new Date(pago.fecha_pago_original);
                    const diaOri = fOri.toLocaleDateString('es-EC', { weekday: 'long' });
                    fechaOriginalTxt = `📅 ${diaOri.charAt(0).toUpperCase() + diaOri.slice(1)} ${fOri.toLocaleDateString('es-EC')} | H:${fOri.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}`;
                }

                const metodoPago = pago.forma_pago ? pago.forma_pago.toUpperCase() : 'EFECTIVO';
                const creCifrado = pago.codigo_cre || 'CRE #?';
                
                const cli = diccionarioClientes[pago.id_credito] || {};
                const nombreCliente = cli.nombres ? `${cli.nombres} ${cli.apellidos}`.toUpperCase() : 'CLIENTE DESCONOCIDO';
                
                const iN = (cli.nombres || 'X').trim().charAt(0).toUpperCase();
                const iA = (cli.apellidos || 'X').trim().charAt(0).toUpperCase();
                const refFinal = `REF: ${iN}${iA}-${(cli.cedula || '0000').trim().slice(-4)}`;

                const textoBusqueda = `${nombreCliente} ${cli.cedula} ${refFinal} ${pago.id_credito} ${creCifrado} ${metodoPago}`.toLowerCase();

                return `
                <div class="item-papelera-global" data-busqueda="${textoBusqueda}" style="background: #fff; border: 1px solid #cbd5e1; border-left: 6px solid #ef4444; border-radius: 10px; padding: 15px; margin-bottom: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                    <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 10px; flex-wrap: wrap;">
                        <span style="background: #f1f5f9; color: #334155; font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 900; border: 1px solid #cbd5e1;">${refFinal}</span>
                        <span style="background: #e0f2fe; color: #0369a1; font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 900; border: 1px solid #bae6fd;">${creCifrado}</span>
                        <span style="background: #fef3c7; color: #b45309; font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 900; border: 1px solid #fde68a;">CRÉDITO #${pago.id_credito}</span>
                        <span style="background: #fee2e2; color: #b91c1c; font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 900; border: 1px solid #fecaca;">PAGO #${pago.numero_pago}</span>
                        <span style="background: #dcfce7; color: #15803d; font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 900; border: 1px solid #bbf7d0;">${metodoPago}</span>
                        <span style="margin-left: auto; font-size: 18px;">🔒</span>
                    </div>
                    
                    <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #0f172a; font-weight: 900;">👤 ${nombreCliente}</h3>
                    <p style="margin: 0 0 10px 0; font-size: 13px; color: #64748b; font-weight: 600;">Pago original: ${fechaOriginalTxt}</p>
                    
                    <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px dashed #94a3b8; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <p style="margin: 0; font-size: 12px; color: #475569; font-weight: bold;">Monto Reversado:</p>
                            <p style="margin: 0; font-size: 22px; color: #ef4444; font-weight: 900;">$${parseFloat(pago.abono_total).toFixed(2)}</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="margin: 0 0 5px 0; font-size: 11px; color: #64748b; font-weight: 600;">🗑️ Anulado: ${fechaEliminacionTxt}</p>
                            <p style="margin: 0; font-size: 11px; color: #475569; background: #e2e8f0; padding: 4px 8px; border-radius: 4px; display: inline-block; font-weight: bold;">📝 ${pago.motivo_eliminacion || 'Auditoría Interna'}</p>
                        </div>
                    </div>
                </div>`;
            }).join('');
        } catch (error) { contenedor.innerHTML = `<p style="color:red; font-size:13px;">Error de Bóveda: ${error.message}</p>`; }
    }
    // =====================================================================
    // 🏆 SECCIÓN D: CRÉDITOS FINALIZADOS (CON BOTÓN DE HISTORIAL)
    // =====================================================================
    else if (categoria === 'finalizados') {
        contenedor.innerHTML = '<p style="color:#64748b; font-size:13px;">Abriendo bóveda histórica y calculando últimos pagos...</p>';
        try {
            // 🔥 AÑADIDO: "cliente_id" a la consulta para calcular CRE exacto
            const { data: finalizados, error } = await supabaseClient
                .from('creditos')
                .select(`id, monto_capital, total_pagar, monto_mora, fecha_emision, frecuencia_pago, num_cuotas, valor_cuota, cliente_id, clientes!inner(nombres, apellidos, cedula)`)
                .eq('estado', 'finalizado');
                // Quitamos el order('id') de aquí porque ahora lo ordenaremos nosotros por fecha exacta de cancelación

            if (error) throw error;
            if (finalizados.length === 0) {
                contenedor.innerHTML = `<p style="color: #8b5cf6; font-weight: bold;">✨ Aún no hay créditos finalizados en el historial.</p>`;
                return;
            }

            // 🔥 MAGIA: Calculamos el historial para saber el número exacto (Ej: 38)
            const { data: todosLosCreditos } = await supabaseClient
                .from('creditos')
                .select('id, cliente_id')
                .order('id', { ascending: true });
                
            let mapaNumeroCredito = {};
            if (todosLosCreditos) {
                let conteos = {};
                todosLosCreditos.forEach(c => {
                    if (!conteos[c.cliente_id]) conteos[c.cliente_id] = 0;
                    conteos[c.cliente_id]++;
                    mapaNumeroCredito[c.id] = conteos[c.cliente_id];
                });
            }

            const idsCreditos = finalizados.map(c => c.id);
            let ultimosPagos = {};
            if (idsCreditos.length > 0) {
                const { data: pagos } = await supabaseClient
                    .from('historial_pagos')
                    .select('id_credito, fecha_pago')
                    .in('id_credito', idsCreditos)
                    .order('fecha_pago', { ascending: false });
                
                if (pagos) {
                    pagos.forEach(p => {
                        if (!ultimosPagos[p.id_credito]) ultimosPagos[p.id_credito] = p.fecha_pago;
                    });
                }
            }

            // 🚀 LA SOLUCIÓN MAESTRA: Ordenamos los créditos basándonos en cuándo hicieron su ÚLTIMO PAGO
            finalizados.sort((a, b) => {
                const tiempoA = ultimosPagos[a.id] ? new Date(ultimosPagos[a.id]).getTime() : 0;
                const tiempoB = ultimosPagos[b.id] ? new Date(ultimosPagos[b.id]).getTime() : 0;
                return tiempoB - tiempoA; // El pago más reciente aparecerá arriba de todo
            });

            const formatearFechaAlpha = (fechaISO) => {
                if (!fechaISO) return 'N/A';
                const f = new Date(fechaISO);
                const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
                const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                let hora = f.getHours();
                const ampm = hora >= 12 ? 'pm' : 'am';
                hora = hora % 12 || 12; 
                const min = f.getMinutes().toString().padStart(2, '0');
                return `${dias[f.getDay()]} ${f.getDate()}/${meses[f.getMonth()]}/${f.getFullYear()} | h ${hora}:${min} ${ampm}`;
            };

            contenedor.innerHTML = finalizados.map(cre => {
                const cli = cre.clientes || {};
                const nombreCliente = `${cli.nombres} ${cli.apellidos}`.toUpperCase();
                const iN = (cli.nombres || 'X').trim().charAt(0).toUpperCase();
                const iA = (cli.apellidos || 'X').trim().charAt(0).toUpperCase();
                const u4 = (cli.cedula || '0000').trim().slice(-4);
                const refFinal = `REF: ${iN}${iA}-${u4}`;
                
                // 🔥 AQUÍ ARMAMOS LA ETIQUETA PERFECTA (Ej: CRE #38 [RJ])
                let numeroCredito = mapaNumeroCredito[cre.id] || '?';
                let creCifrado = typeof cifrarNumeroCredito === 'function' ? cifrarNumeroCredito(numeroCredito).toUpperCase() : '?';
                let etiquetaCRE = `CRE #${numeroCredito} [${creCifrado}]`;

                const capital = parseFloat(cre.monto_capital) || 1;
                const total = parseFloat(cre.total_pagar) || 1;
                const calcInteresPorcentaje = Math.round(((total - capital) / capital) * 100);

                // 🔥 INYECCIÓN DE MORA Y TOTAL REAL CANCELADO
                const moraExtra = parseFloat(cre.monto_mora) || 0;
                let visualTotalAPagar = `<span style="font-size: 14px; color: #166534; font-weight: 900;">💰 Total a Pagar: $${total.toFixed(2)}</span>`;
                
                if (moraExtra > 0) {
                    const totalCancelado = total + moraExtra;
                    visualTotalAPagar += ` <span style="background: #fee2e2; color: #ef4444; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-left: 5px;">+ Mora $${moraExtra.toFixed(2)}</span>`;
                    visualTotalAPagar += ` <span style="background: #f8fafc; border: 1px dashed #cbd5e1; color: #334155; font-size: 12px; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-left: 5px;">👉 Cancelado: $${totalCancelado.toFixed(2)}</span>`;
                }

                let fechaEmisionTxt = formatearFechaAlpha(cre.fecha_emision);
                let fechaUltimoPagoTxt = ultimosPagos[cre.id] ? formatearFechaAlpha(ultimosPagos[cre.id]) : 'Sin pagos registrados';

                const textoBusqueda = `${nombreCliente} ${cli.cedula} ${refFinal} ${cre.id}`.toLowerCase();

                return `
                <div class="item-papelera-global" data-busqueda="${textoBusqueda}" style="background: #fff; border: 1px solid #cbd5e1; border-left: 6px solid #8b5cf6; border-radius: 10px; padding: 15px; margin-bottom: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                    
                    <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 10px; flex-wrap: wrap; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
                        <span style="background: #f1f5f9; color: #334155; font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 900; border: 1px solid #cbd5e1;">${refFinal}</span>
                        <span style="background: #ede9fe; color: #5b21b6; font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 900; border: 1px solid #ddd6fe;">CRÉDITO #${cre.id}</span>
                        <span style="background: #fef08a; color: #854d0e; font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 900; border: 1px solid #fde047;">${etiquetaCRE}</span>
                        <span style="background: #dcfce7; color: #166534; font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 900; border: 1px solid #bbf7d0;">✅ PAGADO AL 100%</span>
                        <span style="margin-left: auto; font-size: 18px;">🏆</span>
                    </div>
                    
                    <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #0f172a; font-weight: 900;">👤 ${nombreCliente}</h3>
                    <p style="margin: 0 0 10px 0; font-size: 12px; color: #64748b;">🆔 Cédula: ${cli.cedula}</p>
                    
                    <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px dashed #94a3b8; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 8px;">
                            <span style="font-size: 13px; color: #334155;"><strong>Capital:</strong> $${capital.toFixed(2)}</span>
                            <span style="font-size: 13px; color: #334155;"><strong>Interés:</strong> ${calcInteresPorcentaje}%</span>
                            <span style="font-size: 13px; color: #334155;"><strong>Cuota:</strong> $${parseFloat(cre.valor_cuota || 0).toFixed(2)}</span>
                            ${visualTotalAPagar}
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 4px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
                            <span style="font-size: 12px; color: #475569;">🔄 <strong>Frecuencia de Pago:</strong> ${cre.frecuencia_pago || 'Cobro Diario'}</span>
                            <span style="font-size: 12px; color: #475569;">🔢 <strong>N° de Cuotas:</strong> ${cre.num_cuotas || '0'}</span>
                        </div>
                    </div>

                    <div style="background: #f1f5f9; padding: 12px; border-radius: 6px; display: flex; flex-direction: column; gap: 8px;">
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <span style="font-size: 14px;">🗓️</span>
                            <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 600;">Inicio de crédito: <span style="color: #0f172a; font-weight: bold;">${fechaEmisionTxt}</span></p>
                        </div>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <span style="font-size: 14px;">🏆</span>
                            <p style="margin: 0; font-size: 12px; color: #166534; font-weight: 900;">Último pago (Cancelación): <span style="color: #166534;">${fechaUltimoPagoTxt}</span></p>
                        </div>
                    </div>

                    <div style="margin-top: 15px;">
                        <button onclick="verHistorialPagosFinalizado(${cre.id}, '${nombreCliente.replace(/'/g, "\\'")}')" style="width: 100%; padding: 10px; background: #0f172a; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">📑 Ver Historial de Pagos</button>
                    </div>

                </div>`;
            }).join('');

        } catch (error) { 
            contenedor.innerHTML = `<p style="color:red; font-size:13px;">Error histórico: ${error.message}</p>`; 
        }
    }
}



// =========================================================================
// 📄 VISOR FLOTANTE DE HISTORIAL DE PAGOS (CON FECHAS ALPHA Y CRE)
// =========================================================================
async function verHistorialPagosFinalizado(idCredito, nombreCliente) {
    try {
        // 1. Buscamos TODOS los pagos de ese crédito en Supabase
        const { data: pagos, error } = await supabaseClient
            .from('historial_pagos')
            .select('*')
            .eq('id_credito', idCredito)
            .order('numero_pago', { ascending: true });

        if (error) throw error;

        if (!pagos || pagos.length === 0) {
            alert(`⚠️ No se encontraron pagos registrados para el crédito #${idCredito}.`);
            return;
        }

        // 2. ⏱️ FORMATEADOR EXACTO ALPHA PARA LA TABLA (ej. lunes 11/julio/2026 - 10:14 a. m.)
        const formatearFechaTabla = (fechaISO) => {
            if (!fechaISO) return 'N/A';
            const f = new Date(fechaISO);
            const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
            const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            let hora = f.getHours();
            const ampm = hora >= 12 ? 'p. m.' : 'a. m.';
            hora = hora % 12 || 12; // Formato 12 horas
            const min = f.getMinutes().toString().padStart(2, '0');
            return `${dias[f.getDay()]} ${f.getDate()}/${meses[f.getMonth()]}/${f.getFullYear()} - ${hora}:${min} ${ampm}`;
        };

        // 3. Generamos la etiqueta CRE cifrada para el encabezado
        let creCifrado = typeof cifrarNumeroCredito === 'function' ? cifrarNumeroCredito(idCredito).toUpperCase() : '';
        let etiquetaCRE = creCifrado ? `CRE #${idCredito} [${creCifrado}]` : `CRE #${idCredito}`;

        // 4. Armamos las filas de la tabla con los pagos extraídos y la fecha pulida
        let filasHTML = pagos.map(p => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px; text-align: center; color: #475569; font-weight: bold;">#${p.numero_pago}</td>
                <td style="padding: 10px; color: #0f172a;">${formatearFechaTabla(p.fecha_pago)}</td>
                <td style="padding: 10px; text-align: center;">
                    <span style="background: #e2e8f0; color: #475569; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                        ${(p.forma_pago || 'EFECTIVO').toUpperCase()}
                    </span>
                </td>
                <td style="padding: 10px; text-align: right; color: #166534; font-weight: 900;">$${parseFloat(p.abono_total).toFixed(2)}</td>
            </tr>
        `).join('');

        const totalPagado = pagos.reduce((sum, p) => sum + parseFloat(p.abono_total || 0), 0);
        const modalId = 'modal-historial-pagos-alpha';

        // Borramos si quedó uno abierto antes
        const modalPrevio = document.getElementById(modalId);
        if (modalPrevio) modalPrevio.remove();

        // 5. Diseñamos la Ventana Flotante (Pop-up)
        const modalHTML = `
        <div id="${modalId}" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.7); display: flex; justify-content: center; align-items: center; z-index: 9999; padding: 20px; box-sizing: border-box; backdrop-filter: blur(3px);">
            <div style="background: white; border-radius: 12px; width: 100%; max-width: 550px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">
                
                <div style="background: #0f172a; padding: 15px 20px; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h3 style="margin: 0; color: white; font-size: 16px;">📑 Auditoría de Pagos</h3>
                        <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px; display: flex; align-items: center;">
                            <span style="background: #334155; padding: 2px 6px; border-radius: 4px; color: #e2e8f0; font-weight: bold; margin-right: 6px;">${etiquetaCRE}</span> 
                            CRÉDITO #${idCredito} - ${nombreCliente}
                        </p>
                    </div>
                    <button onclick="document.getElementById('${modalId}').remove()" style="background: #ef4444; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center;">X</button>
                </div>

                <div style="padding: 20px; overflow-y: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <thead>
                            <tr style="background: #f8fafc; color: #64748b; text-align: left; border-bottom: 2px solid #e2e8f0;">
                                <th style="padding: 10px; text-align: center;">N°</th>
                                <th style="padding: 10px;">Fecha y Hora</th>
                                <th style="padding: 10px; text-align: center;">Método</th>
                                <th style="padding: 10px; text-align: right;">Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filasHTML}
                        </tbody>
                    </table>
                </div>

                <div style="padding: 15px 20px; background: #f8fafc; border-top: 2px solid #e2e8f0; border-radius: 0 0 12px 12px; display: flex; justify-content: space-between; align-items: center;">
                    <button onclick="document.getElementById('${modalId}').remove()" style="padding: 8px 16px; border: 1px solid #cbd5e1; background: white; border-radius: 6px; cursor: pointer; font-weight: bold; color: #475569;">Cerrar Vista</button>
                    <div style="text-align: right;">
                        <span style="font-size: 12px; color: #64748b; font-weight: bold;">TOTAL RECAUDADO</span><br>
                        <span style="font-size: 18px; color: #166534; font-weight: 900;">$${totalPagado.toFixed(2)}</span>
                    </div>
                </div>

            </div>
        </div>`;

        // Lo inyectamos en la pantalla
        document.body.insertAdjacentHTML('beforeend', modalHTML);

    } catch (err) {
        alert("❌ Error crítico al cargar el historial: " + err.message);
    }
}
window.verHistorialPagosFinalizado = verHistorialPagosFinalizado;


// =========================================================================
// 🔍 MOTOR UNIVERSAL DE BÚSQUEDA PARA LA DEPURACIÓN
// =========================================================================
function filtrarPapeleraGlobal() {
    const textoInput = document.getElementById('input-buscador-global-papelera').value.toLowerCase();
    // Busca todas las tarjetas, sin importar en qué pestaña estemos
    const tarjetas = document.querySelectorAll('.item-papelera-global');

    tarjetas.forEach(tarjeta => {
        const datosTarjeta = tarjeta.getAttribute('data-busqueda') || '';
        
        if (datosTarjeta.includes(textoInput)) {
            tarjeta.style.display = 'block';
        } else {
            tarjeta.style.display = 'none';
        }
    });
}
window.filtrarPapeleraGlobal = filtrarPapeleraGlobal;


/**
 * Función para revivir a un cliente archivado
 */
async function reactivarClienteDesdePapelera(id, nombre) {
    if (confirm(`♻️ ¿Estás seguro de que deseas RESTAURAR al cliente [${nombre}]?\n\nVolverá a aparecer en tu lista principal con todo su historial intacto.`)) {
        try {
            const { error } = await supabaseClient
                .from('clientes')
                .update({ estado: 'activo' })
                .eq('id', id);

            if (error) throw error;

            alert(`✅ ¡El cliente ${nombre} ha vuelto a la vida con éxito!`);
            
            // Recargamos la papelera para que desaparezca de esta pantalla
            cargarPapelera('clientes'); 
            
            // Si tienes la función cargarClientes() global, la llamamos para actualizar el fondo
            if (typeof cargarClientes === 'function') cargarClientes();

        } catch (error) {
            alert("❌ Error al restaurar: " + error.message);
        }
    }
}

/**
 * Función PELIGROSA: Nuke total (Borrado definitivo saltándose la seguridad contable)
 */
async function forzarEliminacionCliente(id, nombre) {
    let confirmacionNivel1 = confirm(`⚠️ ALERTA CRÍTICA ⚠️\n\nEstás a punto de DESTRUIR permanentemente el registro de [${nombre}].\n\nSi este cliente tiene créditos asociados, causará un descuadre irremediable en tu base de datos.\n\n¿Deseas continuar bajo tu propio riesgo?`);
    
    if (confirmacionNivel1) {
        let confirmacionNivel2 = prompt(`Escribe la palabra ELIMINAR para confirmar la destrucción de ${nombre}:`);
        
        if (confirmacionNivel2 === 'ELIMINAR') {
            try {
                // Aquí usamos el borrado fuerte (Hard Delete)
                const { error } = await supabaseClient.from('clientes').delete().eq('id', id);
                if (error) throw error;

                alert(`💥 Registro destruido permanentemente.`);
                cargarPapelera('clientes');

            } catch (error) {
                alert("❌ Fallo en la destrucción: " + error.message);
            }
        } else {
            alert("Operación de destrucción cancelada. La palabra clave no coincide.");
        }
    }
}

/**
 * RE-ACTIVACIÓN FINANCIERA: Devuelve el crédito a la vida, resta el capital, actualiza auditoría y envía SMS de restauración.
 */
/**
 * RE-ACTIVACIÓN FINANCIERA: Devuelve el crédito a la vida, resta el capital, actualiza auditoría y envía SMS de restauración.
 */
async function reactivarCreditoDesdePapelera(idCredito, capital, formaEntrega, nombreCliente) {
    if (!confirm(`♻️ ¿Deseas RE-ACTIVAR el crédito #${idCredito} de [${nombreCliente}]?\n\nAl hacerlo, se volverá a descontar los $${capital} de la caja fuerte correspondiente y se notificará al cliente.`)) return;

    try {
        // --- 1. TRAER DATOS COMPLETOS DEL CRÉDITO Y CLIENTE PARA EL SMS ---
        const { data: credito, error: errCred } = await supabaseClient
            .from('creditos')
            .select('*')
            .eq('id', idCredito)
            .single();
        
        if (errCred) throw errCred;

        const { data: cliente, error: errCli } = await supabaseClient
            .from('clientes')
            .select('nombres, apellidos, cedula, whatsapp')
            .eq('id', credito.cliente_id)
            .single();
        
        if (errCli) throw errCli;

        // --- 2. MAGIA CRIPTOGRÁFICA Y CÓDIGO BANCARIO ---
        const inicialN = cliente.nombres.charAt(0).toUpperCase();
        const inicialA = cliente.apellidos.charAt(0).toUpperCase();
        const ultimos4 = cliente.cedula.slice(-4);
        const codigoClienteBancario = `${inicialN}${inicialA}-${ultimos4}`;

        // Buscar qué número de crédito es en la historia exacta del cliente
        const { data: todosCreditos } = await supabaseClient
            .from('creditos')
            .select('id')
            .eq('cliente_id', credito.cliente_id)
            .order('id', { ascending: true });
        
        let numeroCredito = 1;
        if (todosCreditos) {
            const index = todosCreditos.findIndex(c => c.id === idCredito);
            if (index !== -1) numeroCredito = index + 1;
        }

        const codigoCifrado = typeof cifrarNumeroCredito === 'function' ? cifrarNumeroCredito(numeroCredito).toUpperCase() : '?';

        // SEPARACIÓN DE CÓDIGOS (INTERNO VS CLIENTE)
        const codigoCreditoOficial = `${codigoClienteBancario} | CRE #${numeroCredito} [${codigoCifrado}]`; // Auditoría interna
        const codigoCreditoSMS = `${codigoClienteBancario} | CRE #${codigoCifrado}`; // SMS para el cliente
        const nombreLimpio = `${cliente.nombres.toUpperCase()} ${cliente.apellidos.toUpperCase()}`;

        // --- 3. LÓGICA DE LA CAJA FUERTE ---
        const textoCaja = formaEntrega ? formaEntrega.toLowerCase() : '';
        let idCaja = textoCaja.includes('banco') ? 2 : 1;

        const { data: caja, error: errCaja } = await supabaseClient
            .from('cajas_capital')
            .select('saldo_actual')
            .eq('id', idCaja)
            .single();

        if (errCaja) throw errCaja;

        if (parseFloat(caja.saldo_actual) < parseFloat(capital)) {
            alert(`❌ Fondos insuficientes en la caja para restaurar este crédito. Saldo disponible: $${caja.saldo_actual}`);
            return;
        }

        const nuevoSaldo = parseFloat(caja.saldo_actual) - parseFloat(capital);
        await supabaseClient.from('cajas_capital').update({ saldo_actual: nuevoSaldo }).eq('id', idCaja);

        // --- 4. REGISTRAR AUDITORÍA UNIFICADA ---
        await supabaseClient.from('historial_capital').insert([{
            caja_id: idCaja,
            monto: -parseFloat(capital), // Sale dinero de la caja
            concepto: `🔴 RESTAURACIÓN: Re-activación - ${codigoCreditoOficial} - ${nombreLimpio} (Re-desembolso)`
        }]);

        // --- 5. ACTIVAR EL CRÉDITO EN LA NUBE ---
        await supabaseClient.from('creditos').update({ estado: 'activo' }).eq('id', idCredito);

        // --- 6. 🟢 DISPARAR SMS DE REACTIVACIÓN (TONO POSITIVO Y CIFRADO) ---
        if (cliente.whatsapp && typeof enviarSMSAutomatico === 'function') {
            const modalidadNombre = (credito.frecuencia_pago || "Fija").replace(/.*Cobro\s+/i, "").replace("📅", "").trim();
            
            // 🔥 FÓRMULA ALPHA SMS COMPACTA 🔥
            const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

            const ahora = new Date();
            const diaSemanaA = dias[ahora.getDay()];
            const numDiaA = String(ahora.getDate()).padStart(2, '0');
            const mesNombreA = meses[ahora.getMonth()];
            const anioA = ahora.getFullYear();

            let horasA = ahora.getHours();
            let minutosA = String(ahora.getMinutes()).padStart(2, '0');
            const ampmA = horasA >= 12 ? 'p.m.' : 'a.m.'; // Sin espacios
            horasA = horasA % 12; horasA = horasA ? horasA : 12;
            horasA = String(horasA).padStart(2, '0');

            const fechaHoraSMS = `${diaSemanaA} ${numDiaA}/${mesNombreA}/${anioA} | ${horasA}:${minutosA} ${ampmA}`;

            // MENSAJE DE IMPACTO POSITIVO: Se centra en la restauración exitosa
            const msjReactivacion = `=== SISTEMA ALPHA ===\n${fechaHoraSMS}\n\n🆔 Ref: ${codigoCreditoSMS}\n👤 Cliente: ${nombreLimpio}\n\nHola, te informamos que tu credito ha sido RESTAURADO exitosamente y se encuentra ACTIVO en nuestro sistema.\n\n💰 Monto: $${parseFloat(credito.monto_capital).toFixed(2)}\n💵 Cuota: $${parseFloat(credito.valor_cuota).toFixed(2)}\n🔄 Modalidad: ${modalidadNombre}\n📊 Total: $${parseFloat(credito.total_pagar).toFixed(2)}\n🔢 Cuotas: ${credito.num_cuotas}\n\nEste es tu soporte oficial. ¡Gracias!\n🚫 POR FAVOR, NO RESPONDER A ESTE MENSAJE.`;
            
            console.log("Enviando SMS de restauración...");
            await enviarSMSAutomatico(cliente.whatsapp, msjReactivacion);
        }

        alert("✅ Crédito reactivado exitosamente. Volvió a la cartera activa y se notificó al cliente.");
        
        // --- 7. ACTUALIZACIÓN EN VIVO DE LAS PANTALLAS ---
        if (typeof cargarPapelera === 'function') cargarPapelera('creditos');
        if (typeof cargarHistorialCreditos === 'function') cargarHistorialCreditos();
        if (typeof cargarDatosCapital === 'function') cargarDatosCapital();
        if (typeof cargarHistorialCapital === 'function') cargarHistorialCapital();

    } catch (error) {
        console.error("Error al restaurar crédito:", error);
        alert("❌ Error al restaurar crédito: " + error.message);
    }
}

/**
 * ELIMINACIÓN DE REGISTRO DE AUDITORÍA (Nuke total de un crédito anulado)
 */
async function forzarEliminacionCredito(idCredito) {
    if (!confirm(`⚠️ ALERTA DE AUDITORÍA ⚠️\n\n¿Estás seguro de destruir el registro histórico del crédito #${idCredito}?\n\nEsta acción borrará el comprobante anulado de la base de datos permanentemente.`)) return;

    let token = prompt("🔒 Ingrese la palabra ELIMINAR para purgar el registro:");
    if (token !== 'ELIMINAR') {
        alert("Operación cancelada.");
        return;
    }

    try {
        await supabaseClient.from('creditos').delete().eq('id', idCredito);
        alert("💥 Registro de auditoría eliminado para siempre.");
        cargarPapelera('creditos');
    } catch (error) {
        alert("❌ Error al eliminar registro: " + error.message);
    }
}
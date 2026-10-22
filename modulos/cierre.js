// =========================================================================
// 🔒 MÓDULO DE CIERRE DE CAJA DIARIO Y AUDITORÍA (SISTEMA ALPHA V6 - BLINDADO)
// =========================================================================

// ⚙️ CONFIGURACIÓN DE AUDITORÍA
const COL_CODIGO_CREDITO = 'codigo_interno'; 
const COL_REF_CLIENTE = 'referencia';        

window.deudaPendienteCierre = 0;

function extraerNombreSeguro(clienteObj) {
    if (!clienteObj) return 'CLIENTE DESCONOCIDO';
    if (clienteObj.nombres && clienteObj.apellidos) return `${clienteObj.nombres} ${clienteObj.apellidos}`;
    if (clienteObj.nombre && clienteObj.apellido) return `${clienteObj.nombre} ${clienteObj.apellido}`;
    return clienteObj.nombre_completo || clienteObj.nombres || clienteObj.nombre || clienteObj.cliente || 'CLIENTE';
}

window.ejecutarCierreDiario = async function() {
    // 1. LEER LA CAJA CHICA ANTES DE QUE SE ACTUALICE LA PANTALLA
    let cajaChicaInput = document.getElementById('input-base-caja');
    let baseCajaChica = cajaChicaInput ? parseFloat(cajaChicaInput.value || 0) : (window.ultimaCajaChicaGuardada || 0);
    window.ultimaCajaChicaGuardada = baseCajaChica; // Guardamos en memoria

    document.getElementById('cierre-total-ingresos').innerText = "Calculando...";
    document.getElementById('cierre-total-gastos').innerText = "Calculando...";
    document.getElementById('cierre-total-prestamos').innerText = "Calculando...";
    document.getElementById('cierre-detalle-lista').innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 20px;">Sincronizando bóvedas y referencias cruzadas...</div>';
    
    try {
        const inicioDia = new Date();
        inicioDia.setHours(0, 0, 0, 0);
        const inicioISO = inicioDia.toISOString();

        const finDia = new Date();
        finDia.setHours(23, 59, 59, 999);
        const finISO = finDia.toISOString();

        let htmlDetalle = ''; 

        // MOSTRAR CAJA CHICA EN EL REPORTE VISUAL
        if (baseCajaChica > 0) {
            htmlDetalle += `<div style="background: #f1f5f9; padding: 12px; border-radius: 5px; font-weight: bold; color: #334155; margin-bottom: 15px; border-left: 4px solid #475569;">💼 BASE INICIAL (CAJA CHICA FÍSICA): <span style="float: right; color: #0f172a;">$${baseCajaChica.toFixed(2)}</span></div>`;
        }

        const { data: historialTodos } = await supabaseClient.from('creditos').select('id, cliente_id').order('id', { ascending: true });
        const mapNumCreditoLocal = {};
        if (historialTodos) {
            const conteoPorCliente = {};
            historialTodos.forEach(c => {
                conteoPorCliente[c.cliente_id] = (conteoPorCliente[c.cliente_id] || 0) + 1;
                mapNumCreditoLocal[c.id] = conteoPorCliente[c.cliente_id];
            });
        }

        // ========================================================
        // A. RECAUDACIÓN (DINERO QUE ENTRÓ DE CLIENTES)
        // ========================================================
        const { data: pagos, error: errPagos } = await supabaseClient
            .from('historial_pagos') 
            .select(`id, numero_pago, id_credito, monto_capital, monto_interes, abono_total, fecha_pago, forma_pago, creditos ( *, clientes ( * ) )`)
            .gte('fecha_pago', inicioISO).lte('fecha_pago', finISO).order('fecha_pago', { ascending: false });
            
        if (errPagos) throw errPagos;

        let totalCapitalEntranteFisico = 0;
        let totalInteresEntranteFisico = 0;
        let totalRecaudadoFisico = 0;

        let totalCapitalEntranteBanco = 0;
        let totalInteresEntranteBanco = 0;
        
        if (pagos.length > 0) {
            htmlDetalle += `<div style="background: #ecfdf5; padding: 8px; border-radius: 5px; font-weight: bold; color: #065f46; margin-top: 10px;">📥 INGRESOS RECAUDADOS (CLIENTES)</div>`;
            pagos.forEach(pago => {
                let hora = new Date(pago.fecha_pago).toLocaleTimeString('es-EC', { hour: '2-digit', minute:'2-digit' });
                let fechaLarga = new Date(pago.fecha_pago).toLocaleDateString('es-EC', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
                
                let numAbono = pago.numero_pago || pago.id || 'N/A';
                let idCred = pago.id_credito || 'N/A';
                let clienteObj = (pago.creditos && pago.creditos.clientes) ? pago.creditos.clientes : null;
                let nombreCliente = extraerNombreSeguro(clienteObj).toUpperCase();
                
                let sufijoCredito = (pago.creditos && pago.creditos[COL_CODIGO_CREDITO]) ? pago.creditos[COL_CODIGO_CREDITO] : '';
                let textoSufijo = sufijoCredito ? ` | ${sufijoCredito}` : '';
                
                let iniciales = nombreCliente.substring(0, 2);
                let u4 = (clienteObj && clienteObj.cedula) ? clienteObj.cedula.trim().slice(-4) : '0000';
                let refCli = (clienteObj && clienteObj[COL_REF_CLIENTE]) ? clienteObj[COL_REF_CLIENTE] : `REF: ${iniciales}-${u4}`;

                const numLocal = mapNumCreditoLocal[pago.id_credito] || 1;
                const creCifrado = typeof window.cifrarNumeroCredito === 'function' ? window.cifrarNumeroCredito(numLocal).toUpperCase() : '';
                const etiquetaCRE = creCifrado ? `CRE #${numLocal} [${creCifrado}]` : `CRE #${numLocal}`;

                const rawMetodo = (pago.forma_pago || 'EFECTIVO').toUpperCase();
                let esTransferencia = (rawMetodo.includes('TRANSF') || rawMetodo.includes('BANCO') || rawMetodo.includes('DEP'));
                
                let origenTexto = "🏦 Efectivo Central (Matriz)";
                let colorCaja = "#0284c7"; 
                
                let capPago = parseFloat(pago.monto_capital || 0);
                let intPago = parseFloat(pago.monto_interes || 0);
                let totPago = parseFloat(pago.abono_total || 0);

                if (esTransferencia) {
                    origenTexto = "💳 Banco Principal (Transferencia)";
                    colorCaja = "#8b5cf6"; 
                    totalCapitalEntranteBanco += capPago;
                    totalInteresEntranteBanco += intPago;
                } else {
                    totalCapitalEntranteFisico += capPago;
                    totalInteresEntranteFisico += intPago;
                    totalRecaudadoFisico += totPago; 
                }

                htmlDetalle += `
                <div style="display: flex; justify-content: space-between; padding: 12px 10px; border-bottom: 1px dashed #cbd5e1; font-size: 13px; background: #f8fafc;">
                    <div style="flex: 1;">
                        <strong style="color: #0f172a; text-transform: uppercase;">RECUPERACIÓN: ABONO #${numAbono} | CRE #${idCred}${textoSufijo} | ${nombreCliente}</strong>
                        <div style="color: ${colorCaja}; font-size: 11px; font-weight: bold; margin-top: 4px;">${origenTexto}</div>
                        <div style="color: #64748b; font-size: 11px; margin-top: 4px;">
                            PAGO #${numAbono} | ${refCli} | CRÉDITO #${idCred} | ${etiquetaCRE}
                        </div>
                        <div style="color: #64748b; font-size: 11px; margin-top: 2px;">
                            Capital: <span style="color:#0369a1; font-weight:bold;">$${capPago.toFixed(2)}</span> | 
                            Interés: <span style="color:#a16207; font-weight:bold;">$${intPago.toFixed(2)}</span>
                        </div>
                    </div>
                    <div style="text-align: right; min-width: 100px;">
                        <span style="font-weight: 900; color: #10b981; font-size: 15px;">+$${totPago.toFixed(2)}</span>
                        <div style="color: #94a3b8; font-size: 10px; margin-top: 4px; text-transform: capitalize;">📅 ${fechaLarga}</div>
                        <div style="color: #94a3b8; font-size: 10px;">🕒 ${hora}</div>
                    </div>
                </div>`;
            });
        }

        // ========================================================
        // B. GASTOS VARIOS 
        // ========================================================
        const { data: gastos, error: errGastos } = await supabaseClient
            .from('gastos_varios')
            .select('monto, concepto, fecha_gasto')
            .gte('fecha_gasto', inicioISO).lte('fecha_gasto', finISO).order('fecha_gasto', { ascending: false });
            
        if (errGastos) throw errGastos;

        let totalGastosHoy = 0;
        if (gastos.length > 0) {
            htmlDetalle += `<div style="background: #fef2f2; padding: 8px; border-radius: 5px; font-weight: bold; color: #991b1b; margin-top: 15px;">📉 GASTOS DEL DÍA</div>`;
            gastos.forEach(gasto => {
                totalGastosHoy += parseFloat(gasto.monto || 0);
                let hora = new Date(gasto.fecha_gasto).toLocaleTimeString('es-EC', { hour: '2-digit', minute:'2-digit' });
                let fechaLarga = new Date(gasto.fecha_gasto).toLocaleDateString('es-EC', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });

                htmlDetalle += `
                <div style="display: flex; justify-content: space-between; padding: 12px 10px; border-bottom: 1px dashed #cbd5e1; font-size: 13px; background: #fef4f4;">
                    <div style="flex: 1;">
                        <strong style="color: #7f1d1d; text-transform: uppercase;">GASTO: ${gasto.concepto || 'GASTO VARIO'}</strong>
                        <div style="color: #991b1b; font-size: 11px; font-weight: bold; margin-top: 4px;">🏦 Efectivo en Calle</div>
                    </div>
                    <div style="text-align: right; min-width: 100px;">
                        <span style="font-weight: 900; color: #ef4444; font-size: 15px;">-$${parseFloat(gasto.monto||0).toFixed(2)}</span>
                        <div style="color: #94a3b8; font-size: 10px; margin-top: 4px; text-transform: capitalize;">📅 ${fechaLarga}</div>
                        <div style="color: #94a3b8; font-size: 10px;">🕒 ${hora}</div>
                    </div>
                </div>`;
            });
        }

        // ========================================================
        // C. PRÉSTAMOS ENTREGADOS HOY 
        // ========================================================
        const { data: creditos, error: errCreditos } = await supabaseClient
            .from('creditos').select(`*, clientes ( * )`)
            .gte('fecha_emision', inicioISO).lte('fecha_emision', finISO).order('fecha_emision', { ascending: false }); 
            
        if (errCreditos) throw errCreditos;

        let totalPrestadoHoy = 0;
        if (creditos && creditos.length > 0) {
            const creditosEfectivo = creditos.filter(c => {
                const forma = (c.forma_entrega || '').toString().toUpperCase();
                return forma === '1' || forma.includes('EFECTIVO') || forma === ''; 
            });

            if (creditosEfectivo.length > 0) {
                htmlDetalle += `<div style="background: #fffbeb; padding: 8px; border-radius: 5px; font-weight: bold; color: #b45309; margin-top: 15px;">💸 PRÉSTAMOS ENTREGADOS (EFECTIVO)</div>`;
                
                creditosEfectivo.forEach(credito => {
                    let montoPrestado = parseFloat(credito.monto_capital || credito.monto || 0);
                    totalPrestadoHoy += montoPrestado;
                    
                    let hora = new Date(credito.fecha_emision).toLocaleTimeString('es-EC', { hour: '2-digit', minute:'2-digit' });
                    let fechaLarga = new Date(credito.fecha_emision).toLocaleDateString('es-EC', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });

                    let clienteObj = credito.clientes ? credito.clientes : null;
                    let nombreCliente = extraerNombreSeguro(clienteObj).toUpperCase();
                    let idCred = credito.id || 'N/A';
                    let sufijoCredito = credito[COL_CODIGO_CREDITO] ? credito[COL_CODIGO_CREDITO] : '';
                    let textoSufijo = sufijoCredito ? ` | ${sufijoCredito}` : '';
                    let iniciales = nombreCliente.substring(0, 2);
                    let u4 = (clienteObj && clienteObj.cedula) ? clienteObj.cedula.trim().slice(-4) : '0000';
                    let refCli = (clienteObj && clienteObj[COL_REF_CLIENTE]) ? clienteObj[COL_REF_CLIENTE] : `REF: ${iniciales}-${u4}`;

                    const numLocal = mapNumCreditoLocal[credito.id] || 1;
                    const creCifrado = typeof window.cifrarNumeroCredito === 'function' ? window.cifrarNumeroCredito(numLocal).toUpperCase() : '';
                    const etiquetaCRE = creCifrado ? `CRE #${numLocal} [${creCifrado}]` : `CRE #${numLocal}`;

                    htmlDetalle += `
                    <div style="display: flex; justify-content: space-between; padding: 12px 10px; border-bottom: 1px dashed #cbd5e1; font-size: 13px; background: #fffcf0;">
                        <div style="flex: 1;">
                            <strong style="color: #92400e; text-transform: uppercase;">DESEMBOLSO: CRE #${idCred}${textoSufijo} | ${nombreCliente}</strong>
                            <div style="color: #b45309; font-size: 11px; font-weight: bold; margin-top: 4px;">🏦 Efectivo Central (Matriz)</div>
                            <div style="color: #64748b; font-size: 11px; margin-top: 4px;">
                                ${refCli} | ${etiquetaCRE} | ENTREGA EN EFECTIVO DIRECTO
                            </div>
                        </div>
                        <div style="text-align: right; min-width: 100px;">
                            <span style="font-weight: 900; color: #f59e0b; font-size: 15px;">-$${montoPrestado.toFixed(2)}</span>
                            <div style="color: #94a3b8; font-size: 10px; margin-top: 4px; text-transform: capitalize;">📅 ${fechaLarga}</div>
                            <div style="color: #94a3b8; font-size: 10px;">🕒 ${hora}</div>
                        </div>
                    </div>`;
                });
            }
        }

        // ========================================================
        // D. INYECCIONES DE CAPITAL
        // ========================================================
        const { data: movsCapital, error: errCapital } = await supabaseClient
            .from('historial_capital')
            .select('monto, concepto, fecha_movimiento')
            .gte('fecha_movimiento', inicioISO).lte('fecha_movimiento', finISO).order('fecha_movimiento', { ascending: false });
            
        if (errCapital) throw errCapital;

        let totalInyeccionesCapitalHoy = 0;
        
        if (movsCapital && movsCapital.length > 0) {
            let htmlCapital = '';
            let huboInyeccion = false;

            movsCapital.forEach(mov => {
                let monto = parseFloat(mov.monto || 0);
                if (monto > 0) {
                    huboInyeccion = true;
                    let conceptoTexto = (mov.concepto || '').toUpperCase();
                    let esRecuperacion = conceptoTexto.includes('RECUPERACIÓN');

                    if (!esRecuperacion) {
                        totalInyeccionesCapitalHoy += monto;
                    }
                    
                    let hora = new Date(mov.fecha_movimiento).toLocaleTimeString('es-EC', { hour: '2-digit', minute:'2-digit' });
                    let fechaLarga = new Date(mov.fecha_movimiento).toLocaleDateString('es-EC', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });

                    htmlCapital += `
                    <div style="display: flex; justify-content: space-between; padding: 12px 10px; border-bottom: 1px dashed #cbd5e1; font-size: 13px; background: #f0f9ff;">
                        <div style="flex: 1;">
                            <strong style="color: #0369a1; text-transform: uppercase;">INYECCIÓN / REPOSICIÓN DE CAPITAL</strong>
                            <div style="color: #0284c7; font-size: 11px; font-weight: bold; margin-top: 4px;">🏦 Efectivo Central (Matriz)</div>
                            <div style="color: #64748b; font-size: 11px; margin-top: 4px; font-style: italic;">
                                CONCEPTO: ${mov.concepto || 'MOVIMIENTO MANUAL'}
                            </div>
                        </div>
                        <div style="text-align: right; min-width: 100px;">
                            <span style="font-weight: 900; color: #0369a1; font-size: 15px;">+$${monto.toFixed(2)}</span>
                            <div style="color: #94a3b8; font-size: 10px; margin-top: 4px; text-transform: capitalize;">📅 ${fechaLarga}</div>
                            <div style="color: #94a3b8; font-size: 10px;">🕒 ${hora}</div>
                        </div>
                    </div>`;
                }
            });

            if (huboInyeccion) {
                htmlDetalle += `<div style="background: #e0f2fe; padding: 8px; border-radius: 5px; font-weight: bold; color: #0369a1; margin-top: 15px;">🔄 MOVIMIENTOS DIRECTOS A CAPITAL</div>` + htmlCapital;
            }
        }

        // ========================================================
        // D.2 INYECCIONES DE INTERÉS (INFORMATIVO)
        // ========================================================
        const { data: movsInteres, error: errInteres } = await supabaseClient
            .from('movimientos_utilidad')
            .select('monto, concepto, fecha, tipo')
            .gte('fecha', inicioISO).lte('fecha', finISO).order('fecha', { ascending: false });

        if (!errInteres && movsInteres && movsInteres.length > 0) {
            let htmlInteres = '';
            let huboInyeccionInteres = false;

            movsInteres.forEach(mov => {
                let monto = parseFloat(mov.monto || 0);
                if (monto > 0 && mov.tipo !== 'RETIRO') {
                    huboInyeccionInteres = true;
                    let hora = new Date(mov.fecha).toLocaleTimeString('es-EC', { hour: '2-digit', minute:'2-digit' });
                    let fechaLarga = new Date(mov.fecha).toLocaleDateString('es-EC', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });

                    htmlInteres += `
                    <div style="display: flex; justify-content: space-between; padding: 12px 10px; border-bottom: 1px dashed #cbd5e1; font-size: 13px; background: #fefce8;">
                        <div style="flex: 1;">
                            <strong style="color: #a16207; text-transform: uppercase;">INYECCIÓN / INTERÉS</strong>
                            <div style="color: #ca8a04; font-size: 11px; font-weight: bold; margin-top: 4px;">🏦 Efectivo Central (Matriz)</div>
                            <div style="color: #64748b; font-size: 11px; margin-top: 4px; font-style: italic;">
                                CONCEPTO: ${mov.concepto || 'MOVIMIENTO AUTOMÁTICO'}
                            </div>
                        </div>
                        <div style="text-align: right; min-width: 100px;">
                            <span style="font-weight: 900; color: #a16207; font-size: 15px;">+$${monto.toFixed(2)}</span>
                            <div style="color: #94a3b8; font-size: 10px; margin-top: 4px; text-transform: capitalize;">📅 ${fechaLarga}</div>
                            <div style="color: #94a3b8; font-size: 10px;">🕒 ${hora}</div>
                        </div>
                    </div>`;
                }
            });

            if (huboInyeccionInteres) {
                htmlDetalle += `<div style="background: #fef9c3; padding: 8px; border-radius: 5px; font-weight: bold; color: #a16207; margin-top: 15px;">🔄 MOVIMIENTOS DIRECTOS A INTERÉS</div>` + htmlInteres;
            }
        }

        if (pagos.length === 0 && gastos.length === 0 && creditos.length === 0 && totalInyeccionesCapitalHoy === 0 && (!movsInteres || movsInteres.length === 0) && baseCajaChica === 0) {
            htmlDetalle = `<div style="text-align: center; color: #64748b; padding: 20px;">No se registraron movimientos en efectivo el día de hoy.</div>`;
        }

        document.getElementById('cierre-detalle-lista').innerHTML = htmlDetalle;

        // ========================================================
        // E. EL CÁLCULO FÍSICO Y DIGITAL (CON CAJA CHICA INCLUIDA)
        // ========================================================
        let salidasDeEfectivo = totalGastosHoy + totalPrestadoHoy;
        
        // Sumamos la Base (Caja Chica), los Cobros y las Inyecciones, menos las salidas
        let efectivoFisicoEnMano = baseCajaChica + totalRecaudadoFisico + totalInyeccionesCapitalHoy - salidasDeEfectivo; 
        
        let totalRecaudadoDiaFisicoYDigital = totalRecaudadoFisico + totalCapitalEntranteBanco + totalInteresEntranteBanco;

        document.getElementById('cierre-total-ingresos').innerText = `$${totalRecaudadoDiaFisicoYDigital.toFixed(2)}`;
        document.getElementById('cierre-ingreso-cap').innerText = `$${(totalCapitalEntranteFisico + totalCapitalEntranteBanco).toFixed(2)}`;
        document.getElementById('cierre-ingreso-int').innerText = `$${(totalInteresEntranteFisico + totalInteresEntranteBanco).toFixed(2)}`;
        
        document.getElementById('cierre-total-gastos').innerText = `$${totalGastosHoy.toFixed(2)}`;
        document.getElementById('cierre-total-prestamos').innerText = `$${totalPrestadoHoy.toFixed(2)}`;
        
        document.getElementById('cierre-efectivo-mano').innerText = `$${efectivoFisicoEnMano.toFixed(2)}`;
        
        if (document.getElementById('txt-efectivo-repartir')) {
            document.getElementById('txt-efectivo-repartir').innerText = `$${efectivoFisicoEnMano.toFixed(2)}`;
        }

        // ========================================================
        // F. EL JUEZ CONTABLE (FÍSICO) - LÓGICA CORREGIDA V6
        // ========================================================
        // Capital disponible = Base Inicial + Entradas Capital Físico + Inyecciones - PRÉSTAMOS
        let capitalAGuardar = baseCajaChica + totalCapitalEntranteFisico + totalInyeccionesCapitalHoy - totalPrestadoHoy;
        let interesAGuardar = totalInteresEntranteFisico;
        
        let deudaInterna = 0;
        window.deudaPendienteCierre = 0; 
        
        // LOS GASTOS (comida, gasolina, etc) se pagan exclusivamente con el Interés
        if (totalGastosHoy <= interesAGuardar) {
            interesAGuardar = interesAGuardar - totalGastosHoy;
            document.getElementById('alerta-cruce-bovedas').style.display = 'none';
        } else {
            // Si el gasto superó el interés, el sistema tuvo que usar Capital
            let gastosNoCubiertos = totalGastosHoy - interesAGuardar;
            interesAGuardar = 0; 
            capitalAGuardar = capitalAGuardar - gastosNoCubiertos; 
            
            deudaInterna = gastosNoCubiertos - totalInyeccionesCapitalHoy;

            if (deudaInterna > 0.001) {
                window.deudaPendienteCierre = deudaInterna;
                document.getElementById('alerta-cruce-bovedas').style.display = 'block';
                document.getElementById('alerta-cruce-bovedas').innerHTML = `
                    <h4 style="color: #b91c1c; margin: 0 0 10px 0; font-size: 16px;">⚠️ ATENCIÓN: REPOSICIÓN DE FONDOS REQUERIDA</h4>
                    <p style="color: #991b1b; font-size: 14px; margin: 0 0 15px 0;">
                        El Capital físico fue usado para pagar los <strong>gastos</strong> de hoy. 
                        La Bóveda de Intereses histórica <strong>LE DEBE $${deudaInterna.toFixed(2)}</strong> al Capital para cuadrar su maleta real.
                    </p>
                    <button onclick="ejecutarAjusteDeCruce()" style="background: #dc2626; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3); transition: transform 0.1s;" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'">
                        ✅ Aplicar Ajuste Automático en Sistema
                    </button>
                `;
            } else {
                document.getElementById('alerta-cruce-bovedas').style.display = 'none';
            }
        }

        if (efectivoFisicoEnMano < 0) {
            document.getElementById('cierre-efectivo-mano').style.color = "#ef4444";
        } else {
            document.getElementById('cierre-efectivo-mano').style.color = "#38bdf8";
        }

        document.getElementById('cierre-guardar-capital').innerText = `$${capitalAGuardar.toFixed(2)}`;
        document.getElementById('cierre-guardar-interes').innerText = `$${interesAGuardar.toFixed(2)}`;

        if (document.getElementById('cierre-banco-capital')) {
            document.getElementById('cierre-banco-capital').innerText = `$${totalCapitalEntranteBanco.toFixed(2)}`;
        }
        if (document.getElementById('cierre-banco-interes')) {
            document.getElementById('cierre-banco-interes').innerText = `$${totalInteresEntranteBanco.toFixed(2)}`;
        }

    } catch (error) {
        console.error("Error en el cierre de caja:", error);
        alert("❌ Error al procesar la auditoría. Revise la consola (F12) para más detalles.");
    }
};

window.ejecutarAjusteDeCruce = async function() {
    const monto = window.deudaPendienteCierre;
    
    if (!monto || monto <= 0) return;

    const confirmacion = confirm(`¿Autoriza transferir internamente $${monto.toFixed(2)} desde sus UTILIDADES acumuladas hacia el CAPITAL para cubrir el descuadre físico de hoy?\n\n(Esto evita que usted tenga que sacar dinero de su bolsillo).`);
    
    if (!confirmacion) return;

    try {
        await supabaseClient.from('movimientos_utilidad').insert([{
            tipo: 'RETIRO', monto: monto, concepto: 'AJUSTE AUTOMÁTICO: COBERTURA DE DÉFICIT DE CAPITAL (CIERRE DIARIO)', origen: 'EFECTIVO', fecha: new Date().toISOString()
        }]);

        await supabaseClient.from('historial_capital').insert([{
            caja_id: 1, monto: monto, concepto: 'REPOSICIÓN AUTOMÁTICA DESDE BÓVEDA DE UTILIDADES (CIERRE DIARIO)', fecha_movimiento: new Date().toISOString()
        }]);

        const { data: caja } = await supabaseClient.from('cajas_capital').select('saldo_actual').eq('id', 1).single();
        if (caja) {
            const nuevoSaldo = parseFloat(caja.saldo_actual || 0) + monto;
            await supabaseClient.from('cajas_capital').update({ saldo_actual: nuevoSaldo }).eq('id', 1);
        }

        alert(`✅ ¡Ajuste mágico realizado! Se han transferido $${monto.toFixed(2)} al capital.\n\nLa contabilidad vuelve a estar perfecta y el sistema está balanceado.`);
        ejecutarCierreDiario();

    } catch (error) {
        console.error("Error al aplicar el ajuste automático:", error);
        alert("❌ Ocurrió un error al intentar balancear la base de datos.");
    }
};

// =========================================================================
// 🪄 CREADOR DE CAJA CHICA DINÁMICA (SIN TOCAR HTML)
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const originalCambiarModuloCierre = window.cambiarModulo;
    if (typeof originalCambiarModuloCierre === 'function') {
        window.cambiarModulo = function(idModulo) {
            originalCambiarModuloCierre(idModulo);
            if (idModulo === 'cierre') {
                window.ultimaCajaChicaGuardada = 0; // Resetear en memoria
                document.getElementById('cierre-total-ingresos').innerText = "$0.00";
                document.getElementById('cierre-efectivo-mano').innerText = "$0.00";
                document.getElementById('alerta-cruce-bovedas').style.display = 'none';
                
                // INYECTA EL CUADRO DE TEXTO AUTOMÁTICAMENTE
                document.getElementById('cierre-detalle-lista').innerHTML = `
                    <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 20px; text-align: center; border: 2px dashed #cbd5e1; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                        <h4 style="margin: 0 0 10px 0; color: #1e293b; font-size: 16px;">💼 Ingrese su Base Inicial (Caja Chica)</h4>
                        <p style="font-size: 13px; color: #64748b; margin-top:0; margin-bottom: 15px;">Escriba el dinero físico con el que salió a la calle HOY antes de cobrar y presione Calcular.</p>
                        <input type="number" id="input-base-caja" placeholder="Ej: 200" style="padding: 12px; font-size: 24px; font-weight: bold; width: 180px; text-align: center; border: 2px solid #38bdf8; border-radius: 8px; color: #0f172a; outline: none; transition: 0.2s;" onfocus="this.style.borderColor='#0284c7'" onblur="this.style.borderColor='#38bdf8'">
                    </div>
                `;
            }
        };
    }
});

// =========================================================================
// 🖨️ MOTOR PDF DE CIERRE DE CAJA DIARIO OFICIAL (BLINDADO V6)
// =========================================================================
window.generarPDFCierreDiario = async function() {
    try {
        if (typeof window.jspdf === 'undefined') {
            alert("⚠️ La librería de PDF no está cargada en el sistema.");
            return;
        }

        const valEfectivoMano = document.getElementById('cierre-efectivo-mano').innerText;
        if (valEfectivoMano === "$0.00" || valEfectivoMano === "Calculando...") {
            alert("⚠️ Por favor, primero presione 'CALCULAR CIERRE DE HOY' antes de generar el PDF.");
            return;
        }

        alert("⏳ Recopilando la Radiografía del Día para el PDF... Presione Aceptar y espere un momento.");

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('portrait', 'mm', 'a4'); 

        doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(15, 23, 42);
        doc.text("SISTEMA ALPHA V6", 14, 20);

        doc.setFontSize(14); doc.setTextColor(2, 132, 199);
        doc.text("ARQUEO Y CIERRE DE CAJA DIARIO (AUDITORÍA DETALLADA)", 14, 28);
        
        const fImpresion = new Date().toLocaleDateString('es-EC', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        doc.setFontSize(9); doc.setTextColor(100, 116, 139); doc.setFont(undefined, 'normal');
        doc.text(`Fecha y Hora de Auditoría: ${fImpresion.toUpperCase()}`, 14, 34);
        doc.setDrawColor(200, 200, 200); doc.line(14, 37, 196, 37);

        doc.setFillColor(15, 23, 42); doc.roundedRect(14, 43, 182, 26, 3, 3, 'F');
        doc.setFontSize(10); doc.setTextColor(148, 163, 184); doc.setFont(undefined, 'bold');
        doc.text("EFECTIVO FÍSICO TOTAL QUE DEBE TENER EN SU MANO:", 20, 52);
        doc.setFontSize(22); doc.setTextColor(56, 189, 248); 
        doc.text(valEfectivoMano, 20, 62);

        const valIngresos = document.getElementById('cierre-total-ingresos').innerText;
        const valGastos = document.getElementById('cierre-total-gastos').innerText;
        const valPrestamos = document.getElementById('cierre-total-prestamos').innerText;

        doc.setFontSize(11); doc.setTextColor(15, 23, 42);
        doc.text("RESUMEN DE MOVIMIENTOS DEL DÍA", 14, 78);
        
        doc.setFillColor(236, 253, 245); doc.roundedRect(14, 82, 58, 16, 2, 2, 'F');
        doc.setFontSize(8); doc.setTextColor(6, 78, 59); doc.text("TOTAL RECAUDADO", 17, 88);
        doc.setFontSize(12); doc.text(valIngresos, 17, 95);

        doc.setFillColor(254, 242, 242); doc.roundedRect(76, 82, 58, 16, 2, 2, 'F');
        doc.setFontSize(8); doc.setTextColor(153, 27, 27); doc.text("GASTOS VARIOS", 79, 88);
        doc.setFontSize(12); doc.text(valGastos, 79, 95);

        doc.setFillColor(255, 251, 235); doc.roundedRect(138, 82, 58, 16, 2, 2, 'F');
        doc.setFontSize(8); doc.setTextColor(180, 83, 9); doc.text("PRÉSTAMOS ENTREGADOS", 141, 88);
        doc.setFontSize(12); doc.text(valPrestamos, 141, 95);

        doc.setFontSize(11); doc.setTextColor(15, 23, 42); doc.text("SEPARACIÓN DE FONDOS", 14, 108);
        doc.setDrawColor(200, 200, 200); doc.line(14, 111, 196, 111);

        let yPos = 115;
        const pintarCajita = (titulo, idElemento, colorBg, colorTxt) => {
            const valor = document.getElementById(idElemento) ? document.getElementById(idElemento).innerText : "$0.00";
            doc.setFillColor(...colorBg); doc.roundedRect(14, yPos, 182, 10, 1, 1, 'F');
            doc.setFontSize(9); doc.setTextColor(...colorTxt); doc.text(titulo, 18, yPos + 7);
            doc.setFontSize(10); doc.text(valor, 180, yPos + 7, { align: 'right' });
            yPos += 12;
        };

        pintarCajita("CAJA FUERTE DE CAPITAL (Efectivo)", 'cierre-guardar-capital', [241, 245, 249], [15, 23, 42]);
        pintarCajita("CAJA FUERTE DE UTILIDADES (Ganancia en Efectivo)", 'cierre-guardar-interes', [254, 252, 232], [161, 98, 7]);
        pintarCajita("CAPITAL EN BANCOS (Transferencias)", 'cierre-banco-capital', [245, 243, 255], [109, 40, 217]);
        pintarCajita("UTILIDADES EN BANCOS (Transferencias)", 'cierre-banco-interes', [253, 244, 255], [192, 38, 211]);

        const inicioDia = new Date(); inicioDia.setHours(0, 0, 0, 0);
        const finDia = new Date(); finDia.setHours(23, 59, 59, 999);
        const isoIni = inicioDia.toISOString(); const isoFin = finDia.toISOString();

        let datosTabla = [];
        
        // 1. BASE DE CAJA CHICA (Ya estaba funcionando)
        let baseCajaChica = window.ultimaCajaChicaGuardada || 0;
        if (baseCajaChica > 0) {
            let fechaBase = new Date(); fechaBase.setHours(8, 0, 0, 0);
            datosTabla.push({ 
                fechaObj: fechaBase, hora: "08:00 a. m.", operacion: 'BASE INICIAL', 
                detalle: 'CAJA CHICA DEL DÍA', caja: 'EFECTIVO', 
                monto: `+$${baseCajaChica.toFixed(2)}`, valorNum: baseCajaChica 
            });
        }

        // 2. PAGOS / RECAUDACIÓN (AHORA CON CONSULTAS CIEGAS *)
        const { data: pagos } = await supabaseClient.from('historial_pagos').select(`*, creditos (*, clientes (*))`).gte('fecha_pago', isoIni).lte('fecha_pago', isoFin);
        if (pagos) pagos.forEach(p => {
            let cli = (p.creditos && p.creditos.clientes) ? `${p.creditos.clientes.nombres} ${p.creditos.clientes.apellidos}` : 'CLIENTE';
            let detalleConDesglose = `${cli.toUpperCase()}\n[Capital: $${parseFloat(p.monto_capital || 0).toFixed(2)} | Interés: $${parseFloat(p.monto_interes || 0).toFixed(2)}]`;
            datosTabla.push({ fechaObj: new Date(p.fecha_pago), hora: new Date(p.fecha_pago).toLocaleTimeString('es-EC', {hour:'2-digit', minute:'2-digit'}), operacion: 'INGRESO (ABONO)', detalle: detalleConDesglose, caja: (p.forma_pago || 'EFECTIVO').toUpperCase(), monto: `+$${parseFloat(p.abono_total).toFixed(2)}`, valorNum: parseFloat(p.abono_total) });
        });

        // 3. GASTOS (CONSULTA CIEGA *)
        const { data: gastos } = await supabaseClient.from('gastos_varios').select('*').gte('fecha_gasto', isoIni).lte('fecha_gasto', isoFin);
        if (gastos) gastos.forEach(g => {
            datosTabla.push({ fechaObj: new Date(g.fecha_gasto), hora: new Date(g.fecha_gasto).toLocaleTimeString('es-EC', {hour:'2-digit', minute:'2-digit'}), operacion: 'GASTO DEL DÍA', detalle: (g.concepto || 'VARIO').toUpperCase(), caja: 'EFECTIVO', monto: `-$${parseFloat(g.monto).toFixed(2)}`, valorNum: -parseFloat(g.monto) });
        });

        // 4. 🔥 PRÉSTAMOS (EL ERROR CORREGIDO USANDO CONSULTA CIEGA *) 🔥
        const { data: creditos } = await supabaseClient.from('creditos').select('*, clientes (*)').gte('fecha_emision', isoIni).lte('fecha_emision', isoFin);
        if (creditos) {
            const creditosEfectivo = creditos.filter(c => {
                const forma = (c.forma_entrega || '').toString().toUpperCase();
                return forma === '1' || forma.includes('EFECTIVO') || forma === ''; 
            });
            creditosEfectivo.forEach(c => {
                let cli = c.clientes ? `${c.clientes.nombres} ${c.clientes.apellidos}` : 'CLIENTE';
                let montoPrestado = parseFloat(c.monto_capital || c.monto || 0);
                datosTabla.push({ fechaObj: new Date(c.fecha_emision), hora: new Date(c.fecha_emision).toLocaleTimeString('es-EC', {hour:'2-digit', minute:'2-digit'}), operacion: 'NUEVO PRÉSTAMO', detalle: cli.toUpperCase(), caja: 'EFECTIVO', monto: `-$${montoPrestado.toFixed(2)}`, valorNum: -montoPrestado });
            });
        }

        // 5. INYECCIONES DE CAPITAL (CONSULTA CIEGA *)
        const { data: movsCapital } = await supabaseClient.from('historial_capital').select('*').gte('fecha_movimiento', isoIni).lte('fecha_movimiento', isoFin);
        if (movsCapital) {
            movsCapital.forEach(mov => {
                let montoNum = parseFloat(mov.monto || 0);
                let conceptoLimpio = (mov.concepto || '').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\.,;:\-\_\(\)\[\]\|#\$%&!¿\?]/g, ' ').replace(/\s+/g, ' ').trim();
                let conceptoTexto = conceptoLimpio.toUpperCase();
                
                if (montoNum > 0 && !conceptoTexto.includes('RECUPERACION') && !conceptoTexto.includes('RECUPERACIÓN')) {
                    datosTabla.push({ fechaObj: new Date(mov.fecha_movimiento), hora: new Date(mov.fecha_movimiento).toLocaleTimeString('es-EC', {hour:'2-digit', minute:'2-digit'}), operacion: 'INYECCIÓN DE CAPITAL', detalle: conceptoTexto || 'FONDEO DE CAJA', caja: 'EFECTIVO', monto: `+$${montoNum.toFixed(2)}`, valorNum: montoNum });
                }
            });
        }

        // 6. ORDENAR TABLA Y GENERAR PDF
        datosTabla.sort((a, b) => a.fechaObj - b.fechaObj);
        const filasPDF = datosTabla.map(d => [d.hora, d.operacion, d.detalle, d.caja, d.monto]);

        doc.setFontSize(11); doc.setTextColor(15, 23, 42); doc.text("DETALLE DE AUDITORÍA (RADIOGRAFÍA DEL DÍA)", 14, yPos + 10);
        
        doc.autoTable({
            startY: yPos + 14, head: [['HORA', 'OPERACIÓN', 'CLIENTE / CONCEPTO', 'CAJA', 'VALOR']], body: filasPDF, theme: 'striped',
            headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8 }, styles: { fontSize: 8, cellPadding: 3 },
            columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 35 }, 2: { cellWidth: 'auto' }, 3: { cellWidth: 25 }, 4: { halign: 'right', fontStyle: 'bold', cellWidth: 20 } },
            didParseCell: function(data) {
                if (data.section === 'body' && data.column.index === 4) {
                    if (data.cell.raw.startsWith('+')) data.cell.styles.textColor = [16, 185, 129]; 
                    else data.cell.styles.textColor = [220, 38, 38]; 
                }
            }
        });

        let finalY = doc.lastAutoTable.finalY + 30;
        if (finalY > 260) { doc.addPage(); finalY = 40; }

        doc.setDrawColor(0, 0, 0); doc.line(30, finalY, 80, finalY);
        doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(15, 23, 42);
        doc.text("Firma del Cajero / Operador", 55, finalY + 5, { align: 'center' });

        doc.line(130, finalY, 180, finalY);
        doc.text("Firma de Gerencia / Auditoría", 155, finalY + 5, { align: 'center' });

        doc.setFontSize(8); doc.setTextColor(150, 150, 150); 
        doc.text(`Documento auditado por Sistema Alpha V6. Todo sobrante o faltante es responsabilidad del operador.`, 14, 280);

        const fechaFile = new Date().toISOString().split('T')[0];
        doc.save(`Arqueo_Caja_Detallado_${fechaFile}.pdf`);

    } catch (error) {
        console.error("Error crítico al generar PDF de Cierre:", error);
        alert("❌ Ocurrió un error al intentar generar la papeleta. Revise la consola.");
    }
}
// =========================================================================
// 🔒 MÓDULO DE CIERRE DE CAJA DIARIO Y AUDITORÍA (SISTEMA ALPHA V5)
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
            .select(`
                id, numero_pago, id_credito, monto_capital, monto_interes, abono_total, fecha_pago, forma_pago,
                creditos ( *, clientes ( * ) )
            `)
            .gte('fecha_pago', inicioISO)
            .lte('fecha_pago', finISO)
            .order('fecha_pago', { ascending: false });
            
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
            .gte('fecha_gasto', inicioISO)
            .lte('fecha_gasto', finISO)
            .order('fecha_gasto', { ascending: false });
            
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
            .from('creditos')
            .select(`*, clientes ( * )`)
            .gte('fecha_emision', inicioISO)
            .lte('fecha_emision', finISO)
            .eq('forma_entrega', '1') 
            .order('fecha_emision', { ascending: false }); 
            
        if (errCreditos) throw errCreditos;

        let totalPrestadoHoy = 0;
        if (creditos.length > 0) {
            htmlDetalle += `<div style="background: #fffbeb; padding: 8px; border-radius: 5px; font-weight: bold; color: #b45309; margin-top: 15px;">💸 PRÉSTAMOS ENTREGADOS (EFECTIVO)</div>`;
            creditos.forEach(credito => {
                totalPrestadoHoy += parseFloat(credito.monto_capital || 0);
                
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
                        <span style="font-weight: 900; color: #f59e0b; font-size: 15px;">-$${parseFloat(credito.monto_capital||0).toFixed(2)}</span>
                        <div style="color: #94a3b8; font-size: 10px; margin-top: 4px; text-transform: capitalize;">📅 ${fechaLarga}</div>
                        <div style="color: #94a3b8; font-size: 10px;">🕒 ${hora}</div>
                    </div>
                </div>`;
            });
        }

        // ========================================================
        // 🔥 NUEVO: D. INYECCIONES DE CAPITAL (EL BOTÓN ROJO) 🔥
        // ========================================================
        const { data: movsCapital, error: errCapital } = await supabaseClient
            .from('historial_capital')
            .select('monto, concepto, fecha_movimiento')
            .gte('fecha_movimiento', inicioISO)
            .lte('fecha_movimiento', finISO)
            .order('fecha_movimiento', { ascending: false });
            
        if (errCapital) throw errCapital;

        let totalInyeccionesCapitalHoy = 0;
        
        if (movsCapital && movsCapital.length > 0) {
            let htmlCapital = '';
            let huboInyeccion = false;

            movsCapital.forEach(mov => {
                let monto = parseFloat(mov.monto || 0);
                // Si el monto es mayor a 0, significa que entró dinero físico a la maleta
                if (monto > 0) {
                    huboInyeccion = true;
                    totalInyeccionesCapitalHoy += monto;
                    
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

        if (pagos.length === 0 && gastos.length === 0 && creditos.length === 0 && totalInyeccionesCapitalHoy === 0) {
            htmlDetalle = `<div style="text-align: center; color: #64748b; padding: 20px;">No se registraron movimientos en efectivo el día de hoy.</div>`;
        }

        document.getElementById('cierre-detalle-lista').innerHTML = htmlDetalle;

        // ========================================================
        // E. EL CÁLCULO FÍSICO Y DIGITAL (ACTUALIZADO)
        // ========================================================
        let salidasDeEfectivo = totalGastosHoy + totalPrestadoHoy;
        
        // Sumamos las inyecciones (el botón rojo) a la maleta física
        let efectivoFisicoEnMano = totalRecaudadoFisico + totalInyeccionesCapitalHoy - salidasDeEfectivo; 
        
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
        // F. EL JUEZ CONTABLE (FÍSICO) Y BÓVEDAS
        // ========================================================
        // El Capital que hay que guardar incluye lo que inyectamos con el botón
        let capitalAGuardar = totalCapitalEntranteFisico + totalInyeccionesCapitalHoy;
        let interesAGuardar = totalInteresEntranteFisico;
        
        let deudaInterna = 0;
        window.deudaPendienteCierre = 0; 
        
        if (salidasDeEfectivo <= interesAGuardar) {
            // Escenario Perfecto
            interesAGuardar = interesAGuardar - salidasDeEfectivo;
            document.getElementById('alerta-cruce-bovedas').style.display = 'none';
        } else {
            // Hubo déficit
            let diferenciaFaltante = salidasDeEfectivo - interesAGuardar;
            interesAGuardar = 0; 
            capitalAGuardar = capitalAGuardar - diferenciaFaltante; 
            
            // Calculamos cuánto DEBEMOS restándole lo que YA REPUSIMOS hoy con el botón
            deudaInterna = diferenciaFaltante - totalInyeccionesCapitalHoy;

            // Si la deuda sigue siendo mayor a 0 (aunque sea por 1 centavo)
            if (deudaInterna > 0.001) {
                window.deudaPendienteCierre = deudaInterna;
                document.getElementById('alerta-cruce-bovedas').style.display = 'block';
                document.getElementById('alerta-cruce-bovedas').innerHTML = `
                    <h4 style="color: #b91c1c; margin: 0 0 10px 0; font-size: 16px;">⚠️ ATENCIÓN: REPOSICIÓN DE FONDOS REQUERIDA</h4>
                    <p style="color: #991b1b; font-size: 14px; margin: 0 0 15px 0;">
                        El Capital físico fue usado para pagar los gastos de hoy. 
                        La Bóveda de Intereses histórica <strong>LE DEBE $${deudaInterna.toFixed(2)}</strong> al Capital para cuadrar su maleta real.
                    </p>
                    <button onclick="ejecutarAjusteDeCruce()" style="background: #dc2626; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3); transition: transform 0.1s;" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'">
                        ✅ Aplicar Ajuste Automático en Sistema
                    </button>
                `;
            } else {
                // Si la inyección cubrió la deuda, apagamos la alerta roja
                document.getElementById('alerta-cruce-bovedas').style.display = 'none';
            }
        }

        if (efectivoFisicoEnMano < 0) {
            document.getElementById('cierre-efectivo-mano').style.color = "#ef4444";
        } else {
            document.getElementById('cierre-efectivo-mano').style.color = "#38bdf8";
        }

        // Cajas Físicas
        document.getElementById('cierre-guardar-capital').innerText = `$${capitalAGuardar.toFixed(2)}`;
        document.getElementById('cierre-guardar-interes').innerText = `$${interesAGuardar.toFixed(2)}`;

        // Cajas Bancarias
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

// =========================================================================
// 🚀 FUNCIÓN MÁGICA: EL BOTÓN DE AJUSTE AUTOMÁTICO
// =========================================================================
window.ejecutarAjusteDeCruce = async function() {
    const monto = window.deudaPendienteCierre;
    
    if (!monto || monto <= 0) return;

    const confirmacion = confirm(`¿Autoriza transferir internamente $${monto.toFixed(2)} desde sus UTILIDADES acumuladas hacia el CAPITAL para cubrir el descuadre físico de hoy?\n\n(Esto evita que usted tenga que sacar dinero de su bolsillo).`);
    
    if (!confirmacion) return;

    try {
        await supabaseClient.from('movimientos_utilidad').insert([{
            tipo: 'RETIRO',
            monto: monto,
            concepto: 'AJUSTE AUTOMÁTICO: COBERTURA DE DÉFICIT DE CAPITAL (CIERRE DIARIO)',
            origen: 'EFECTIVO',
            fecha: new Date().toISOString()
        }]);

        await supabaseClient.from('historial_capital').insert([{
            caja_id: 1, // 1 = Efectivo Matriz
            monto: monto,
            concepto: 'REPOSICIÓN AUTOMÁTICA DESDE BÓVEDA DE UTILIDADES (CIERRE DIARIO)',
            fecha_movimiento: new Date().toISOString()
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

document.addEventListener('DOMContentLoaded', () => {
    const originalCambiarModuloCierre = window.cambiarModulo;
    if (typeof originalCambiarModuloCierre === 'function') {
        window.cambiarModulo = function(idModulo) {
            originalCambiarModuloCierre(idModulo);
            if (idModulo === 'cierre') {
                document.getElementById('cierre-total-ingresos').innerText = "$0.00";
                document.getElementById('cierre-efectivo-mano').innerText = "$0.00";
                document.getElementById('alerta-cruce-bovedas').style.display = 'none';
                document.getElementById('cierre-detalle-lista').innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 20px; font-size: 14px;">Presione "Calcular Cierre de Hoy" para generar el reporte detallado de los movimientos.</div>';
            }
        };
    }
});
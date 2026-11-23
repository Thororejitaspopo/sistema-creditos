// =========================================================================
// 🔒 MÓDULO DE CIERRE DE CAJA DIARIO Y AUDITORÍA (CLON MÓVIL BLINDADO V6)
// Archivo: modulos_movil/cierre_movil.js
// =========================================================================

window.deudaPendienteCierreMovil = 0;
window.ultimaCajaChicaGuardadaMovil = 0;

function extraerNombreSeguroMovil(clienteObj) {
    if (!clienteObj) return 'CLIENTE DESCONOCIDO';
    if (clienteObj.nombres && clienteObj.apellidos) return `${clienteObj.nombres} ${clienteObj.apellidos}`;
    if (clienteObj.nombre && clienteObj.apellido) return `${clienteObj.nombre} ${clienteObj.apellido}`;
    return clienteObj.nombre_completo || clienteObj.nombres || clienteObj.nombre || clienteObj.cliente || 'CLIENTE';
}

// =========================================================================
// 1. MOTOR PRINCIPAL: CALCULAR CIERRE DE HOY
// =========================================================================
window.ejecutarCierreDiarioMovil = async function() {
    const cajaChicaInput = document.getElementById('input-base-caja-movil');
    const baseCajaChica = cajaChicaInput ? parseFloat(cajaChicaInput.value || 0) : (window.ultimaCajaChicaGuardadaMovil || 0);
    window.ultimaCajaChicaGuardadaMovil = baseCajaChica;

    document.getElementById('cierre-total-ingresos-movil').innerText = "...";
    document.getElementById('cierre-total-gastos-movil').innerText = "...";
    document.getElementById('cierre-total-prestamos-movil').innerText = "...";
    document.getElementById('cierre-efectivo-mano-movil').innerText = "Calculando...";
    document.getElementById('cierre-detalle-lista-movil').innerHTML = '<div style="text-align:center; color:#94a3b8; padding:20px; font-size:12px;">⏳ Sincronizando bóvedas y referencias cruzadas...</div>';

    try {
        const supa = window.supabaseClient;
        if (!supa) throw new Error("Base de datos no conectada.");

        const inicioDia = new Date(); inicioDia.setHours(0, 0, 0, 0);
        const finDia = new Date(); finDia.setHours(23, 59, 59, 999);
        const inicioISO = inicioDia.toISOString();
        const finISO = finDia.toISOString();

        let htmlDetalle = '';

        if (baseCajaChica > 0) {
            htmlDetalle += `<div style="background:#f1f5f9; padding:10px 12px; border-radius:8px; font-weight:bold; color:#334155; margin-bottom:12px; border-left:4px solid #475569; font-size:12px; display:flex; justify-content:space-between;"><span>💼 BASE INICIAL (CAJA CHICA)</span><span style="color:#0f172a;">$${baseCajaChica.toFixed(2)}</span></div>`;
        }

        const { data: historialTodos } = await supa.from('creditos').select('id, cliente_id').order('id', { ascending: true });
        const mapNumCreditoLocal = {};
        if (historialTodos) {
            const conteo = {};
            historialTodos.forEach(c => {
                conteo[c.cliente_id] = (conteo[c.cliente_id] || 0) + 1;
                mapNumCreditoLocal[c.id] = conteo[c.cliente_id];
            });
        }

        // A. RECAUDACIÓN (CLIENTES)
        const { data: pagos, error: errPagos } = await supa
            .from('historial_pagos')
            .select(`id, numero_pago, id_credito, monto_capital, monto_interes, abono_total, fecha_pago, forma_pago, creditos ( *, clientes ( * ) )`)
            .gte('fecha_pago', inicioISO).lte('fecha_pago', finISO).order('fecha_pago', { ascending: false });
        if (errPagos) throw errPagos;

        let totalCapitalEntranteFisico = 0, totalInteresEntranteFisico = 0, totalRecaudadoFisico = 0;
        let totalCapitalEntranteBanco = 0, totalInteresEntranteBanco = 0;

        if (pagos && pagos.length > 0) {
            htmlDetalle += `<div style="background:#ecfdf5; padding:8px 10px; border-radius:6px; font-weight:900; color:#065f46; font-size:11px; margin-top:8px;">📥 INGRESOS RECAUDADOS (CLIENTES)</div>`;
            pagos.forEach(pago => {
                const hora = new Date(pago.fecha_pago).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
                const numAbono = pago.numero_pago || pago.id || 'N/A';
                const idCred = pago.id_credito || 'N/A';
                const clienteObj = (pago.creditos && pago.creditos.clientes) ? pago.creditos.clientes : null;
                const nombreCliente = extraerNombreSeguroMovil(clienteObj).toUpperCase();
                const iniciales = nombreCliente.substring(0, 2);
                const u4 = (clienteObj && clienteObj.cedula) ? clienteObj.cedula.trim().slice(-4) : '0000';
                const refCli = (clienteObj && clienteObj.referencia) ? clienteObj.referencia : `REF: ${iniciales}-${u4}`;

                const numLocal = mapNumCreditoLocal[pago.id_credito] || 1;
                const creCif = typeof cifrarNumeroCreditoMovil === 'function' ? cifrarNumeroCreditoMovil(numLocal).toUpperCase() : '';
                const etiquetaCRE = creCif ? `CRE #${numLocal} [${creCif}]` : `CRE #${numLocal}`;

                const rawMetodo = (pago.forma_pago || 'EFECTIVO').toUpperCase();
                const esTransferencia = rawMetodo.includes('TRANSF') || rawMetodo.includes('BANCO') || rawMetodo.includes('DEP');

                const capPago = parseFloat(pago.monto_capital || 0);
                const intPago = parseFloat(pago.monto_interes || 0);
                const totPago = parseFloat(pago.abono_total || 0);

                if (esTransferencia) {
                    totalCapitalEntranteBanco += capPago;
                    totalInteresEntranteBanco += intPago;
                } else {
                    totalCapitalEntranteFisico += capPago;
                    totalInteresEntranteFisico += intPago;
                    totalRecaudadoFisico += totPago;
                }

                htmlDetalle += `
                <div style="padding:10px; border-bottom:1px dashed #cbd5e1; background:#f8fafc; font-size:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                        <strong style="color:#0f172a; font-size:12px;">ABONO #${numAbono} | ${nombreCliente}</strong>
                        <span style="font-weight:900; color:#10b981; font-size:14px; white-space:nowrap;">+$${totPago.toFixed(2)}</span>
                    </div>
                    <div style="color:${esTransferencia ? '#8b5cf6' : '#0284c7'}; font-size:10px; font-weight:bold; margin-top:3px;">${esTransferencia ? '💳 Banco Principal (Transferencia)' : '🏦 Efectivo Central (Matriz)'}</div>
                    <div style="color:#64748b; font-size:10px; margin-top:2px;">${refCli} | CRÉDITO #${idCred} | ${etiquetaCRE}</div>
                    <div style="display:flex; justify-content:space-between; color:#64748b; font-size:10px; margin-top:3px;">
                        <span>Cap: <b style="color:#0369a1;">$${capPago.toFixed(2)}</b> | Int: <b style="color:#a16207;">$${intPago.toFixed(2)}</b></span>
                        <span>🕒 ${hora}</span>
                    </div>
                </div>`;
            });
        }

        // B. GASTOS VARIOS
        const { data: gastos, error: errGastos } = await supa
            .from('gastos_varios')
            .select('monto, concepto, fecha_gasto')
            .gte('fecha_gasto', inicioISO).lte('fecha_gasto', finISO).order('fecha_gasto', { ascending: false });
        if (errGastos) throw errGastos;

        let totalGastosHoy = 0;
        if (gastos && gastos.length > 0) {
            htmlDetalle += `<div style="background:#fef2f2; padding:8px 10px; border-radius:6px; font-weight:900; color:#991b1b; font-size:11px; margin-top:12px;">📉 GASTOS DEL DÍA</div>`;
            gastos.forEach(gasto => {
                totalGastosHoy += parseFloat(gasto.monto || 0);
                const hora = new Date(gasto.fecha_gasto).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
                htmlDetalle += `
                <div style="padding:10px; border-bottom:1px dashed #cbd5e1; background:#fef4f4; font-size:12px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
                    <div>
                        <strong style="color:#7f1d1d;">${(gasto.concepto || 'GASTO VARIO').toUpperCase()}</strong>
                        <div style="color:#991b1b; font-size:10px; margin-top:2px;">🏦 Efectivo en Calle • 🕒 ${hora}</div>
                    </div>
                    <span style="font-weight:900; color:#ef4444; font-size:14px; white-space:nowrap;">-$${parseFloat(gasto.monto || 0).toFixed(2)}</span>
                </div>`;
            });
        }

        // C. PRÉSTAMOS ENTREGADOS HOY (EFECTIVO)
        const { data: creditos, error: errCreditos } = await supa
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
                htmlDetalle += `<div style="background:#fffbeb; padding:8px 10px; border-radius:6px; font-weight:900; color:#b45309; font-size:11px; margin-top:12px;">💸 PRÉSTAMOS ENTREGADOS (EFECTIVO)</div>`;
                creditosEfectivo.forEach(credito => {
                    const montoPrestado = parseFloat(credito.monto_capital || credito.monto || 0);
                    totalPrestadoHoy += montoPrestado;
                    const hora = new Date(credito.fecha_emision).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
                    const nombreCliente = extraerNombreSeguroMovil(credito.clientes).toUpperCase();
                    htmlDetalle += `
                    <div style="padding:10px; border-bottom:1px dashed #cbd5e1; background:#fffcf0; font-size:12px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
                        <div>
                            <strong style="color:#92400e;">CRE #${credito.id} | ${nombreCliente}</strong>
                            <div style="color:#b45309; font-size:10px; margin-top:2px;">🏦 Efectivo Central • 🕒 ${hora}</div>
                        </div>
                        <span style="font-weight:900; color:#f59e0b; font-size:14px; white-space:nowrap;">-$${montoPrestado.toFixed(2)}</span>
                    </div>`;
                });
            }
        }

        // D. INYECCIONES DE CAPITAL
        const { data: movsCapital, error: errCapital } = await supa
            .from('historial_capital')
            .select('monto, concepto, fecha_movimiento')
            .gte('fecha_movimiento', inicioISO).lte('fecha_movimiento', finISO).order('fecha_movimiento', { ascending: false });
        if (errCapital) throw errCapital;

        let totalInyeccionesCapitalHoy = 0;
        if (movsCapital && movsCapital.length > 0) {
            let htmlCap = '', hubo = false;
            movsCapital.forEach(mov => {
                const monto = parseFloat(mov.monto || 0);
                if (monto > 0) {
                    hubo = true;
                    if (!(mov.concepto || '').toUpperCase().includes('RECUPERACIÓN')) totalInyeccionesCapitalHoy += monto;
                    const hora = new Date(mov.fecha_movimiento).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
                    htmlCap += `
                    <div style="padding:10px; border-bottom:1px dashed #cbd5e1; background:#f0f9ff; font-size:12px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
                        <div>
                            <strong style="color:#0369a1;">INYECCIÓN DE CAPITAL</strong>
                            <div style="color:#64748b; font-size:10px; margin-top:2px;">${mov.concepto || 'MANUAL'} • 🕒 ${hora}</div>
                        </div>
                        <span style="font-weight:900; color:#0369a1; font-size:14px; white-space:nowrap;">+$${monto.toFixed(2)}</span>
                    </div>`;
                }
            });
            if (hubo) htmlDetalle += `<div style="background:#e0f2fe; padding:8px 10px; border-radius:6px; font-weight:900; color:#0369a1; font-size:11px; margin-top:12px;">🔄 MOVIMIENTOS DIRECTOS A CAPITAL</div>` + htmlCap;
        }

        // D.2 INYECCIONES DE INTERÉS
        const { data: movsInteres } = await supa
            .from('movimientos_utilidad')
            .select('monto, concepto, fecha, tipo')
            .gte('fecha', inicioISO).lte('fecha', finISO).order('fecha', { ascending: false });

        if (movsInteres && movsInteres.length > 0) {
            let htmlInt = '', huboI = false;
            movsInteres.forEach(mov => {
                const monto = parseFloat(mov.monto || 0);
                if (monto > 0 && mov.tipo !== 'RETIRO') {
                    huboI = true;
                    const hora = new Date(mov.fecha).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
                    htmlInt += `
                    <div style="padding:10px; border-bottom:1px dashed #cbd5e1; background:#fefce8; font-size:12px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
                        <div>
                            <strong style="color:#a16207;">INYECCIÓN / INTERÉS</strong>
                            <div style="color:#64748b; font-size:10px; margin-top:2px;">${mov.concepto || 'AUTOMÁTICO'} • 🕒 ${hora}</div>
                        </div>
                        <span style="font-weight:900; color:#a16207; font-size:14px; white-space:nowrap;">+$${monto.toFixed(2)}</span>
                    </div>`;
                }
            });
            if (huboI) htmlDetalle += `<div style="background:#fef9c3; padding:8px 10px; border-radius:6px; font-weight:900; color:#a16207; font-size:11px; margin-top:12px;">🔄 MOVIMIENTOS DIRECTOS A INTERÉS</div>` + htmlInt;
        }

        if (!htmlDetalle) {
            htmlDetalle = `<div style="text-align:center; color:#64748b; padding:20px; font-size:12px;">No se registraron movimientos el día de hoy.</div>`;
        }
        document.getElementById('cierre-detalle-lista-movil').innerHTML = htmlDetalle;

        // E. CÁLCULO FÍSICO Y DIGITAL
        const salidasDeEfectivo = totalGastosHoy + totalPrestadoHoy;
        const efectivoFisicoEnMano = baseCajaChica + totalRecaudadoFisico + totalInyeccionesCapitalHoy - salidasDeEfectivo;
        const totalRecaudadoDia = totalRecaudadoFisico + totalCapitalEntranteBanco + totalInteresEntranteBanco;

        document.getElementById('cierre-total-ingresos-movil').innerText = `$${totalRecaudadoDia.toFixed(2)}`;
        document.getElementById('cierre-ingreso-cap-movil').innerText = `$${(totalCapitalEntranteFisico + totalCapitalEntranteBanco).toFixed(2)}`;
        document.getElementById('cierre-ingreso-int-movil').innerText = `$${(totalInteresEntranteFisico + totalInteresEntranteBanco).toFixed(2)}`;
        document.getElementById('cierre-total-gastos-movil').innerText = `$${totalGastosHoy.toFixed(2)}`;
        document.getElementById('cierre-total-prestamos-movil').innerText = `$${totalPrestadoHoy.toFixed(2)}`;

        const elMano = document.getElementById('cierre-efectivo-mano-movil');
        elMano.innerText = `$${efectivoFisicoEnMano.toFixed(2)}`;
        elMano.style.color = efectivoFisicoEnMano < 0 ? '#ef4444' : '#38bdf8';

        // F. JUEZ CONTABLE
        let capitalAGuardar = baseCajaChica + totalCapitalEntranteFisico + totalInyeccionesCapitalHoy - totalPrestadoHoy;
        let interesAGuardar = totalInteresEntranteFisico;
        window.deudaPendienteCierreMovil = 0;
        const alertaDiv = document.getElementById('alerta-cruce-bovedas-movil');

        if (totalGastosHoy <= interesAGuardar) {
            interesAGuardar -= totalGastosHoy;
            alertaDiv.style.display = 'none';
        } else {
            const gastosNoCubiertos = totalGastosHoy - interesAGuardar;
            interesAGuardar = 0;
            capitalAGuardar -= gastosNoCubiertos;
            const deudaInterna = gastosNoCubiertos - totalInyeccionesCapitalHoy;

            if (deudaInterna > 0.001) {
                window.deudaPendienteCierreMovil = deudaInterna;
                alertaDiv.style.display = 'block';
                alertaDiv.innerHTML = `
                    <div style="background:#fef2f2; border:1px solid #fca5a5; border-left:5px solid #dc2626; border-radius:10px; padding:14px; margin-bottom:14px;">
                        <h4 style="color:#b91c1c; margin:0 0 6px 0; font-size:13px;">⚠️ REPOSICIÓN DE FONDOS REQUERIDA</h4>
                        <p style="color:#991b1b; font-size:12px; margin:0 0 12px 0;">
                            El Capital físico cubrió los gastos de hoy. La Bóveda de Intereses <b>LE DEBE $${deudaInterna.toFixed(2)}</b> al Capital.
                        </p>
                        <button onclick="ejecutarAjusteDeCruceMovil()" style="width:100%; background:#dc2626; color:white; border:none; padding:11px; border-radius:8px; font-weight:bold; font-size:12px;">
                            ✅ Aplicar Ajuste Automático en Sistema
                        </button>
                    </div>`;
            } else {
                alertaDiv.style.display = 'none';
            }
        }

        document.getElementById('cierre-guardar-capital-movil').innerText = `$${capitalAGuardar.toFixed(2)}`;
        document.getElementById('cierre-guardar-interes-movil').innerText = `$${interesAGuardar.toFixed(2)}`;
        document.getElementById('cierre-banco-capital-movil').innerText = `$${totalCapitalEntranteBanco.toFixed(2)}`;
        document.getElementById('cierre-banco-interes-movil').innerText = `$${totalInteresEntranteBanco.toFixed(2)}`;

    } catch (error) {
        console.error("Error Cierre Móvil:", error);
        alert("❌ Error al procesar la auditoría: " + error.message);
    }
};

// =========================================================================
// 2. AJUSTE AUTOMÁTICO DE CRUCE DE BÓVEDAS
// =========================================================================
window.ejecutarAjusteDeCruceMovil = async function() {
    const monto = window.deudaPendienteCierreMovil;
    if (!monto || monto <= 0) return;

    if (!confirm(`¿Autoriza transferir internamente $${monto.toFixed(2)} desde UTILIDADES hacia CAPITAL para cubrir el descuadre físico de hoy?`)) return;

    try {
        const supa = window.supabaseClient;
        await supa.from('movimientos_utilidad').insert([{
            tipo: 'RETIRO', monto: monto, concepto: 'AJUSTE AUTOMÁTICO: COBERTURA DE DÉFICIT DE CAPITAL (CIERRE DIARIO)', origen: 'EFECTIVO', fecha: new Date().toISOString()
        }]);
        await supa.from('historial_capital').insert([{
            caja_id: 1, monto: monto, concepto: 'REPOSICIÓN AUTOMÁTICA DESDE BÓVEDA DE UTILIDADES (CIERRE DIARIO)', fecha_movimiento: new Date().toISOString()
        }]);
        const { data: caja } = await supa.from('cajas_capital').select('saldo_actual').eq('id', 1).single();
        if (caja) {
            await supa.from('cajas_capital').update({ saldo_actual: parseFloat(caja.saldo_actual || 0) + monto }).eq('id', 1);
        }

        alert(`✅ ¡Ajuste realizado! Se transfirieron $${monto.toFixed(2)} al capital.`);
        window.ejecutarCierreDiarioMovil();
    } catch (e) {
        alert("❌ Error al balancear: " + e.message);
    }
};

// =========================================================================
// 3. GENERAR PDF OFICIAL DE CIERRE DIARIO (CLON EXACTO DE COMPUTADORA)
// =========================================================================
window.generarPDFCierreDiarioMovil = async function() {
    if (!window.jspdf) {
        alert("⏳ Preparando motor PDF... Presione Aceptar, espere 3 segundos y vuelva a tocar el botón.");
        const s1 = document.createElement('script'); s1.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"; document.head.appendChild(s1);
        const s2 = document.createElement('script'); s2.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js"; document.head.appendChild(s2);
        return;
    }

    const valEfectivoMano = document.getElementById('cierre-efectivo-mano-movil')?.innerText || "$0.00";
    if (valEfectivoMano === "$0.00" || valEfectivoMano === "Calculando...") {
        alert("⚠️ Por favor, primero presione 'CALCULAR CIERRE DE HOY' antes de generar el PDF.");
        return;
    }

    alert("⏳ Recopilando la Radiografía del Día para el PDF... Presione Aceptar y espere un momento.");

    try {
        const supa = window.supabaseClient;
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('portrait', 'mm', 'a4');

        // ENCABEZADO
        doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(15, 23, 42);
        doc.text("SISTEMA ALPHA V6", 14, 20);

        doc.setFontSize(14); doc.setTextColor(2, 132, 199);
        doc.text("ARQUEO Y CIERRE DE CAJA DIARIO (AUDITORÍA DETALLADA)", 14, 28);

        const fImpresion = new Date().toLocaleDateString('es-EC', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        doc.setFontSize(9); doc.setTextColor(100, 116, 139); doc.setFont(undefined, 'normal');
        doc.text(`Fecha y Hora de Auditoría: ${fImpresion.toUpperCase()}`, 14, 34);
        doc.setDrawColor(200, 200, 200); doc.line(14, 37, 196, 37);

        // CAJA OSCURA: EFECTIVO EN MANO
        doc.setFillColor(15, 23, 42); doc.roundedRect(14, 43, 182, 26, 3, 3, 'F');
        doc.setFontSize(10); doc.setTextColor(148, 163, 184); doc.setFont(undefined, 'bold');
        doc.text("EFECTIVO FÍSICO TOTAL QUE DEBE TENER EN SU MANO:", 20, 52);
        doc.setFontSize(22); doc.setTextColor(56, 189, 248);
        doc.text(valEfectivoMano, 20, 62);

        // 3 CUADROS DE RESUMEN
        const valIngresos = document.getElementById('cierre-total-ingresos-movil').innerText;
        const valGastos = document.getElementById('cierre-total-gastos-movil').innerText;
        const valPrestamos = document.getElementById('cierre-total-prestamos-movil').innerText;

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

        // SEPARACIÓN DE FONDOS
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

        pintarCajita("CAJA FUERTE DE CAPITAL (Efectivo)", 'cierre-guardar-capital-movil', [241, 245, 249], [15, 23, 42]);
        pintarCajita("CAJA FUERTE DE UTILIDADES (Ganancia en Efectivo)", 'cierre-guardar-interes-movil', [254, 252, 232], [161, 98, 7]);
        pintarCajita("CAPITAL EN BANCOS (Transferencias)", 'cierre-banco-capital-movil', [245, 243, 255], [109, 40, 217]);
        pintarCajita("UTILIDADES EN BANCOS (Transferencias)", 'cierre-banco-interes-movil', [253, 244, 255], [192, 38, 211]);

        // RADIOGRAFÍA DEL DÍA (TABLA DETALLADA)
        const inicioDia = new Date(); inicioDia.setHours(0, 0, 0, 0);
        const finDia = new Date(); finDia.setHours(23, 59, 59, 999);
        const isoIni = inicioDia.toISOString(); const isoFin = finDia.toISOString();

        let datosTabla = [];

        // 1. BASE DE CAJA CHICA
        const baseCajaChica = window.ultimaCajaChicaGuardadaMovil || 0;
        if (baseCajaChica > 0) {
            const fechaBase = new Date(); fechaBase.setHours(8, 0, 0, 0);
            datosTabla.push({
                fechaObj: fechaBase, hora: "08:00 a. m.", operacion: 'BASE INICIAL',
                detalle: 'CAJA CHICA DEL DÍA', caja: 'EFECTIVO',
                monto: `+$${baseCajaChica.toFixed(2)}`
            });
        }

        // 2. PAGOS / RECAUDACIÓN
        const { data: pagos } = await supa.from('historial_pagos').select(`*, creditos (*, clientes (*))`).gte('fecha_pago', isoIni).lte('fecha_pago', isoFin);
        if (pagos) pagos.forEach(p => {
            const cli = (p.creditos && p.creditos.clientes) ? `${p.creditos.clientes.nombres} ${p.creditos.clientes.apellidos}` : 'CLIENTE';
            const detalleConDesglose = `${cli.toUpperCase()}\n[Capital: $${parseFloat(p.monto_capital || 0).toFixed(2)} | Interés: $${parseFloat(p.monto_interes || 0).toFixed(2)}]`;
            datosTabla.push({
                fechaObj: new Date(p.fecha_pago),
                hora: new Date(p.fecha_pago).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
                operacion: 'INGRESO (ABONO)',
                detalle: detalleConDesglose,
                caja: (p.forma_pago || 'EFECTIVO').toUpperCase(),
                monto: `+$${parseFloat(p.abono_total).toFixed(2)}`
            });
        });

        // 3. GASTOS
        const { data: gastos } = await supa.from('gastos_varios').select('*').gte('fecha_gasto', isoIni).lte('fecha_gasto', isoFin);
        if (gastos) gastos.forEach(g => {
            datosTabla.push({
                fechaObj: new Date(g.fecha_gasto),
                hora: new Date(g.fecha_gasto).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
                operacion: 'GASTO DEL DÍA',
                detalle: (g.concepto || 'VARIO').toUpperCase(),
                caja: 'EFECTIVO',
                monto: `-$${parseFloat(g.monto).toFixed(2)}`
            });
        });

        // 4. PRÉSTAMOS EN EFECTIVO
        const { data: creditos } = await supa.from('creditos').select('*, clientes (*)').gte('fecha_emision', isoIni).lte('fecha_emision', isoFin);
        if (creditos) {
            const creditosEfectivo = creditos.filter(c => {
                const forma = (c.forma_entrega || '').toString().toUpperCase();
                return forma === '1' || forma.includes('EFECTIVO') || forma === '';
            });
            creditosEfectivo.forEach(c => {
                const cli = c.clientes ? `${c.clientes.nombres} ${c.clientes.apellidos}` : 'CLIENTE';
                const montoPrestado = parseFloat(c.monto_capital || c.monto || 0);
                datosTabla.push({
                    fechaObj: new Date(c.fecha_emision),
                    hora: new Date(c.fecha_emision).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
                    operacion: 'NUEVO PRÉSTAMO',
                    detalle: cli.toUpperCase(),
                    caja: 'EFECTIVO',
                    monto: `-$${montoPrestado.toFixed(2)}`
                });
            });
        }

        // 5. INYECCIONES DE CAPITAL
        const { data: movsCapital } = await supa.from('historial_capital').select('*').gte('fecha_movimiento', isoIni).lte('fecha_movimiento', isoFin);
        if (movsCapital) {
            movsCapital.forEach(mov => {
                const montoNum = parseFloat(mov.monto || 0);
                const conceptoLimpio = (mov.concepto || '').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\.,;:\-\_\(\)\[\]\|#\$%&!¿\?]/g, ' ').replace(/\s+/g, ' ').trim();
                const conceptoTexto = conceptoLimpio.toUpperCase();
                if (montoNum > 0 && !conceptoTexto.includes('RECUPERACION') && !conceptoTexto.includes('RECUPERACIÓN')) {
                    datosTabla.push({
                        fechaObj: new Date(mov.fecha_movimiento),
                        hora: new Date(mov.fecha_movimiento).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
                        operacion: 'INYECCIÓN DE CAPITAL',
                        detalle: conceptoTexto || 'FONDEO DE CAJA',
                        caja: 'EFECTIVO',
                        monto: `+$${montoNum.toFixed(2)}`
                    });
                }
            });
        }

        // ORDENAR Y DIBUJAR TABLA
        datosTabla.sort((a, b) => a.fechaObj - b.fechaObj);
        const filasPDF = datosTabla.map(d => [d.hora, d.operacion, d.detalle, d.caja, d.monto]);

        doc.setFontSize(11); doc.setTextColor(15, 23, 42); doc.text("DETALLE DE AUDITORÍA (RADIOGRAFÍA DEL DÍA)", 14, yPos + 10);

        doc.autoTable({
            startY: yPos + 14,
            head: [['HORA', 'OPERACIÓN', 'CLIENTE / CONCEPTO', 'CAJA', 'VALOR']],
            body: filasPDF,
            theme: 'striped',
            headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8 },
            styles: { fontSize: 8, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 35 },
                2: { cellWidth: 'auto' },
                3: { cellWidth: 25 },
                4: { halign: 'right', fontStyle: 'bold', cellWidth: 20 }
            },
            didParseCell: function(data) {
                if (data.section === 'body' && data.column.index === 4) {
                    if (data.cell.raw.startsWith('+')) data.cell.styles.textColor = [16, 185, 129];
                    else data.cell.styles.textColor = [220, 38, 38];
                }
            }
        });

        // FIRMAS Y PIE DE PÁGINA
        let finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : yPos + 20) + 30;
        if (finalY > 260) { doc.addPage(); finalY = 40; }

        doc.setDrawColor(0, 0, 0); doc.line(30, finalY, 80, finalY);
        doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(15, 23, 42);
        doc.text("Firma del Cajero / Operador", 55, finalY + 5, { align: 'center' });

        doc.line(130, finalY, 180, finalY);
        doc.text("Firma de Gerencia / Auditoría", 155, finalY + 5, { align: 'center' });

        doc.setFontSize(8); doc.setTextColor(150, 150, 150);
        doc.text("Documento auditado por Sistema Alpha V6. Todo sobrante o faltante es responsabilidad del operador.", 14, 280);

        const fechaFile = new Date().toISOString().split('T')[0];
        doc.save(`Arqueo_Caja_Detallado_${fechaFile}.pdf`);

    } catch (error) {
        console.error("Error al generar PDF de Cierre Móvil:", error);
        alert("❌ Error al generar el PDF: " + error.message);
    }
};

// =========================================================================
// 4. RESPALDO TOTAL CIFRADO POR CORREO (EMAILJS)
// =========================================================================
window.ejecutarRespaldoCorreoMovil = async function(btn) {
    if (typeof emailjs === 'undefined') {
        alert("⚠️ El servicio de correo (EmailJS) no está cargado en movil.html.");
        return;
    }

    const textoOriginal = btn.innerHTML;
    btn.innerHTML = "⏳ CIFRANDO RESPALDO...";
    btn.disabled = true;

    try {
        const supa = window.supabaseClient;
        const [resClientes, resCreditos, resCajas] = await Promise.all([
            supa.from('clientes').select('nombres, apellidos, cedula').order('nombres', { ascending: true }),
            supa.from('creditos').select('id, monto_capital, total_pagar, monto_mora, estado, clientes(nombres, apellidos), historial_pagos(abono_total)').in('estado', ['activo', 'congelado']).order('id', { ascending: true }),
            supa.from('cajas_capital').select('saldo_actual')
        ]);

        const fechaCorte = new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase();
        const ocultarNombre = (n, a) => `${n ? n.trim().charAt(0).toUpperCase() + "." : ""} ${a ? a.trim().split(" ")[0].toUpperCase() : ""}`.trim() || "CLIENTE";
        const ocultarCedula = (ced) => ced && ced.length > 4 ? `******${ced.slice(-4)}` : "N/A";
        const encriptarDinero = (monto) => {
            const dicc = { '1': 'h', '2': 'y', '3': 'r', '4': 'v', '5': 't', '6': 'n', '7': 'g', '8': 'j', '9': 'ñ', '0': 'p' };
            return parseFloat(monto).toFixed(2).split('').map(c => dicc[c] || c).join('');
        };

        let cuerpo = `===========================================\n🏛️ ALPHA FINANCIAL - RESPALDO DE SEGURIDAD\n===========================================\nFECHA: ${fechaCorte}\n\n1. 👥 CLIENTES\n`;
        (resClientes.data || []).forEach(c => { cuerpo += `• ${ocultarNombre(c.nombres, c.apellidos)} | ID: ${ocultarCedula(c.cedula)}\n`; });

        cuerpo += `\n2. 💸 CRÉDITOS ACTIVOS\n`;
        let capitalEnCalle = 0;
        (resCreditos.data || []).forEach(cred => {
            const cli = cred.clientes || {};
            const deuda = parseFloat(cred.total_pagar || 0) + parseFloat(cred.monto_mora || 0);
            const abonado = (cred.historial_pagos || []).reduce((s, h) => s + (parseFloat(h.abono_total) || 0), 0);
            const saldo = Math.max(0, deuda - abonado);
            capitalEnCalle += saldo;
            cuerpo += `• CRE #${cred.id} | ${ocultarNombre(cli.nombres, cli.apellidos)} -> SALDO: $${saldo.toFixed(2)} [${cred.estado.toUpperCase()}]\n`;
        });
        cuerpo += `\n📊 INDICADOR GLOBAL: ${encriptarDinero(capitalEnCalle)}\n\n3. 🏦 RESERVA INTERNA\n`;
        const totalCaja = (resCajas.data || []).reduce((s, c) => s + parseFloat(c.saldo_actual || 0), 0);
        cuerpo += `• ÍNDICE DE LIQUIDEZ: ${encriptarDinero(totalCaja)}\n`;

        await emailjs.send("service_dmkw6fk", "template_j0udm4n", {
            asunto_reporte: `FULL BACKUP (MÓVIL) - ALPHA V6`,
            mensaje_respaldo: cuerpo,
            correo_admin: "micredi2020@gmail.com"
        });

        btn.innerHTML = "✅ ¡BACKUP ENVIADO!";
        btn.style.background = "#10b981";
        setTimeout(() => { btn.innerHTML = textoOriginal; btn.style.background = "#0f172a"; btn.disabled = false; }, 3500);
    } catch (e) {
        alert("❌ Error al enviar respaldo: " + e.message);
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
    }
};
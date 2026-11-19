// =========================================================
// ⚡ MOTOR MATRIZ GERENCIAL MÓVIL (VERSIÓN FINAL IDÉNTICA A PC)
// Archivo: modulos_movil/matriz_movil.js
// =========================================================

function filtrarListaMovil(idContenedor, textoBusqueda) {
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;
    const tarjetas = contenedor.children;
    const busquedaUpper = textoBusqueda.toUpperCase().trim();
    for (let i = 0; i < tarjetas.length; i++) {
        const tarjeta = tarjetas[i];
        if (tarjeta.innerText.includes('⏳') || tarjeta.innerText.includes('✅')) continue;
        if (tarjeta.style) {
            tarjeta.style.display = tarjeta.innerText.toUpperCase().includes(busquedaUpper) ? 'block' : 'none';
        }
    }
}

async function cargarMatrizGlobalMovil() {
    console.log("Iniciando Matriz Gerencial (Cerebro Clonado y Diseño VIP)...");
    
    document.getElementById('monto-caja-matriz').innerText = '...';
    document.getElementById('monto-capital-calle').innerText = '...';
    document.getElementById('num-cuentas-congeladas').innerText = '...';
    document.getElementById('monto-ganancia-proyectada').innerText = '...';
    document.getElementById('lbl-meta-hoy').innerText = '...';
    
    const divRuta = document.getElementById('lista-ruta-movil');
    const divAlertas = document.getElementById('lista-alertas-movil');

    try {
        const supa = window.supabaseClient;
        if (!supa) throw new Error("Supabase no conectado.");

        const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const fechaHoy = new Date();
        const hoySoloFecha = new Date(fechaHoy.getFullYear(), fechaHoy.getMonth(), fechaHoy.getDate());

        // 1. CAJA MATRIZ
        const { data: cajas } = await supa.from('cajas_capital').select('saldo_actual');
        let capitalTotalGeneral = 0;
        if (cajas && cajas.length > 0) {
            cajas.forEach(caja => capitalTotalGeneral += parseFloat(caja.saldo_actual || 0));
            document.getElementById('monto-caja-matriz').innerText = `$${capitalTotalGeneral.toFixed(2)}`;
        }

        // 2. EXTRACCIÓN MASIVA
        const { data: historialTodos } = await supa.from('creditos').select('id, cliente_id').order('id', { ascending: true });
        const mapNumCreditoLocal = {};
        if (historialTodos) {
            const conteo = {};
            historialTodos.forEach(c => {
                conteo[c.cliente_id] = (conteo[c.cliente_id] || 0) + 1;
                mapNumCreditoLocal[c.id] = conteo[c.cliente_id];
            });
        }

        const { data: creditos } = await supa
            .from('creditos')
            .select('id, monto_capital, total_pagar, monto_mora, valor_cuota, total_interes, estado, fecha_emision, num_cuotas, frecuencia_pago, clientes(nombres, apellidos, cedula, perfil_cobro), historial_pagos(abono_total), fecha_vencimiento_actual')
            .in('estado', ['activo', 'congelado']);

        if (!creditos || creditos.length === 0) throw new Error("No hay créditos activos.");

        let gananciaProyectada = 0, cuentasCongeladas = 0, metaHoy = 0;
        let deudaTotalEsperada = 0, abonoGlobal = 0; 
        let alertasVencimiento = [], rutaCobroDia = [];

        creditos.forEach(c => {
            if (c.estado === 'congelado') cuentasCongeladas++;
            if (c.estado === 'activo') metaHoy += parseFloat(c.valor_cuota || 0);
            gananciaProyectada += parseFloat(c.total_interes || 0);
            
            const capitalPrestado = parseFloat(c.monto_capital || 0);
            const moraActual = parseFloat(c.monto_mora || 0);
            const deudaTotalReal = parseFloat(c.total_pagar || 0) + moraActual;
            deudaTotalEsperada += deudaTotalReal;

            const pagos = c.historial_pagos || [];
            const totalAbonado = pagos.reduce((sum, p) => sum + (parseFloat(p.abono_total) || 0), 0);
            abonoGlobal += totalAbonado;

            let saldoPendiente = deudaTotalReal - totalAbonado;
            if (saldoPendiente < 0) saldoPendiente = 0;

            if (c.estado === 'activo' || c.estado === 'congelado') {
                const fEmi = c.fecha_emision ? new Date(c.fecha_emision) : new Date();
                const numeroCuotas = parseInt(c.num_cuotas) || 30;
                const frecuencia = (c.frecuencia_pago || '').toLowerCase();
                
                let multiplicador = 1; 
                if (frecuencia.includes('semanal')) multiplicador = 7;
                else if (frecuencia.includes('quincenal')) multiplicador = 15;
                else if (frecuencia.includes('mensual')) multiplicador = 30;
                
                let fVencAbsoluto = new Date(fEmi.getFullYear(), fEmi.getMonth(), fEmi.getDate());
                fVencAbsoluto.setDate(fVencAbsoluto.getDate() + (numeroCuotas * multiplicador));

                let fechaVence; 
                const esDiario = frecuencia.includes('diario') || frecuencia.includes('diaria');
                const esMensualUnico = frecuencia.includes('mensual') && numeroCuotas === 1;

                if (esDiario || esMensualUnico) {
                    if (c.fecha_vencimiento_actual) {
                        const pts = c.fecha_vencimiento_actual.split('-');
                        fechaVence = new Date(pts[0], pts[1] - 1, pts[2]);
                    } else fechaVence = fVencAbsoluto;
                } else {
                    fechaVence = fVencAbsoluto;
                    if (c.fecha_vencimiento_actual) {
                        const pts = c.fecha_vencimiento_actual.split('-');
                        const fActual = new Date(pts[0], pts[1] - 1, pts[2]);
                        if (fActual > fVencAbsoluto) fechaVence = fActual;
                    }
                }
                
                const venceLimpiado = new Date(fechaVence.getFullYear(), fechaVence.getMonth(), fechaVence.getDate());
                const difTiempo = venceLimpiado.getTime() - hoySoloFecha.getTime();
                const difDias = Math.round(difTiempo / (1000 * 3600 * 24));
                
                const inicialN = c.clientes?.nombres ? c.clientes.nombres.charAt(0).toUpperCase() : '';
                const inicialA = c.clientes?.apellidos ? c.clientes.apellidos.charAt(0).toUpperCase() : '';
                const ultimos4 = c.clientes?.cedula ? c.clientes.cedula.slice(-4) : '0000';
                const numLocal = mapNumCreditoLocal[c.id] || 1;
                let creCif = typeof cifrarNumeroCredito === 'function' ? cifrarNumeroCredito(numLocal).toUpperCase() : '?';

                let emisionTxt = fEmi.toLocaleDateString('es-ES', opcionesFecha);
                let venceTxt = fechaVence.toLocaleDateString('es-ES', opcionesFecha);

                const baseData = {
                    idCredito: c.id,
                    refBancaria: `${inicialN}${inicialA}-${ultimos4}`,
                    etiquetaCRE: `CRE #${numLocal} [${creCif}]`,
                    nombre: `${c.clientes?.nombres} ${c.clientes?.apellidos}`.toUpperCase(),
                    capital: capitalPrestado, cuotas: numeroCuotas,
                    frecuenciaTxt: c.frecuencia_pago ? c.frecuencia_pago.toUpperCase() : 'DIARIO',
                    saldo: saldoPendiente, abonado: totalAbonado, mora: moraActual,
                    emisionTxt: emisionTxt.charAt(0).toUpperCase() + emisionTxt.slice(1),
                    venceTxt: venceTxt.charAt(0).toUpperCase() + venceTxt.slice(1),
                    diasAtraso: Math.abs(difDias),
                    perfil: c.clientes?.perfil_cobro || 'Normal',
                    cuotaFija: parseFloat(c.valor_cuota || 1)
                };

                // LÓGICA ALERTAS (9 vencidos)
                if (difDias < 0) alertasVencimiento.push(baseData);

                // LÓGICA RUTA DE COBRO (El Escudo Retroactivo - 19 Visitas)
                let entraRuta = false;
                if (!esDiario && c.estado !== 'congelado' && saldoPendiente > 0 && c.fecha_vencimiento_actual) {
                    const fVencRoute = new Date(c.fecha_vencimiento_actual + 'T00:00:00');
                    if (fVencRoute.getTime() <= hoySoloFecha.getTime()) {
                        let fEmiRoute = new Date(fEmi.getFullYear(), fEmi.getMonth(), fEmi.getDate());
                        const diasDesdeEmi = Math.floor((hoySoloFecha.getTime() - fEmiRoute.getTime()) / (1000 * 60 * 60 * 24));
                        
                        let cuotasEsperadas = 0;
                        if (frecuencia.includes('semanal')) cuotasEsperadas = Math.floor(diasDesdeEmi / 7);
                        else if (frecuencia.includes('quincenal')) cuotasEsperadas = Math.floor(diasDesdeEmi / 15);
                        else if (frecuencia.includes('mensual')) cuotasEsperadas = Math.floor(diasDesdeEmi / 30);
                        else cuotasEsperadas = Math.floor(diasDesdeEmi);
                        
                        const cuotasPagadas = Math.floor(totalAbonado / baseData.cuotaFija);
                        if (!(cuotasPagadas >= cuotasEsperadas && cuotasEsperadas > 0) && !(cuotasEsperadas === 0 && totalAbonado >= baseData.cuotaFija)) {
                            entraRuta = true;
                        }
                    }
                }

                if (entraRuta) {
                    let cuotasAcum = 1, diasAtrasoRuta = 0;
                    const fVencR = new Date(c.fecha_vencimiento_actual + 'T00:00:00');
                    if (fVencR.getTime() < hoySoloFecha.getTime()) {
                        diasAtrasoRuta = Math.floor((hoySoloFecha.getTime() - fVencR.getTime()) / (1000 * 60 * 60 * 24));
                        let cuotasPorT = 1;
                        if (frecuencia.includes('semanal')) cuotasPorT = Math.floor(diasAtrasoRuta / 7) + 1;
                        else if (frecuencia.includes('quincenal')) cuotasPorT = Math.floor(diasAtrasoRuta / 15) + 1;
                        else if (frecuencia.includes('mensual')) cuotasPorT = Math.floor(diasAtrasoRuta / 30) + 1;
                        cuotasAcum = Math.min(cuotasPorT, numeroCuotas) - Math.floor(totalAbonado / baseData.cuotaFija);
                        if (cuotasAcum < 1) cuotasAcum = 1;
                    }
                    let montoSug = baseData.cuotaFija * cuotasAcum;
                    if (montoSug > saldoPendiente) montoSug = saldoPendiente;
                    
                    let venceRutaStr = baseData.venceTxt;
if (c.fecha_vencimiento_actual) {
    const fVencExacta = new Date(c.fecha_vencimiento_actual + 'T12:00:00');
    const txtExacto = fVencExacta.toLocaleDateString('es-ES', opcionesFecha);
    venceRutaStr = txtExacto.charAt(0).toUpperCase() + txtExacto.slice(1);
}
rutaCobroDia.push({...baseData, montoSugerido: montoSug, cuotasAcumuladas: cuotasAcum, diasAtrasoRuta: diasAtrasoRuta, venceRutaTxt: venceRutaStr});
                }
            }
        });

        // 3. RENDERIZADO VISUAL
        const capitalEnLaCalle = deudaTotalEsperada - abonoGlobal;
        document.getElementById('monto-capital-calle').innerText = `$${capitalEnLaCalle.toFixed(2)}`;
        document.getElementById('num-cuentas-congeladas').innerText = cuentasCongeladas;
        document.getElementById('monto-ganancia-proyectada').innerText = `$${gananciaProyectada.toFixed(2)}`;
        document.getElementById('lbl-meta-hoy').innerText = `$${metaHoy.toFixed(2)}`;

        // RENDER RUTA DE COBRO (DISEÑO VIP DE ESCRITORIO)
        document.getElementById('contador-ruta').innerText = `${rutaCobroDia.length} Visita(s)`;
        if (rutaCobroDia.length > 0) {
            divRuta.innerHTML = rutaCobroDia.map(r => {
                let colorFondo = "#ffffff", colorBorde = "#10b981", alertaStr = "", deudaStr = "", txtCuota = `<span style="font-weight: 900; font-size: 16px; color: #047857;">$${r.montoSugerido.toFixed(2)}</span>`;
                if (r.diasAtrasoRuta > 0) {
                    colorFondo = "#fff1f2"; colorBorde = "#ef4444";
                    alertaStr = `<span style="color: #ef4444; background: #fee2e2; padding: 1px 4px; border-radius: 3px; font-size: 9px; font-weight: bold;">⚠️ ¡Atraso: ${r.diasAtrasoRuta} días!</span>`;
                    if (r.cuotasAcumuladas > 1) {
                        deudaStr = `<span style="color: #ef4444; font-size: 10px; display: block; font-weight: bold;">(Debe ${r.cuotasAcumuladas} cuotas juntas)</span>`;
                        txtCuota = `<span style="font-weight: 900; font-size: 16px; color: #ef4444;">$${r.montoSugerido.toFixed(2)}</span>`;
                    }
                }
               return `
                <div class="tarjeta-ruta-dia" style="border: 1px solid ${colorFondo}; background: #ffffff; border-radius: 8px; padding: 12px; border-left: 4px solid ${colorBorde}; box-shadow: 0 1px 3px rgba(0,0,0,0.05); flex: 0 0 90%;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <div>
                            <div style="font-weight: 900; font-size: 13px; color: #1e293b;">${r.nombre}</div>
                            <div style="font-size: 10px; color: ${colorBorde}; font-weight: bold; margin-top: 3px; display: flex; align-items: center; gap: 4px;">
                                <span style="text-transform: uppercase;">${r.frecuenciaTxt}</span> ${alertaStr}
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <span style="font-size: 10px; color: #64748b; display: block;">Sugerido:</span>
                            ${txtCuota} ${deudaStr}
                        </div>
                    </div>
                    <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 12px 10px; margin-bottom: 10px;">
                        <div style="margin-bottom: 10px;">
                            <span style="background: #e0f2fe; color: #0284c7; font-weight: bold; padding: 3px 6px; border-radius: 4px; border: 1px solid #bae6fd; font-size: 10px;">
                                🆔 REF: ${r.refBancaria} | CRÉDITO #${r.idCredito} | ${r.etiquetaCRE}
                            </span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                            <div>
                                <span style="color: #64748b; font-size: 9px; display: block; text-transform: uppercase;">Capital Prestado</span>
                                <span style="font-weight: bold; color: #1e293b; font-size: 12px;">$${r.capital.toFixed(2)}</span>
                                <span style="color: #64748b; font-size: 10px;">(${r.cuotas} cuotas)</span>
                            </div>
                            <div style="text-align: right;">
                                <span style="color: #64748b; font-size: 9px; display: block; text-transform: uppercase;">Saldo Deuda</span>
                                <span style="font-weight: bold; color: #b91c1c; font-size: 12px;">$${r.saldo.toFixed(2)}</span>
                            </div>
                        </div>
                       <div style="display: flex; justify-content: space-between; margin-bottom: 8px; align-items: center;">
                            <span style="color: #16a34a; font-size: 11px; font-weight: bold;">✅ Abonado: $${r.abonado.toFixed(2)}</span>
                            <span style="color: #ef4444; font-size: 11px; font-weight: bold;">🚨 Mora: $${r.mora.toFixed(2)}</span>
                        </div>
                        <div style="background: #f1f5f9; padding: 6px 10px; border-radius: 4px; font-size: 10px;">
                            <div style="margin-bottom: 4px;"><span style="color: #475569;">🗓️ <b>Emitido:</b> ${r.emisionTxt}</span></div>
                            <div><span style="color: #475569;">🚩 <b>Vencimiento:</b> <b style="color: #b91c1c;">${r.venceRutaTxt}</b></span></div>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: flex-end;">
                        <button onclick="irACobrarDesdeRuta('${r.idCredito}')" style="background: ${colorBorde}; color: white; border: none; padding: 6px 15px; border-radius: 6px; font-weight: bold; cursor: pointer;">
                            💰 Registrar Pago
                        </button>
                    </div>
                </div>`;
            }).join('');
        } else {
            divRuta.innerHTML = `<div style="text-align: center; padding: 20px; color: #10b981; font-size: 12px; font-weight: bold;">✅ Ruta completada.</div>`;
        }

        // RENDER ALERTAS (DISEÑO VIP DE ESCRITORIO)
        alertasVencimiento.sort((a, b) => b.diasAtraso - a.diasAtraso);
        document.getElementById('contador-alertas').innerText = `${alertasVencimiento.length} Vencido(s)`;
        
        if (alertasVencimiento.length > 0) {
            divAlertas.innerHTML = alertasVencimiento.map(a => `
               <div class="tarjeta-alerta-movil" style="background: white; border: 1px solid #e2e8f0; border-left: 5px solid #ef4444; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); flex: 0 0 90%;">
                    <div style="background: #f8fafc; padding: 10px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: #0f172a; font-size: 14px; display: block;">${a.nombre}</strong>
                            <span style="background: #e0f2fe; color: #0284c7; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">
                                🆔 REF: ${a.refBancaria} | CRÉDITO #${a.idCredito}
                            </span>
                        </div>
                        <div style="text-align: right;">
                            <span style="background: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 20px; font-weight: 900; font-size: 11px;">
                                HACE ${a.diasAtraso} DÍAS
                            </span>
                        </div>
                    </div>
                    <div style="padding: 12px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; background: #f1f5f9; padding: 10px; border-radius: 6px; border: 1px dashed #cbd5e1;">
                            <div>
                                <div style="color: #64748b; font-size: 10px; font-weight: bold;">Capital Prestado</div>
                                <div style="color: #0f172a; font-weight: 900; font-size: 13px;">$${a.capital.toFixed(2)}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="color: #64748b; font-size: 10px; font-weight: bold;">Saldo Actual</div>
                                <div style="color: #ea580c; font-weight: 900; font-size: 14px;">$${a.saldo.toFixed(2)}</div>
                            </div>
                            <div style="grid-column: span 2; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 6px;">
                                <span style="color: #16a34a; font-size: 11px; font-weight: bold;">✅ Abonado: $${a.abonado.toFixed(2)}</span>
                                <span style="color: #dc2626; font-size: 11px; font-weight: bold;">🚨 Mora: $${a.mora.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>`).join('');
        } else {
            divAlertas.innerHTML = `<div style="text-align: center; padding: 20px; color: #10b981; font-weight: bold;">✅ Cartera 100% al día.</div>`;
        }

    } catch (error) {
        console.error("Error:", error);
        divRuta.innerHTML = `<div style="text-align: center; padding: 20px; color: #ef4444; font-size: 12px;">❌ Error.</div>`;
        divAlertas.innerHTML = `<div style="text-align: center; padding: 20px; color: #ef4444; font-size: 12px;">❌ Error.</div>`;
    }
}
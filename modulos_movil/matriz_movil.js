// =========================================================
// ⚡ MOTOR MATRIZ GERENCIAL MÓVIL (V6 - CLON EXACTO DE PC)
// Archivo: modulos_movil/matriz_movil.js
// =========================================================

// 1. Filtro Visual para las Listas
function filtrarListaMovil(idContenedor, textoBusqueda) {
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;
    
    const tarjetas = contenedor.children;
    const busquedaUpper = textoBusqueda.toUpperCase().trim();
    
    for (let i = 0; i < tarjetas.length; i++) {
        const tarjeta = tarjetas[i];
        if (tarjeta.innerText.includes('⏳') || tarjeta.innerText.includes('✅')) continue;
        
        const textoTarjeta = tarjeta.innerText.toUpperCase();
        if (tarjeta.style) {
            tarjeta.style.display = textoTarjeta.includes(busquedaUpper) ? 'block' : 'none';
        }
    }
}

// 2. Cerebro Financiero: Conexión y Cálculo (LÓGICA IDÉNTICA A APP.JS)
async function cargarMatrizGlobalMovil() {
    console.log("Iniciando Matriz Gerencial (Cerebro Clonado de PC)...");
    
    document.getElementById('monto-caja-matriz').innerText = '...';
    document.getElementById('monto-capital-calle').innerText = '...';
    document.getElementById('num-cuentas-congeladas').innerText = '...';
    document.getElementById('monto-ganancia-proyectada').innerText = '...';
    document.getElementById('lbl-meta-hoy').innerText = '...';
    
    const divRuta = document.getElementById('lista-ruta-movil');
    const divAlertas = document.getElementById('lista-alertas-movil');

    try {
        const supa = window.supabaseClient;
        if (!supa) throw new Error("Supabase no encontrado.");

        const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const fechaHoy = new Date();
        const hoySoloFecha = new Date(fechaHoy.getFullYear(), fechaHoy.getMonth(), fechaHoy.getDate());

        // A. CAJA MATRIZ GLOBAL
        const { data: cajas } = await supa.from('cajas_capital').select('saldo_actual');
        let capitalTotalGeneral = 0;
        if (cajas && cajas.length > 0) {
            cajas.forEach(caja => capitalTotalGeneral += parseFloat(caja.saldo_actual || 0));
            document.getElementById('monto-caja-matriz').innerText = `$${capitalTotalGeneral.toFixed(2)}`;
        }

        // B. EXTRACCIÓN MASIVA
        const { data: historialTodos } = await supa.from('creditos').select('id, cliente_id').order('id', { ascending: true });
        const mapNumCreditoLocal = {};
        if (historialTodos) {
            const conteoPorCliente = {};
            historialTodos.forEach(c => {
                conteoPorCliente[c.cliente_id] = (conteoPorCliente[c.cliente_id] || 0) + 1;
                mapNumCreditoLocal[c.id] = conteoPorCliente[c.cliente_id];
            });
        }

        const { data: creditos } = await supa
            .from('creditos')
            .select('id, monto_capital, total_pagar, monto_mora, valor_cuota, total_interes, estado, fecha_emision, num_cuotas, frecuencia_pago, clientes(nombres, apellidos, cedula, perfil_cobro), historial_pagos(abono_total), fecha_vencimiento_actual')
            .in('estado', ['activo', 'congelado']);

        if (!creditos || creditos.length === 0) {
            throw new Error("No hay créditos activos.");
        }

        let gananciaProyectada = 0;
        let cuentasCongeladas = 0;
        let metaHoy = 0;
        let deudaTotalEsperada = 0;
        let abonoGlobal = 0; 
        let alertasVencimiento = [];
        let rutaCobroDia = [];

        creditos.forEach(c => {
            if (c.estado === 'congelado') cuentasCongeladas++;
            if (c.estado === 'activo') metaHoy += parseFloat(c.valor_cuota || 0);
            gananciaProyectada += parseFloat(c.total_interes || 0);
            
            const capitalPrestado = parseFloat(c.monto_capital || 0);
            const moraActual = parseFloat(c.monto_mora || 0);
            const deudaTotalReal = parseFloat(c.total_pagar || 0) + moraActual;
            deudaTotalEsperada += deudaTotalReal;

            const pagos = c.historial_pagos || [];
            const totalAbonado = pagos.reduce((sum, pago) => sum + (parseFloat(pago.abono_total) || 0), 0);
            abonoGlobal += totalAbonado;

            let saldoPendiente = deudaTotalReal - totalAbonado;
            if (saldoPendiente < 0) saldoPendiente = 0;

            if (c.estado === 'activo' || c.estado === 'congelado') {
                const fechaEmision = c.fecha_emision ? new Date(c.fecha_emision) : new Date();
                const numeroCuotas = parseInt(c.num_cuotas) || 30;
                const frecuencia = (c.frecuencia_pago || '').toLowerCase();
                
                let multiplicador = 1; 
                if (frecuencia.includes('semanal')) multiplicador = 7;
                else if (frecuencia.includes('quincenal')) multiplicador = 15;
                else if (frecuencia.includes('mensual')) multiplicador = 30;
                
                const diasTotalesCredito = numeroCuotas * multiplicador;
                let fechaVencimientoAbsoluto = new Date(fechaEmision.getFullYear(), fechaEmision.getMonth(), fechaEmision.getDate());
                fechaVencimientoAbsoluto.setDate(fechaVencimientoAbsoluto.getDate() + diasTotalesCredito);

                let fechaVence; 
                const esDiario = frecuencia.includes('diario') || frecuencia.includes('diaria');
                const esMensualUnico = frecuencia.includes('mensual') && numeroCuotas === 1;

                if (esDiario || esMensualUnico) {
                    if (c.fecha_vencimiento_actual) {
                        const partes = c.fecha_vencimiento_actual.split('-');
                        fechaVence = new Date(partes[0], partes[1] - 1, partes[2]);
                    } else {
                        fechaVence = fechaVencimientoAbsoluto;
                    }
                } else {
                    fechaVence = fechaVencimientoAbsoluto;
                    if (c.fecha_vencimiento_actual) {
                        const partes = c.fecha_vencimiento_actual.split('-');
                        const fActual = new Date(partes[0], partes[1] - 1, partes[2]);
                        if (fActual > fechaVencimientoAbsoluto) {
                            fechaVence = fActual;
                        }
                    }
                }
                
                const venceLimpiado = new Date(fechaVence.getFullYear(), fechaVence.getMonth(), fechaVence.getDate());
                const diferenciaTiempo = venceLimpiado.getTime() - hoySoloFecha.getTime();
                const diferenciaDias = Math.round(diferenciaTiempo / (1000 * 3600 * 24));
                
                const perfilCliente = c.clientes?.perfil_cobro || 'Normal';
                const inicialN = c.clientes?.nombres ? c.clientes.nombres.charAt(0).toUpperCase() : '';
                const inicialA = c.clientes?.apellidos ? c.clientes.apellidos.charAt(0).toUpperCase() : '';
                const ultimos4 = c.clientes?.cedula ? c.clientes.cedula.slice(-4) : '0000';
                const refBancaria = `${inicialN}${inicialA}-${ultimos4}`;

                const numLocal = mapNumCreditoLocal[c.id] || 1;
                let creCifrado = typeof cifrarNumeroCreditoMovil === 'function' ? cifrarNumeroCreditoMovil(numLocal).toUpperCase() : '?';
                let etiquetaCRE = creCifrado ? `CRE #${numLocal} [${creCifrado}]` : `CRE #${numLocal}`;

                let emisionTxt = fechaEmision.toLocaleDateString('es-ES', opcionesFecha);
                emisionTxt = emisionTxt.charAt(0).toUpperCase() + emisionTxt.slice(1);
                let venceTxt = fechaVence.toLocaleDateString('es-ES', opcionesFecha);
                venceTxt = venceTxt.charAt(0).toUpperCase() + venceTxt.slice(1);

                const dataCredito = {
                    idCredito: c.id,
                    refBancaria: refBancaria,
                    etiquetaCRE: etiquetaCRE,
                    nombre: `${c.clientes?.nombres} ${c.clientes?.apellidos}`.toUpperCase(),
                    capital: capitalPrestado,
                    cuotas: numeroCuotas,
                    frecuenciaTxt: c.frecuencia_pago ? c.frecuencia_pago.toUpperCase() : 'DIARIO',
                    saldo: saldoPendiente,
                    abonado: totalAbonado,
                    mora: moraActual,
                    emisionTxt: emisionTxt,
                    venceTxt: venceTxt,
                    diasAtraso: Math.abs(diferenciaDias),
                    esHoy: diferenciaDias === 0,
                    perfil: perfilCliente,
                    cuotaFija: parseFloat(c.valor_cuota || 1)
                };

                // LÓGICA RUTA DE COBRO MÓVIL (Ignoramos congelados para la ruta)
                if (c.estado !== 'congelado' && saldoPendiente > 0) {
                    if (diferenciaDias === 0) {
                        rutaCobroDia.push(dataCredito);
                    } else if (esDiario && diferenciaDias <= 0) {
                        rutaCobroDia.push(dataCredito);
                    }
                }

                // LÓGICA DE ALERTAS
                if (diferenciaDias < 0) {
                    alertasVencimiento.push(dataCredito);
                }
            }
        });
// ==========================================
        // C. RENDERIZADO FINAL EN PANTALLA MÓVIL
        // ==========================================
        const capitalEnLaCalle = deudaTotalEsperada - abonoGlobal;

        document.getElementById('monto-capital-calle').innerText = `$${capitalEnLaCalle.toFixed(2)}`;
        document.getElementById('num-cuentas-congeladas').innerText = cuentasCongeladas;
        document.getElementById('monto-ganancia-proyectada').innerText = `$${gananciaProyectada.toFixed(2)}`;
        document.getElementById('lbl-meta-hoy').innerText = `$${metaHoy.toFixed(2)}`;

        // ==========================================
        // RENDERIZADO: RUTA DE HOY (DISEÑO VIP)
        // ==========================================
        document.getElementById('contador-ruta').innerText = `${rutaCobroDia.length} Visita(s)`;
        if (rutaCobroDia.length > 0) {
            divRuta.innerHTML = rutaCobroDia.map(r => {
                const colorFondo = "#ffffff";
                const colorBorde = "#10b981";
                
                return `
                <div class="tarjeta-ruta-dia" style="border: 1px solid ${colorFondo}; background: #ffffff; border-radius: 8px; padding: 12px; margin-bottom: 10px; border-left: 4px solid ${colorBorde}; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <div>
                            <div style="font-weight: 900; font-size: 13px; color: #1e293b;">${r.nombre}</div>
                            <div style="font-size: 10px; color: ${colorBorde}; font-weight: bold; margin-top: 3px; display: flex; align-items: center; flex-wrap: wrap; gap: 4px;">
                                <span style="text-transform: uppercase;">${r.frecuenciaTxt}</span>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <span style="font-size: 10px; color: #64748b; display: block;">Sugerido:</span>
                            <span style="font-weight: 900; font-size: 16px; color: #047857;">$${r.cuotaFija.toFixed(2)}</span>
                        </div>
                    </div>

                    <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 12px 10px; margin-bottom: 10px; font-size: 11px; color: #334155;">
                        <div style="margin-bottom: 10px;">
                            <span style="background: #e0f2fe; color: #0284c7; font-weight: bold; padding: 3px 6px; border-radius: 4px; border: 1px solid #bae6fd; font-size: 10px;">
                                🆔 REF: ${r.refBancaria} | CRÉDITO #${r.idCredito} | ${r.etiquetaCRE}
                            </span>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; padding-left: 6px; padding-right: 6px;">
                            <div>
                                <span style="color: #64748b; font-size: 9px; display: block; text-transform: uppercase;">CAPITAL PRESTADO</span>
                                <span style="font-weight: bold; color: #1e293b; font-size: 12px;">$${r.capital.toFixed(2)}</span>
                                <span style="color: #64748b; font-size: 10px;">(${r.cuotas} cuotas 🗓️ ${r.frecuenciaTxt.toLowerCase()})</span>
                            </div>
                            <div style="text-align: right;">
                                <span style="color: #64748b; font-size: 9px; display: block; text-transform: uppercase;">SALDO DEUDA ACTUAL</span>
                                <span style="font-weight: bold; color: #b91c1c; font-size: 12px;">$${r.saldo.toFixed(2)}</span>
                            </div>
                        </div>

                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding-left: 6px; padding-right: 6px; align-items: center;">
                            <span style="color: #16a34a; font-size: 11px; font-weight: bold;">✅ Abonado: $${r.abonado.toFixed(2)}</span>
                            <span style="color: #ef4444; font-size: 11px; font-weight: bold;">🚨 Mora Acumulada: $${r.mora.toFixed(2)}</span>
                        </div>
                        
                        <div style="background: #f1f5f9; padding: 6px 10px; border-radius: 4px; font-size: 10px;">
                            <div style="margin-bottom: 4px;"><span style="color: #475569;">🗓️ <b>Emitido:</b> ${r.emisionTxt}</span></div>
                            <div><span style="color: #475569;">🚩 <b>Vencimiento:</b> <b style="color: #b91c1c;">${r.venceTxt}</b></span></div>
                        </div>
                    </div>
                    
                    <div style="display: flex; justify-content: flex-end;">
                        <button onclick="irACobrarDesdeRuta('${r.idCredito}')" style="background: ${colorBorde}; color: white; border: none; padding: 5px 15px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                            <span>💰</span> Registrar Pago
                        </button>
                    </div>
                </div>`;
            }).join('');
        } else {
            divRuta.innerHTML = `<div style="text-align: center; padding: 20px; color: #10b981; font-size: 12px; font-weight: bold;">✅ Ruta completada o vacía hoy.</div>`;
        }

        // ==========================================
        // RENDERIZADO: ALERTAS DE CARTERA (DISEÑO VIP)
        // ==========================================
        alertasVencimiento.sort((a, b) => b.diasAtraso - a.diasAtraso);
        document.getElementById('contador-alertas').innerText = `${alertasVencimiento.length} Vencido(s)`;
        
        if (alertasVencimiento.length > 0) {
            divAlertas.innerHTML = alertasVencimiento.map(a => {
                const colorBorde = '#ef4444';
                const titulo = `VENCIDO HACE ${a.diasAtraso} DÍAS`;
                const badgePerfil = a.perfil === 'Social' 
                    ? `<span style="background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; border: 1px solid #bbf7d0;">🛡️ SOCIAL (No Multar)</span>`
                    : `<span style="background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; border: 1px solid #fecaca;">⚠️ NORMAL (Aplica Mora)</span>`;

                return `
                <div class="tarjeta-alerta-movil" style="background: white; border: 1px solid #e2e8f0; border-left: 5px solid ${colorBorde}; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <div style="background: #f8fafc; padding: 10px 15px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: #0f172a; font-size: 14px; display: block; margin-bottom: 4px;">${a.nombre}</strong>
                            <span style="background: #e0f2fe; color: #0284c7; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; border: 1px solid #bae6fd;">
                                🆔 REF: ${a.refBancaria} | CRÉDITO #${a.idCredito} | ${a.etiquetaCRE}
                            </span>
                        </div>
                        <div style="text-align: right;">
                            <span style="background: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 20px; font-weight: 900; font-size: 11px; display: inline-block;">
                                ${titulo}
                            </span>
                        </div>
                    </div>
                    
                    <div style="padding: 12px 15px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; background: #f1f5f9; padding: 10px; border-radius: 6px; border: 1px dashed #cbd5e1;">
                            <div>
                                <div style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: bold;">Capital Prestado</div>
                                <div style="color: #0f172a; font-weight: 900; font-size: 13px;">$${a.capital.toFixed(2)} <span style="font-size:10px; font-weight:normal; color:#64748b;">(${a.cuotas} cuotas ${a.frecuenciaTxt.toLowerCase()})</span></div>
                            </div>
                            <div style="text-align: right;">
                                <div style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: bold;">Saldo Deuda Actual</div>
                                <div style="color: #ea580c; font-weight: 900; font-size: 14px;">$${a.saldo.toFixed(2)}</div>
                            </div>
                            <div style="grid-column: span 2; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 6px; margin-top: 2px;">
                                <span style="color: #16a34a; font-size: 11px; font-weight: bold;">✅ Abonado: $${a.abonado.toFixed(2)}</span>
                                <span style="color: #dc2626; font-size: 11px; font-weight: bold;">🚨 Mora Acumulada: $${a.mora.toFixed(2)}</span>
                            </div>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                            <div style="color: #475569; font-size: 11px; line-height: 1.6;">
                                <div style="display: flex; align-items: center; gap: 5px;">
                                    <span style="font-size: 14px;">📅</span> 
                                    <span>Emitido: <b style="color: #334155;">${a.emisionTxt}</b></span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 5px; margin-top: 4px;">
                                    <span style="font-size: 14px;">🚩</span> 
                                    <span>Vencimiento: <b style="color: #dc2626;">${a.venceTxt}</b></span>
                                </div>
                            </div>
                            
                            <button onclick="alert('Funciones de sanción estarán disponibles en la próxima actualización móvil.')" style="background: #0f172a; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-weight: bold; font-size: 11px; cursor: pointer;">
                                ⚙️ GESTIONAR
                            </button>
                        </div>
                    </div>

                    <div style="background: #f8fafc; padding: 8px 15px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #64748b; font-size: 10px; font-weight: bold;">10 días gracia • Regla: Mitad+1</span>
                        ${badgePerfil}
                    </div>
                </div>`;
            }).join('');
        } else {
            divAlertas.innerHTML = `<div style="text-align: center; padding: 20px; color: #10b981; font-size: 12px; font-weight: bold;">✅ Cartera 100% al día. ¡Excelente!</div>`;
        }

        console.log("Matriz Gerencial móvil sincronizada con diseño VIP.");

    } catch (error) {
        console.error("Error al cargar la Matriz:", error);
        divRuta.innerHTML = `<div style="text-align: center; padding: 20px; color: #ef4444; font-size: 12px;">❌ Error de conexión.</div>`;
        divAlertas.innerHTML = `<div style="text-align: center; padding: 20px; color: #ef4444; font-size: 12px;">❌ Error de conexión.</div>`;
    }
}
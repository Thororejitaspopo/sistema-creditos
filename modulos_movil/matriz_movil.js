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

        // RUTA DE HOY
        document.getElementById('contador-ruta').innerText = `${rutaCobroDia.length} Visita(s)`;
        if (rutaCobroDia.length > 0) {
            divRuta.innerHTML = rutaCobroDia.map(r => `
                <div style="background: white; border: 1px solid #10b981; border-radius: 8px; padding: 12px; margin-bottom: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <strong style="font-size: 13px; color: #047857;">${r.nombre}</strong>
                        <strong style="font-size: 14px; color: #1e293b;">$${r.cuotaFija.toFixed(2)}</strong>
                    </div>
                    <div style="font-size: 10px; color: #64748b; margin-bottom: 8px;">${r.etiquetaCRE} | ${r.frecuenciaTxt}</div>
                    <div style="display: flex; justify-content: space-between; border-top: 1px dashed #cbd5e1; padding-top: 6px;">
                        <span style="font-size: 11px; color: #475569;">Saldo: <b>$${r.saldo.toFixed(2)}</b></span>
                        <button onclick="irACobrarDesdeRuta('${r.idCredito}')" style="background: #10b981; color: white; border: none; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 10px;">Cobrar</button>
                    </div>
                </div>
            `).join('');
        } else {
            divRuta.innerHTML = `<div style="text-align: center; padding: 20px; color: #10b981; font-size: 12px; font-weight: bold;">✅ Ruta completada o vacía.</div>`;
        }

        // ALERTAS DE CARTERA
        alertasVencimiento.sort((a, b) => b.diasAtraso - a.diasAtraso);
        document.getElementById('contador-alertas').innerText = `${alertasVencimiento.length} Vencido(s)`;
        
        if (alertasVencimiento.length > 0) {
            divAlertas.innerHTML = alertasVencimiento.map(a => `
                <div class="tarjeta-alerta-movil" style="background: white; border: 1px solid #ef4444; border-left: 4px solid #ef4444; border-radius: 8px; padding: 12px; margin-bottom: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <strong style="font-size: 12px; color: #b91c1c;">${a.nombre}</strong>
                        <span style="font-size: 10px; font-weight: bold; color: #ef4444; background: #fee2e2; padding: 2px 6px; border-radius: 10px;">${a.diasAtraso} días</span>
                    </div>
                    <div style="font-size: 10px; color: #64748b; margin-bottom: 8px;">${a.etiquetaCRE} | Saldo: $${a.saldo.toFixed(2)}</div>
                    <div style="font-size: 9px; color: #94a3b8;">Venció: ${a.venceTxt}</div>
                </div>
            `).join('');
        } else {
            divAlertas.innerHTML = `<div style="text-align: center; padding: 20px; color: #10b981; font-size: 12px; font-weight: bold;">✅ Cartera 100% al día.</div>`;
        }

        console.log("Matriz Gerencial móvil sincronizada con éxito.");

    } catch (error) {
        console.error("Error al cargar la Matriz:", error);
        divRuta.innerHTML = `<div style="text-align: center; padding: 20px; color: #ef4444; font-size: 12px;">❌ Error de conexión.</div>`;
        divAlertas.innerHTML = `<div style="text-align: center; padding: 20px; color: #ef4444; font-size: 12px;">❌ Error de conexión.</div>`;
    }
}
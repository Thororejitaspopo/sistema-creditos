// =========================================================
// ⚡ MOTOR MATRIZ GERENCIAL MÓVIL
// Archivo: modulos_movil/matriz_movil.js
// =========================================================

// 1. Filtro Visual para las Listas (Ruta y Alertas)
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

// 2. Función Auxiliar para formatear fechas
function formatearFechaEcuador(fechaISO) {
    if (!fechaISO) return 'N/A';
    const f = new Date(fechaISO);
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${dias[f.getDay()]}, ${f.getDate()} de ${meses[f.getMonth()]} de ${f.getFullYear()}`;
}

// 3. Cerebro Financiero: Conexión y Cálculo
async function cargarMatrizGlobalMovil() {
    console.log("Iniciando carga de la Matriz Gerencial en el móvil...");
    
    // Indicadores visuales de carga
    document.getElementById('monto-caja-matriz').innerText = '...';
    document.getElementById('monto-capital-calle').innerText = '...';
    document.getElementById('num-cuentas-congeladas').innerText = '...';
    document.getElementById('monto-ganancia-proyectada').innerText = '...';
    document.getElementById('lbl-meta-hoy').innerText = '...';
    
    const divRuta = document.getElementById('lista-ruta-movil');
    const divAlertas = document.getElementById('lista-alertas-movil');
    const badgeRuta = document.getElementById('contador-ruta');
    const badgeAlertas = document.getElementById('contador-alertas');

    try {
        const supa = window.supabaseClient;
        if (!supa) throw new Error("Base de datos no inicializada.");

        // ==========================================
        // A. CÁLCULO DE CAJA MATRIZ (EFECTIVO)
        // ==========================================
        const { data: cajaEfectivo } = await supa.from('cajas_capital').select('saldo_actual').eq('tipo', 'efectivo').single();
        const saldoCaja = cajaEfectivo ? parseFloat(cajaEfectivo.saldo_actual || 0) : 0;
        document.getElementById('monto-caja-matriz').innerText = `$${saldoCaja.toFixed(2)}`;

        // ==========================================
        // B. EXTRACCIÓN MASIVA DE CRÉDITOS Y PAGOS
        // ==========================================
        const { data: creditosActivos } = await supa
            .from('creditos')
            .select(`
                id, cliente_id, monto_capital, total_pagar, monto_mora, tasa_interes, 
                fecha_emision, frecuencia_pago, valor_cuota, num_cuotas, estado, fecha_vencimiento_actual,
                clientes(nombres, apellidos, cedula)
            `)
            .in('estado', ['activo', 'congelado']);

        const { data: historialPagos } = await supa.from('historial_pagos').select('id_credito, abono_total, monto_interes, monto_capital, fecha_pago');
        
        let totalCapitalEnCalle = 0;
        let totalGananciaProyectada = 0;
        let cuentasCongeladasCount = 0;
        let metaCobroHoy = 0;
        
        let htmlRuta = '';
        let countRuta = 0;
        
        let htmlAlertas = '';
        let countAlertas = 0;

        const hoy = new Date();
        hoy.setHours(0,0,0,0);
        const esDomingo = hoy.getDay() === 0;

        if (creditosActivos && historialPagos) {
            
            // Agrupamos los pagos por crédito para hacer sumas rápidas
            const pagosPorCredito = {};
            historialPagos.forEach(p => {
                if (!pagosPorCredito[p.id_credito]) {
                    pagosPorCredito[p.id_credito] = { total: 0, capital: 0, interes: 0, ultFecha: null };
                }
                pagosPorCredito[p.id_credito].total += parseFloat(p.abono_total || 0);
                pagosPorCredito[p.id_credito].capital += parseFloat(p.monto_capital || 0);
                pagosPorCredito[p.id_credito].interes += parseFloat(p.monto_interes || 0);
                
                const fechaP = new Date(p.fecha_pago);
                if (!pagosPorCredito[p.id_credito].ultFecha || fechaP > pagosPorCredito[p.id_credito].ultFecha) {
                    pagosPorCredito[p.id_credito].ultFecha = fechaP;
                }
            });

            // Procesamos cada crédito individualmente
            for (const cred of creditosActivos) {
                const pagos = pagosPorCredito[cred.id] || { total: 0, capital: 0, interes: 0, ultFecha: null };
                
                // 1. Cálculos de saldos y métricas globales
                let saldoDeudaTotal = (parseFloat(cred.total_pagar) || 0) - pagos.total;
                if (saldoDeudaTotal < 0) saldoDeudaTotal = 0;
                
                const moraActual = parseFloat(cred.monto_mora) || 0;
                saldoDeudaTotal += moraActual;

                let capitalRestante = (parseFloat(cred.monto_capital) || 0) - pagos.capital;
                if (capitalRestante > 0) totalCapitalEnCalle += capitalRestante;

                const interesEsperado = (parseFloat(cred.total_pagar) || 0) - (parseFloat(cred.monto_capital) || 0);
                let interesRestante = interesEsperado - pagos.interes;
                if (interesRestante > 0) totalGananciaProyectada += interesRestante;

                if (cred.estado === 'congelado') cuentasCongeladasCount++;

                // 2. Lógica de Fechas y Vencimientos
                const nombreCliente = cred.clientes ? `${cred.clientes.nombres} ${cred.clientes.apellidos}`.toUpperCase() : 'SIN NOMBRE';
                const cedulaCliente = cred.clientes ? cred.clientes.cedula : 'N/A';
                const freq = (cred.frecuencia_pago || 'DIARIO').toUpperCase();
                const cuotaFija = parseFloat(cred.valor_cuota) || 1;
                
                let fechaVenc = new Date(cred.fecha_vencimiento_actual || cred.fecha_emision);
                fechaVenc.setHours(0,0,0,0);
                
                const diferenciaDias = Math.floor((hoy - fechaVenc) / (1000 * 60 * 60 * 24));
                
                // Lógica para detectar si cobró hoy
                let pagoHoy = false;
                if (pagos.ultFecha) {
                    const ultP = new Date(pagos.ultFecha);
                    ultP.setHours(0,0,0,0);
                    if (ultP.getTime() === hoy.getTime()) pagoHoy = true;
                }

                // ==========================================
                // CREACIÓN DE TARJETAS (RUTA Y ALERTAS)
                // ==========================================
                
                // Cifraremos rápido (como no tenemos todos los créditos aquí, usamos una versión simplificada o la cedula)
                const refVisual = `REF: ${cedulaCliente.slice(-4)} | CRÉDITO #${cred.id}`;
                
                const tarjetaHTML = `
                    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                            <div>
                                <div style="font-weight: 900; font-size: 13px; color: #1e293b;">${nombreCliente}</div>
                                <div style="font-size: 10px; color: #0284c7; font-weight: bold; background: #e0f2fe; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 4px;">
                                    ${refVisual}
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 10px; color: #64748b;">${freq}</div>
                                <div style="font-size: 15px; font-weight: 900; color: #047857;">$${cuotaFija.toFixed(2)}</div>
                            </div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; padding-top: 10px; border-top: 1px dashed #cbd5e1;">
                            <div style="color: #64748b;">Saldo: <span style="font-weight: bold; color: #1e293b;">$${saldoDeudaTotal.toFixed(2)}</span></div>
                            ${moraActual > 0 ? `<div style="color: #ef4444; font-weight: bold;">Mora: $${moraActual.toFixed(2)}</div>` : ''}
                        </div>
                    </div>
                `;

                // CLASIFICACIÓN DE ALERTAS (Vencidos)
                if (diferenciaDias > 0) {
                    htmlAlertas += tarjetaHTML;
                    countAlertas++;
                    metaCobroHoy += cuotaFija; // El vencido suma a la meta
                } 
                // CLASIFICACIÓN DE RUTA DE HOY
                else if (diferenciaDias === 0 && !pagoHoy && !esDomingo) {
                    htmlRuta += tarjetaHTML;
                    countRuta++;
                    metaCobroHoy += cuotaFija;
                }
                else if (freq === 'DIARIO' && !pagoHoy && !esDomingo && diferenciaDias <= 0) {
                    // Los diarios siempre entran si no han pagado hoy
                    htmlRuta += tarjetaHTML;
                    countRuta++;
                    metaCobroHoy += cuotaFija;
                }
            }
        }

        // ==========================================
        // C. RENDERIZADO FINAL EN PANTALLA
        // ==========================================
        document.getElementById('monto-capital-calle').innerText = `$${totalCapitalEnCalle.toFixed(2)}`;
        document.getElementById('num-cuentas-congeladas').innerText = cuentasCongeladasCount;
        document.getElementById('monto-ganancia-proyectada').innerText = `$${totalGananciaProyectada.toFixed(2)}`;
        document.getElementById('lbl-meta-hoy').innerText = `$${metaCobroHoy.toFixed(2)}`;

        badgeRuta.innerText = `${countRuta} Visita(s)`;
        if (countRuta > 0) {
            divRuta.innerHTML = htmlRuta;
        } else {
            divRuta.innerHTML = `<div style="text-align: center; padding: 20px; color: #10b981; font-weight: bold; font-size: 13px;">✅ Ruta completada o vacía hoy.</div>`;
        }

        badgeAlertas.innerText = `${countAlertas} Vencido(s)`;
        if (countAlertas > 0) {
            divAlertas.innerHTML = htmlAlertas;
        } else {
            divAlertas.innerHTML = `<div style="text-align: center; padding: 20px; color: #10b981; font-weight: bold; font-size: 13px;">✅ Cartera 100% al día. ¡Excelente!</div>`;
        }

        console.log("Matriz Gerencial móvil cargada exitosamente.");

    } catch (error) {
        console.error("Error al cargar la Matriz:", error);
        divRuta.innerHTML = `<div style="text-align: center; padding: 20px; color: #ef4444; font-size: 13px;">❌ Error de conexión.</div>`;
        divAlertas.innerHTML = `<div style="text-align: center; padding: 20px; color: #ef4444; font-size: 13px;">❌ Error de conexión.</div>`;
    }
}
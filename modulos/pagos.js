// aqui empieza el modulo registrar pago 

// aqui termina el modulo registrar pago

// =========================================================================
// 🌟 SISTEMA DE PAGINACIÓN DE ABONOS (VARIABLES GLOBALES)
// =========================================================================
let abonosClienteActual = []; // Memoria temporal para los abonos del cliente
let paginaActualAbonos = 1;
const ABONOS_POR_PAGINA = 4;  // Límite exacto de abonos que pediste


// =========================================================================
// 🌐 RECAUDACIÓN AVANZADA: VARIABLES DE CONTROL GLOBAL
// =========================================================================
let creditoSeleccionadoCobro = null;
let interesYaPagado = 0;
let interesTotalPactado = 0;

// =========================================================================
// 📍 MOTOR DE FILTRADO DE CLIENTES POR SECTOR
// =========================================================================
async function cargarDropdownClientes() {
    const sectorSeleccionado = document.getElementById('filtro-sector-recaudacion').value;
    const dropdown = document.getElementById('selector-cliente-recaudacion');
    
    dropdown.innerHTML = '<option value="">⏳ Buscando clientes en ruta...</option>';

    try {
        const { data: creditos, error } = await supabaseClient
            .from('creditos')
            .select(`id, clientes (nombres, apellidos, cedula, sector)`)
            .eq('estado', 'activo');

        if (error) throw error;

        let clientesUnicos = new Map();

        creditos.forEach(c => {
            const cli = c.clientes || {};
            const sectorCliente = cli.sector || ''; 

            if (!sectorSeleccionado || sectorCliente.includes(sectorSeleccionado)) {
                const nombreCompleto = `${cli.nombres || ''} ${cli.apellidos || ''}`.trim().toUpperCase();
                const cedula = cli.cedula || 'S/N';
                
                if (!clientesUnicos.has(cedula)) {
                    clientesUnicos.set(cedula, { nombre: nombreCompleto, cedula: cedula });
                }
            }
        });

        dropdown.innerHTML = '<option value="">-- Seleccione un cliente --</option>';
        
        if (clientesUnicos.size === 0) {
            dropdown.innerHTML = '<option value="">🚫 No hay clientes activos en este sector</option>';
            return;
        }

        const clientesArray = Array.from(clientesUnicos.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));

        clientesArray.forEach(cli => {
            const option = document.createElement('option');
            option.value = cli.cedula; 
            option.text = `${cli.nombre} (${cli.cedula})`;
            dropdown.appendChild(option);
        });

    } catch (err) {
        console.error("Error al cargar clientes:", err);
        dropdown.innerHTML = '<option value="">⚠️ Error al cargar datos</option>';
    }
}

// Carga automática inicial del Dropdown al abrir la página
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const dropSector = document.getElementById('filtro-sector-recaudacion');
        if(dropSector) cargarDropdownClientes();
    }, 1000);
});

// =========================================================================
// 🔎 BUSCADOR INTELIGENTE POR MENÚ DESPLEGABLE (CON ETIQUETAS DE ACCIÓN V5)
// =========================================================================
let listaCreditosActivosCliente = [];

async function buscarCreditoParaCobro() {
    const busqueda = document.getElementById('selector-cliente-recaudacion').value.trim();
    
    if (!busqueda) {
        alert("Por favor, selecciona un cliente de la lista.");
        return;
    }

    try {
        const { data: creditos, error } = await supabaseClient
            .from('creditos')
            // 🔥 AQUÍ ESTÁ LA MAGIA: Agregamos "fecha_vencimiento_actual" para que el empujón funcione
            .select(`id, monto_capital, total_pagar, monto_mora, valor_cuota, frecuencia_pago, estado, fecha_emision, fecha_vencimiento_actual, cliente_id, num_cuotas, clientes (nombres, apellidos, cedula)`)
            .in('estado', ['activo', 'congelado']); 

        if (error) throw error;

        // Filtramos para quedarnos solo con los créditos del cliente seleccionado
        const creditosDelCliente = creditos.filter(c => {
            const cli = c.clientes || {};
            return (cli.cedula || '').trim() === busqueda;
        });

        if (creditosDelCliente.length === 0) {
            alert("🔍 No se encontró ningún crédito ACTIVO o CONGELADO para este cliente.");
            return;
        }

        // TRAMOS EL HISTORIAL COMPLETO PARA SABER QUÉ NÚMERO DE CRÉDITO ES CADA UNO
        const idDelCliente = creditosDelCliente[0].cliente_id;
        const { data: todosCreditosCliente } = await supabaseClient
            .from('creditos')
            .select('id')
            .eq('cliente_id', idDelCliente)
            .order('id', { ascending: true });

        // Traemos los pagos para restar lo que ya abonó
        const idsActivos = creditosDelCliente.map(c => c.id);
        const { data: pagosCliente } = await supabaseClient
            .from('historial_pagos')
            .select('id_credito, abono_total')
            .in('id_credito', idsActivos);

        // 🔥 NUEVO: Traemos la memoria de sanciones y perdones para poner las etiquetas 🔥
        const { data: morasCliente } = await supabaseClient
            .from('historial_moras')
            .select('credito_id, tipo_accion')
            .in('credito_id', idsActivos)
            .order('id', { ascending: true });

        listaCreditosActivosCliente = creditosDelCliente;

        // EVALUACIÓN DE RUTAS: 1 crédito vs Múltiples créditos
        if (creditosDelCliente.length === 1) {
            await cargarEstadoCuentaCredito(creditosDelCliente[0].id);
        } else {
            const selectMulti = document.getElementById('selector-multicredito');
            selectMulti.innerHTML = '<option value="">-- Seleccione el crédito --</option>';
            
            creditosDelCliente.forEach(c => {
                const f = new Date(c.fecha_emision);
                const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
                const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                const fechaTxt = `${dias[f.getDay()]} ${f.getDate()}/${meses[f.getMonth()]}/${f.getFullYear()}`;
                
                let numeroCredito = 1;
                if (todosCreditosCliente) {
                    const index = todosCreditosCliente.findIndex(tc => tc.id === c.id);
                    if (index !== -1) numeroCredito = index + 1;
                }
                const codigoCifrado = typeof cifrarNumeroCredito === 'function' ? cifrarNumeroCredito(numeroCredito).toUpperCase() : '?';

                const cli = c.clientes || {};
                
               // =========================================================
                // 🔥 CÁLCULO DEL SALDO NETO REAL PARA LA LISTA DESPLEGABLE
                // =========================================================
                const moraCredito = parseFloat(c.monto_mora) || 0;
                let totalPagadoHastaHoy = 0;
                
                if (pagosCliente) {
                    pagosCliente.forEach(p => {
                        if (p.id_credito === c.id) {
                            totalPagadoHastaHoy += parseFloat(p.abono_total || 0);
                        }
                    });
                }
                
                // Calculamos el saldo vivo (Total a pagar original - Todo lo que ha pagado)
                let saldoNeto = (parseFloat(c.total_pagar) || 0) - totalPagadoHastaHoy;
                if (saldoNeto < 0) saldoNeto = 0; // Para que no salgan saldos negativos si pagó de más

                const deudaTotalConMora = saldoNeto + moraCredito;
                
                let textoMoraExtra = "";
                if (moraCredito > 0) {
                    textoMoraExtra = ` | 🚨 Mora $${moraCredito.toFixed(0)} | 👉 Deuda Total: $${deudaTotalConMora.toFixed(2)}`;
                }
                
                // Formateamos el texto que se verá en la lista
                const prestamo = `Saldo: $${saldoNeto.toFixed(2)}`;

                // 🔥 MAGIA DE ETIQUETAS: Detectar Botón Morado o Verde 🔥
                let etiquetaAccion = "";
                if (morasCliente) {
                    const morasEsteCredito = morasCliente.filter(m => m.credito_id === c.id);
                    if (morasEsteCredito.length > 0) {
                        const ultimaAccion = morasEsteCredito[morasEsteCredito.length - 1].tipo_accion || '';
                        
                        if (ultimaAccion.includes('Refinanciamiento') || ultimaAccion.includes('Renovación')) {
                            etiquetaAccion = " | 🔄 RENOVADO";
                        } else if (ultimaAccion.includes('Perdón')) {
                            etiquetaAccion = " | 🛡️ PERDONADO";
                        }
                    }
                }
                
                const alertaCongelado = c.estado === 'congelado' ? ' [🧊 CONGELADO]' : '';
                
                // Formateamos la fecha en versión corta (ej: 18/oct/2026)
                const fMesCorto = meses[f.getMonth()].substring(0, 3);
                const fechaTxtCorta = `${f.getDate()}/${fMesCorto}/${f.getFullYear()}`;
                
               // Formateamos el dinero
const totalOriginal = parseFloat(c.total_pagar || 0).toFixed(2);
const infoDinero = `Total: $${totalOriginal} ➡️ Saldo: $${saldoNeto.toFixed(2)}`;
                
// --- FORMATO GERENCIAL [CRIPTO][FRECUENCIA][CUOTA][PAGOS] ---
let letraF = '-';
let fP = (c.frecuencia_pago || '').toUpperCase();
if (fP.includes('DIARIO')) letraF = 'D';
else if (fP.includes('SEMANAL')) letraF = 'S';
else if (fP.includes('QUINCENAL')) letraF = 'Q';
else if (fP.includes('MENSUAL')) letraF = 'M';

let valorC = c.valor_cuota ? parseFloat(c.valor_cuota).toFixed(2) : '0.00';
if (valorC.endsWith('.00')) valorC = parseInt(valorC);

// Calculamos las cuotas pagadas para la "P"
let cuotasPendientesVisual = Math.ceil(saldoNeto / parseFloat(c.valor_cuota || 1));
let cuotasOriginalesVisual = parseInt(c.num_cuotas) || 1;
let pagadasVisual = cuotasOriginalesVisual - cuotasPendientesVisual;
if (pagadasVisual < 0) pagadasVisual = 0;
// ------------------------------------------------------------

// 🔥 NUEVA VERSIÓN: [R][D][C3][P20]
const codigosVisuales = `[${codigoCifrado}][${letraF}][C${valorC}][P${pagadasVisual}]`;

const textoOpcion = `CRÉDITO #${c.id} | CRE #${numeroCredito} ${codigosVisuales} | Emitido: ${fechaTxtCorta} | ${infoDinero}${textoMoraExtra}${etiquetaAccion}${alertaCongelado}`;
selectMulti.innerHTML += `<option value="${c.id}">${textoOpcion}</option>`;
});

document.getElementById('recaudacion-espera-msg').style.display = 'none';
document.getElementById('panel-recaudacion-activo').style.display = 'none';
document.getElementById('contenedor-multicredito').style.display = 'block';
}

} catch (err) {
    alert("Error al buscar créditos: " + err.message);
}
}

// =========================================================================
// 🎯 CARGADOR DE ESTADO DE CUENTA Y GENERADOR DE HISTORIAL (ALPHA V5 - MULTI MESES)
// =========================================================================
async function cargarEstadoCuentaCredito(idCredito) {
    if (!idCredito) return;
    
    if (listaCreditosActivosCliente && listaCreditosActivosCliente.length > 1) {
        document.getElementById('contenedor-multicredito').style.display = 'block';
    } else {
        document.getElementById('contenedor-multicredito').style.display = 'none';
    }
    
    const encontrado = listaCreditosActivosCliente.find(c => c.id == idCredito);
    if (!encontrado) return;

    creditoSeleccionadoCobro = encontrado;
    let totalPagadoHastaHoy = 0;
    interesYaPagado = 0;
    
    abonosClienteActual = [];
    paginaActualAbonos = 1;

    let ultimaAccion = ""; 

    try {
        const { data: pagosPrevios, errorPagos } = await supabaseClient
            .from('historial_pagos')
            .select('*')
            .eq('id_credito', encontrado.id)
            .order('fecha_pago', { ascending: false });

        if (!errorPagos && pagosPrevios && pagosPrevios.length > 0) {
            pagosPrevios.forEach(p => {
                totalPagadoHastaHoy += parseFloat(p.abono_total || 0);
                interesYaPagado += parseFloat(p.monto_interes || 0);
            });
            abonosClienteActual = pagosPrevios;
        } else {
            abonosClienteActual = [];
        }

        const { data: moras } = await supabaseClient.from('historial_moras').select('tipo_accion').eq('credito_id', encontrado.id).order('id', { ascending: true });
        if (moras && moras.length > 0) {
            ultimaAccion = moras[moras.length - 1].tipo_accion || '';
        }

    } catch (e) {
        abonosClienteActual = [];
    }

    interesTotalPactado = parseFloat(encontrado.total_pagar) - parseFloat(encontrado.monto_capital);
    const saldoRestanteNeto = parseFloat(encontrado.total_pagar) - totalPagadoHastaHoy;
    creditoSeleccionadoCobro.saldoNeto = saldoRestanteNeto;

    const cli = encontrado.clientes || {};
    const iN = (cli.nombres || '').trim().charAt(0);
    const iA = (cli.apellidos || '').trim().charAt(0);
    const u4 = (cli.cedula || '').trim().slice(-4);
    const refFinal = `${iN}${iA}-${u4}`.toUpperCase();

    // 🔥 FORMATO VIP DE FECHA Y HORA DE EMISIÓN
    let fechaEmisionStr = 'N/A';
    if(encontrado.fecha_emision) {
        // Pasamos la fecha con todo y hora al motor (igual que en los recibos)
        let fEmi = new Date(encontrado.fecha_emision);
        
        // Truco de seguridad por si Supabase manda un formato extraño
        if (isNaN(fEmi.getTime()) && typeof encontrado.fecha_emision === 'string') {
            fEmi = new Date(encontrado.fecha_emision.replace(/-/g, '/').replace('T', ' ').split('.')[0]);
        }

        if (!isNaN(fEmi.getTime())) {
            const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
            const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            
            let horasEmi = fEmi.getHours();
            let minutosEmi = String(fEmi.getMinutes()).padStart(2, '0');
            let segundosEmi = String(fEmi.getSeconds()).padStart(2, '0');
            const ampmEmi = horasEmi >= 12 ? 'p. m.' : 'a. m.';
            horasEmi = horasEmi % 12; horasEmi = horasEmi ? horasEmi : 12;
            horasEmi = String(horasEmi).padStart(2, '0');

            fechaEmisionStr = `${dias[fEmi.getDay()]}, ${fEmi.getDate()}/${meses[fEmi.getMonth()]}/${fEmi.getFullYear()} | ${horasEmi}:${minutosEmi}:${segundosEmi} ${ampmEmi}`;
        }
    }

    let numCre = '?';
    let textoAcuerdo = ''; 
    let nuevaCuotaAcuerdo = null;
    let nuevaFrecuenciaAcuerdo = null;

    try {
        const { data: credFull } = await supabaseClient.from('creditos').select('*').eq('id', encontrado.id).single();
            
        if (credFull) {
            textoAcuerdo = credFull.acuerdo_pago || ''; 
            
            if (encontrado.estado === 'congelado' && textoAcuerdo.trim() !== '') {
                const acuerdoLower = textoAcuerdo.toLowerCase();
                const matchMonto = textoAcuerdo.match(/\$?\s*(\d+(\.\d{1,2})?)/);
                if (matchMonto) nuevaCuotaAcuerdo = parseFloat(matchMonto[1]);

                if (acuerdoLower.includes('diario') || acuerdoLower.includes('al dia')) nuevaFrecuenciaAcuerdo = 'DIARIO';
                else if (acuerdoLower.includes('semanal') || acuerdoLower.includes('por semana')) nuevaFrecuenciaAcuerdo = 'SEMANAL';
                else if (acuerdoLower.includes('quincenal') || acuerdoLower.includes('cada 15')) nuevaFrecuenciaAcuerdo = 'QUINCENAL';
                else if (acuerdoLower.includes('mensual') || acuerdoLower.includes('al mes')) nuevaFrecuenciaAcuerdo = 'MENSUAL';
            }
            
            if (credFull.numero_credito) {
                numCre = credFull.numero_credito;
            } else if (credFull.cliente_id) {
                const { data: historialCli } = await supabaseClient.from('creditos').select('id').eq('cliente_id', credFull.cliente_id).order('id', { ascending: true });
                if (historialCli) {
                    const pos = historialCli.findIndex(c => c.id == encontrado.id);
                    if (pos !== -1) numCre = pos + 1;
                }
            }
        }
    } catch (errorCRE) {}

    const codigoCifrado = typeof cifrarNumeroCredito === 'function' ? cifrarNumeroCredito(numCre).toUpperCase() : '?';

    document.getElementById('lbl-recaudacion-ref').innerHTML = `REF: ${refFinal} | CRÉDITO #${encontrado.id} | CRE #${numCre} [${codigoCifrado}] &nbsp;&nbsp;|&nbsp;&nbsp; 📅 <span style="background:#fff; padding: 2px 6px; border-radius: 4px; border: 1px dashed #cbd5e1; font-weight: bold; color: #475569; font-size: 10px; display: inline-block; transform: translateY(-1px);">${fechaEmisionStr}</span>`;  
    document.getElementById('lbl-recaudacion-cliente').innerText = `${cli.nombres} ${cli.apellidos}`.toUpperCase();
    document.getElementById('lbl-recaudacion-cedula').innerText = `Cédula: ${cli.cedula || 'N/A'}`;
    
    const contenedorBanderas = document.getElementById('contenedor-banderas-recaudacion'); 
    if (!contenedorBanderas) {
        const lblRef = document.getElementById('lbl-recaudacion-ref');
        const divBanderas = document.createElement('div');
        divBanderas.id = 'contenedor-banderas-recaudacion';
        divBanderas.style.marginBottom = '15px';
        lblRef.parentNode.insertBefore(divBanderas, lblRef.nextSibling); 
    }
    
    const cajaBanderas = document.getElementById('contenedor-banderas-recaudacion');
    if (encontrado.estado === 'congelado' && textoAcuerdo.trim() !== '') {
        cajaBanderas.innerHTML = `<div style="background: linear-gradient(135deg, #fef08a 0%, #fde047 100%); border: 1px solid #eab308; border-left: 6px solid #ca8a04; border-radius: 8px; padding: 12px 15px; margin-top: 10px;"><div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;"><span style="font-size: 18px;">🤝</span><span style="color: #854d0e; font-weight: 900; font-size: 14px; text-transform: uppercase;">Acuerdo de Refinanciamiento Activo</span></div><div style="color: #422006; font-size: 14px; font-weight: bold; padding-left: 26px;">"${textoAcuerdo}"</div></div>`;
    } else if (encontrado.estado === 'congelado' && textoAcuerdo.trim() === '') {
         cajaBanderas.innerHTML = `<div style="background: #e0f2fe; border: 1px solid #bae6fd; border-left: 6px solid #0284c7; border-radius: 8px; padding: 10px 15px; margin-top: 10px;"><div style="display: flex; align-items: center; gap: 8px;"><span style="font-size: 16px;">🧊</span><span style="color: #0369a1; font-weight: 800; font-size: 13px;">Cuenta Protegida (Sin acuerdo escrito)</span></div></div>`;
    } else {
        cajaBanderas.innerHTML = ''; 
    }

    const moraGuardada = parseFloat(encontrado.monto_mora) || 0;
    const saldoFinalMora = saldoRestanteNeto + moraGuardada;

    const frecuenciaBruta = (encontrado.frecuencia_pago || 'DIARIO').toUpperCase();
    const frecuenciaFinal = nuevaFrecuenciaAcuerdo !== null ? nuevaFrecuenciaAcuerdo : frecuenciaBruta.replace('📅', '').trim();
    
    // 🔥 LA CURA MULTI-MESES: Identificamos cuántas cuotas tiene realmente el crédito
    const numeroCuotasOriginales = parseInt(encontrado.num_cuotas) || 1;
   const cuotaPuraCalculada = parseFloat(encontrado.valor_cuota) || (parseFloat(encontrado.total_pagar) / numeroCuotasOriginales);
    
    let cuotaFinal = nuevaCuotaAcuerdo !== null ? nuevaCuotaAcuerdo : cuotaPuraCalculada;

    // 🔥 SOLO suma todo de golpe si es MENSUAL y de 1 SOLA CUOTA. Si son 11 cuotas, respeta la división ($200)
    if (frecuenciaFinal.includes('MENSUAL') && numeroCuotasOriginales === 1) {
        cuotaFinal = saldoFinalMora;
    }

    document.getElementById('lbl-recaudacion-cuota').innerText = `$${cuotaFinal.toFixed(2)}`;
    document.getElementById('lbl-recaudacion-frecuencia').innerText = frecuenciaFinal;
    
    if (nuevaCuotaAcuerdo !== null) {
        document.getElementById('lbl-recaudacion-cuota').innerHTML = `<span style="color: #ca8a04; background: #fef08a; padding: 2px 5px; border-radius: 4px;">$${cuotaFinal.toFixed(2)}</span>`;
        document.getElementById('lbl-recaudacion-frecuencia').innerHTML = `<span style="color: #ca8a04;">${frecuenciaFinal}</span>`;
    }
    
    const elCuotas = document.getElementById('lbl-recaudacion-num-cuotas');
if (elCuotas) {
    const valorDeCuota = cuotaFinal || 1; 
    let cuotasPendientes = Math.ceil(saldoRestanteNeto / valorDeCuota);
    if (cuotasPendientes < 0) cuotasPendientes = 0; 

    // 🔥 AUDITORÍA: Cálculo exacto de cuotas pagadas
    let cuotasPagadas = numeroCuotasOriginales - cuotasPendientes;
    if (cuotasPagadas < 0) cuotasPagadas = 0; // Seguro contra negativos
    
    const textoCuotasTotales = nuevaCuotaAcuerdo !== null ? '<span title="Modificado por convenio">N/A</span>' : numeroCuotasOriginales;
    
    // 🔥 VERSIÓN VIP: Etiqueta Verde de Pagadas + Etiqueta Roja de Pendientes
    elCuotas.innerHTML = `${textoCuotasTotales} &nbsp; ` +
        `<span style="color: #15803d; font-size: 11px; font-weight: bold; background: #dcfce7; padding: 2px 6px; border-radius: 4px; margin-right: 5px;">(✔️ ${cuotasPagadas} Pagadas)</span>` +
        `<span style="color: #ef4444; font-size: 11px; font-weight: bold; background: #fee2e2; padding: 2px 6px; border-radius: 4px;">(${cuotasPendientes} Pendientes)</span>`;
}
    
    let htmlSaldoNeto = `<div style="display: flex; flex-direction: column; align-items: flex-end; line-height: 1.2;">
        <span style="font-size: 18px; font-weight: 900; color: #dc2626;">$${saldoFinalMora.toFixed(2)}</span>`;
    
    if (moraGuardada > 0) {
        htmlSaldoNeto += `<span style="font-size: 11px; font-weight: normal; color: #64748b;">(Incluye $${moraGuardada.toFixed(2)} de mora)</span>`;
    } else if (ultimaAccion.includes('Refinanciamiento') || ultimaAccion.includes('Renovación')) {
        htmlSaldoNeto += `<span style="font-size: 11px; font-weight: bold; color: #8b5cf6;">(Capital Refinanciado)</span>`;
    }
    htmlSaldoNeto += `</div>`;
    
    const totalVisual = parseFloat(encontrado.valor_cuota) * numeroCuotasOriginales;
    document.getElementById('lbl-recaudacion-total').innerText = `$${totalVisual.toFixed(2)}`;
    
    document.getElementById('lbl-recaudacion-saldo').innerHTML = htmlSaldoNeto;

    let cajonSugerido = cuotaFinal;
    // Sugiere todo de golpe SÓLO si es mensual de 1 sola cuota
    if (frecuenciaFinal.includes('MENSUAL') && numeroCuotasOriginales === 1) {
        cajonSugerido = saldoFinalMora;
    }
    
    document.getElementById('monto-cobro-input').value = cajonSugerido.toFixed(2);
    
    if (typeof simularEnrutamientoFlujo === 'function') {
        simularEnrutamientoFlujo(cajonSugerido); 
    }

    document.getElementById('recaudacion-espera-msg').style.display = 'none';
    document.getElementById('panel-recaudacion-activo').style.display = 'block';

    renderizarAbonosPaginados();
}

window.seleccionarCreditoEspecifico = cargarEstadoCuentaCredito;



// =========================================================================
// 🎨 FUNCIONES AUXILIARES: DIBUJAR LISTA DE ABONOS Y BOTONES (NIVEL PREMIUM)
// =========================================================================
function renderizarAbonosPaginados() {
    const contenedor = document.getElementById('lista-historial-abonos');
    if (!contenedor) return;

    if (abonosClienteActual.length === 0) {
        contenedor.innerHTML = `
            <div style="text-align: center; color: #94a3b8; padding: 30px 10px; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;">
                <span style="font-size: 30px; display: block; margin-bottom: 10px;">📉</span>
                <p style="margin: 0; font-size: 13px;">No hay abonos registrados en este crédito aún.</p>
            </div>`;
        return;
    }

    const inicio = (paginaActualAbonos - 1) * ABONOS_POR_PAGINA;
    const fin = inicio + ABONOS_POR_PAGINA;
    const abonosPagina = abonosClienteActual.slice(inicio, fin);
    const totalPaginas = Math.ceil(abonosClienteActual.length / ABONOS_POR_PAGINA);
    const totalAbonos = abonosClienteActual.length;

    // 🔥 EXTRAER REF Y CRE (Para el nuevo encabezado premium)
    const cli = creditoSeleccionadoCobro.clientes || {};
    const iN = (cli.nombres || '').trim().charAt(0);
    const iA = (cli.apellidos || '').trim().charAt(0);
    const u4 = (cli.cedula || '').trim().slice(-4);
    const refFinal = `${iN}${iA}-${u4}`.toUpperCase();
    
    // Capturamos el CRE directamente de la etiqueta principal para que sea idéntico
    let creText = "CRE # ?";
    const lblRef = document.getElementById('lbl-recaudacion-ref');
    if (lblRef && lblRef.innerText) {
        const match = lblRef.innerText.match(/CRE\s*#[^|]+/);
        if (match) creText = match[0].trim();
    }

    let htmlHistorial = '';

    abonosPagina.forEach((p, index) => {
        const indiceGlobal = inicio + index;
        const numeroPago = totalAbonos - indiceGlobal;

        const fPago = new Date(p.fecha_pago);
        const ahora = new Date().getTime();
        const esEditable = (ahora - fPago.getTime()) < 86400000;

      // 🔥 NUEVO FORMATO DE HORA (12h con segundos, igual a Emisión de Crédito)
        const diasAbono = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const mesesAbono = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const diaSemana = diasAbono[fPago.getDay()];
        const dia = String(fPago.getDate()).padStart(2, '0');
        const mes = mesesAbono[fPago.getMonth()];
        const anio = fPago.getFullYear();
        
        let horas = fPago.getHours();
        let minutos = String(fPago.getMinutes()).padStart(2, '0');
        let segundos = String(fPago.getSeconds()).padStart(2, '0');
        const ampm = horas >= 12 ? 'p. m.' : 'a. m.';
        horas = horas % 12; horas = horas ? horas : 12;
        horas = String(horas).padStart(2, '0');
        
        const metodoTxt = p.forma_pago ? p.forma_pago.toUpperCase() : 'EFECTIVO';
        
       htmlHistorial += `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); margin-bottom: 10px;">
                
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px;">
                    <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 11px; font-weight: bold; color: #475569;">
                        <span style="font-size: 12px; font-weight: 900; color: #1e293b; background: #e2e8f0; padding: 2px 8px; border-radius: 4px;">Pago #${p.numero_pago || numeroPago}</span>
                        <span style="color: #0284c7;">REF: ${refFinal}</span>
                        <span style="color: #cbd5e1;">|</span>
                        <span style="color: #65a30d;">${creText}</span>
                        <span style="color: #cbd5e1;">|</span>
                        <span style="text-transform: lowercase;">📅 ${diaSemana}, ${dia}/${mes}/${anio} | ${horas}:${minutos}:${segundos} ${ampm}</span>
                    </div>
                    
                    <!-- 🔥 AQUÍ ESTÁ LA MAGIA: AGRUPAMOS EL MÉTODO Y EL BANCO A LA DERECHA -->
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 5px; margin-left: 10px;">
                        <span style="font-size: 10px; font-weight: 800; background: #e0f2fe; color: #0284c7; padding: 3px 6px; border-radius: 4px;">${metodoTxt}</span>
                        ${p.detalles_banco ? `<span style="font-size: 11px; font-weight: 800; color: #64748b;">${p.detalles_banco}</span>` : ''}
                    </div>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 20px; font-weight: 900; color: #10b981;">+$${parseFloat(p.abono_total).toFixed(2)}</div>
                        <div style="display: flex; gap: 15px; font-size: 12px; font-weight: 600;">
                            <span style="color: #ca8a04;">Int: $${parseFloat(p.monto_interes || 0).toFixed(2)}</span>
                            <span style="color: #0369a1;">Cap: $${parseFloat(p.monto_capital || 0).toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 10px; align-items: center; border-left: 1px dashed #cbd5e1; padding-left: 10px;">
                        <button onclick="reenviarReciboAbono(${p.id})" title="Reenviar">📩</button>
                        ${esEditable ? `
                            <button onclick="editarAbono(${p.id})" title="Editar">✏️</button>
                            <button onclick="eliminarAbono(${p.id})" title="Eliminar">🚫</button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });

    // Paginación
    if (totalPaginas > 1) {
        htmlHistorial += `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; padding-top: 15px; border-top: 2px dashed #e2e8f0;">
                <button onclick="cambiarPaginaAbonos(${paginaActualAbonos - 1})" ${paginaActualAbonos === 1 ? 'disabled' : ''} style="padding: 6px 12px; font-size: 12px; font-weight: bold; background: #ffffff; color: #0284c7; border: 1px solid #bae6fd; border-radius: 6px; cursor: pointer;">◀ Anterior</button>
                <span style="font-size: 11px; font-weight: 900; color: #334155; background: #e2e8f0; padding: 4px 12px; border-radius: 20px;">PÁG ${paginaActualAbonos} DE ${totalPaginas}</span>
                <button onclick="cambiarPaginaAbonos(${paginaActualAbonos + 1})" ${paginaActualAbonos >= totalPaginas ? 'disabled' : ''} style="padding: 6px 12px; font-size: 12px; font-weight: bold; background: #ffffff; color: #0284c7; border: 1px solid #bae6fd; border-radius: 6px; cursor: pointer;">Siguiente ▶</button>
            </div>
        `;
    }

    contenedor.innerHTML = htmlHistorial;
}




function cambiarPaginaAbonos(nuevaPagina) {
    const totalPaginas = Math.ceil(abonosClienteActual.length / ABONOS_POR_PAGINA);
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
        paginaActualAbonos = nuevaPagina;
        renderizarAbonosPaginados();
    }
}
// =========================================================================
// ⚙️ LÓGICA DE AUDITORÍA Y EDICIÓN DE ABONOS (REGLA 24H Y RE-ENRUTAMIENTO)
// =========================================================================

async function validarRegla24HorasAbono(idAbono) {
    const idNum = parseInt(idAbono);
    const { data: abono, error } = await supabaseClient
        .from('historial_pagos')
        .select('fecha_pago')
        .eq('id', idNum)
        .single();

    if (error || !abono) {
        alert("❌ Error al verificar la fecha del abono en la base de datos.");
        return false;
    }

    const fPago = new Date(abono.fecha_pago).getTime();
    const ahora = new Date().getTime();
    
    // Si han pasado 24 horas (86400000 ms), bloqueamos la acción
    if ((ahora - fPago) >= 86400000) { 
        alert("🔒 REGLA DE ORO ALPHA:\nHan pasado más de 24 horas desde este registro. El abono ya está sellado en contabilidad y NO puede ser modificado ni eliminado por seguridad.");
        return false;
    }
    return true;
}
// -------------------------------------------------------------------------
// ✏️ 1. EDITAR ABONO (Motor Matemático + Ajuste de Cajas + SMS + REVERSA FECHAS)
// -------------------------------------------------------------------------
async function editarAbono(idAbono) {
    const idNum = parseInt(idAbono);
    const esValido = await validarRegla24HorasAbono(idNum);
    if (!esValido) return;

    try {
        const { data: abonoActual, error: errAbono } = await supabaseClient.from('historial_pagos').select('*').eq('id', idNum).single();
        if (errAbono || !abonoActual) throw new Error("No se pudo obtener la información del abono.");

        const { data: creditoAct, error: errCredito } = await supabaseClient.from('creditos').select('*').eq('id', abonoActual.id_credito).single();
        if (errCredito || !creditoAct) throw new Error("No se pudo obtener la información del crédito.");

        const numPago = abonoActual.numero_pago || '?';
        const capitalViejo = parseFloat(abonoActual.monto_capital || 0); // Lo que había entrado a caja antes
        const metodoPago = abonoActual.forma_pago || 'efectivo';

        let nuevoMonto = prompt(`✏️ EDICIÓN DE ABONO #${numPago}\n\nMonto actual: $${parseFloat(abonoActual.abono_total).toFixed(2)}\n\nEscribe el NUEVO monto total correcto para este pago:`, parseFloat(abonoActual.abono_total));
        
        if (!nuevoMonto || isNaN(nuevoMonto)) return;
        
        nuevoMonto = parseFloat(nuevoMonto);
        if (nuevoMonto <= 0) {
            alert("❌ El monto debe ser mayor a cero.");
            return;
        }

        if (!confirm(`¿Confirmas que quieres cambiar este abono de $${parseFloat(abonoActual.abono_total).toFixed(2)} a $${nuevoMonto.toFixed(2)}?\n\nEl sistema recalculará automáticamente la distribución de Capital e Interés y ajustará las cajas.`)) return;

        // 🔥 LA PREGUNTA DEL GERENTE
        const enviarSMS = confirm("📲 ¿Deseas notificar al cliente sobre esta corrección en su pago vía SMS?");

        // 🧠 Re-enrutamiento matemático Alpha
        const moraExtra = parseFloat(creditoAct.monto_mora) || 0;
        const interesPactadoTotal = parseFloat(creditoAct.total_pagar) - parseFloat(creditoAct.monto_capital) + moraExtra;
        
        const { data: otrosPagos } = await supabaseClient
            .from('historial_pagos')
            .select('monto_interes')
            .eq('id_credito', abonoActual.id_credito)
            .neq('id', idNum);

        let interesYaPagadoOtros = 0;
        if (otrosPagos) {
            interesYaPagadoOtros = otrosPagos.reduce((sum, p) => sum + parseFloat(p.monto_interes || 0), 0);
        }

        const interesRestante = interesPactadoTotal - interesYaPagadoOtros;
        let nuevoInteres = 0;
        let nuevoCapital = 0;

        if (nuevoMonto <= interesRestante) {
            nuevoInteres = nuevoMonto;
            nuevoCapital = 0;
        } else {
            nuevoInteres = interesRestante;
            nuevoCapital = nuevoMonto - interesRestante;
        }

        // Ejecutamos la actualización y FORZAMOS a Supabase a devolver el registro actualizado
        const { data: updatedRows, error: errUpdate } = await supabaseClient
            .from('historial_pagos')
            .update({ 
                abono_total: nuevoMonto,
                monto_interes: nuevoInteres > 0 ? nuevoInteres : 0,
                monto_capital: nuevoCapital > 0 ? nuevoCapital : 0 
            })
            .eq('id', idNum)
            .select();

        if (errUpdate) throw errUpdate;
        
        if (!updatedRows || updatedRows.length === 0) {
            alert("⚠️ BLOQUEO DE BASE DE DATOS: Supabase no permitió guardar el cambio. Por favor revisa los permisos RLS.");
            return;
        }

        // =================================================================
        // 🔥 MAGIA DE AUDITORÍA: AJUSTAR EL CAPITAL EN CAJA (Si hubo cambios)
        // =================================================================
        const diferenciaCapital = nuevoCapital - capitalViejo; // Si es negativo, hay que restar a la caja

        if (diferenciaCapital !== 0) {
            const tipoCaja = (metodoPago.toLowerCase() === 'transferencia' || metodoPago.toLowerCase() === 'banco') ? 'banco' : 'efectivo';
            
            const { data: cajasTarget, error: errCajas } = await supabaseClient
                .from('cajas_capital')
                .select('id, saldo_actual')
                .eq('tipo', tipoCaja)
                .order('id', { ascending: true })
                .limit(1);

            if (!errCajas && cajasTarget && cajasTarget.length > 0) {
                const cajaId = cajasTarget[0].id;
                const saldoActualCaja = parseFloat(cajasTarget[0].saldo_actual || 0);
                const nuevoSaldoCaja = saldoActualCaja + diferenciaCapital;

                // 1. Ajustamos el saldo de la caja
                await supabaseClient.from('cajas_capital').update({ saldo_actual: nuevoSaldoCaja }).eq('id', cajaId);

                // 2. Extraer el CRE para el historial
                let creTextHistorial = "CRE # ?";
                const lblRefH = document.getElementById('lbl-recaudacion-ref');
                if (lblRefH && lblRefH.innerText) {
                    const matchH = lblRefH.innerText.match(/CRE\s*#[^|]+/);
                    if (matchH) {
                        const textoCrudoH = matchH[0].trim();
                        const matchLetraH = textoCrudoH.match(/\[(.*?)\]/); // <-- Modificado para limpiar corchete
                        creTextHistorial = matchLetraH && matchLetraH[1] ? `CRE #${matchLetraH[1]}` : textoCrudoH;
                    }
                }
                
                const cliInfo = creditoSeleccionadoCobro.clientes || {};
                const nomCliente = `${cliInfo.nombres || ''} ${cliInfo.apellidos || ''}`.toUpperCase().trim();

                // 3. Dejamos un registro de auditoría explicando el ajuste
                await supabaseClient.from('historial_capital').insert([{
                    caja_id: cajaId,
                    monto: diferenciaCapital,
                    concepto: `AJUSTE DE EDICIÓN: Abono #${numPago} | ${creTextHistorial} | ${nomCliente} (Ajuste cap. de $${capitalViejo} a $${nuevoCapital})`
                }]);
            }
        }

        // =================================================================
        // 🚀 🔥 RECALCULAR FECHA DE VENCIMIENTO (SISTEMA DELTA ALPHA) 🔥
        // =================================================================
        try {
            const oldMonto = parseFloat(abonoActual.abono_total || 0);
            
            // Traemos TODOS los pagos de este crédito para tener el total real actual
            const { data: todosPagosActuales } = await supabaseClient
                .from('historial_pagos')
                .select('abono_total')
                .eq('id_credito', creditoAct.id);

            let pagadoTotalActualizado = 0;
            if (todosPagosActuales) {
                pagadoTotalActualizado = todosPagosActuales.reduce((acc, p) => acc + parseFloat(p.abono_total || 0), 0);
            }

            // Calculamos cuánto dinero había ANTES de que usted modificara el abono
            const totalPagadoAntes = pagadoTotalActualizado - nuevoMonto + oldMonto;

            let freq = (creditoAct.frecuencia_pago || '').toUpperCase();
            let valorDeUnaCuota = parseFloat(creditoAct.valor_cuota) || 1;

            if (creditoAct.estado === 'congelado') {
                const acuerdo = (creditoAct.acuerdo_pago || '').toLowerCase();
                if (acuerdo.includes('mensual')) freq = 'MENSUAL';
                else if (acuerdo.includes('quincenal')) freq = 'QUINCENAL';
                else if (acuerdo.includes('semanal')) freq = 'SEMANAL';
                else if (acuerdo.includes('diario')) freq = 'DIARIO';

                const matchMonto = acuerdo.match(/\d+(\.\d+)?/);
                if (matchMonto && parseFloat(matchMonto[0]) > 0) {
                    valorDeUnaCuota = parseFloat(matchMonto[0]);
                }
            }

            const cuotasAntes = Math.floor(totalPagadoAntes / valorDeUnaCuota);
            const cuotasDespues = Math.floor(pagadoTotalActualizado / valorDeUnaCuota);
            const diferenciaCuotas = cuotasDespues - cuotasAntes; // Puede ser positivo o negativo

            // Solo movemos la fecha si hubo un cambio real en el número de cuotas completas
            if (diferenciaCuotas !== 0 && creditoAct.fecha_vencimiento_actual) {
                let fechaObj = new Date(creditoAct.fecha_vencimiento_actual + 'T12:00:00');
                
                if (freq.includes('SEMANAL')) {
                    fechaObj.setDate(fechaObj.getDate() + (7 * diferenciaCuotas));
                } else if (freq.includes('QUINCENAL')) {
                    fechaObj.setDate(fechaObj.getDate() + (15 * diferenciaCuotas));
                } else if (freq.includes('MENSUAL')) {
                    fechaObj.setMonth(fechaObj.getMonth() + (1 * diferenciaCuotas));
                } else if (freq.includes('DIARIO')) {
                    fechaObj.setDate(fechaObj.getDate() + (1 * diferenciaCuotas));
                }
                
                const nuevaFechaCalculada = fechaObj.toISOString().split('T')[0];

                await supabaseClient
                    .from('creditos')
                    .update({ fecha_vencimiento_actual: nuevaFechaCalculada })
                    .eq('id', creditoAct.id);
                
                if(creditoSeleccionadoCobro) creditoSeleccionadoCobro.fecha_vencimiento_actual = nuevaFechaCalculada;
            }
        } catch (errorFecha) {
            console.error("Error al recalcular la fecha en edición:", errorFecha);
        }

        // =================================================================
        // 🚀 MENSAJE DE AUDITORÍA Y ACTUALIZACIÓN
        // =================================================================
        if (enviarSMS) {
            const cli = creditoSeleccionadoCobro.clientes || {};
            let numeroCliente = cli.whatsapp; 

            if (!numeroCliente) {
                const idBuscado = creditoAct.cliente_id || cli.id;
                if (idBuscado) {
                    const { data: infoDB } = await supabaseClient.from('clientes').select('whatsapp').eq('id', idBuscado).single();
                    if (infoDB && infoDB.whatsapp) numeroCliente = infoDB.whatsapp;
                }
            }

            if (numeroCliente && typeof enviarSMSAutomatico === 'function') {
                const nombre = `${cli.nombres} ${cli.apellidos}`.toUpperCase();
                const iN = (cli.nombres || '').trim().charAt(0);
                const iA = (cli.apellidos || '').trim().charAt(0);
                const u4 = (cli.cedula || '').trim().slice(-4);
                const refFinal = `${iN}${iA}-${u4}`.toUpperCase();
                
                // Extraer solo el CRE con su letra cifrada LIMPIA de corchetes
                let creText = "CRE # ?";
                const lblRef = document.getElementById('lbl-recaudacion-ref');
                if (lblRef && lblRef.innerText) {
                    const match = lblRef.innerText.match(/CRE\s*#[^|]+/);
                    if (match) {
                        const textoCrudo = match[0].trim(); 
                        const matchLetra = textoCrudo.match(/\[(.*?)\]/); 
                        if (matchLetra && matchLetra[1]) {
                            creText = `CRE #${matchLetra[1]}`; 
                        } else {
                            creText = textoCrudo;
                        }
                    }
                }

                // 🔥 FÓRMULA ALPHA SMS COMPACTA (Domingo 20/septiembre/2026 | 09:21 a.m.)
                const ahora = new Date();
                const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                
                const diaSemana = dias[ahora.getDay()];
                const numDia = String(ahora.getDate()).padStart(2, '0');
                const mesNombre = meses[ahora.getMonth()];
                const anio = ahora.getFullYear();
                
                let horas = ahora.getHours();
                let minutos = String(ahora.getMinutes()).padStart(2, '0');
                const ampm = horas >= 12 ? 'p.m.' : 'a.m.'; // Sin espacio en a.m.
                horas = horas % 12; horas = horas ? horas : 12;
                horas = String(horas).padStart(2, '0');
                
                const fechaHoraSMS = `${diaSemana} ${numDia}/${mesNombre}/${anio} | ${horas}:${minutos} ${ampm}`;

                // Calculamos el SALDO REAL GOBAL sumando todos los pagos a este momento
                const { data: todosLosPagos } = await supabaseClient.from('historial_pagos').select('abono_total').eq('id_credito', abonoActual.id_credito);
                let pagadoTotalActualizado = 0;
                if (todosLosPagos) {
                    pagadoTotalActualizado = todosLosPagos.reduce((sum, p) => sum + parseFloat(p.abono_total || 0), 0);
                }
                
                // Le sumamos la mora para que el saldo sea el correcto
                const saldoConMora = parseFloat(creditoAct.total_pagar) + parseFloat(creditoAct.monto_mora || 0);
                const nuevoSaldoFinal = saldoConMora - pagadoTotalActualizado;

                const cuotasTotales = parseInt(creditoAct.num_cuotas) || 1;
                const valorDeCuota = parseFloat(creditoAct.valor_cuota) || 1;
                let cuotasPendientes = Math.ceil(nuevoSaldoFinal / valorDeCuota);
                if (cuotasPendientes < 0) cuotasPendientes = 0;

               // 🔥 MAGIA VIP PARA EDICIÓN
                let infoMetodo = `💳 Método: ${abonoActual.forma_pago ? abonoActual.forma_pago.toUpperCase() : 'EFECTIVO'}`;
                if (abonoActual.forma_pago && abonoActual.forma_pago.toLowerCase() === 'transferencia' && abonoActual.detalles_banco) {
                    infoMetodo += `\n🏦 Banco: ${abonoActual.detalles_banco}`;
                }

                const msjActualizacion = `=== SISTEMA ALPHA (Actualización) ===\n${fechaHoraSMS}\n\n🆔 Ref: ${refFinal} | ${creText}\n👤 Cliente: ${nombre}\n\nHola, te notificamos un ajuste en tu historial tras nuestra revisión de caja.\n\n🔄 Pago Corregido: #${numPago}\n💰 Monto Exacto: $${nuevoMonto.toFixed(2)}\n📉 Nuevo Saldo: $${nuevoSaldoFinal.toFixed(2)}\n🔢 N° de Cuotas: ${cuotasPendientes}/${cuotasTotales}\n${infoMetodo}\n\nLamentamos las molestias. ¡Gracias!\n🚫 NO RESPONDER A ESTE MENSAJE.`;
                // 1. Envía el mensaje de actualización al cliente
                await enviarSMSAutomatico(numeroCliente, msjActualizacion);

                // 🕒 PAUSA DE 2 SEGUNDOS: Evitamos colapso del chip
                await new Promise(resolve => setTimeout(resolve, 2000));

                // 2. 🔥 COPIA DE AUDITORÍA PARA EL GERENTE
                const numeroGerente = "0939836191";
                if (numeroCliente.toString().trim() !== numeroGerente) {
                    await enviarSMSAutomatico(numeroGerente, `[COPIA EDICIÓN ABONO]\n\n${msjActualizacion}`);
                }
            }
        }
        alert("✅ Abono editado, saldos, cajas y FECHAS recalculadas exitosamente.");
        
        // 1. Refrescamos la pantalla visual del cliente
        if (creditoSeleccionadoCobro) {
            await cargarEstadoCuentaCredito(creditoSeleccionadoCobro.id);
        }
        
        // 2. 🔥 ACTUALIZAMOS EL MÓDULO CAPITAL EN VIVO 🔥
        if (typeof inicializarModuloCapital === 'function') {
            await inicializarModuloCapital();
        }
        
    } catch (error) {
        alert("❌ Error al editar el abono: " + error.message);
    }
}

// -------------------------------------------------------------------------
// 🚫 2. ELIMINAR ABONO (Auditoría Avanzada + Ajuste Cajas + SMS + REVERSA FECHAS)
// -------------------------------------------------------------------------
async function eliminarAbono(idAbono) {
    const idNum = parseInt(idAbono);
    const esValido = await validarRegla24HorasAbono(idNum);
    if (!esValido) return;

    if (!confirm("⚠️ ALERTA DE AUDITORÍA GERENCIAL ⚠️\n\n¿Estás absolutamente seguro de ELIMINAR este abono de la historia?\nEl saldo de la deuda del cliente volverá a subir y las cajas se ajustarán.")) return;

    const enviarSMS = confirm("📲 ¿Deseas enviar el comprobante de ANULACIÓN OFICIAL por SMS al cliente?");

    try {
        // 🔥 EXTRAER EL 'CRE' DESDE LA PANTALLA ANTES DE BORRAR Y LIMPIAR CORCHETES
        let creText = "CRE # ?";
        const lblRef = document.getElementById('lbl-recaudacion-ref');
        if (lblRef && lblRef.innerText) {
            const match = lblRef.innerText.match(/CRE\s*#[^|]+/);
            if (match) {
                const textoCrudo = match[0].trim(); 
                const matchLetra = textoCrudo.match(/\[(.*?)\]/); // Capturamos lo de adentro del corchete
                // Si encontramos letra en corchete, la ponemos limpia sin corchetes (Ej: CRE #H)
                creText = matchLetra && matchLetra[1] ? `CRE #${matchLetra[1]}` : textoCrudo;
            }
        }

        // 1. PRIMERO: Recuperamos los datos del abono original
        const { data: abonoABorrar, error: errLectura } = await supabaseClient
            .from('historial_pagos')
            .select('*')
            .eq('id', idNum)
            .single();

        if (errLectura || !abonoABorrar) {
             alert("⚠️ Error: No se pudo leer el abono para su auditoría.");
             return;
        }

        const { data: creditoAct } = await supabaseClient.from('creditos').select('*').eq('id', abonoABorrar.id_credito).single();

        // 2. SEGUNDO: Guardamos TODO en la Bóveda de Eliminados (Papelera)
        const { error: errAuditoria } = await supabaseClient
            .from('auditoria_pagos_eliminados')
            .insert([{
                id_credito: abonoABorrar.id_credito,
                abono_total: abonoABorrar.abono_total,
                numero_pago: abonoABorrar.numero_pago,
                motivo_eliminacion: 'Corrección interna por gerente',
                forma_pago: abonoABorrar.forma_pago || 'EFECTIVO',
                fecha_pago_original: abonoABorrar.fecha_pago,      
                codigo_cre: creText                                
            }]);

        if (errAuditoria) {
            alert("⚠️ Error: No se pudo guardar el respaldo. Anulación cancelada.");
            return;
        }

        // 3. TERCERO: Eliminamos de la tabla activa
        const { error: errBorrado } = await supabaseClient.from('historial_pagos').delete().eq('id', idNum);
        if (errBorrado) throw errBorrado;

        // =================================================================
        // 🔥 MAGIA DE AUDITORÍA: REVERTIR EL CAPITAL EN CAJA
        // =================================================================
        const capitalReversar = parseFloat(abonoABorrar.monto_capital || 0);

        if (capitalReversar > 0) {
            const metodoPago = abonoABorrar.forma_pago || 'efectivo';
            const tipoCaja = (metodoPago.toLowerCase() === 'transferencia' || metodoPago.toLowerCase() === 'banco') ? 'banco' : 'efectivo';
            
            const { data: cajasTarget, error: errCajas } = await supabaseClient
                .from('cajas_capital')
                .select('id, saldo_actual')
                .eq('tipo', tipoCaja)
                .order('id', { ascending: true })
                .limit(1);

            if (!errCajas && cajasTarget && cajasTarget.length > 0) {
                const cajaId = cajasTarget[0].id;
                const saldoActualCaja = parseFloat(cajasTarget[0].saldo_actual || 0);
                const nuevoSaldoCaja = saldoActualCaja - capitalReversar; // RESTAMOS LO QUE HABÍAMOS SUMADO

                // 1. Ajustamos el saldo de la caja
                await supabaseClient.from('cajas_capital').update({ saldo_actual: nuevoSaldoCaja }).eq('id', cajaId);

                const cliInfo = creditoSeleccionadoCobro.clientes || {};
                const nomCliente = `${cliInfo.nombres || ''} ${cliInfo.apellidos || ''}`.toUpperCase().trim();

                // 2. Dejamos un registro de auditoría
                await supabaseClient.from('historial_capital').insert([{
                    caja_id: cajaId,
                    monto: -capitalReversar,
                    concepto: `REVERSO DE ANULACIÓN: Abono #${abonoABorrar.numero_pago} | ${creText} | ${nomCliente} (Eliminado)`
                }]);
            }
        }
// =================================================================
        // 🚀 🔥 RECALCULAR FECHA DE VENCIMIENTO (SISTEMA DELTA ALPHA) 🔥
        // =================================================================
        if (creditoAct) {
            try {
                const oldMonto = parseFloat(abonoABorrar.abono_total || 0);

                // Traemos TODOS los pagos de este crédito (Ya sin el que acabamos de borrar)
                const { data: todosPagosActuales } = await supabaseClient
                    .from('historial_pagos')
                    .select('abono_total')
                    .eq('id_credito', creditoAct.id);

                let pagadoTotalActualizado = 0;
                if (todosPagosActuales) {
                    pagadoTotalActualizado = todosPagosActuales.reduce((acc, p) => acc + parseFloat(p.abono_total || 0), 0);
                }
                
                const totalPagadoAntes = pagadoTotalActualizado + oldMonto;

                let freq = (creditoAct.frecuencia_pago || '').toUpperCase();
                let valorDeUnaCuota = parseFloat(creditoAct.valor_cuota) || 1;

                if (creditoAct.estado === 'congelado') {
                    const acuerdo = (creditoAct.acuerdo_pago || '').toLowerCase();
                    if (acuerdo.includes('mensual')) freq = 'MENSUAL';
                    else if (acuerdo.includes('quincenal')) freq = 'QUINCENAL';
                    else if (acuerdo.includes('semanal')) freq = 'SEMANAL';
                    else if (acuerdo.includes('diario')) freq = 'DIARIO';

                    const matchMonto = acuerdo.match(/\d+(\.\d+)?/);
                    if (matchMonto && parseFloat(matchMonto[0]) > 0) {
                        valorDeUnaCuota = parseFloat(matchMonto[0]);
                    }
                }

                const cuotasAntes = Math.floor(totalPagadoAntes / valorDeUnaCuota);
                const cuotasDespues = Math.floor(pagadoTotalActualizado / valorDeUnaCuota);
                const diferenciaCuotas = cuotasDespues - cuotasAntes; // Siempre será 0 o negativo

                if (diferenciaCuotas !== 0 && creditoAct.fecha_vencimiento_actual) {
                    let fechaObj = new Date(creditoAct.fecha_vencimiento_actual + 'T12:00:00');
                    
                    if (freq.includes('SEMANAL')) {
                        fechaObj.setDate(fechaObj.getDate() + (7 * diferenciaCuotas));
                    } else if (freq.includes('QUINCENAL')) {
                        fechaObj.setDate(fechaObj.getDate() + (15 * diferenciaCuotas));
                    } else if (freq.includes('MENSUAL')) {
                        fechaObj.setMonth(fechaObj.getMonth() + (1 * diferenciaCuotas));
                    } else if (freq.includes('DIARIO')) {
                        fechaObj.setDate(fechaObj.getDate() + (1 * diferenciaCuotas));
                    }
                    
                    const nuevaFechaCalculada = fechaObj.toISOString().split('T')[0];

                    await supabaseClient
                        .from('creditos')
                        .update({ fecha_vencimiento_actual: nuevaFechaCalculada })
                        .eq('id', creditoAct.id);
                    
                    if(creditoSeleccionadoCobro) creditoSeleccionadoCobro.fecha_vencimiento_actual = nuevaFechaCalculada;
                }
            } catch (errorFecha) {
                console.error("Error al recalcular la fecha en eliminación:", errorFecha);
            }
        }

        // =================================================================
        // 🚀 SMS DE ANULACIÓN (CON DISEÑO VIP ALPHA)
        // =================================================================
        if (enviarSMS) {
            const cli = creditoSeleccionadoCobro.clientes || {};
            let numeroCliente = cli.whatsapp; 

            if (!numeroCliente && creditoAct) {
                const { data: infoDB } = await supabaseClient.from('clientes').select('whatsapp').eq('id', creditoAct.cliente_id).single();
                if (infoDB) numeroCliente = infoDB.whatsapp;
            }

            if (numeroCliente && typeof enviarSMSAutomatico === 'function' && creditoAct) {
                const nombre = `${cli.nombres} ${cli.apellidos}`.toUpperCase();
                const iN = (cli.nombres || '').trim().charAt(0);
                const iA = (cli.apellidos || '').trim().charAt(0);
                const u4 = (cli.cedula || '').trim().slice(-4);
                const refFinal = `${iN}${iA}-${u4}`.toUpperCase();
                
                // 🔥 FÓRMULA ALPHA SMS COMPACTA (domingo 20/septiembre/2026 | 08:16 a.m.)
                const ahora = new Date();
                const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                
                const diaSemana = dias[ahora.getDay()];
                const numDia = String(ahora.getDate()).padStart(2, '0');
                const mesNombre = meses[ahora.getMonth()];
                const anio = ahora.getFullYear();
                
                let horas = ahora.getHours();
                let minutos = String(ahora.getMinutes()).padStart(2, '0');
                const ampm = horas >= 12 ? 'p.m.' : 'a.m.'; // <-- SIN ESPACIO PARA QUE NO SALTE LA LÍNEA
                horas = horas % 12; horas = horas ? horas : 12;
                horas = String(horas).padStart(2, '0');
                
                // Formato exacto requerido
                const fechaHoraSMS = `${diaSemana} ${numDia}/${mesNombre}/${anio} | ${horas}:${minutos} ${ampm}`;

               const nuevoSaldoFinal = parseFloat(creditoSeleccionadoCobro.saldoNeto) + parseFloat(abonoABorrar.abono_total);
                const cuotasTotales = parseInt(creditoAct.num_cuotas) || 1;
                let cuotasPendientes = Math.ceil(nuevoSaldoFinal / (parseFloat(creditoAct.valor_cuota) || 1));
                if (cuotasPendientes > cuotasTotales) cuotasPendientes = cuotasTotales;

                // 🔥 MAGIA VIP PARA ANULACIÓN
                let infoMetodo = `💳 Método: ${abonoABorrar.forma_pago ? abonoABorrar.forma_pago.toUpperCase() : 'EFECTIVO'}`;
                if (abonoABorrar.forma_pago && abonoABorrar.forma_pago.toLowerCase() === 'transferencia' && abonoABorrar.detalles_banco) {
                    infoMetodo += `\n🏦 Banco: ${abonoABorrar.detalles_banco}`;
                }

                const msjAnulacion = `=== SISTEMA ALPHA (Anulación Oficial) ===\n${fechaHoraSMS}\n\n🆔 Ref: ${refFinal} | ${creText}\n👤 Cliente: ${nombre}\n\nPor transparencia y control de auditoría, te notificamos que el siguiente abono ha sido ELIMINADO del sistema por una corrección interna.\n\n❌ Pago Anulado: #${abonoABorrar.numero_pago}\n💰 Monto Reversado: $${parseFloat(abonoABorrar.abono_total).toFixed(2)}\n📈 Saldo Restablecido: $${nuevoSaldoFinal.toFixed(2)}\n🔢 Cuotas Pendientes: ${cuotasPendientes}/${cuotasTotales}\n${infoMetodo}\n\nTu cuenta está protegida. Conserva este msj.\n🚫 NO RESPONDER A ESTE MENSAJE.`;
                // 1. Envía la notificación de anulación al cliente
                await enviarSMSAutomatico(numeroCliente, msjAnulacion);

                // 🕒 PAUSA DE 2 SEGUNDOS: Evitamos colapso del chip
                await new Promise(resolve => setTimeout(resolve, 2000));

                // 2. 🔥 COPIA DE AUDITORÍA PARA EL GERENTE
                const numeroGerente = "0939836191";
                if (numeroCliente.toString().trim() !== numeroGerente) {
                    await enviarSMSAutomatico(numeroGerente, `[COPIA ANULACIÓN ABONO]\n\n${msjAnulacion}`);
                }
            }
        }

        if (creditoSeleccionadoCobro.estado === 'finalizado') {
             await supabaseClient.from('creditos').update({ estado: 'activo' }).eq('id', creditoSeleccionadoCobro.id);
        }

        alert("✅ Abono borrado y FECHAS recalculadas. Respaldado en la bóveda de eliminados.");
        
        // 1. Refrescamos la pantalla visual del cliente
        if (creditoSeleccionadoCobro) {
             await cargarEstadoCuentaCredito(creditoSeleccionadoCobro.id);
        }

        // 2. 🔥 ACTUALIZAMOS EL MÓDULO CAPITAL EN VIVO 🔥
        if (typeof inicializarModuloCapital === 'function') {
            await inicializarModuloCapital();
        }
        
    } catch (error) {
        alert("❌ Error al procesar la anulación: " + error.message);
    }
}


// -------------------------------------------------------------------------
// 📩 3. REENVIAR RECIBO DE ABONO (PROGRAMACIÓN OFICIAL ALPHA V5)
// -------------------------------------------------------------------------
async function reenviarReciboAbono(idAbono) {
    // 1. Buscamos el abono específico dentro de nuestra lista en memoria
    const abono = abonosClienteActual.find(a => a.id == idAbono);
    if (!abono) {
        alert("⚠️ Error: No se encontró la información de este abono en el sistema.");
        return;
    }

    const numPago = abono.numero_pago || '?';

    // 🔥 CAMBIO DE CONDICIÓN: Aceptar cobra comisión, Cancelar envía gratis sin bloquear el flujo
    const cobrarCosto = confirm(`¿Deseas incluir el recargo por reenvío del Pago #${numPago}?\n\n• Presione [ACEPTAR] si le va a cobrar los 0.50 ctv al cliente.\n• Presione [CANCELAR] si prefiere enviarlo totalmente GRATIS (Ayuda Social).`);

    // El sistema evalúa tu decisión para armar el encabezado exacto
    const encabezadoSMS = cobrarCosto 
        ? `=== SISTEMA ALPHA (Copia)(VAL 0.50 ctv) ===` 
        : `=== SISTEMA ALPHA (Copia) ===`;

    try {
        // 3. Extracción directa y segura del WhatsApp desde Supabase
        const cli = creditoSeleccionadoCobro.clientes || {};
        let numeroCliente = cli.whatsapp; 

        if (!numeroCliente) {
            const idBuscado = creditoSeleccionadoCobro.cliente_id || cli.id;
            if (idBuscado) {
                const { data: infoClienteDB } = await supabaseClient
                    .from('clientes')
                    .select('whatsapp')
                    .eq('id', idBuscado)
                    .single();
                    
                if (infoClienteDB && infoClienteDB.whatsapp) {
                    numeroCliente = infoClienteDB.whatsapp;
                }
            }
        }

        if (!numeroCliente) {
            alert("⚠️ No se pudo enviar: El cliente no tiene un número registrado en la columna 'whatsapp'.");
            return;
        }

        if (typeof enviarSMSAutomatico !== 'function') {
            alert("⚠️ Error: El sistema no detecta la función 'enviarSMSAutomatico'.");
            return;
        }

        // 4. Reconstrucción de la Referencia y CRE cifrado
        const nombre = `${cli.nombres} ${cli.apellidos}`.toUpperCase();
        const iN = (cli.nombres || '').trim().charAt(0);
        const iA = (cli.apellidos || '').trim().charAt(0);
        const u4 = (cli.cedula || '').trim().slice(-4);
        const refFinal = `${iN}${iA}-${u4}`.toUpperCase();
        
        // 🔥 TRADUCCIÓN DE LÓGICA (El Sabueso): Aquí buscamos la etiqueta CRE en la pantalla.
        // Si encontramos los corchetes (ej: [H]), usamos solo la letra. Si no, usamos el texto crudo.
        let creText = "CRE # ?";
        const lblRef = document.getElementById('lbl-recaudacion-ref');
        if (lblRef && lblRef.innerText) {
            const match = lblRef.innerText.match(/CRE\s*#[^|]+/);
            if (match) {
                const textoCrudo = match[0].trim(); 
                const matchLetra = textoCrudo.match(/\[(.*?)\]/); // <-- ESTA ES LA CLAVE: Sacar la letra sin corchetes
                if (matchLetra && matchLetra[1]) {
                    creText = `CRE #${matchLetra[1]}`; // Armamos CRE #H
                } else {
                    creText = textoCrudo;
                }
            }
        }

        // 5. 🔥 FÓRMULA ALPHA SMS COMPACTA PARA REENVÍO 🔥
        const fPago = new Date(abono.fecha_pago);
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        
        const diaSemana = dias[fPago.getDay()];
        const numDia = String(fPago.getDate()).padStart(2, '0');
        const mesNombre = meses[fPago.getMonth()];
        const anio = fPago.getFullYear();
        
        // 🔥 TRADUCCIÓN DE LÓGICA (El Reloj de 12h y el Guardián): 
        // Convertimos la hora de formato militar (24h) a civil (12h) y rellenamos los minutos con ceros.
        let horas = fPago.getHours();
        let minutos = String(fPago.getMinutes()).padStart(2, '0');
        const ampm = horas >= 12 ? 'p.m.' : 'a.m.'; // <-- SIN ESPACIO (a.m. en lugar de a. m.)
        horas = horas % 12; horas = horas ? horas : 12; // El módulo %12 hace que las 15h sean las 3h.
        horas = String(horas).padStart(2, '0');
        
        const fechaHoraSMS = `${diaSemana} ${numDia}/${mesNombre}/${anio} | ${horas}:${minutos} ${ampm}`;

        // 6. Matemática reconstructiva: Calcular el saldo y cuotas en ESE momento exacto
        const pagosHastaAqui = abonosClienteActual.filter(a => new Date(a.fecha_pago) <= fPago);
        const totalPagadoHastaAqui = pagosHastaAqui.reduce((sum, a) => sum + parseFloat(a.abono_total || 0), 0);
        
        const saldoEnEseMomento = parseFloat(creditoSeleccionadoCobro.total_pagar) - totalPagadoHastaAqui;
        const cuotasTotales = parseInt(creditoSeleccionadoCobro.num_cuotas) || 1;
        const valorDeCuota = parseFloat(creditoSeleccionadoCobro.valor_cuota) || 1;
        
        let cuotasPendientes = Math.ceil(saldoEnEseMomento / valorDeCuota);
        if (cuotasPendientes < 0) cuotasPendientes = 0;

       // 🔥 MAGIA VIP PARA EL REENVÍO
        let infoMetodo = `💳 Método: ${abono.forma_pago ? abono.forma_pago.toUpperCase() : 'EFECTIVO'}`;
        if (abono.forma_pago && abono.forma_pago.toLowerCase() === 'transferencia' && abono.detalles_banco) {
            infoMetodo += `\n🏦 Banco: ${abono.detalles_banco}`;
        }

        // 7. Armado del Mensaje Comercial con el encabezado dinámico 🔥
        const msjAbono = `${encabezadoSMS}\n${fechaHoraSMS}\n\n🆔 Ref: ${refFinal} | ${creText}\n👤 Cliente: ${nombre}\n\nHola, aquí tienes el respaldo de tu abono.\n\n✅ Pago: #${numPago}\n💰 Monto: $${parseFloat(abono.abono_total).toFixed(2)}\n📊 Saldo: $${saldoEnEseMomento.toFixed(2)}\n🔢 N° de Cuotas: ${cuotasPendientes}/${cuotasTotales}\n${infoMetodo}\n\nConserva este msj. ¡Gracias!\n🚫 POR FAVOR, NO RESPONDER A ESTE MENSAJE.`;
       // 8. Disparo directo a tu MacroDroid sin bloqueos
        // A. Envío original al cliente
        await enviarSMSAutomatico(numeroCliente, msjAbono);

        // 🕒 B. PAUSA DE 2 SEGUNDOS: Evitamos colapso del chip
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 🔥 C. COPIA DE AUDITORÍA PARA EL GERENTE
        const numeroGerente = "0939836191";
        if (numeroCliente !== numeroGerente) {
            const estadoCobro = cobrarCosto ? "COBRADO $0.50" : "GRATIS";
            await enviarSMSAutomatico(numeroGerente, `[AVISO REENVÍO ABONO - ${estadoCobro}]\n\n${msjAbono}`);
        }
        
        // Alerta informativa final para el operador en pantalla
        if (cobrarCosto) {
            alert(`✅ Recibo enviado. Se aplicó el recargo de 0.50 ctv.`);
        } else {
            alert(`✅ Recibo enviado gratis como ayuda social.`);
        }
        
    } catch (err) {
        alert("Error al procesar el reenvío de abono: " + err.message);
    }
}
// =========================================================================
// ⚡ SIMULADOR DE ENRUTAMIENTO EN VIVO (REGLA DE ORO ALPHA + BYPASS CONVENIOS)
// =========================================================================
// =========================================================================
// ⚡ SIMULADOR DE ENRUTAMIENTO EN VIVO (REGLA DE ORO ALPHA PURA)
// =========================================================================
function simularEnrutamientoFlujo(valor) {
    const monto = parseFloat(valor);
    if (isNaN(monto) || monto <= 0 || !creditoSeleccionadoCobro) return;

    // 🔥 REGLA DE ORO ALPHA: La mora es pura ganancia, se suma al interés esperado
    const moraExtra = parseFloat(creditoSeleccionadoCobro.monto_mora) || 0;
    const interesFaltantePorAsegurar = (interesTotalPactado + moraExtra) - interesYaPagado;
    
    let destinoInteres = 0; 
    let destinoCapital = 0;

    if (interesFaltantePorAsegurar > 0) {
        if (monto <= interesFaltantePorAsegurar) {
            destinoInteres = monto; 
            destinoCapital = 0;
            document.getElementById('sim-leyenda-fase').innerHTML = `👑 FASE 1: Asegurando Utilidades ($${(interesFaltantePorAsegurar - monto).toFixed(2)} restantes)`;
            document.getElementById('sim-leyenda-fase').style.color = "#ca8a04";
        } else {
            destinoInteres = interesFaltantePorAsegurar;
            destinoCapital = monto - interesFaltantePorAsegurar;
            document.getElementById('sim-leyenda-fase').innerHTML = `🚀 FRONTERA CRUZADA! Excedente ($${destinoCapital.toFixed(2)}) repone Capital.`;
            document.getElementById('sim-leyenda-fase').style.color = "#0284c7";
        }
    } else {
        destinoInteres = 0; 
        destinoCapital = monto;
        document.getElementById('sim-leyenda-fase').innerText = "🛡️ FASE 2: Interés blindado. Todo repone tu Capital.";
        document.getElementById('sim-leyenda-fase').style.color = "#10b981";
    }

    // Dibujamos los números finales en pantalla
    document.getElementById('sim-boveda-interes').innerText = `$${destinoInteres.toFixed(2)}`;
    document.getElementById('sim-boveda-capital').innerText = `$${destinoCapital.toFixed(2)}`;
}

// =========================================================================
// 🔄 UI: INTERRUPTOR DE EFECTIVO / TRANSFERENCIA
// =========================================================================
function cambiarMetodoPago(metodo) {
    const btnEfectivo = document.getElementById('btn-metodo-efectivo');
    const btnTransf = document.getElementById('btn-metodo-transf');
    const cajaDetalles = document.getElementById('caja-detalles-transferencia');
    const inputMetodo = document.getElementById('metodo-pago-seleccionado');

    if (metodo === 'efectivo') {
        btnEfectivo.style.background = '#4f46e5'; btnEfectivo.style.color = 'white';
        btnTransf.style.background = '#f1f5f9'; btnTransf.style.color = '#64748b';
        cajaDetalles.style.display = 'none'; inputMetodo.value = 'efectivo';
    } else {
        btnTransf.style.background = '#4f46e5'; btnTransf.style.color = 'white';
        btnEfectivo.style.background = '#f1f5f9'; btnEfectivo.style.color = '#64748b';
        cajaDetalles.style.display = 'block'; inputMetodo.value = 'transferencia';
    }
}
// =========================================================================
// 🚀 INYECCIÓN OFICIAL DE COBRO A LA BASE DE DATOS, TICKET Y NOTIFICACIÓN SMS
// =========================================================================
// =========================================================================
// 🚀 INYECCIÓN OFICIAL DE COBRO A LA BASE DE DATOS, TICKET Y NOTIFICACIÓN SMS
// =========================================================================
async function procesarCobroOficial() {
    const montoInput = parseFloat(document.getElementById('monto-cobro-input').value);
    const metodoPago = document.getElementById('metodo-pago-seleccionado').value;
    const detallesBanco = document.getElementById('input-detalles-banco').value.trim();
    
    if (isNaN(montoInput) || montoInput <= 0 || !creditoSeleccionadoCobro) {
        alert("⚠️ Por favor introduce un monto de abono válido.");
        return;
    }

    if (metodoPago === 'transferencia' && detallesBanco === '') {
        alert("⚠️ Seleccionaste Transferencia. Por favor ingresa los datos del banco o comprobante.");
        return;
    }

    // 🔥 REGLA DE ORO ALPHA: Calculamos el límite real sumando la mora al saldo
    const moraExtra = parseFloat(creditoSeleccionadoCobro.monto_mora) || 0;
    const saldoRealTotal = parseFloat(creditoSeleccionadoCobro.saldoNeto) + moraExtra;

    if (montoInput > saldoRealTotal) {
        alert(`⚠️ Alerta: El abono no puede ser mayor al saldo pendiente actual ($${saldoRealTotal.toFixed(2)}).`);
        return;
    }

    const confirmar = confirm(`¿Estás seguro de registrar un cobro de $${montoInput.toFixed(2)} en ${metodoPago.toUpperCase()}?`);
    if (!confirmar) return;

    const enviarSMS = confirm("📲 ¿Deseas enviar el comprobante de este abono por SMS al cliente?");

   try {
        // 🌟 MAGIA 1: Traemos todos los pagos previos de la BD para sumar los pedacitos
        const { data: pagosPrevios } = await supabaseClient
            .from('historial_pagos')
            .select('abono_total')
            .eq('id_credito', creditoSeleccionadoCobro.id);
        
        let totalAbonadoPrevio = 0;
        if (pagosPrevios) {
            totalAbonadoPrevio = pagosPrevios.reduce((acc, p) => acc + (parseFloat(p.abono_total) || 0), 0);
        }
        const numeroNuevoPago = (pagosPrevios ? pagosPrevios.length : 0) + 1;

        // 🔥 REGLA DE ORO ALPHA: Asignamos la mora a la Bóveda de Interés
        const interesFaltantePorAsegurar = (interesTotalPactado + moraExtra) - interesYaPagado;
        let finalInteres = 0; let finalCapital = 0;

        if (interesFaltantePorAsegurar > 0) {
            if (montoInput <= interesFaltantePorAsegurar) {
                finalInteres = montoInput;
            } else {
                finalInteres = interesFaltantePorAsegurar;
                finalCapital = montoInput - interesFaltantePorAsegurar;
            }
        } else {
            finalCapital = montoInput;
        }

        // 1. REGISTRAR EL PAGO EN EL HISTORIAL
        const { error: errorHistorial } = await supabaseClient
            .from('historial_pagos')
            .insert([{
                id_credito: creditoSeleccionadoCobro.id,
                abono_total: montoInput,
                monto_interes: finalInteres,
                monto_capital: finalCapital,
                forma_pago: metodoPago,
                detalles_banco: detallesBanco,
                fecha_pago: new Date().toISOString(),
                numero_pago: numeroNuevoPago
            }]);

        if (errorHistorial) throw errorHistorial;

        // =================================================================
        // 🔥 MAGIA DE CAPITAL: INYECTAR EL RETORNO DE CAPITAL A LAS CAJAS
        // =================================================================
        if (finalCapital > 0) {
            const tipoCaja = metodoPago === 'transferencia' ? 'banco' : 'efectivo';
            
            const { data: cajasTarget, error: errCajas } = await supabaseClient
                .from('cajas_capital')
                .select('id, saldo_actual')
                .eq('tipo', tipoCaja)
                .order('id', { ascending: true })
                .limit(1);

            if (!errCajas && cajasTarget && cajasTarget.length > 0) {
                const cajaId = cajasTarget[0].id;
                const saldoActualCaja = parseFloat(cajasTarget[0].saldo_actual || 0);
                const nuevoSaldoCaja = saldoActualCaja + finalCapital;

                await supabaseClient
                    .from('cajas_capital')
                    .update({ saldo_actual: nuevoSaldoCaja })
                    .eq('id', cajaId);

                const cli = creditoSeleccionadoCobro.clientes || {};
                const nombreCliente = `${cli.nombres || ''} ${cli.apellidos || ''}`.toUpperCase().trim();
                
                let creTextHistorial = "CRE # ?";
                const lblRefH = document.getElementById('lbl-recaudacion-ref');
                if (lblRefH && lblRefH.innerText) {
                    const matchH = lblRefH.innerText.match(/CRE\s*#[^|]+/);
                    if (matchH) {
                        const textoCrudoH = matchH[0].trim();
                        const matchLetraH = textoCrudoH.match(/\[.*?\]/);
                        creTextHistorial = matchLetraH ? `CRE #${matchLetraH[0]}` : textoCrudoH;
                    }
                }

                await supabaseClient
                    .from('historial_capital')
                    .insert([{
                        caja_id: cajaId,
                        monto: finalCapital,
                        concepto: `RECUPERACIÓN: Abono #${numeroNuevoPago} | ${creTextHistorial} | ${nombreCliente}`
                    }]);
            } else {
                console.warn(`⚠️ No se encontró una caja tipo '${tipoCaja}' para retornar el capital.`);
            }
        }

        // =================================================================
        // 🧮 CÁLCULO DE SALDO RESIDUAL Y VALIDACIÓN DE LIQUIDACIÓN
        // =================================================================
        const nuevoSaldo = parseFloat((saldoRealTotal - montoInput).toFixed(2));
        const esCancelacionTotal = nuevoSaldo <= 0;

        // =================================================================
        // 🔥 EXTRACCIÓN DIRECTA DEL WHATSAPP
        // =================================================================
        const cli = creditoSeleccionadoCobro.clientes || {};
        let numeroCliente = cli.whatsapp; 

        if (!numeroCliente) {
            const { data: infoClienteDB } = await supabaseClient
                .from('clientes')
                .select('whatsapp')
                .eq('id', creditoSeleccionadoCobro.cliente_id)
                .single();
                
            if (infoClienteDB && infoClienteDB.whatsapp) {
                numeroCliente = infoClienteDB.whatsapp;
            }
        }

        // =================================================================
        // 🚀 LÓGICA INTELIGENTE DE ENVÍO DE SMS
        // =================================================================
        if (enviarSMS) {
            if (!numeroCliente) {
                alert("⚠️ El SMS NO se envió: Este cliente no tiene número en la BD.");
            } else if (typeof enviarSMSAutomatico !== 'function') {
                alert("⚠️ El SMS NO se envió: Función 'enviarSMSAutomatico' no detectada.");
            } else {
                try {
                    const nombre = `${cli.nombres} ${cli.apellidos}`.toUpperCase();
                    const iN = (cli.nombres || '').trim().charAt(0);
                    const iA = (cli.apellidos || '').trim().charAt(0);
                    const u4 = (cli.cedula || '').trim().slice(-4);
                    const refFinal = `${iN}${iA}-${u4}`.toUpperCase();
                    
                    let creText = "CRE # ?";
                    const lblRef = document.getElementById('lbl-recaudacion-ref');
                    if (lblRef && lblRef.innerText) {
                        const match = lblRef.innerText.match(/CRE\s*#[^|]+/);
                        if (match) {
                            const textoCrudo = match[0].trim();
                            const matchLetra = textoCrudo.match(/\[.*?\]/);
                            creText = matchLetra ? `CRE #${matchLetra[0]}` : textoCrudo;
                        }
                    }

                    // 🔥 FÓRMULA ALPHA SMS COMPACTA (Mes en letras)
                    const ahora = new Date();
                    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

                    const diaSemana = dias[ahora.getDay()];
                    const numDia = String(ahora.getDate()).padStart(2, '0');
                    const mesNombre = meses[ahora.getMonth()];
                    const anioCorto = String(ahora.getFullYear()).slice(-2);

                    let horas = ahora.getHours();
                    let minutos = String(ahora.getMinutes()).padStart(2, '0');
                    const ampm = horas >= 12 ? 'p.m.' : 'a.m.';
                    horas = horas % 12; horas = horas ? horas : 12;
                    horas = String(horas).padStart(2, '0');

                    const fechaHoraSMS = `${diaSemana} ${numDia}/${mesNombre}/${anioCorto} | ${horas}:${minutos} ${ampm}`;
                    // 🔥 MAGIA: Preparamos la línea del método para ver si lleva banco
                    let infoMetodo = `💳 Método: ${metodoPago.toUpperCase()}`;
                    if (metodoPago === 'transferencia' && detallesBanco !== "") {
                        infoMetodo += `\n🏦 Banco: ${detallesBanco}`;
                    }

                    let msjSalida = "";

                    if (esCancelacionTotal) {
                        msjSalida = `=== SISTEMA ALPHA ===\n${fechaHoraSMS}\n\n🆔 Ref: ${refFinal} | ${creText}\n👤 Cliente: ${nombre}\n\n🎉 ¡CONTRATO CANCELADO AL 100%! 🎉\n\nTe notificamos de manera oficial que tu crédito ha sido liquidado exitosamente en nuestra base de datos.\n\n✅ Pago de Cierre: #${numeroNuevoPago}\n💰 Monto Recibido: $${montoInput.toFixed(2)}\n📉 Saldo Pendiente: $0.00\n${infoMetodo}\n📊 Récord Crediticio: EXCELENTE / IMPECABLE\n\nQueremos agradecer enormemente tu compromiso y puntualidad. ¡Tienes las puertas totalmente abiertas para tu siguiente solicitud cuando la requieras! 🚀\n\n🚫 POR FAVOR, NO RESPONDER A ESTE MENSAJE.`;
                    } else {
                        const cuotasTotales = parseInt(creditoSeleccionadoCobro.num_cuotas) || 1;
                        const valorDeCuota = parseFloat(creditoSeleccionadoCobro.valor_cuota) || 1;
                        let cuotasPendientes = Math.ceil(nuevoSaldo / valorDeCuota);
                        if (cuotasPendientes < 0) cuotasPendientes = 0;

                        msjSalida = `=== SISTEMA ALPHA ===\n${fechaHoraSMS}\n\n🆔 Ref: ${refFinal} | ${creText}\n👤 Cliente: ${nombre}\n\nHola, aquí tienes el respaldo de tu abono.\n\n✅ Pago: #${numeroNuevoPago}\n💰 Monto: $${montoInput.toFixed(2)}\n📉 Saldo: $${nuevoSaldo.toFixed(2)}\n🔢 Cuotas: ${cuotasPendientes}/${cuotasTotales}\n${infoMetodo}\n\nConserva este msj. ¡Gracias!\n🚫 POR FAVOR, NO RESPONDER A ESTE MENSAJE.`;
                    }
                    
                    // 1. Envía el recibo original al cliente
                    await enviarSMSAutomatico(numeroCliente.toString(), msjSalida);

                    // 🕒 PAUSA DE 2 SEGUNDOS: Evitamos colapso de red
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // 2. 🔥 COPIA DE AUDITORÍA PARA EL GERENTE
                    const numeroGerente = "0939836191";
                    if (numeroCliente.toString().trim() !== numeroGerente) {
                        // Detectamos si fue un abono normal o si liquidó toda la deuda
                        const etiquetaAuditoria = esCancelacionTotal ? "[COPIA LIQUIDACIÓN]" : "[COPIA NUEVO ABONO]";
                        await enviarSMSAutomatico(numeroGerente, `${etiquetaAuditoria}\n\n${msjSalida}`);
                    }
                    console.log("✅ SMS enviado al cliente y copia al gerente.");

                } catch (errorSMS) {
                    alert(`❌ Falló el envío del SMS: ${errorSMS.message}`);
                }
            }
        }

        if (esCancelacionTotal) {
            await supabaseClient
                .from('creditos')
                .update({ estado: 'finalizado', acuerdo_pago: '' })
                .eq('id', creditoSeleccionadoCobro.id);
        }

        // =================================================================
        // 🔥 TICKET DIGITAL DINÁMICO
        // =================================================================
        const ticketDiv = document.createElement('div');
        
        ticketDiv.style.cssText = esCancelacionTotal
            ? "position:fixed; top:15%; left:30%; width:40%; background:white; padding:30px; border-radius:15px; box-shadow:0 10px 25px rgba(0,0,0,0.3); z-index:9999; border:3px solid #8b5cf6; text-align:center;"
            : "position:fixed; top:15%; left:30%; width:40%; background:white; padding:30px; border-radius:15px; box-shadow:0 10px 25px rgba(0,0,0,0.3); z-index:9999; border:2px solid #10b981; text-align:center;";
        
        const f = new Date();
        const fechaHoraExacta = `${f.toLocaleDateString()} ${f.getHours()}:${String(f.getMinutes()).padStart(2, '0')}`;
        
        let btnWhatsApp = "";
        if (numeroCliente) {
            let numeroWA = numeroCliente.toString().trim();
            if (numeroWA.startsWith('0')) numeroWA = numeroWA.substring(1);
            
            const msjWP = esCancelacionTotal
                ? `¡Felicidades ${cli.nombres}! Confirmamos tu pago final de $${montoInput.toFixed(2)}. Tu crédito ha sido CANCELADO AL 100% con récord impecable. ¡Gracias por tu puntualidad! 🚀`
                : `Hola ${cli.nombres}, confirmamos tu PAGO #${numeroNuevoPago} de $${montoInput.toFixed(2)}. ¡Gracias por tu puntualidad!`;
                
            const url = `https://wa.me/593${numeroWA}?text=${encodeURIComponent(msjWP)}`;
            btnWhatsApp = `<a href="${url}" target="_blank" style="padding:10px 20px; background:#25d366; color:white; text-decoration:none; border-radius:6px; font-weight:bold;">Enviar WhatsApp 📲</a>`;
        }

        const cabeceraTicket = esCancelacionTotal 
            ? `<h2 style="color:#8b5cf6; margin-bottom:5px;">🏆 ¡CRÉDITO LIQUIDADO! 🏆</h2>
               <p style="font-size:14px; color:#6d28d9; font-weight:900; margin:0 0 10px 0;">Felicite al cliente por su récord impecable</p>`
            : `<h2 style="color:#10b981; margin-bottom:5px;">✅ ¡Cobro Exitoso!</h2>`;

        ticketDiv.innerHTML = `
            ${cabeceraTicket}
            <p style="font-size:18px; font-weight:bold; color:#0f172a; margin:5px 0;">Pago #${numeroNuevoPago} ${esCancelacionTotal ? '(CIERRE)' : ''}</p>
            <p style="font-size:14px; color:#475569; margin-bottom:15px;">📅 ${fechaHoraExacta}</p>
            <div style="text-align:left; font-family:monospace; background:#f8fafc; padding:15px; border-radius:8px;">
                <p><strong>Cliente:</strong> ${cli.nombres} ${cli.apellidos}</p>
                <p><strong>Total Abono:</strong> $${montoInput.toFixed(2)}</p>
                <hr style="border: 1px dashed #cbd5e1;">
                <p style="color:#ca8a04;">💼 Interés: $${finalInteres.toFixed(2)}</p>
                <p style="color:#0284c7;">🏦 Capital: $${finalCapital.toFixed(2)}</p>
                <hr style="border: 1px dashed #cbd5e1;">
                <p><strong>Método:</strong> ${metodoPago.toUpperCase()}</p>
                ${esCancelacionTotal 
                    ? `<p style="color:#166534; font-weight:900; text-align:center; margin-top:10px; font-size:14px;">🎉 SALDO PENDIENTE: $0.00 🎉</p>` 
                    : `<p><strong>Saldo Restante:</strong> $${nuevoSaldo.toFixed(2)}</p>`
                }
            </div>
            <div style="margin-top:20px; display: flex; gap: 10px; justify-content: center;">
                <button id="btn-cerrar-ticket" style="padding:10px 20px; background:#0f172a; color:white; border:none; border-radius:6px; cursor:pointer;">Cerrar Ticket</button>
                ${btnWhatsApp}
            </div>
        `;
        
        document.body.appendChild(ticketDiv);

        const idCreditoActual = creditoSeleccionadoCobro.id;
        document.getElementById('btn-cerrar-ticket').onclick = () => {
            ticketDiv.remove();
            cargarEstadoCuentaCredito(idCreditoActual);
        };

       document.getElementById('monto-cobro-input').value = "";
        document.getElementById('input-detalles-banco').value = "";
        
        // 🔥 Limpiar los nuevos selectores VIP
        if(document.getElementById('select-banco')) document.getElementById('select-banco').value = "";
        if(document.getElementById('input-referencia')) document.getElementById('input-referencia').value = "";

        if (typeof cambiarMetodoPago === 'function') cambiarMetodoPago('efectivo');
        
        if (typeof cargarDatosCapital === 'function') cargarDatosCapital();

        // =================================================================
        // 🚀 NUEVO: REPROGRAMAR LA FECHA DE COBRO (CEREBRO DE PAGOS PARCIALES)
        // =================================================================
        if (!esCancelacionTotal && creditoSeleccionadoCobro.fecha_vencimiento_actual) {
            try {
                // 🔥 EL CANDADO DEL GERENTE (REGLA DE ALERTAS) 🔥
                const fVenc = new Date(creditoSeleccionadoCobro.fecha_vencimiento_actual + 'T12:00:00');
                const fHoy = new Date();
                
                fVenc.setHours(0,0,0,0);
                fHoy.setHours(0,0,0,0);
                
                // Si la fecha de vencimiento es de AYER o más antigua, está atrapado en Alertas.
                const estaEnAlertas = fVenc.getTime() < fHoy.getTime(); 

                if (estaEnAlertas) {
                    // 🔒 LUZ ROJA: El cliente está vencido y acaba de hacer un abono parcial.
                    // ¡SE ACTIVA EL CANDADO! La fecha NO SE MUEVE para que no escape de Alertas.
                    console.log("🔒 Candado Alpha Activo: El cliente está en mora. La fecha de vencimiento ha sido bloqueada.");
                } else {
                    // 🟢 LUZ VERDE: El cliente está al día. El sistema lo premia moviendo su fecha normal.
                    const { data: dbCredito } = await supabaseClient
                        .from('creditos')
                        .select('estado, acuerdo_pago, valor_cuota, frecuencia_pago')
                        .eq('id', creditoSeleccionadoCobro.id)
                        .single();

                    let freq = (dbCredito.frecuencia_pago || '').toUpperCase();
                    let valorDeUnaCuota = parseFloat(dbCredito.valor_cuota) || 1;

                    if (dbCredito.estado === 'congelado') {
                        const acuerdo = (dbCredito.acuerdo_pago || '').toLowerCase();
                        if (acuerdo.includes('mensual')) freq = 'MENSUAL';
                        else if (acuerdo.includes('quincenal')) freq = 'QUINCENAL';
                        else if (acuerdo.includes('semanal')) freq = 'SEMANAL';
                        else if (acuerdo.includes('diario')) freq = 'DIARIO';

                        const matchMonto = acuerdo.match(/\d+(\.\d+)?/);
                        if (matchMonto && parseFloat(matchMonto[0]) > 0) {
                            valorDeUnaCuota = parseFloat(matchMonto[0]);
                        }
                    }

                    const cuotasPagadasAntes = Math.floor(totalAbonadoPrevio / valorDeUnaCuota);
                    const cuotasPagadasDespues = Math.floor((totalAbonadoPrevio + montoInput) / valorDeUnaCuota);
                    const cuotasAvanzadas = cuotasPagadasDespues - cuotasPagadasAntes;

                    if (cuotasAvanzadas >= 1) {
                        let fechaObj = new Date(creditoSeleccionadoCobro.fecha_vencimiento_actual + 'T12:00:00');
                        
                        if (freq.includes('SEMANAL')) {
                            fechaObj.setDate(fechaObj.getDate() + (7 * cuotasAvanzadas));
                        } else if (freq.includes('QUINCENAL')) {
                            fechaObj.setDate(fechaObj.getDate() + (15 * cuotasAvanzadas));
                        } else if (freq.includes('MENSUAL')) {
                            fechaObj.setMonth(fechaObj.getMonth() + (1 * cuotasAvanzadas));
                        } else if (freq.includes('DIARIO')) {
                            fechaObj.setDate(fechaObj.getDate() + (1 * cuotasAvanzadas));
                        }
                        
                        const nuevaFechaVenc = fechaObj.toISOString().split('T')[0];

                        await supabaseClient
                            .from('creditos')
                            .update({ fecha_vencimiento_actual: nuevaFechaVenc })
                            .eq('id', creditoSeleccionadoCobro.id);

                        creditoSeleccionadoCobro.fecha_vencimiento_actual = nuevaFechaVenc;
                    }
                }
            } catch (errorFecha) {
                console.error("Error moviendo la fecha:", errorFecha);
            }
        }
        // =================================================================

    } catch (err) {
        alert("Error crítico al registrar abono: " + err.message);
    }
}

// =========================================================================
// 🔄 UNIR BANCO Y REFERENCIA AUTOMÁTICAMENTE
// =========================================================================
// =========================================================================
// 🔄 UNIR BANCO Y REFERENCIA AUTOMÁTICAMENTE (CON SIGNO # VIP)
// =========================================================================
function unirDetallesTransferencia() {
    const banco = document.getElementById('select-banco').value;
    const ref = document.getElementById('input-referencia').value.trim();
    const inputOculto = document.getElementById('input-detalles-banco');
    
    if (banco && ref) {
        // 🔥 Aquí está la magia: le inyectamos el espacio y el # automáticamente
        inputOculto.value = `${banco} #${ref}`; 
    } else {
        inputOculto.value = ""; 
    }
}


// =========================================================================
// 📄 GENERADOR DE ESTADO DE CUENTA CORPORATIVO (PDF) BLINDADO V2
// =========================================================================
async function generarEstadoCuentaPDF() {
    if (!creditoSeleccionadoCobro || !abonosClienteActual) {
        alert("⚠️ Por favor, selecciona un cliente y un crédito primero.");
        return;
    }

    try {
        const cli = creditoSeleccionadoCobro.clientes;
        const nombreCompleto = `${cli.nombres} ${cli.apellidos}`.toUpperCase();
        
        // 1. EXTRAER EL CRE CIFRADO
        let creText = "CRE # ?";
        const lblRef = document.getElementById('lbl-recaudacion-ref');
        if (lblRef && lblRef.innerText) {
            const match = lblRef.innerText.match(/CRE\s*#[^|]+/);
            if (match) {
                const textoCrudo = match[0].trim();
                const matchLetra = textoCrudo.match(/\[.*?\]/);
                if (matchLetra) {
                    creText = `CRE #${matchLetra[0]}`;
                } else {
                    creText = textoCrudo;
                }
            }
        }

        // 2. FORMATEAR LA FECHA ORIGINAL DEL CRÉDITO (CON MES EN LETRAS)
        let fechaEmisionCredito = "Fecha no disponible";
        if (creditoSeleccionadoCobro.fecha_emision) {
            const fObj = new Date(creditoSeleccionadoCobro.fecha_emision);
            const mesesArr = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            const diaSemana = fObj.toLocaleDateString('es-EC', { weekday: 'long' });
            const diaSemanaLimpio = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
            const numDia = String(fObj.getDate()).padStart(2, '0');
            const mesNombre = mesesArr[fObj.getMonth()];
            const anio = fObj.getFullYear();
            
            fechaEmisionCredito = `${diaSemanaLimpio} ${numDia}/${mesNombre}/${anio}`;
        }

        // Inicializar jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // --- ENCABEZADO CORPORATIVO ---
        doc.setFontSize(22);
        doc.setTextColor(16, 185, 129); // Verde Alpha
        doc.text("SISTEMA ALPHA V5", 14, 20);
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text("ESTADO DE CUENTA OFICIAL", 14, 28);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        const hoy = new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        doc.text(`Impreso: ${hoy}`, 14, 34);

       // --- 🧠 CEREBRO DEL PDF INTELIGENTE: LEER LA PANTALLA ---
        const panelUI = document.body.innerText;
        
        // 1. Detectar Estados Especiales Visuales (Ojos del PDF)
        const tieneBannerAcuerdo = panelUI.includes("ACUERDO DE REFINANCIAMIENTO ACTIVO");
        const esRefinanciado = panelUI.includes("(Capital Refinanciado)");
        const incluyeMora = panelUI.includes("de mora)");
        
        let textoAcuerdo = "Acuerdo de Refinanciamiento";
        if (tieneBannerAcuerdo) {
            const match = panelUI.match(/ACUERDO DE REFINANCIAMIENTO ACTIVO[\s\S]*?"([^"]+)"/i);
            if (match) textoAcuerdo = match[1];
        }

        // --- DATOS DEL CLIENTE Y CRÉDITO ---
        doc.setDrawColor(200, 200, 200);
        doc.line(14, 38, 196, 38); // Línea separadora
        
        let startYDatos = 46; 

        // 🌟 BANNER AMARILLO VIP (Solo si está visible en pantalla) 🌟
        if (tieneBannerAcuerdo) {
             doc.setFillColor(254, 240, 138); 
             doc.roundedRect(14, 42, 182, 12, 2, 2, 'F');
             doc.setTextColor(161, 98, 7); 
             doc.setFontSize(10);
             doc.setFont(undefined, 'bold');
             doc.text("ACUERDO DE REFINANCIAMIENTO ACTIVO", 20, 47);
             doc.setFont(undefined, 'normal');
             doc.text(`"${textoAcuerdo}"`, 20, 52);
             startYDatos = 62; 
             doc.setTextColor(0, 0, 0); 
        }

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        
        // Columna Izquierda 
        doc.text(`Cliente: ${nombreCompleto}`, 14, startYDatos);
        doc.text(`Cédula: ${cli.cedula}`, 14, startYDatos + 6);
        doc.text(`Referencia: ${creText}`, 14, startYDatos + 12); 
        doc.text(`Fecha de Crédito: ${fechaEmisionCredito}`, 14, startYDatos + 18); 

       // Columna Derecha (Valores base)
        let totalPagar = parseFloat(creditoSeleccionadoCobro.total_pagar).toFixed(2);
        
        // 🔥 🧠 CEREBRO VIP: Leer el "Total original" directo de la pantalla
        const matchTotal = panelUI.match(/Total del Crédito original:\s*\$([\d,.]+)/i);
        if (matchTotal) {
            totalPagar = matchTotal[1]; // Atrapamos el 120.00 limpiecito que se ve en la interfaz
        }

        const saldoActual = parseFloat(creditoSeleccionadoCobro.saldoNeto).toFixed(2);
        const cuotaFija = parseFloat(creditoSeleccionadoCobro.valor_cuota).toFixed(2);
        
        const cuotasTotales = parseInt(creditoSeleccionadoCobro.num_cuotas) || 1;
        let cuotasPendientes = Math.ceil(parseFloat(saldoActual) / parseFloat(cuotaFija));
        if (cuotasPendientes < 0) cuotasPendientes = 0;

        doc.text(`Total del Crédito: $${totalPagar}`, 120, startYDatos);
        
        if (tieneBannerAcuerdo) {
            doc.setTextColor(217, 119, 6); 
            doc.setFont(undefined, 'bold');
            doc.text(`Valor de Cuota: $${cuotaFija} (CUENTA CONGELADA)`, 120, startYDatos + 6);
            doc.text(`N° de Cuotas: N/A (${cuotasPendientes} Pendientes Aprox.)`, 120, startYDatos + 12);
            doc.setTextColor(0, 0, 0); 
            doc.setFont(undefined, 'normal');
        } else {
            doc.text(`Valor de Cuota: $${cuotaFija}`, 120, startYDatos + 6);
            doc.text(`N° de Cuotas: ${cuotasTotales} (${cuotasPendientes} Pendientes)`, 120, startYDatos + 12);
        }

        // 🔥 🧠 RENDERIZADO INTELIGENTE DEL SALDO SEGÚN LA PANTALLA 🔥
        let inicioTablaY = startYDatos + 32; 

        if (esRefinanciado) {
            // Caso 1: Botón Morado (Capital Refinanciado detectado en pantalla)
            doc.setTextColor(147, 51, 234); // Color Morado elegante
            doc.setFont(undefined, 'bold');
            doc.text(`Estado: CAPITAL REFINANCIADO`, 120, startYDatos + 18);
            doc.setTextColor(0, 0, 0);
            doc.text(`Saldo Pendiente Actual: $${saldoActual}`, 120, startYDatos + 24);
            doc.setFont(undefined, 'normal');
            inicioTablaY = startYDatos + 36;
            
      } else if (incluyeMora) {
            // Caso 2: Tiene Mora en pantalla
            const moraPDF = parseFloat(creditoSeleccionadoCobro.monto_mora) || 0;
            doc.setTextColor(220, 38, 38); 
            doc.setFont(undefined, 'bold');
            doc.text(`Mora Acumulada: $${moraPDF.toFixed(2)}`, 120, startYDatos + 18);
            
            doc.setTextColor(0, 0, 0);
            const deudaTotalMora = (parseFloat(saldoActual) + moraPDF).toFixed(2);
            doc.text(`Deuda Total a Pagar: $${deudaTotalMora}`, 120, startYDatos + 24);
            
            // 🔥 VIP: Eliminamos el "Saldo de Capital" para evitar excusas del cliente
            doc.setFont(undefined, 'normal');
            inicioTablaY = startYDatos + 36; // Subimos la tabla un poquito para compensar el espacio
            
        } else {
            // Caso 3: Crédito normal al día
            doc.setFont(undefined, 'bold');
            doc.text(`Saldo Pendiente (Al día): $${saldoActual}`, 120, startYDatos + 18);
            doc.setFont(undefined, 'normal');
            inicioTablaY = startYDatos + 28;
        }
        // --- MATEMÁTICA PARA LA TABLA HISTÓRICA ---
        let abonosOrdenados = [...abonosClienteActual].sort((a, b) => new Date(a.fecha_pago) - new Date(b.fecha_pago));
        
        let saldoEnTransito = parseFloat(creditoSeleccionadoCobro.total_pagar);
        const filasTabla = [];

        abonosOrdenados.forEach((abono) => {
            const fPago = new Date(abono.fecha_pago);
            const diaNombre = fPago.toLocaleDateString('es-EC', { weekday: 'short' }); 
            
            const mesesArr = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            const numDia = String(fPago.getDate()).padStart(2, '0');
            const mesNombre = mesesArr[fPago.getMonth()];
            const anio = fPago.getFullYear();
            
            const diaNum = `${numDia}/${mesNombre}/${anio}`; 
            const horaExacta = fPago.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }); 
            
            const fechaTabla = `${diaNombre}. ${diaNum} - ${horaExacta}`;
            const montoPagado = parseFloat(abono.abono_total);
            
            saldoEnTransito = saldoEnTransito - montoPagado;
            if (saldoEnTransito < 0) saldoEnTransito = 0;

            filasTabla.push([
                abono.numero_pago,
                fechaTabla,
                abono.forma_pago ? abono.forma_pago.toUpperCase() : 'EFECTIVO',
                `$${montoPagado.toFixed(2)}`,
                `$${saldoEnTransito.toFixed(2)}`
            ]);
        });
// --- DIBUJAR LA TABLA PRINCIPAL ---
        doc.autoTable({
            startY: inicioTablaY, // Variable Dinámica que respeta el espacio
            head: [['N° Pago', 'Fecha y Hora Exacta', 'Método', 'Abono', 'Saldo Restante']],
            body: filasTabla,
            theme: 'striped',
            headStyles: { fillColor: [15, 23, 42] }, 
            styles: { fontSize: 9, cellPadding: 3 }, 
            columnStyles: {
                0: { halign: 'center', cellWidth: 15 },
                1: { cellWidth: 55 },
                3: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] }, 
                4: { halign: 'right', fontStyle: 'bold' } 
            }
        });

        let finalY = doc.lastAutoTable.finalY || inicioTablaY;

        // 📜 --- ANEXO SEGURO: HISTORIAL DE CASTIGOS (CONECTADO A SUPABASE) --- 📜
        try {
            // Vamos directo a la base de datos a traer las moras de este crédito
            const { data: historial, error } = await supabaseClient
                .from('historial_moras')
                .select('*')
                .eq('credito_id', creditoSeleccionadoCobro.id)
                .order('fecha_registro', { ascending: false });

            if (!error && historial && historial.length > 0) {
                finalY += 10; // Espacio estético después de la primera tabla
                
                // Título del anexo
                doc.setFontSize(10);
                doc.setTextColor(220, 38, 38); 
                doc.setFont(undefined, 'bold');
                doc.text("ANEXO: HISTORIAL DE SANCIONES Y REFINANCIAMIENTOS", 14, finalY);
                
                // Mapeo usando los nombres de columna correctos de su base de datos
                const filasCastigos = historial.map(h => {
                    const f = new Date(h.fecha_registro);
                    const mesesArr = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
                    const fechaStr = `${f.getDate()} ${mesesArr[f.getMonth()]} ${f.getFullYear()}`; 
                    
                    const tipo = h.tipo_accion || "Mora s/ Capital";
                    const monto = parseFloat(h.monto_castigo || 0).toFixed(2);
                    
                    return [fechaStr, tipo, `$${monto}`];
                });

                // Dibujar la tabla de castigos en el PDF
                doc.autoTable({
                    startY: finalY + 4,
                    head: [['FECHA', 'TIPO DE SANCIÓN', 'MONTO']],
                    body: filasCastigos,
                    theme: 'plain', 
                    headStyles: { fillColor: [254, 242, 242], textColor: [220, 38, 38], fontStyle: 'bold' },
                    styles: { fontSize: 8, cellPadding: 3 },
                    columnStyles: {
                        0: { cellWidth: 35 },
                        1: { cellWidth: 'auto' },
                        2: { halign: 'right', fontStyle: 'bold', textColor: [220, 38, 38], cellWidth: 30 }
                    }
                });
                
                finalY = doc.lastAutoTable.finalY; // Actualizamos el nivel para el pie de página
            }
        } catch (errSupabase) {
            console.warn("No se pudo cargar el historial de moras para el PDF", errSupabase);
        }

        // --- PIE DE PÁGINA LEGAL ---
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.setFont(undefined, 'normal');
        doc.text("Este documento es un comprobante de auditoría emitido por Sistema Alpha V5.", 14, finalY + 15);
        doc.text("Las fechas y horas exactas garantizan la validez e inmutabilidad de cada abono.", 14, finalY + 20);

        // --- DESCARGAR EL PDF ---
        doc.save(`Estado_Cuenta_${cli.cedula}.pdf`);
        
    } catch (error) {
        alert("❌ Error al generar el PDF: " + error.message);
        console.error(error);
    }
}
// =========================================================================
// 📲 ENVÍO DE ESTADO DE CUENTA POR SMS (EQUILIBRIO PERFECTO: RÁPIDO Y DETALLADO)
// =========================================================================
async function enviarResumenSMS() {
    if (!creditoSeleccionadoCobro) {
        alert("⚠️ Selecciona un cliente primero.");
        return;
    }

    // 🛡️ BLINDAJE DE DATOS
    let cli = creditoSeleccionadoCobro.clientes || {};
    let numeroCliente = cli.whatsapp;

    if (!numeroCliente || numeroCliente.trim() === "") {
        const { data: infoDB } = await supabaseClient
            .from('clientes')
            .select('whatsapp')
            .eq('id', creditoSeleccionadoCobro.cliente_id)
            .single();
        if (infoDB && infoDB.whatsapp) numeroCliente = infoDB.whatsapp;
    }

    if (!numeroCliente || numeroCliente.trim() === "") {
        alert("❌ Error: Este cliente NO tiene un número de WhatsApp registrado.");
        return;
    }

    const cobrar = confirm("💰 SERVICIO DE AUDITORÍA SMS\n\n¿Deseas cobrar $1.00 por el envío de este estado de cuenta detallado?\n\n🟢 ACEPTAR = Cobrar $1.00\n🔴 CANCELAR = Envío GRATIS (Cortesía)");

    if (cobrar) {
        try {
            const { data: cajaData } = await supabaseClient.from('cajas_capital').select('saldo_actual').eq('id', 1).single();
            await supabaseClient.from('cajas_capital').update({ saldo_actual: parseFloat(cajaData.saldo_actual) + 1.00 }).eq('id', 1);
            await supabaseClient.from('historial_capital').insert([{
                caja_id: 1,
                monto: 1.00,
                concepto: `🟢 INGRESO: Servicio Estado de Cuenta SMS - ${cli.nombres} ${cli.apellidos}`
            }]);
            if (typeof cargarDatosCapital === 'function') cargarDatosCapital();
        } catch (e) { console.error("Error al cobrar:", e); }
    }

    // 1. Extraer CRE cifrado
    let creText = "CRE # ?";
    const lblRef = document.getElementById('lbl-recaudacion-ref');
    if (lblRef && lblRef.innerText) {
        const match = lblRef.innerText.match(/CRE\s*#[^|]+/);
        if (match) {
            const matchLetra = match[0].match(/\[.*?\]/);
            creText = matchLetra ? `CRE #${matchLetra[0]}` : match[0].trim();
        }
    }

    // 2. Formatear Fecha "Impreso" (Ej: domingo 12 de julio de 2026)
    const ahora = new Date();
    // Añadimos 'weekday: long' para forzar el día de la semana y quitamos comas
    let fechaImpreso = ahora.toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).replace(',', '');
    const horaImpreso = ahora.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });

    // 3. Formatear Fecha Original (Ej: Sábado 11/julio/2026)
    let fechaEmisionCredito = "N/A";
    if (creditoSeleccionadoCobro.fecha_emision) {
        const fObj = new Date(creditoSeleccionadoCobro.fecha_emision);
        
        const diaSemana = fObj.toLocaleDateString('es-EC', { weekday: 'long' });
        const diaSemanaCap = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1); // "Sábado"
        
        const mesNombre = fObj.toLocaleDateString('es-EC', { month: 'long' }); // "julio"
        const diaNum = fObj.toLocaleDateString('es-EC', { day: '2-digit' }); // "11"
        const anioNum = fObj.toLocaleDateString('es-EC', { year: 'numeric' }); // "2026"
        
        fechaEmisionCredito = `${diaSemanaCap} ${diaNum}/${mesNombre}/${anioNum}`;
    }

   // 4. Montos y Cuotas (Con lectura visual inteligente)
    const panelUI = document.body.innerText;
    
    let totalPagar = parseFloat(creditoSeleccionadoCobro.total_pagar);
    const matchTotal = panelUI.match(/Total del Crédito original:\s*\$([\d,.]+)/i);
    if (matchTotal) totalPagar = parseFloat(matchTotal[1]); // Atrapa los $120.00 exactos

    let saldo = parseFloat(creditoSeleccionadoCobro.saldoNeto);
    const matchSaldo = panelUI.match(/Saldo Neto Pendiente:\s*\$([\d,.]+)/i);
    if (matchSaldo) saldo = parseFloat(matchSaldo[1]); // Atrapa el saldo real visible
    
    const cuotaFija = parseFloat(creditoSeleccionadoCobro.valor_cuota);
    const cuotasTotales = parseInt(creditoSeleccionadoCobro.num_cuotas) || 1;
    let cuotasPendientes = Math.ceil(saldo / cuotaFija);
    if (cuotasPendientes < 0) cuotasPendientes = 0;

    // 5. Historial (MÁXIMO LOS ÚLTIMOS 5 PAGOS + MAGIA INVERSA)
    let historialTxt = "";
    if (abonosClienteActual && abonosClienteActual.length > 0) {
        let abonosOrdenados = [...abonosClienteActual].sort((a, b) => new Date(a.fecha_pago) - new Date(b.fecha_pago));
        
        // Magia Matemática Inversa para que los saldos cuadren perfecto al centavo
        const totalAbonado = abonosOrdenados.reduce((sum, abono) => sum + parseFloat(abono.abono_total), 0);
        let saldoEnTransito = saldo + totalAbonado; 
        
        let abonosConSaldo = abonosOrdenados.map(abono => {
            saldoEnTransito -= parseFloat(abono.abono_total);
            if (saldoEnTransito < 0) saldoEnTransito = 0;
            return { ...abono, saldoRestante: saldoEnTransito };
        });

        // 🟢 Cortamos los últimos 5 pagos
        let ultimos5 = abonosConSaldo.slice(-5);
        
        historialTxt += `\n🧾 ÚLTIMOS 5 MOVIMIENTOS:\n`;
        ultimos5.forEach((abono) => {
            const fPago = new Date(abono.fecha_pago);
            const diaFormato = fPago.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' }); 
            const montoPagado = parseFloat(abono.abono_total);
            
            // Sintaxis de texto perfecta y compacta para SMS
            historialTxt += `• Pago #${abono.numero_pago} | ${diaFormato}\n  Abono: $${montoPagado.toFixed(2)} | Queda: $${abono.saldoRestante.toFixed(2)}\n`;
        });
        
        if (abonosConSaldo.length > 5) {
            const anteriores = abonosConSaldo.length - 5;
            historialTxt += `*(Y ${anteriores} pagos anteriores)*\n`;
        }
    } else {
        historialTxt += `\n🧾 MOVIMIENTOS:\nSin abonos registrados.\n`;
    }

    // 6. Ensamblar Mensaje Final
    const etiqueta = cobrar ? "[ESTADO DE CTA] val $1.00\n" : "";
    const msj = `=== SISTEMA ALPHA ===\n${etiqueta}Impreso: ${fechaImpreso} a las ${horaImpreso}\n\n🆔 ${creText}\n👤 Cliente: ${cli.nombres.toUpperCase()} ${cli.apellidos.toUpperCase()}\n💳 Cédula: ${cli.cedula || 'N/A'}\n📅 Fecha Crédito: ${fechaEmisionCredito}\n\n📊 Total Crédito: $${totalPagar.toFixed(2)}\n💵 Valor Cuota: $${cuotaFija.toFixed(2)}\n📉 Saldo Pendiente: $${saldo.toFixed(2)}\n🔢 N° Cuotas: ${cuotasTotales} (${cuotasPendientes} Pendientes)\n${historialTxt}\n¡Gracias por tu confianza!\n🚫 NO RESPONDER AL MENSAJE.`;

    // 🚀 1. DISPARO AL CLIENTE
    enviarSMSAutomatico(numeroCliente, msj);
    
    // 🕒 PAUSA DE 2 SEGUNDOS: Evitamos colapso del chip de MacroDroid
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 👮‍♂️ 2. DISPARO AL GERENTE (Magia VIP de Auditoría)
    const numeroGerente = "0939836191"; 
    if (numeroCliente.toString().trim() !== numeroGerente) {
        enviarSMSAutomatico(numeroGerente, `[COPIA RESUMEN SMS]\n\n${msj}`);
    }

    alert("✅ Resumen SMS enviado a: " + numeroCliente + "\n👮‍♂️ Copia de auditoría enviada al Gerente.");
}
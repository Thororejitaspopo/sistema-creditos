/* ==========================================================================
   1. CREDENCIALES CONFIGURADAS DE ACCESO A TU BASE DE DATOS SUPABASE
   ========================================================================== */
// Guarda la dirección web en la nube donde reside tu base de datos de Supabase
const SUPABASE_URL = "https://mxsvrxmwxgrgqrcanwwt.supabase.co";
// Almacena la llave pública de acceso requerida para realizar consultas de forma segura
const SUPABASE_ANON_KEY = "sb_publishable_0irYiV3D_rlOKayPYXHeIg_kdn5Kb1t";

// Inicialización de la instancia de cliente de Supabase
// Une la URL y la llave para activar de forma oficial el motor de conexión en tu sistema
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ==========================================================================
   2. VARIABLES DE CONTROL DE ESTADO GLOBAL
   ========================================================================== */
// Memoria local para búsquedas en caliente y carga de garantes
let listaClientesGlobal = []; 
// Centinela: null es modo Registro, si tiene número es modo Edición
let idClienteEditando = null;  
// Registra de forma fija la página en la que se encuentra navegando el administrador
let paginaActual = 1; 
// AJUSTE: He cambiado el límite de 15 a 10 para cumplir con tu requerimiento de 10 por página
const clientesPorPagina = 10; 

// codigo CRE#
// =========================================================================
// 🔐 MOTOR CRIPTOGRÁFICO ALPHA: TRADUCTOR DE NÚMEROS A LETRAS
// =========================================================================
function cifrarNumeroCredito(numero) {
    if (!numero && numero !== 0) return 'p';
    
    const numStr = numero.toString();
    let codigoOculto = '';
    
    const diccionario = {
        '1': 'h', '2': 'y', '3': 'r', '4': 'v', '5': 't',
        '6': 'n', '7': 'g', '8': 'j', '9': 'ñ', '0': 'p'
    };
    
    for (let i = 0; i < numStr.length; i++) {
        const digito = numStr[i];
        codigoOculto += diccionario[digito] || digito;
    }
    
    return codigoOculto;
}



// =========================================================================
// VARIABLE GLOBAL DE CONTROL FINANCIERO
// DESCRIPCIÓN: Almacena en la memoria del navegador la tasa base del sistema
//              para mantenerla disponible sin importar en qué pestaña esté.
// =========================================================================
let tasaBaseSistema = 20; 

// --------------------------------------------------------------------------
// CONTROL DE HISTORIAL Y AUDITORÍA - MODULO CAPITAL
// --------------------------------------------------------------------------
// Registra de forma fija la página del log de auditoría
let paginaActualHistorial = 1;            
// Límite estricto de 10 movimientos por página indicado por Miguel
const filasPorPaginaHistorial = 10;

/* ==========================================================================
   3. ARRANCADORES AUTOMÁTICOS AL INICIAR LA HOJA
   ========================================================================== */
// Detecta cuando el navegador termina de cargar el HTML para encender el sistema
document.addEventListener('DOMContentLoaded', () => {
    // Llama inmediatamente a la función que descarga los datos de la nube
    cargarClientes();
});





/* ==========================================================================
   5. LÓGICA DE CONTROL DE LA INTERFAZ (NAVIGATION INTERNA)
   ========================================================================== */

/**
 * Altera la visibilidad de los paneles del software según el botón seleccionado del menú.
 */
/**
 /* =========================================================================
 * Altera la visibilidad de los paneles del software según el botón seleccionado.
 * ========================================================================= */
function cambiarModulo(idModulo) {
    // 1. CONTROL DE INTERFAZ: Remueve la clase activa de todos los bloques y botones
    document.querySelectorAll('.modulo-contenido').forEach(mod => mod.classList.remove('active'));
    document.querySelectorAll('.btn-menu').forEach(btn => btn.classList.remove('active'));
    
    // 2. ACTIVACIÓN VISUAL: Añade la clase activa al div del módulo solicitado
    const moduloDestino = document.getElementById(`mod-${idModulo}`);
    if (moduloDestino) {
        moduloDestino.classList.add('active');
    }
    
    if(window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add('active');
    }

    // 3. DICCIONARIO DE TÍTULOS: Cambia dinámicamente el H1 y Subtítulo
    const titulos = {
        'inicio': ['Bienvenido, Administrator', 'Resumen general del estado de tu negocio.'],
        'consultar': ['Matriz de Consulta Rápida', 'Búsqueda instantánea de clientes y saldos.'],
        'clientes': ['Gestión de Clientes', 'Fichas técnicas y registro de usuarios.'],
        'creditos': ['Colocación de Créditos', 'Control de préstamos activos y tablas de cuotas.'],
        'pagos': ['Módulo de Recaudación', 'Ingreso de cobros y abonos diarios.'],
        'gastos': ['Gastos de Operación', 'Salidas de caja por conceptos administrativos.'],
        'capital': ['Bóveda de Capital', 'Monitoreo estricto del capital base recuperado.'],
        'interes': ['Bóveda de Utilidades', 'Acumulado neto de ganancias y moras ganadas.'],
        'cierre': ['Cuadre General', 'Verificación del efectivo físico disponible.'],
        'supervisores': ['Panel de Supervisión', 'Asignación y revisión de cuentas asignadas.'],
        'cobradores': ['Rutas de Cobranza', 'Rendimiento y dinero en posesión de los cobradores.'],
        'reportes': ['Reportes Ejecutivos', 'Métricas avanzadas de crecimiento financiero.'],
        'eliminar': ['Auditoría Estricta', 'Eliminación controlada de transacciones erróneas.'],
        
        // 🔥 AQUÍ AGREGAMOS NUESTRO NUEVO MÓDULO PARA QUE NO FALLE 🔥
        'gestion_mora': ['⚖️ Control de Cartera y Mora', 'Administración de créditos, penalizaciones y convenios.']
    };

    if (titulos[idModulo]) {
        document.getElementById('titulo-panel').innerText = titulos[idModulo][0];
        document.getElementById('subtitulo-panel').innerText = titulos[idModulo][1];
    }

    // 4. LÓGICA DE ACTIVACIÓN ESPECÍFICA POR MÓDULO
    
    // Si entramos a la pestaña de CRÉDITOS:
    if (idModulo === 'creditos') {
        if (typeof aplicarTasaAlAbrirModulo === 'function') aplicarTasaAlAbrirModulo(); 
        if (typeof cargarClientesDropdown === 'function') cargarClientesDropdown();
        if (typeof cargarHistorialCreditos === 'function') cargarHistorialCreditos(); 
    }

    // Si entramos a la pestaña de CAPITAL:
    if (idModulo === 'capital') {
        if (typeof inicializarModuloCapital === 'function') inicializarModuloCapital();
    }

    // 🔥 NUEVA REGLA: Si entramos a GESTIÓN Y MORA, cargar la tabla automáticamente
    if (idModulo === 'gestion_mora') {
        if (typeof cargarTablaGestionMora === 'function') cargarTablaGestionMora();
    }
}
window.cambiarModulo = cambiarModulo;







// =========================================================================
// 🤖 ROBOT DEL DASHBOARD (ACTUALIZA NÚMEROS EN TIEMPO REAL)
// =========================================================================
// =========================================================================
// 🤖 ROBOT DEL DASHBOARD (VERSIÓN DEFINITIVA: ASISTENTE DE VENCIMIENTOS)
// =========================================================================
// =========================================================================
// 🤖 ROBOT DEL DASHBOARD (VERSIÓN DEFINITIVA: ASISTENTE ULTRA DETALLADO)
// =========================================================================
// =========================================================================
// 🤖 ROBOT DEL DASHBOARD (VERSIÓN DEFINITIVA: ASISTENTE ULTRA DETALLADO + CRE)
// =========================================================================
// =========================================================================
// 🤖 ROBOT DEL DASHBOARD (VERSIÓN DEFINITIVA: AGRUPACIÓN MAGNÉTICA)
// =========================================================================
// =========================================================================
// 🤖 ROBOT DEL DASHBOARD (VERSIÓN DEFINITIVA: BUSCADOR RELÁMPAGO Y FILTROS)
// =========================================================================
// =========================================================================
// 🤖 ROBOT DEL DASHBOARD (VERSIÓN DEFINITIVA: CÁLCULO EXACTO POR MODALIDAD)
// =========================================================================
window.despertarRobotDashboard = async function() {
    try {
        const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const fechaHoy = new Date();
        let fechaString = fechaHoy.toLocaleDateString('es-ES', opcionesFecha);
        const txtFecha = document.getElementById('dash-fecha');
        if (txtFecha) txtFecha.innerText = fechaString.charAt(0).toUpperCase() + fechaString.slice(1);

        const { data: cajas } = await supabaseClient.from('cajas_capital').select('saldo_actual');
        if (cajas && cajas.length > 0) {
            let capitalTotalGeneral = 0;
            cajas.forEach(caja => capitalTotalGeneral += parseFloat(caja.saldo_actual || 0));
            if(document.getElementById('dash-caja')) document.getElementById('dash-caja').innerText = `$${capitalTotalGeneral.toFixed(2)}`;
        }

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

        // 🛑 CIRUGÍA 1: Agregamos 'frecuencia_pago' para que el Robot sepa si es Semanal o Quincenal
        const { data: creditos } = await supabaseClient
            .from('creditos')
            .select('id, monto_capital, total_pagar, monto_mora, valor_cuota, total_interes, estado, fecha_emision, num_cuotas, frecuencia_pago, clientes(nombres, apellidos, cedula, perfil_cobro), historial_pagos(abono_total), fecha_vencimiento_actual')
            .in('estado', ['activo', 'congelado']);

        if (creditos && creditos.length > 0) {
            let gananciaProyectada = 0;
            let cuentasCongeladas = 0;
            let metaHoy = 0;
            let deudaTotalEsperada = 0;
            let abonoGlobal = 0; 
            let alertasVencimiento = [];

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

                if (c.estado === 'activo') {
                    const fechaEmision = c.fecha_emision ? new Date(c.fecha_emision) : new Date();
                    
                   // 🛑 CIRUGÍA 2: EL MOTOR MULTIPLICADOR DE TIEMPO (CÁLCULO DE CADUCIDAD GLOBAL)
                    const numeroCuotas = parseInt(c.num_cuotas) || 30;
                    const frecuencia = (c.frecuencia_pago || '').toLowerCase();
                    
                    let multiplicador = 1; // Por defecto diario
                    if (frecuencia.includes('semanal')) multiplicador = 7;
                    else if (frecuencia.includes('quincenal')) multiplicador = 15;
                    else if (frecuencia.includes('mensual')) multiplicador = 30;
                    
                    // 1. Calculamos la Fecha de Caducidad Global (El fin del ciclo total para este crédito)
                    const diasTotalesCredito = numeroCuotas * multiplicador;
                    let fechaVencimientoAbsoluto = new Date(fechaEmision.getFullYear(), fechaEmision.getMonth(), fechaEmision.getDate());
                    fechaVencimientoAbsoluto.setDate(fechaVencimientoAbsoluto.getDate() + diasTotalesCredito);

                    // 2. LA REGLA DE ORO DEL GERENTE: Separación de mundos
                    let fechaVence; // 🔥 Usamos su nombre de variable original para no romper la pantalla
                    const esDiario = frecuencia.includes('diario') || frecuencia.includes('diaria');
                    const esMensualUnico = frecuencia.includes('mensual') && numeroCuotas === 1;

                    if (esDiario || esMensualUnico) {
                        // REGLA A: Los diarios y mensuales de 1 mes respetan su regla original (Intocables)
                        if (c.fecha_vencimiento_actual) {
                            const partes = c.fecha_vencimiento_actual.split('-');
                            fechaVence = new Date(partes[0], partes[1] - 1, partes[2]);
                        } else {
                            fechaVence = fechaVencimientoAbsoluto;
                        }
                    } else {
                        // REGLA B: Semanales, Quincenales y Mensuales (de 2 meses en adelante).
                        // Solo van a Alertas cuando pasa toda su vida útil (Ej: Las 4 semanas completas).
                        fechaVence = fechaVencimientoAbsoluto;
                        
                        // Si el gerente aplicó una sanción y pateó la fecha más allá de la caducidad global, la respetamos
                        if (c.fecha_vencimiento_actual) {
                            const partes = c.fecha_vencimiento_actual.split('-');
                            const fActual = new Date(partes[0], partes[1] - 1, partes[2]);
                            if (fActual > fechaVencimientoAbsoluto) {
                                fechaVence = fActual;
                            }
                        }
                    }
                    
                    const hoyLimpiado = new Date(fechaHoy.getFullYear(), fechaHoy.getMonth(), fechaHoy.getDate());
                    const venceLimpiado = new Date(fechaVence.getFullYear(), fechaVence.getMonth(), fechaVence.getDate());
                    
                    const diferenciaTiempo = venceLimpiado.getTime() - hoyLimpiado.getTime();
                    const diferenciaDias = Math.round(diferenciaTiempo / (1000 * 3600 * 24));
                    
                    const perfilCliente = c.clientes?.perfil_cobro || 'Normal';

                    const inicialN = c.clientes?.nombres ? c.clientes.nombres.charAt(0).toUpperCase() : '';
                    const inicialA = c.clientes?.apellidos ? c.clientes.apellidos.charAt(0).toUpperCase() : '';
                    const ultimos4 = c.clientes?.cedula ? c.clientes.cedula.slice(-4) : '0000';
                    const refBancaria = `${inicialN}${inicialA}-${ultimos4}`;

                    const numLocal = mapNumCreditoLocal[c.id] || 1;
                    let creCifrado = typeof cifrarNumeroCredito === 'function' ? cifrarNumeroCredito(numLocal).toUpperCase() : '';
                    let etiquetaCRE = creCifrado ? `CRE #${numLocal} [${creCifrado}]` : `CRE #${numLocal}`;

                    let emisionTxt = fechaEmision.toLocaleDateString('es-ES', opcionesFecha);
                    emisionTxt = emisionTxt.charAt(0).toUpperCase() + emisionTxt.slice(1);
                    
                    let venceTxt = fechaVence.toLocaleDateString('es-ES', opcionesFecha);
                    venceTxt = venceTxt.charAt(0).toUpperCase() + venceTxt.slice(1);

                    // Si la diferenciaDias es 0 o negativa, recién ahí está vencido
                    if (diferenciaDias < 0) {
                        alertasVencimiento.push({
                            idCredito: c.id,
                            refBancaria: refBancaria,
                            etiquetaCRE: etiquetaCRE,
                            nombre: `${c.clientes?.nombres} ${c.clientes?.apellidos}`.toUpperCase(),
                            capital: capitalPrestado,
                            cuotas: numeroCuotas,
                            frecuenciaTxt: c.frecuencia_pago ? c.frecuencia_pago.replace(/Cobro/i, '').trim() : 'Diario',
                            saldo: saldoPendiente,
                            abonado: totalAbonado,
                            mora: moraActual,
                            emisionTxt: emisionTxt,
                            venceTxt: venceTxt,
                            diasAtraso: Math.abs(diferenciaDias),
                            esHoy: diferenciaDias === 0,
                            perfil: perfilCliente
                        });
                    }
                }
            });

            const capitalEnLaCalle = deudaTotalEsperada - abonoGlobal;

            if(document.getElementById('dash-capital-calle')) document.getElementById('dash-capital-calle').innerText = `$${capitalEnLaCalle.toFixed(2)}`;
            if(document.getElementById('dash-congeladas')) document.getElementById('dash-congeladas').innerText = cuentasCongeladas;
            if(document.getElementById('dash-ganancia')) document.getElementById('dash-ganancia').innerText = `$${gananciaProyectada.toFixed(2)}`;
            if(document.getElementById('dash-meta-hoy')) document.getElementById('dash-meta-hoy').innerText = `$${metaHoy.toFixed(2)}`;

            if(document.getElementById('contador-alertas')) {
                document.getElementById('contador-alertas').innerText = `${alertasVencimiento.length} Vencido(s)`;
            }

            alertasVencimiento.sort((a, b) => {
                if (a.nombre < b.nombre) return -1;
                if (a.nombre > b.nombre) return 1;
                return b.diasAtraso - a.diasAtraso;
            });

            let htmlAlertas = '';
            if (alertasVencimiento.length > 0) {
                htmlAlertas = alertasVencimiento.map(alerta => {
                    const colorBorde = alerta.esHoy ? '#eab308' : '#ef4444';
                    const titulo = alerta.esHoy ? '¡VENCE HOY!' : `VENCIDO HACE ${alerta.diasAtraso} DÍAS`;
                    const badgePerfil = alerta.perfil === 'Social' 
                        ? `<span style="background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; border: 1px solid #bbf7d0;">🛡️ SOCIAL (No Multar)</span>`
                        : `<span style="background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; border: 1px solid #fecaca;">⚠️ NORMAL (Aplica Mora)</span>`;

                    return `
                    <div class="tarjeta-alerta-vencimiento" data-nombre="${alerta.nombre}" style="scroll-snap-align: start; scroll-snap-stop: always; margin-bottom:15px; background: white; border: 1px solid #e2e8f0; border-left: 5px solid ${colorBorde}; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
                        
                        <div style="background: #f8fafc; padding: 10px 15px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong style="color: #0f172a; font-size: 14px; display: block; margin-bottom: 4px;">${alerta.nombre}</strong>
                                <span style="background: #e0f2fe; color: #0284c7; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; border: 1px solid #bae6fd;">
                                    🆔 REF: ${alerta.refBancaria} | CRÉDITO #${alerta.idCredito} | ${alerta.etiquetaCRE}
                                </span>
                            </div>
                            <div style="text-align: right;">
                                <span style="background: ${alerta.esHoy ? '#fef08a' : '#fee2e2'}; color: ${alerta.esHoy ? '#854d0e' : '#991b1b'}; padding: 4px 8px; border-radius: 20px; font-weight: 900; font-size: 11px; display: inline-block;">
                                    ${titulo}
                                </span>
                            </div>
                        </div>
                        
                        <div style="padding: 12px 15px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; background: #f1f5f9; padding: 10px; border-radius: 6px; border: 1px dashed #cbd5e1;">
                                <div>
                                    <div style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: bold;">Capital Prestado</div>
                                    <div style="color: #0f172a; font-weight: 900; font-size: 13px;">$${alerta.capital.toFixed(2)} <span style="font-size:10px; font-weight:normal; color:#64748b;">(${alerta.cuotas} cuotas ${alerta.frecuenciaTxt})</span></div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: bold;">Saldo Deuda Actual</div>
                                    <div style="color: #ea580c; font-weight: 900; font-size: 14px;">$${alerta.saldo.toFixed(2)}</div>
                                </div>
                                <div style="grid-column: span 2; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 6px; margin-top: 2px;">
                                    <span style="color: #16a34a; font-size: 11px; font-weight: bold;">✅ Abonado: $${alerta.abonado.toFixed(2)}</span>
                                    <span style="color: #dc2626; font-size: 11px; font-weight: bold;">🚨 Mora Acumulada: $${alerta.mora.toFixed(2)}</span>
                                </div>
                            </div>

                            <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                                <div style="color: #475569; font-size: 11px; line-height: 1.6;">
                                    <div style="display: flex; align-items: center; gap: 5px;">
                                        <span style="font-size: 14px;">📅</span> 
                                        <span>Emitido: <b style="color: #334155;">${alerta.emisionTxt}</b></span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 5px; margin-top: 4px;">
                                        <span style="font-size: 14px;">🚩</span> 
                                        <span>Vencimiento: <b style="color: #dc2626;">${alerta.venceTxt}</b></span>
                                    </div>
                                </div>
                                
                                <!-- 🔥 LLAMADA DIRECTA A SU FUNCIÓN MAESTRA 🔥 -->
                                <button onclick="abrirPanelSancion('${alerta.idCredito}', '${alerta.nombre.replace(/'/g, "\\'")}', ${alerta.capital}, 0, ${alerta.saldo}, 20, 'activo', '${alerta.etiquetaCRE}', 'REF: ${alerta.refBancaria}')" style="background: #0f172a; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-weight: bold; font-size: 11px; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" onmouseover="this.style.background='#1e293b'" onmouseout="this.style.background='#0f172a'">
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
                htmlAlertas = `
                <div style="text-align:center; padding:30px 10px;">
                    <div style="font-size: 40px; margin-bottom: 10px;">✅</div>
                    <p style="color:#10b981; font-weight:bold; margin: 0; font-size: 15px;">¡Día despejado, Gerente Miguel!</p>
                    <p style="color:#64748b; font-size: 12px; margin-top: 5px;">No hay créditos que se venzan hoy ni en periodo de gracia.</p>
                </div>`;
            }
            if(document.getElementById('dash-lista-vencimientos')) document.getElementById('dash-lista-vencimientos').innerHTML = htmlAlertas;
            
            if(document.getElementById('dash-lista-buenos')) document.getElementById('dash-lista-buenos').innerHTML = '<p style="text-align:center; color:#334155; padding:20px 0; font-size: 13px;">⭐ Analizando historial de pagos...</p>';
        }

        // 🌟 AQUÍ SE ENCIENDE LA RUTA DE COBRO DEL DÍA 🌟
        if (typeof cargarRutaCobroDia === 'function') cargarRutaCobroDia();

    } catch (error) {
        console.error("Error al despertar el robot:", error);
    }
};

// =========================================================================
// 🔍 BUSCADOR RELÁMPAGO PARA LAS ALERTAS (EL CEREBRO DEL FILTRO)
// =========================================================================
window.filtrarAlertasDash = function() {
    const textoInput = document.getElementById('buscador-alertas');
    if (!textoInput) return;
    
    const texto = textoInput.value.toUpperCase();
    const tarjetas = document.querySelectorAll('.tarjeta-alerta-vencimiento');
    
    tarjetas.forEach(tarjeta => {
        const nombre = tarjeta.getAttribute('data-nombre') || "";
        if (nombre.includes(texto)) {
            tarjeta.style.display = 'block';
        } else {
            tarjeta.style.display = 'none';
        }
    });
};

// Auto-ejecutar cuando se carga la página por primera vez
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(window.despertarRobotDashboard, 1000);
});

// =========================================================================
// 🕵️ ESPÍA SILENCIOSO PARA ACTUALIZAR EL DASHBOARD EN VIVO
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const moduloInicio = document.getElementById('mod-inicio');
    
    if (moduloInicio) {
        // El espía detecta cuando la pantalla de inicio es visible
        const espiaDashboard = new IntersectionObserver((entradas) => {
            if (entradas[0].isIntersecting) {
                // ¡El módulo de inicio apareció en pantalla! Despertamos al robot.
                if (typeof window.despertarRobotDashboard === 'function') {
                    window.despertarRobotDashboard();
                }
            }
        }, { threshold: 0.1 }); // Se activa apenas el 10% del panel asoma en pantalla

        espiaDashboard.observe(moduloInicio);
    }
});

// =========================================================================
// 📅 LLENADO AUTOMÁTICO DEL FILTRO DE REPORTES (MÁQUINA DEL TIEMPO)
// =========================================================================
function inicializarFiltroReportes() {
    const selectFiltro = document.getElementById('filtro-mes-reportes');
    if (!selectFiltro) return;

    const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const fechaActual = new Date();
    let mesActual = fechaActual.getMonth();
    let anioActual = fechaActual.getFullYear();

    // Limpiamos y ponemos las dos opciones principales
    selectFiltro.innerHTML = `
        <option value="todos">🌍 Ver Todo el Historial</option>
        <option value="actual" selected>📅 Mes Actual (${mesesNombres[mesActual]} ${anioActual})</option>
    `;

    // Generamos automáticamente los últimos 12 meses hacia atrás
    for (let i = 1; i <= 12; i++) {
        let d = new Date(anioActual, mesActual - i, 1);
        let mes = d.getMonth();
        let anio = d.getFullYear();
        let valorFiltro = `${anio}-${mes}`; // Código interno para el filtro (Ej: 2026-6)
        
        selectFiltro.innerHTML += `<option value="${valorFiltro}">🗓️ ${mesesNombres[mes]} ${anio}</option>`;
    }
}

// Hacemos que esto se ejecute en cuanto el sistema carga
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(inicializarFiltroReportes, 500);
});
// =========================================================================
// 🗺️ MOTOR INDEPENDIENTE: RUTA DE COBRO DEL DÍA (CLON PERFECTO DE ALERTAS)
// =========================================================================
async function cargarRutaCobroDia() {
    try {
        const contenedor = document.getElementById('contenedor-ruta-dia');
        const contador = document.getElementById('contador-ruta-dia');
        if (!contenedor) return;

        // 1. Conseguimos la fecha exacta de HOY para comparar
        const hoy = new Date();
        hoy.setHours(0,0,0,0); 
        
        const añoHoy = hoy.getFullYear();
        const mesHoy = String(hoy.getMonth() + 1).padStart(2, '0');
        const diaHoy = String(hoy.getDate()).padStart(2, '0');
        const stringHoy = `${añoHoy}-${mesHoy}-${diaHoy}`;

        // 🔥 EL CEREBRO DEL CRE: Contamos el historial para tener el número exacto
        const { data: historialTodos } = await supabaseClient.from('creditos').select('id, cliente_id').order('id', { ascending: true });
        const mapNumCreditoLocal = {};
        if (historialTodos) {
            const conteoPorCliente = {};
            historialTodos.forEach(hc => {
                conteoPorCliente[hc.cliente_id] = (conteoPorCliente[hc.cliente_id] || 0) + 1;
                mapNumCreditoLocal[hc.id] = conteoPorCliente[hc.cliente_id];
            });
        }

        // 2. Traemos a TODOS los clientes activos ¡USANDO EL NOMBRE DE TABLA CORRECTO: historial_pagos!
        const { data: creditosActivos, error } = await supabaseClient
            .from('creditos')
            .select(`
                id, saldo_pendiente, fecha_vencimiento_actual, frecuencia_pago, estado, valor_cuota, acuerdo_pago, total_pagar, num_cuotas, monto_capital, fecha_emision, monto_mora,
                clientes(nombres, apellidos, cedula),
                historial_pagos(abono_total)
            `)
            .in('estado', ['activo', 'congelado']);

        if (error) throw error;

        // 3. LA INTELIGENCIA DE FILTRADO
        const clientesDeHoy = creditosActivos.filter(credito => {
            const freq = (credito.frecuencia_pago || '').toLowerCase();
            const esDiario = freq.includes('diario') && credito.estado !== 'congelado';
            
            if (esDiario) return false;
            if (!credito.fecha_vencimiento_actual) return false;
            
            const fechaVencimiento = new Date(credito.fecha_vencimiento_actual + 'T00:00:00');
            if (fechaVencimiento.getTime() > hoy.getTime()) return false;
            
            if (credito.saldo_pendiente <= 0) return false; // Filtro de seguridad

            return true;
        });

        // 4. PINTAR LA RUTA
        if (!clientesDeHoy || clientesDeHoy.length === 0) {
            contenedor.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 30px 10px; font-size: 13px;">
                <span style="font-size: 35px; display:block; margin-bottom: 10px;">☕</span>
                <b>Ruta Libre.</b><br>No hay cobros especiales programados para el día de hoy.
            </div>`;
            if (contador) contador.innerText = "0 Visitas";
            return;
        }

        if (contador) contador.innerText = `${clientesDeHoy.length} Visita(s)`;

        let htmlTarjetas = '';

        clientesDeHoy.forEach(c => {
            const cli = c.clientes || {};
            const nombreCompleto = `${cli.nombres || ''} ${cli.apellidos || ''}`.trim().toUpperCase();
            
            const inicialN = cli.nombres ? cli.nombres.charAt(0).toUpperCase() : 'X';
            const inicialA = cli.apellidos ? cli.apellidos.charAt(0).toUpperCase() : 'X';
            const ultimos4 = cli.cedula ? String(cli.cedula).slice(-4) : '0000';
            
            // 🔥 CÁLCULO REAL DEL CRE PARA LA RUTA
            const numLocal = mapNumCreditoLocal[c.id] || 1;
            let creCifrado = typeof cifrarNumeroCredito === 'function' ? cifrarNumeroCredito(numLocal).toUpperCase() : 'H';
            const refCompleta = `🆔 REF: ${inicialN}${inicialA}-${ultimos4} | CRÉDITO #${c.id} | CRE #${numLocal} [${creCifrado}]`;

            let emitidoStr = 'N/A';
            if (c.fecha_emision) {
                const fEmi = new Date(c.fecha_emision);
                const diasArr = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                const mesesArr = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                emitidoStr = `${diasArr[fEmi.getDay()]}, ${fEmi.getDate()} de ${mesesArr[fEmi.getMonth()]} de ${fEmi.getFullYear()}`;
            }

            let vencimientoStr = 'N/A';
            if (c.fecha_vencimiento_actual) {
                const fVenc = new Date(c.fecha_vencimiento_actual + 'T12:00:00');
                const diasArr = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                const mesesArr = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                vencimientoStr = `${diasArr[fVenc.getDay()]}, ${fVenc.getDate()} de ${mesesArr[fVenc.getMonth()]} de ${fVenc.getFullYear()}`;
            }

            let etiqueta = (c.frecuencia_pago || 'Semanal').toUpperCase().replace('COBRO ', '').replace(' (LUN A SÁB)', '');
            let colorFondo = "#f0fdf4";
            let colorBorde = "#10b981";
            
            // =========================================================
            // 🔥 CÁLCULO DE ABONOS Y SALDOS EXACTAMENTE IGUAL A LAS ALERTAS 🔥
            // =========================================================
            const moraActual = parseFloat(c.monto_mora || 0);
            const deudaTotalReal = parseFloat(c.total_pagar || 0) + moraActual;
            
            const pagos = c.historial_pagos || [];
            const totalAbonado = pagos.reduce((sum, pago) => sum + (parseFloat(pago.abono_total) || 0), 0);
            
            let saldoPendiente = deudaTotalReal - totalAbonado;
            if (saldoPendiente < 0) saldoPendiente = 0;
            
            // =========================================================
            // 🔥 CALCULADORA DE CUOTAS ACUMULADAS
            // =========================================================
            let cuotasAcumuladas = 1;
            let diasAtraso = 0;
            
            const fechaVenc = new Date(c.fecha_vencimiento_actual + 'T00:00:00');

            if (fechaVenc.getTime() < hoy.getTime()) {
                diasAtraso = Math.floor((hoy.getTime() - fechaVenc.getTime()) / (1000 * 60 * 60 * 24));
                const freqStr = etiqueta; 
                
                if (freqStr.includes('SEMANAL')) {
                    cuotasAcumuladas = Math.floor(diasAtraso / 7) + 1;
                } else if (freqStr.includes('QUINCENAL')) {
                    cuotasAcumuladas = Math.floor(diasAtraso / 15) + 1;
                } else if (freqStr.includes('MENSUAL')) {
                    cuotasAcumuladas = Math.floor(diasAtraso / 30) + 1;
                }
            }

            let montoSugerido = parseFloat(c.valor_cuota) * cuotasAcumuladas;
            if (montoSugerido > saldoPendiente) {
                montoSugerido = saldoPendiente;
            }

            let textoCuota = `$${montoSugerido.toFixed(2)}`;
            let alertaAtraso = "";
            let textoDeudaAcumulada = "";

            if (fechaVenc.getTime() < hoy.getTime()) {
                colorFondo = "#fff1f2";
                colorBorde = "#ef4444";
                alertaAtraso = `<span style="color: #ef4444; background: #fee2e2; padding: 1px 4px; border-radius: 3px; font-size: 9px; font-weight: bold; margin-left: 5px;">⚠️ ¡Atraso: ${diasAtraso} días!</span>`;
                
                if (cuotasAcumuladas > 1) {
                    textoDeudaAcumulada = `<span style="color: #ef4444; font-size: 10px; display: block; font-weight: bold; margin-top: 2px;">(Debe ${cuotasAcumuladas} cuotas juntas)</span>`;
                    textoCuota = `<span style="color: #ef4444;">$${montoSugerido.toFixed(2)}</span>`; 
                }
            }

            if (c.estado === 'congelado') {
                etiqueta = "❄️ ACUERDO: " + (c.acuerdo_pago ? c.acuerdo_pago.substring(0, 20) + "..." : "Trato Especial");
                colorFondo = "#eff6ff";
                colorBorde = "#3b82f6";
                textoCuota = `Saldo: $${saldoPendiente.toFixed(2)}`;
                textoDeudaAcumulada = "";
            } else if (etiqueta.includes('MENSUAL') && parseInt(c.num_cuotas) === 1) {
                textoCuota = `$${saldoPendiente.toFixed(2)}`;
            }

            let etiquetaCapitalizada = etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1).toLowerCase();

            htmlTarjetas += `
            <div style="border: 1px solid ${colorFondo}; background: #ffffff; border-radius: 8px; padding: 12px; margin-bottom: 10px; border-left: 4px solid ${colorBorde}; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <div>
                        <div style="font-weight: 900; font-size: 13px; color: #1e293b;">${nombreCompleto}</div>
                        <div style="font-size: 10px; color: ${colorBorde}; font-weight: bold; margin-top: 3px; display: flex; align-items: center; flex-wrap: wrap; gap: 4px;">
                            <span style="text-transform: uppercase;">${etiqueta}</span> ${alertaAtraso}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 10px; color: #64748b; display: block;">Sugerido:</span>
                        <span style="font-weight: 900; font-size: 16px; color: #047857;">${textoCuota}</span>
                        ${textoDeudaAcumulada}
                    </div>
                </div>

                <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 12px 10px; margin-bottom: 10px; font-size: 11px; color: #334155;">
                    <div style="margin-bottom: 10px;">
                        <span style="background: #e0f2fe; color: #0284c7; font-weight: bold; padding: 3px 6px; border-radius: 4px; border: 1px solid #bae6fd; font-size: 10px;">
                            ${refCompleta}
                        </span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; padding-left: 6px; padding-right: 6px;">
                        <div>
                            <span style="color: #64748b; font-size: 9px; display: block; text-transform: uppercase;">CAPITAL PRESTADO</span>
                            <span style="font-weight: bold; color: #1e293b; font-size: 12px;">$${parseFloat(c.monto_capital || 0).toFixed(2)}</span>
                            <span style="color: #64748b; font-size: 10px;">(${c.num_cuotas} cuotas 🗓️ ${etiquetaCapitalizada})</span>
                        </div>
                        <div style="text-align: right;">
                            <span style="color: #64748b; font-size: 9px; display: block; text-transform: uppercase;">SALDO DEUDA ACTUAL</span>
                            <span style="font-weight: bold; color: #b91c1c; font-size: 12px;">$${saldoPendiente.toFixed(2)}</span>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding-left: 6px; padding-right: 6px; align-items: center;">
                        <span style="color: #16a34a; font-size: 11px; font-weight: bold;">✅ Abonado: $${totalAbonado.toFixed(2)}</span>
                        <span style="color: #ef4444; font-size: 11px; font-weight: bold;">🚨 Mora Acumulada: $${moraActual.toFixed(2)}</span>
                    </div>
                    
                    <div style="background: #f1f5f9; padding: 6px 10px; border-radius: 4px; font-size: 10px;">
                        <div style="margin-bottom: 4px;"><span style="color: #475569;">🗓️ <b>Emitido:</b> ${emitidoStr}</span></div>
                        <div><span style="color: #475569;">🚩 <b>Vencimiento:</b> <b style="color: #b91c1c;">${vencimientoStr}</b></span></div>
                    </div>
                </div>
                
                <div style="display: flex; justify-content: flex-end;">
                    <button onclick="irACobrarDesdeRuta('${c.id}')" style="background: ${colorBorde}; color: white; border: none; padding: 5px 15px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.2s;">
                        <span>💰</span> Registrar Pago
                    </button>
                </div>
            </div>`;
        });

        contenedor.innerHTML = htmlTarjetas;

    } catch (e) {
        console.error("Error en Ruta de Cobro del Día:", e);
        const contenedor = document.getElementById('contenedor-ruta-dia');
        if (contenedor) contenedor.innerHTML = `<div style="color: red; font-size: 12px; text-align: center;">Error al calcular ruta.</div>`;
    }
}

// =========================================================================
// 🚀 MOTOR DE SALTO AUTOMÁTICO (DE RUTA A PAGOS)
// =========================================================================
// =========================================================================
// 🚀 MOTOR DE SALTO AUTOMÁTICO (DE RUTA A PAGOS) - CORREGIDO
// =========================================================================
// =========================================================================
// 🚀 MOTOR DE SALTO AUTOMÁTICO (DE RUTA A PAGOS) - VERSIÓN FINAL AUTOMATIZADA
// =========================================================================
// =========================================================================
// 🚀 MOTOR DE SALTO AUTOMÁTICO (ACCESO VIP DIRECTO A PAGOS)
// =========================================================================
// =========================================================================
// 🚀 MOTOR DE SALTO AUTOMÁTICO (V5 - ALINEACIÓN TOTAL CON PAGOS)
// =========================================================================
// =========================================================================
// 🚀 MOTOR DE SALTO AUTOMÁTICO (V6 - EL TRUCO DEL BOTÓN CONSULTAR)
// =========================================================================
// =========================================================================
// 🚀 MOTOR DE SALTO AUTOMÁTICO (V7 - INYECCIÓN DIRECTA Y BYPASS)
// =========================================================================
// =========================================================================
// 🚀 MOTOR DE SALTO AUTOMÁTICO (V8 - ROBOT HUMANOIDE MULTI-CRÉDITO)
// =========================================================================
window.irACobrarDesdeRuta = async function(idCredito) {
    // 1. Salto visual a la pestaña de Pagos
    if (typeof mostrarModulo === 'function') {
        mostrarModulo('mod-pagos');
    } else {
        document.querySelectorAll('.modulo-contenido').forEach(mod => mod.classList.remove('active'));
        const moduloPago = document.getElementById('mod-pagos');
        if (moduloPago) moduloPago.classList.add('active');
    }

    try {
        // 2. Averiguamos la Cédula del cliente (que es lo que usa su botón Consultar nativo)
        const { data: cred } = await supabaseClient
            .from('creditos')
            .select('clientes(cedula)')
            .eq('id', idCredito)
            .single();

        if (cred && cred.clientes && cred.clientes.cedula) {
            const cedulaTarget = cred.clientes.cedula;

            // 3. Ponemos la cédula en el buscador principal
            const selectorCliente = document.getElementById('selector-cliente-recaudacion');
            if (selectorCliente) {
                let existe = Array.from(selectorCliente.options).some(opt => opt.value === cedulaTarget);
                if (!existe) {
                    const opt = new Option(cedulaTarget, cedulaTarget, true, true);
                    selectorCliente.add(opt);
                }
                selectorCliente.value = cedulaTarget;

                // 4. Dejamos que SU código original haga todo el trabajo pesado
                if (typeof buscarCreditoParaCobro === 'function') {
                    // Ejecutamos la búsqueda original (esto llena las memorias protegidas)
                    await buscarCreditoParaCobro();

                    // 5. SOLUCIÓN MULTI-CRÉDITO: Esperamos a que su código termine de buscar...
                    setTimeout(() => {
                        // Si el cliente tiene varios créditos, seleccionamos el exacto de la Ruta
                        const selectorMulti = document.getElementById('selector-multicredito');
                        if (selectorMulti) {
                            selectorMulti.value = idCredito;
                        }

                        // Forzamos la carga final de los datos en pantalla
                        if (typeof cargarEstadoCuentaCredito === 'function') {
                            cargarEstadoCuentaCredito(idCredito);
                        }
                    }, 800); // 800ms para darle tiempo a Supabase de traer todo el historial
                }
            }
        }
    } catch (e) {
        console.error("Error en el Robot Humanoide:", e);
    }
};
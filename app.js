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
// 🤖 ROBOT DEL DASHBOARD (VERSIÓN DEFINITIVA: CONECTADO AL CALENDARIO MÓVIL)
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

        // 🛑 CIRUGÍA 1: Agregamos 'fecha_vencimiento_actual' al final del select
        const { data: creditos } = await supabaseClient
            .from('creditos')
            .select('id, monto_capital, total_pagar, monto_mora, valor_cuota, total_interes, estado, fecha_emision, num_cuotas, clientes(nombres, apellidos, cedula, perfil_cobro), historial_pagos(abono_total), fecha_vencimiento_actual')
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
                    const diasCredito = parseInt(c.num_cuotas) || 30;
                    
                    // 🛑 CIRUGÍA 2: El Robot lee la fecha móvil. Si no hay, usa la lógica original.
                    let fechaVence;
                    if (c.fecha_vencimiento_actual) {
                        const partes = c.fecha_vencimiento_actual.split('-');
                        fechaVence = new Date(partes[0], partes[1] - 1, partes[2]);
                    } else {
                        fechaVence = new Date(fechaEmision.getFullYear(), fechaEmision.getMonth(), fechaEmision.getDate());
                        fechaVence.setDate(fechaVence.getDate() + diasCredito);
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

                    // 🔥 EL AJUSTE MAESTRO: Si la diferenciaDias es 0 (vence hoy) o negativa (ya venció) SIEMPRE LO MUESTRA
                    if (diferenciaDias <= 0) {
                        alertasVencimiento.push({
                            idCredito: c.id,
                            refBancaria: refBancaria,
                            etiquetaCRE: etiquetaCRE,
                            nombre: `${c.clientes?.nombres} ${c.clientes?.apellidos}`.toUpperCase(),
                            capital: capitalPrestado,
                            cuotas: diasCredito,
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
                                    <div style="color: #0f172a; font-weight: 900; font-size: 13px;">$${alerta.capital.toFixed(2)} <span style="font-size:10px; font-weight:normal; color:#64748b;">(${alerta.cuotas} cuotas)</span></div>
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
// =========================================================================
// 6. MOTOR MASTER DEL MÓDULO DE CAPITAL (SISTEMA ALPHA V5 - FILTRADO)
// =========================================================================

/**
 * CARGAR SALDOS EN VIVO Y CALCULAR EL CAPITAL GENERAL
 * CORE DEL SISTEMA: Descarga el estado de todas las cajas en Supabase,
 * suma absolutamente todo para hallar el "Capital General" e inyecta
 * los desgloses de Efectivo y Banco en las tarjetas correspondientes.
 * NOTA: Filtrado estricto para mostrar solo Banco Principal y Efectivo Matriz.
 */
async function inicializarModuloCapital() {
    try {
        // 1. CONEXIÓN: Descargamos todas las fuentes de capital usando tu conector oficial
        const { data: cajas, error } = await supabaseClient
            .from('cajas_capital')
            .select('*');

        if (error) throw error;

        // 2. COMPROBACIÓN: Validamos si el selector de destino está disponible en el HTML
        const selector = document.getElementById('cap-caja-destino');
        if (!selector) {
            console.warn("Aviso: El elemento 'cap-caja-destino' no está renderizado en esta pestaña.");
            return;
        }

        // 3. LIMPIEZA DE INTERFAZ: Reseteamos el selector con su primera opción deshabilitada
        selector.innerHTML = '<option value="" selected disabled>-- Seleccione Caja o Banco --</option>';

        // 4. VERIFICACIÓN DE REGISTROS: Si la base de datos está vacía, emitimos alerta de control
        if (!cajas || cajas.length === 0) {
            alert("Aviso de Auditoría: No existen cajas configuradas en la tabla 'cajas_capital'.");
            return;
        }

        // 5. MATEMÁTICA CONTABLE: Inicializamos los acumuladores originales en cero
        let capitalGeneralAcumulado = 0; // -> Suma absoluta de todo el dinero del sistema
        let capitalEfectivo = 0;         // -> Suma exclusiva de dinero físico (Cajas)
        let capitalBanco = 0;            // -> Suma exclusiva de dinero digital (Transferencias)

        // 6. ITERACIÓN DE CAJAS: Procesamos registro por registro en tiempo real
        cajas.forEach(caja => {
            // Pasamos el nombre a minúsculas para evaluar sin importar tildes o mayúsculas erróneas
            const nombreLimpio = caja.nombre_caja.toLowerCase();
            const saldoMonto = parseFloat(caja.saldo_actual || 0);

            // FILTRO ESTRICTO: Solo dejamos pasar las dos cuentas autorizadas por Miguel
            if (nombreLimpio.includes('matriz') || nombreLimpio.includes('central') || nombreLimpio.includes('banco principal')) {
                
                // Regla Absoluta: Toda caja autorizada suma directamente al Capital General del negocio
                capitalGeneralAcumulado += saldoMonto;

                // Clasificación interna por tipos para llenar los tableros secundarios (Usando tus variables de siempre)
                if (caja.tipo === 'efectivo') {
                    capitalEfectivo += saldoMonto;
                } else if (caja.tipo === 'banco') {
                    capitalBanco += saldoMonto;
                }

                // Inyección en el combobox de la interfaz (Muestra el nombre y su saldo disponible)
                const option = document.createElement('option');
                option.value = caja.id;
                option.textContent = `${caja.nombre_caja} ($${saldoMonto.toFixed(2)})`;
                selector.appendChild(option);
            }
            // Las cajas de rutas o cobradores se omiten en silencio para mantener limpia la pantalla
        });

        // 7. INYECCIÓN VISUAL EN LAS TARJETAS (Pintado con las variables originales del sistema)
        // Tarjeta Master: Capital General (Suma de Efectivo + Banco)
        const txtGeneral = document.getElementById('saldo-general-txt');
        if (txtGeneral) txtGeneral.textContent = `$${capitalGeneralAcumulado.toFixed(2)}`;

        // Tarjeta Secundaria A: Capital Real en Bóveda (Dinero físico)
        const txtEfectivo = document.getElementById('saldo-efectivo-txt');
        if (txtEfectivo) txtEfectivo.textContent = `$${capitalEfectivo.toFixed(2)}`;

        // Tarjeta Secundaria B: Capital en Banco (Transferencias)
        const txtBancos = document.getElementById('saldo-bancos-txt');
        if (txtBancos) txtBancos.textContent = `$${capitalBanco.toFixed(2)}`;

       // =========================================================================
        // BLOQUE DE ARRANQUE GENERAL: INICIALIZACIÓN DE LA PANTALLA
        // =========================================================================

        // 8. RENDERIZADO DEL LOG: Cargamos el historial detallado de movimientos a la derecha
        await cargarHistorialCapital();

        // 🚀 CONTROL DE SELECTORES DE CRÉDITO: Carga los saldos entre paréntesis al iniciar
        // Ejecuta la lectura de dinero en vivo para que el operador vea los saldos desde el segundo uno.
        if (typeof cargarSaldosEnSelectorCredito === 'function') {
            await cargarSaldosEnSelectorCredito();
        }

    } catch (error) {
        console.error('Error crítico en la sincronización de capital:', error.message);
        alert('Supabase rechazó la sincronización de fondos: ' + error.message);
    }
}
/**
 * EJECUTAR TRANSACCIÓN DE CAPITAL (INGRESOS Y RETIROS)
 * ACCIÓN DINÁMICA: Procesa de forma segura la entrada o salida de capital.
 * Valida campos obligatorios, modifica balances y genera auditoría con signo.
 * @param {string} tipoAccion - Recibe 'INGRESAR' o 'RETIRAR' para definir el flujo matemático.
 */
async function procesarTransaccionCapital(tipoAccion) {
    // 1. CAPTURA: Extraemos los valores del formulario lateral de la interfaz
    const cajaId = document.getElementById('cap-caja-destino').value;
    const montoInput = document.getElementById('cap-monto').value;
    const concepto = document.getElementById('cap-concepto').value.trim();

    // 2. AUDITORÍA PREVENTIVA: Si falta seleccionar destino, monto o el detalle descriptivo, frena el script
    if (!cajaId || !montoInput || !concepto) {
        alert('Error: Todos los campos (Caja destino, Monto y Concepto/Detalle) son estrictamente obligatorios.');
        return;
    }

    // Convertimos la entrada de texto en número flotante puro
    let montoFlotante = parseFloat(montoInput);
    if (montoFlotante <= 0 || isNaN(montoFlotante)) {
        alert('Por favor, digite un monto numérico válido y mayor a cero.');
        return;
    }

    try {
        // 3. CONSULTA SÍNCRONA: Leemos el saldo actual de la caja elegida antes de operar
        const { data: caja, error: errorFetch } = await supabaseClient
            .from('cajas_capital')
            .select('saldo_actual, nombre_caja')
            .eq('id', cajaId)
            .single();

        if (errorFetch) throw errorFetch;

        let saldoActualizado = parseFloat(caja.saldo_actual || 0);
        let montoParaHistorial = montoFlotante;

        // 4. LOGIC ENGINE (Matemática de transacciones):
        if (tipoAccion === 'INGRESAR') {
            // Incrementamos fondos en la caja destino
            saldoActualizado += montoFlotante;
        } else if (tipoAccion === 'RETIRAR') {
            // Validación de fondos: Previene que la caja quede en saldo negativo si no es permitido
            if (montoFlotante > saldoActualizado) {
                alert(`Fondos Insuficientes: No puede retirar $${montoFlotante.toFixed(2)} de la caja "${caja.nombre_caja}" porque solo dispone de $${saldoActualizado.toFixed(2)}.`);
                return;
            }
            // Decrementamos fondos y guardamos el monto con signo negativo para las auditorías del historial
            saldoActualizado -= montoFlotante;
            montoParaHistorial = -montoFlotante; 
        }

        // 5. REGISTRO EN HISTORIAL: Inyectamos la fila contable para la auditoría diaria
        const { error: errorHistorial } = await supabaseClient
            .from('historial_capital')
            .insert([{ 
                caja_id: parseInt(cajaId), 
                monto: montoParaHistorial, 
                concepto: concepto 
            }]);

        if (errorHistorial) throw errorHistorial;

        // 6. ACTUALIZACIÓN DE BALANCE: Sobreescribimos el balance final de la caja modificada en Supabase
        const { error: errorUpdate } = await supabaseClient
            .from('cajas_capital')
            .update({ saldo_actual: saldoActualizado })
            .eq('id', cajaId);

        if (errorUpdate) throw errorUpdate;

        // 7. CONCLUSIÓN EXITOSA: Notificamos al operador y limpiamos la pantalla de datos sensibles
        alert(`¡Transacción de ${tipoAccion === 'INGRESAR' ? 'ingreso' : 'retiro'} ejecutada correctamente!`);
        document.getElementById('cap-monto').value = '';
        document.getElementById('cap-concepto').value = '';

        // 8. REFRESCAR SISTEMA: Invocamos el recálculo masivo para pintar los nuevos totales
        await inicializarModuloCapital();
        
        // 🚀 NUEVA LÍNEA: Actualiza la tabla de auditoría con los 10 registros nuevos en vivo
        await cargarHistorialCapital();

    } catch (error) {
        console.error('Error crítico al procesar la transacción:', error.message);
        alert('La operation fue cancelada por seguridad: ' + error.message);
    }
}

/**
 * RENDERIZAR HISTORIAL DETALLADO DE MOVIMIENTOS
 * AUDITORÍA VISUAL: Forzado horizontal estricto de extremo a extremo.
 * Montos positivos en verde, montos negativos en rojo alineados a la derecha.
 */
async function cargarHistorialCapital() {
    // BLOQUE PREVENTIVO: VERIFICACIÓN DEL CONTENEDOR HTML
    const contenedorHistorial = document.getElementById('historial-capital-lista');
    if (!contenedorHistorial) return; 

    try {
        // BLOQUE 1: CÁLCULO DE RANGOS DINÁMICOS
        const desde = (paginaActualHistorial - 1) * filasPorPaginaHistorial;
        const hasta = desde + filasPorPaginaHistorial - 1;

        // BLOQUE 2: CONSULTA A SUPABASE
        const { data: movimientos, error, count } = await supabaseClient
            .from('historial_capital')
            .select(`
                id,
                created_at,
                monto,
                concepto,
                cajas_capital ( nombre_caja )
            `, { count: 'exact' })
            .order('id', { ascending: false })
            .range(desde, hasta); 

        if (error) throw error;

        // BLOQUE 3: LIMPIEZA DE CONTENEDOR
        contenedorHistorial.innerHTML = '';

        if (!movimientos || movimientos.length === 0) {
            contenedorHistorial.innerHTML = '<p class="text-muted text-center py-3">No existen movimientos registrados en la bóveda.</p>';
            renderizarPaginacionHistorial(0); 
            return;
        }

        // BLOQUE 4: MAQUETACIÓN INLINE RIGUROSA (CON MEDIDA JUSTA A 12PX)
        movimientos.forEach(mov => {
            const numMonto = parseFloat(mov.monto);
            const esIngreso = numMonto >= 0;
            
            const signo = esIngreso ? '+' : '-';
            const montoAbsoluto = Math.abs(numMonto).toFixed(2);
            const montoFormateado = `$${signo}${montoAbsoluto}`;
            
            const colorActual = esIngreso ? '#10b981' : '#ef4444'; 

            const fechaObjeto = new Date(mov.created_at || new Date()); 
            const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const fFormateada = fechaObjeto.toLocaleDateString('es-ES', opcionesFecha);
            const hFormateada = fechaObjeto.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

            // TEMPLATE OPTIMIZADO: 12px estricto y espacio de protección para el scroll (padding-right: 15px)
            const itemHTML = `
                <div class="movimiento-item" style="display: flex !important; justify-content: space-between !important; align-items: center !important; padding: 10px 15px 10px 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); width: 100%; gap: 15px;">
                    
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 12px !important; line-height: 1.3;">
                        
                        <span style="height: 8px; width: 8px; background-color: ${colorActual}; border-radius: 50%; display: inline-block; box-shadow: 0 0 6px ${colorActual}; flex-shrink: 0;"></span>
                        
                        <span class="text-muted" style="font-size: 12px !important;">${fFormateada}, ${hFormateada} M.</span>
                        <span class="text-muted">|</span>
                        
                        <strong style="font-size: 12px !important; color: #ffffff; letter-spacing: 0.3px;">${mov.cajas_capital?.nombre_caja || 'Caja Desconocida'}</strong>
                        <span class="text-muted">|</span>
                        
                        <span class="text-light" style="font-size: 12px !important; opacity: 0.95;">${mov.concepto}</span>
                    </div>

                    <div style="white-space: nowrap !important; flex-shrink: 0; text-align: right; padding-right: 5px;">
                        <span class="fw-bold" style="color: ${colorActual}; font-size: 1.05rem; letter-spacing: 0.5px;">${montoFormateado}</span>
                    </div>
                    
                </div>
            `;
            contenedorHistorial.insertAdjacentHTML('beforeend', itemHTML);
        });

        // BLOQUE 5: PAGINACIÓN
        renderizarPaginacionHistorial(count);

    } catch (error) {
        console.error('Error al pintar el log de auditoría:', error.message);
    }
}

/**
 * RENDERIZAR BOTONES DE PAGINACIÓN DEL HISTORIAL
 * Calcula las páginas totales en base a los bloques de 10 registros
 * e inyecta los botones de navegación deshabilitándolos en los límites contables.
 */
function renderizarPaginacionHistorial(totalRegistros) {
    const totalPaginas = Math.ceil(totalRegistros / filasPorPaginaHistorial);
    const contenedorPaginas = document.getElementById('paginacion-historial-controles');
    if (!contenedorPaginas) return;

    // Pintamos los botones usando estilos limpios alineados a tu diseño
    contenedorPaginas.innerHTML = `
        <div class="d-flex justify-content-center align-items-center gap-3 mt-3">
            <button class="btn btn-sm btn-secondary" ${paginaActualHistorial === 1 ? 'disabled' : ''} onclick="cambiarPaginaHistorial(-1)">
                Anterior
            </button>
            <span class="fw-bold small text-muted"> 
                Página ${paginaActualHistorial} de ${totalPaginas || 1} 
            </span>
            <button class="btn btn-sm btn-secondary" ${paginaActualHistorial >= totalPaginas ? 'disabled' : ''} onclick="cambiarPaginaHistorial(1)">
                Siguiente
            </button>
        </div>
    `;
}

/**
 * EVENTO CAMBIO DE PÁGINA DEL HISTORIAL
 * Suma o resta una página a la vista y vuelve a llamar al motor de carga fusionado.
 */
async function cambiarPaginaHistorial(direccion) {
    paginaActualHistorial += direccion;
    await cargarHistorialCapital();
}



/**
 * BUSCAR MOVIMIENTO INDIVIDUAL POR ID EN CALIENTE
 * AUDITORÍA DETALLADA: Busca un ID secuencial único de la tabla 'historial_capital'
 * y dibuja el resultado alineado de extremo a extremo usando el diseño de anoche.
 */
async function buscarPorId() {
    // 1. CAPTURA: Extraemos el valor digitado en el buscador
    const idBuscado = document.getElementById('input-buscar-id').value.trim();
    const contenedorHistorial = document.getElementById('historial-capital-lista');
    if (!contenedorHistorial) return;

    // Si el operador borra el buscador y le da a buscar, recargamos el listado tradicional de 10 en 10
    if (!idBuscado) {
        paginaActualHistorial = 1; // Reseteamos a la página 1
        await cargarHistorialCapital();
        return;
    }

    try {
        // 2. CONEXIÓN A SUPABASE: Solicitamos el registro con filtro exacto .eq()
        const { data: mov, error } = await supabaseClient
            .from('historial_capital')
            .select(`
                id,
                monto,
                concepto,
                cajas_capital ( nombre_caja )
            `)
            .eq('id', parseInt(idBuscado))
            .maybeSingle(); // Usamos maybeSingle para que no bote excepción si el ID no existe

        if (error) throw error;

        // Limpiamos la lista para preparar la pantalla
        contenedorHistorial.innerHTML = '';

        // 3. CONTROL DE EXISTENCIA: Si el ID no existe en Supabase, avisamos al operador
        if (!mov) {
            contenedorHistorial.innerHTML = `
                <div class="text-center py-3">
                    <span style="color: #ef4444; font-weight: bold; font-size: 0.95rem;">
                        ❌ El ID de movimiento #${idBuscado} no existe en la base de datos de la bóveda.
                    </span>
                </div>
            `;
            // Dejamos la paginación vacía
            const contenedorPaginas = document.getElementById('paginacion-historial-controles');
            if (contenedorPaginas) contenedorPaginas.innerHTML = '';
            return;
        }

        // 4. MAQUETACIÓN VISUAL DE EXTREMO A EXTREMO
        const numMonto = parseFloat(mov.monto);
        const esIngreso = numMonto >= 0;
        
        // Ajuste de formato: $+100.00 o $-100.00
        const signo = esIngreso ? '+' : '-';
        const montoAbsoluto = Math.abs(numMonto).toFixed(2);
        const montoFormateado = `$${signo}${montoAbsoluto}`;
        
        // Colores: Verde para entradas y Rojo brillante para retiros
        const colorActual = esIngreso ? '#10b981' : '#ef4444';

        // Usamos la fecha del sistema actual de forma segura para evitar roturas
        const fechaObjeto = new Date();
        const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const fFormateada = fechaObjeto.toLocaleDateString('es-ES', opcionesFecha);
        const hFormateada = fechaObjeto.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        const itemHTML = `
            <div class="movimiento-item" style="display: flex !important; justify-content: space-between !important; align-items: center !important; padding: 10px 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); width: 100%; gap: 20px; background-color: rgba(37, 99, 235, 0.05); border-radius: 4px;">
                
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span style="height: 10px; width: 10px; background-color: ${colorActual}; border-radius: 50%; display: inline-block; box-shadow: 0 0 6px ${colorActual}; flex-shrink: 0;"></span>
                    
                    <strong style="color: #3b82f6; font-size: 0.9rem;">#${mov.id}</strong>
                    <span class="text-muted small">|</span>
                    
                    <span class="text-muted small">${fFormateada}, ${hFormateada} M.</span>
                    <span class="text-muted small">|</span>
                    
                    <strong>${mov.cajas_capital?.nombre_caja || 'Caja Desconocida'}</strong>
                    <span class="text-muted">|</span>
                    
                    <span class="text-light">${mov.concepto}</span>
                </div>

                <div style="white-space: nowrap !important; flex-shrink: 0; text-align: right;">
                    <span class="fw-bold" style="color: ${colorActual}; font-size: 1.05rem; letter-spacing: 0.5px;">${montoFormateado}</span>
                </div>
                
            </div>
        `;

        contenedorHistorial.insertAdjacentHTML('beforeend', itemHTML);

        // Apagamos los controles de la paginación ordinaria durante una consulta específica
        const contenedorPaginas = document.getElementById('paginacion-historial-controles');
        if (contenedorPaginas) {
            contenedorPaginas.innerHTML = `
                <div class="d-flex justify-content-center mt-3">
                    <button class="btn btn-sm btn-secondary" onclick="document.getElementById('input-buscar-id').value=''; buscarPorId();">
                        🔄 Mostrar todos los movimientos
                    </button>
                </div>
            `;
        }

    } catch (error) {
        console.error('Error al ejecutar la búsqueda por ID:', error.message);
    }
}

// =========================================================================
// BLOQUE: CONTROL TOTAL DEL HISTORIAL (CORREGIDO DE RAÍZ)
// =========================================================================
let filtroMemoria = "";

// Función para filtrar al hacer clic en las tarjetas
function filtrarHistorial(termino) {
    filtroMemoria = termino;
    aplicarFiltroAlHistorial();
}

// Función para limpiar filtros y mostrar todo ordenado
function limpiarFiltros() {
    filtroMemoria = ""; // Borramos el filtro
    aplicarFiltroAlHistorial();
}

// Función que aplica la lógica visual sin romper las columnas de dinero
function aplicarFiltroAlHistorial() {
    const contenedor = document.getElementById('historial-capital-lista');
    if (!contenedor) return;

    // 🛑 CORRECCIÓN CLAVE: Seleccionamos la fila entera (.movimiento-item), NO los sub-divs internos
    const items = contenedor.querySelectorAll('.movimiento-item');
    
    items.forEach(item => {
        const texto = item.innerText.toUpperCase();
        
        // Si el filtro está vacío o la fila completa contiene la palabra (ej: MATRIZ o BANCO)
        if (filtroMemoria === "" || texto.includes(filtroMemoria.toUpperCase())) {
            // Guardamos el diseño original (Flex) para que el texto vaya a la izquierda y el dinero a la derecha
            item.style.setProperty('display', 'flex', 'important');
        } else {
            // Si no coincide, ocultamos la fila completa con todo su contenido
            item.style.setProperty('display', 'none', 'important');
        }
    });
}
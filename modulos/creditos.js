// =========================================================================
// MOTOR FINANCIERO V5: RELOJ DE AUDITORÍA Y MATEMÁTICA EN TIEMPO REAL
// =========================================================================

/**
 * Función 1: CONTROL DE TIEMPO EN VIVO
 * Captura de forma continua los datos cronológicos del equipo local,
 * formateando el string para que calce idéntico a las reglas de auditoría.
 */

// =========================================================================
// 5. MOTOR FINANCIERO V5: RELOJ DE AUDITORÍA Y MATEMÁTICA EN TIEMPO REAL
// =========================================================================

/**
 * CONTROL DE TIEMPO EN VIVO
 * Captura de forma continua los datos cronológicos del equipo local,
 * formateando el string para que calce idéntico a las reglas de auditoría.
 */
function actualizarFechaEmision() {
    // 1. CAPTURA: Buscamos el contenedor de la fecha en la cabecera del módulo
    const contenedorFecha = document.getElementById('cred-fecha-servidor');
    if (!contenedorFecha) return; // Si no está en pantalla, aborta para evitar errores

    // 2. PROCESAMIENTO: Obtenemos el objeto de tiempo del servidor local
    const ahora = new Date();
    
    // Configuración regional para forzar formato largo idéntico al sistema anterior
    const opciones = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    const fechaFormateada = ahora.toLocaleDateString('es-ES', opciones);
    const horaFormateada = ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // 3. INYECCIÓN: Pintamos la marca de tiempo exacta en la interfaz
    contenedorFecha.innerText = `${fechaFormateada}, ${horaFormateada}`;
}

// Bucle repetidor: Fuerza a la interfaz a actualizar el segundero del reloj cada 1000 milisegundos (1 segundo)
setInterval(actualizarFechaEmision, 1000);



/**
 * CÁLCULO DE PROYECCIÓN DE CRÉDITO
 * Ejecuta la matemática financiera en tiempo real. Captura los 
 * datos de entrada e inyecta los resultados en el tablero negro.
 */
function calcularProyeccionCredito() {
    // 1. CAPTURA: Obtenemos los inputs numéricos del formulario
    const inputMonto = document.getElementById('cred-monto');
    const inputTasa = document.getElementById('cred-tasa-interes');
    const inputCuotas = document.getElementById('cred-cuotas');
    
    // Auditoría de Control: Si el formulario no está renderizado, detiene el script
    if (!inputMonto || !inputTasa || !inputCuotas) return;

    // 2. CONVERSIÓN: Pasamos los textos a números operables limpiando campos vacíos
    const monto = parseFloat(inputMonto.value) || 0;
    const porcentajeTasa = parseFloat(inputTasa.value) || 0;
    const cuotas = parseInt(inputCuotas.value) || 1;

    // 3. MATEMÁTICA: Desarrollo de ecuaciones contables de la cartera
    const totalInteres = monto * (porcentajeTasa / 100); // Ganancia líquida
    const totalADevolver = monto + totalInteres;         // Capital final amortizado
    const valorCuota = cuotas > 0 ? (totalADevolver / cuotas) : 0; // Prorrateo exacto

    // 4. INYECCIÓN: Formateamos las cifras neón con 2 decimales fijos en el panel oscuro
    document.getElementById('lbl-cuota-valor').innerText = `$${valorCuota.toFixed(2)}`;
    document.getElementById('lbl-interes-total').innerText = `$${totalInteres.toFixed(2)}`;
    document.getElementById('lbl-pagar-total').innerText = `$${totalADevolver.toFixed(2)}`;
}

/**
 * ACTUALIZACIÓN DE TASA EN MEMORIA
 * Monitorea el menú lateral izquierdo. Al digitar una nueva tasa,
 * la guarda en memoria global y actualiza el crédito si está abierto.
 */
function actualizarTasaMemoria() {
    // 1. CAPTURA: Obtenemos el input que está fijo en la barra lateral
    const inputTasaMenu = document.getElementById('menu-tasa-base');
    if (!inputTasaMenu) return;

    // 2. MEMORIA: Guardamos el valor en nuestra variable global protectora
    tasaBaseSistema = parseFloat(inputTasaMenu.value) || 20; // Si está vacío pone 20% por defecto

    // 3. SINCRONIZACIÓN EN VIVO: Buscamos el interés regulado del formulario de crédito
    const inputTasaCredito = document.getElementById('cred-tasa-interes');
    
    // Si el usuario justo está viendo la pestaña de créditos, actualiza el espejo e itera la matemática
    if (inputTasaCredito) {
        inputTasaCredito.value = tasaBaseSistema;
        calcularProyeccionCredito();
    }
}

/**
 * SINCRONIZACIÓN AL CAMBIAR DE MÓDULO
 * Actúa como puente al cambiar de pestaña. Asegura que cuando
 * el operador abra el módulo de créditos, este herede la tasa global.
 */
function aplicarTasaAlAbrirModulo() {
    // 1. CAPTURA: Localizamos el input de interés del formulario recién activado
    const inputTasaCredito = document.getElementById('cred-tasa-interes');
    
    // 2. TRANSFERENCIA: Si existe el campo, le inyectamos lo acumulado en la memoria global
    if (inputTasaCredito) {
        inputTasaCredito.value = tasaBaseSistema;
        
        // 3. RECÁLCULO: Forzamos al tablero a actualizarse en frío
        calcularProyeccionCredito();
    }
}

// =========================================================================
// DISPARADOR DE ARRANQUE GENERAL (DOM LOADED)
// Sincroniza y arranca todos los motores automáticos al iniciar el sistema
// =========================================================================
window.addEventListener('DOMContentLoaded', () => {
    actualizarTasaMemoria();
    actualizarFechaEmision();
});


// =========================================================================
// 2. FUNCIÓN PARA GUARDAR EL CRÉDITO EN SUPABASE AL DAR CLIC AL BOTÓN
// =========================================================================
// =========================================================================
// =========================================================================
// 2. FUNCIÓN PARA GUARDAR EL CRÉDITO EN SUPABASE AL DAR CLIC AL BOTÓN
// 2. FUNCIÓN PARA GUARDAR EL CRÉDITO EN SUPABASE AL DAR CLIC AL BOTÓN
// =========================================================================
// =========================================================================
// 2. FUNCIÓN PARA GUARDAR EL CRÉDITO EN SUPABASE AL DAR CLIC AL BOTÓN
// =========================================================================
// =========================================================================
// 2. FUNCIÓN PARA GUARDAR EL CRÉDITO EN SUPABASE AL DAR CLIC AL BOTÓN
// =========================================================================
// =========================================================================
// 2. FUNCIÓN PARA GUARDAR EL CRÉDITO EN SUPABASE AL DAR CLIC AL BOTÓN
// =========================================================================
async function guardarNuevoCredito() {
    // BLOCK 1: CAPTURA DE DATOS DESDE LA INTERFAZ HTML
    const selectorCliente = document.getElementById('cred-cliente-id');
    const clienteId = selectorCliente.value;
    
    const nombreCliente = selectorCliente.options[selectorCliente.selectedIndex].text;

    const monto = parseFloat(document.getElementById('cred-monto').value);
    const tasa = parseFloat(document.getElementById('cred-tasa-interes').value);
    const cuotas = parseInt(document.getElementById('cred-cuotas').value);
    const cajaId = document.getElementById('cred-forma-entrega').value;

    // BLOCK 2: VALIDACIÓN DE SEGURIDAD PREVENTIVA
    if (!clienteId || !monto || isNaN(monto) || !cuotas || !cajaId) {
        alert("⚠️ Por favor, complete todos los campos obligatorios antes de aprobar.");
        return;
    }

    if (monto <= 0) {
        alert("⚠️ Error: El monto del crédito debe ser un valor positivo mayor a cero.");
        return;
    }

    // BLOCK 3: CÁLCULOS MATEMÁTICOS DEL CRÉDITO
    const totalInteres = parseFloat(((monto * tasa) / 100).toFixed(2));
    const totalPagar = parseFloat((monto + totalInteres).toFixed(2));
    const valorCuota = parseFloat((totalPagar / cuotas).toFixed(2));

    // =========================================================================
    // 🔥 BLOCK 4.5: CÁLCULO DE FECHA DE VENCIMIENTO INICIAL (EL CEREBRO DEL RADAR) 🔥
    // =========================================================================
    // Obtenemos la modalidad elegida por el operador
    const modalidadText = document.getElementById('cred-modalidad').options[document.getElementById('cred-modalidad').selectedIndex].text.toUpperCase();
    
    // Por defecto nace en NULL (Perfecto para los Diarios)
    let fechaVencimientoCalculada = null; 
    
    // Si NO es diario, calculamos la fecha de su primera cuota para la Ruta de Cobro
    if (!modalidadText.includes('DIARIO')) {
        const fechaNacimiento = new Date();
        
        if (modalidadText.includes('SEMANAL')) {
            fechaNacimiento.setDate(fechaNacimiento.getDate() + 7);
        } else if (modalidadText.includes('QUINCENAL')) {
            fechaNacimiento.setDate(fechaNacimiento.getDate() + 15);
        } else if (modalidadText.includes('MENSUAL')) {
            fechaNacimiento.setMonth(fechaNacimiento.getMonth() + 1);
        }
        
        // Formateamos a 'YYYY-MM-DD' para Supabase
        fechaVencimientoCalculada = fechaNacimiento.toISOString().split('T')[0];
    }
    // =========================================================================

    try {
        // BLOCK 4: CONSULTAR EL SALDO ACTUAL DE LA BÓVEDA/CAJA
        const { data: caja, error: errorCaja } = await supabaseClient
            .from('cajas_capital')
            .select('saldo_actual, nombre_caja')
            .eq('id', parseInt(cajaId))
            .single();

        if (errorCaja) throw errorCaja;

        if (monto > parseFloat(caja.saldo_actual)) {
            alert(`❌ Operación Cancelada: Fondos insuficientes en [${caja.nombre_caja}].\n\nSaldo disponible actual: $${parseFloat(caja.saldo_actual).toFixed(2)}\nMonto que intenta prestar: $${monto.toFixed(2)}`);
            return;
        }

        const { data: infoCliente, error: errorCliente } = await supabaseClient
            .from('clientes')
            .select('nivel, limite_creditos, whatsapp, nombres, apellidos, cedula') 
            .eq('id', parseInt(clienteId))
            .single();

        if (errorCliente) throw errorCliente;

        const { data: creditosCliente, error: errorConteo } = await supabaseClient
            .from('creditos')
            .select('id, estado')
            .eq('cliente_id', parseInt(clienteId));

        if (errorConteo) throw errorConteo;

        const creditosActivos = creditosCliente.filter(c => c.estado === 'activo');
        const limiteMaximoPermitido = parseInt(infoCliente.limite_creditos) || 2;

        if (creditosActivos.length >= limiteMaximoPermitido) {
            alert(`❌ Operación Cancelada: El cliente ha alcanzado su límite de créditos permitidos.\n\nNivel Actual: ${infoCliente.nivel || 'Sin Nivel'}\nCréditos Activos: ${creditosActivos.length}\nLímite Máximo: ${limiteMaximoPermitido}`);
            return;
        }

        const numeroCredito = creditosCliente.length + 1; 

        // BLOCK 5: REGISTRO DEL CRÉDITO EN SUPABASE
        const { data: resultadoCredito, error } = await supabaseClient
            .from('creditos')
            .insert([
                {
                    cliente_id: parseInt(clienteId),
                    caja_id: parseInt(document.getElementById('cred-forma-entrega').value),
                    monto_capital: monto,
                    tasa_interes: tasa,
                    total_interes: totalInteres,
                    total_pagar: totalPagar,
                    saldo_pendiente: totalPagar,
                    num_cuotas: cuotas,
                    valor_cuota: valorCuota,
                    estado: 'activo',
                    usuario_registro: 'Administrador',
                    frecuencia_pago: document.getElementById('cred-modalidad').options[document.getElementById('cred-modalidad').selectedIndex].text,
                    forma_entrega: document.getElementById('cred-forma-entrega').options[document.getElementById('cred-forma-entrega').selectedIndex].text,
                    // 🔥 INYECTAMOS LA FECHA CALCULADA AQUÍ 🔥
                    fecha_vencimiento_actual: fechaVencimientoCalculada 
                }
            ])
            .select();

        if (error) throw error;

        const nuevoCreditoId = resultadoCredito && resultadoCredito.length > 0 ? resultadoCredito[0].id : null;

        // BLOCK 6: DESCUENTO DE DINERO DE LA CAJA SELECCIONADA
        const nuevoSaldoCaja = parseFloat(caja.saldo_actual) - monto;
        
        const { error: errorUpdateCaja } = await supabaseClient
            .from('cajas_capital')
            .update({ saldo_actual: nuevoSaldoCaja })
            .eq('id', parseInt(cajaId));

        if (errorUpdateCaja) throw errorUpdateCaja;

        const inicialN = infoCliente.nombres.charAt(0).toUpperCase();
        const inicialA = infoCliente.apellidos.charAt(0).toUpperCase();
        const ultimos4 = infoCliente.cedula.slice(-4);
        const codigoClienteBancario = `${inicialN}${inicialA}-${ultimos4}`;
        
        const codigoCifrado = typeof cifrarNumeroCredito === 'function' ? cifrarNumeroCredito(numeroCredito).toUpperCase() : '?';

        const codigoCreditoOficial = `${codigoClienteBancario} | CRE #${numeroCredito} [${codigoCifrado}]`;
        const codigoCreditoSMS = `${codigoClienteBancario} | CRE #${codigoCifrado}`;

        // BLOCK 7: REGISTRO DE AUDITORÍA
        const nombreCompletoHistorial = `${infoCliente.nombres.toUpperCase()} ${infoCliente.apellidos.toUpperCase()}`;
        const { error: errorHistorial } = await supabaseClient
            .from('historial_capital')
            .insert([{
                caja_id: parseInt(cajaId),
                credito_id: nuevoCreditoId,
                monto: -monto, 
                concepto: `DESEMBOLSO: ${codigoCreditoOficial} - ${nombreCompletoHistorial}`
            }]);

        if (errorHistorial) throw errorHistorial;

        alert(`🚀 ¡${codigoCreditoOficial} aprobado, registrado y descontado con éxito!`);
        
        // =========================================================================
        // 🟢 NUEVO: ¡DISPARO AUTOMÁTICO DE SMS VOUCHER (VÍA MACRODROID)!
        // =========================================================================
        if (infoCliente.whatsapp && typeof enviarSMSAutomatico === 'function') {
            const nombreLimpio = nombreCompletoHistorial;
            
            const modalidadSelect = document.getElementById('cred-modalidad');
            let modalidadNombre = modalidadSelect ? modalidadSelect.options[modalidadSelect.selectedIndex].text : "Fija";
            modalidadNombre = modalidadNombre.replace(/.*Cobro\s+/i, "");

            // 🔥 FORMULA ALPHA SMS COMPACTA (Sábado 19/septiembre/2026 | 10:56 a.m.)
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
            
            const fechaHoraSMS = `${diaSemana} ${numDia}/${mesNombre}/${anio} | ${horas}:${minutos} ${ampm}`;

            const mensajeVoucher = `=== SISTEMA ALPHA ===\n${fechaHoraSMS}\n\n🆔 Ref: ${codigoCreditoSMS}\n👤 Cliente: ${nombreLimpio}\n\n💰 Monto: $${monto.toFixed(2)}\n💵 Cuota: $${valorCuota.toFixed(2)}\n🔄 Modalidad: ${modalidadNombre}\n📊 Total: $${totalPagar.toFixed(2)}\n🔢 Cuotas: ${cuotas}\n\nConserva este msj. ¡Gracias!\n🚫 POR FAVOR, NO RESPONDER A ESTE MENSAJE.`;
            
            // 1. Envía el mensaje original e impecable al cliente
            await enviarSMSAutomatico(infoCliente.whatsapp, mensajeVoucher);

            // 🕒 PAUSA DE 2 SEGUNDOS: Evitamos que el chip bloquee los mensajes
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 2. 🔥 COPIA DE AUDITORÍA PARA EL GERENTE
            const numeroGerente = "0939836191"; // <-- ¡RECUERDE PONER SU NÚMERO REAL AQUÍ!
            if (infoCliente.whatsapp !== numeroGerente) {
                await enviarSMSAutomatico(numeroGerente, `[COPIA NUEVO CRÉDITO]\n\n${mensajeVoucher}`);
            }
        }
        
        if (typeof window.cargarHistorialCreditos === 'function') {
            window.cargarHistorialCreditos();
        } else if (typeof cargarHistorialCreditos === 'function') {
            cargarHistorialCreditos();
        }
        
        // BLOCK 9: LIMPIEZA
        document.getElementById('cred-cliente-id').value = '';
        document.getElementById('cred-monto').value = '';
        document.getElementById('cred-cuotas').value = '1';
        document.getElementById('cred-forma-entrega').value = '';

        document.getElementById('lbl-cuota-valor').innerText = '$0.00';
        document.getElementById('lbl-interes-total').innerText = '$0.00';
        document.getElementById('lbl-pagar-total').innerText = '$0.00';

        if (typeof inicializarModuloCapital === 'function') await inicializarModuloCapital();
        if (typeof cargarSaldosEnSelectorCredito === 'function') await cargarSaldosEnSelectorCredito();
        if (typeof cargarHistorialCapital === 'function') cargarHistorialCapital();

    } catch (error) {
        console.error("Error al registrar crédito:", error);
        alert("❌ Hubo un error al guardar en la base de datos: " + error.message);
    }
}


// =========================================================================
// BLOCK 12: ESCUCHADOR EN TIEMPO REAL PARA RESTRINGIR LETRAS EN EL MONTO
// =========================================================================
// Bloque autónomo que limpia el campo de texto inmediatamente si detecta letras
document.getElementById('cred-monto').addEventListener('input', function () {
    // 1. Capturamos el contenido actual que el usuario escribe o pega
    let entrada = this.value;

    // 2. Filtro de Seguridad: Borra todo lo que NO sea un número del 0 al 9 o un punto decimal
    let entradaLimpia = entrada.replace(/[^0-9.]/g, '');

    // 3. Control de Doble Punto: Evitamos que rompan los cálculos escribiendo "100..50"
    const partes = entradaLimpia.split('.');
    if (partes.length > 2) {
        // Mantiene el primer punto válido y junta el resto eliminando los puntos extra
        entradaLimpia = partes[0] + '.' + partes.slice(1).join('');
    }

    // 4. Devolvemos el valor depurado a la interfaz en tiempo real
    this.value = entradaLimpia;
});

// =========================================================================
// BLOCK 14: BUSCADOR DINÁMICO DE CLIENTES EN TIEMPO REAL
// =========================================================================
// Crea un campo de búsqueda arriba del selector para filtrar instantáneamente 560+ clientes
(function() {
    const selector = document.getElementById('cred-cliente-id');
    if (!selector) return;

    // Construcción dinámica del input buscador
    const buscarInput = document.createElement('input');
    buscarInput.type = 'text';
    buscarInput.id = 'cred-cliente-buscar';
    buscarInput.placeholder = '🔍 Escribe aquí para buscar cliente... (Ej: Piguave)';
    
    // Estilos de acople visual estables para el diseño
    buscarInput.style.width = '100%';
    buscarInput.style.marginBottom = '6px';
    buscarInput.style.padding = '8px';
    buscarInput.style.boxSizing = 'border-box';
    
    // Inyección limpia del buscador justo antes del elemento select
    selector.parentNode.insertBefore(buscarInput, selector);

    let opcionesOriginales = [];

    // Captura y respaldo de los datos reales del selector al enfocarse
    buscarInput.addEventListener('focus', function() {
        if (this.value === '') {
            opcionesOriginales = Array.from(selector.options);
        }
    });

    // Filtro dinámico en base al texto digitado por el usuario
    buscarInput.addEventListener('input', function() {
        const termino = this.value.toLowerCase().trim();
        
        if (termino === '') {
            selector.innerHTML = '';
            opcionesOriginales.forEach(opt => selector.add(opt.cloneNode(true)));
            return;
        }

        const filtradas = opcionesOriginales.filter(opt => {
            if (opt.value === '') return true; // Mantiene visible la opción por defecto por seguridad
            return opt.text.toLowerCase().includes(termino);
        });

        selector.innerHTML = '';
        filtradas.forEach(opt => selector.add(opt.cloneNode(true)));
    });

    // Limpieza del buscador y restauración integral del selector al elegir el registro
    selector.addEventListener('change', function() {
        if (buscarInput.value !== '' && opcionesOriginales.length > 0) {
            const valorSeleccionado = selector.value;
            buscarInput.value = ''; 
            
            selector.innerHTML = '';
            opcionesOriginales.forEach(opt => selector.add(opt.cloneNode(true)));
            
            selector.value = valorSeleccionado; // Reasigna el id correcto al BLOCK 1
        }
    });
})();

// 3. FUNCIÓN PARA TRAER LOS CLIENTES DESDE SUPABASE AL SELECTOR
async function cargarClientesDropdown() {
    try {
        // Vamos a Supabase a traer el ID, Nombres y Apellidos ordenador alfabéticamente
        const { data: clientes, error } = await supabaseClient
            .from('clientes')
            .select('id, nombres, apellidos')
            .order('nombres', { ascending: true });

        if (error) throw error;

        const selectCliente = document.getElementById('cred-cliente-id');
        if (!selectCliente) return;

        // Limpiamos el selector y dejamos solo la opción por defecto
        selectCliente.innerHTML = '<option value="">-- Seleccione un cliente activo --</option>';

        // Recorremos los clientes de la base de datos y los inyectamos en el HTML
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id; // El ID real de la base de datos
            option.textContent = `🆔 ${cliente.id} - ${cliente.nombres} ${cliente.apellidos}`.toUpperCase();
            selectCliente.appendChild(option);
        });

        console.log("👥 Selector de clientes cargado con éxito.");
    } catch (error) {
        console.error("Error al cargar clientes en el dropdown:", error);
    }
}

// Esto hace que la lista se cargue automáticamente apenas se abra el sistema
document.addEventListener('DOMContentLoaded', () => {
    // Un pequeño delay de medio segundo para asegurar que Supabase ya esté conectado
    setTimeout(async () => {
        // 1. Carga los clientes en el selector
        await cargarClientesDropdown();
        
        // 2. Carga los saldos reales en el selector de créditos desde el arranque
        if (typeof cargarSaldosEnSelectorCredito === 'function') {
            await cargarSaldosEnSelectorCredito();
        }
    }, 500);
});

/**
 * RENDERIZAR OPCIONES DE ENTREGA CON SALDOS EN VIVO
 * GUIADO DEL MÓDULO CAPITAL: Formatea las opciones para mostrar el saldo real
 * de cada caja entre paréntesis, evitando que se preste dinero sin fondos.
 */
async function cargarSaldosEnSelectorCredito() {
    // BLOQUE 1: ATRA PAR EL SELECTOR DEL HTML
    // Buscamos el ID exacto del combobox de forma de entrega en el módulo de créditos
    const comboEntrega = document.getElementById('cred-forma-entrega');
    if (!comboEntrega) return; // Si no está en pantalla, frena la función para evitar errores

    try {
        // BLOQUE 2: CONSULTA DIRECTA A SUPABASE (IGUAL A MÓDULO CAPITAL)
        // Traemos las cajas registradas con sus nombres y montos reales desde la base de datos
        const { data: cajas, error } = await supabaseClient
            .from('cajas_capital')
            .select('id, nombre_caja, saldo_actual')
            .order('id', { ascending: true });

        if (error) throw error;

        // BLOQUE 3: SALVAGUARDAR SELECCIÓN ACTUAL DEL OPERADOR
        // Guardamos la opción que ya tenga marcada el usuario para que no se le mueva el combo de golpe
        const seleccionPrevia = comboEntrega.value;

        // Limpiamos el contenido viejo dejando únicamente la opción por defecto
        comboEntrega.innerHTML = '<option value="">-- Seleccione forma de entrega --</option>';

        // BLOQUE 4: CONSTRUCCIÓN DEL TEMPLATE VISUAL (CON SALDOS EN VIVO)
        // Recorremos las cajas e inyectamos el HTML calcando el formato exacto del Módulo Capital
        cajas.forEach(caja => {
            const saldoNumero = parseFloat(caja.saldo_actual).toFixed(2);
            
            // Creamos la etiqueta <option> manteniendo el ID de la caja ("1" o "2") en el value
            // El texto visible queda idéntico: "Efectivo Central (Matriz) ($600.00)"
            const opcionHTML = `<option value="${caja.id}">${caja.nombre_caja} ($${saldoNumero})</option>`;
            
            // Colocamos la opción al final de la lista del selector
            comboEntrega.insertAdjacentHTML('beforeend', opcionHTML);
        });

        // BLOQUE 5: RESTAURACIÓN AUTOMÁTICA DE LA SELECCIÓN
        // Si el operador ya había elegido "Banco" o "Matriz", se lo dejamos seleccionado otra vez
        if (seleccionPrevia) {
            comboEntrega.value = seleccionPrevia;
        }

    } catch (error) {
        // BLOQUE DE CONTROL DE INCIDENCIAS
        console.error('Error al calcar saldos en el selector de créditos:', error.message);
    }
}

// ==========================================
// VARIABLES DE CONTROL DE PAGINACIÓN Y BÚSQUEDA (CRÉDITOS)
// ==========================================
window.paginaActualCreditos = 1;
window.itemsPorPaginaCreditos = 3;
window.filtroTextoCredito = ""; // 🔍 Guarda de forma segura lo que se escribe en el buscador

// Función que se activa automáticamente al escribir en la barra de búsqueda
window.buscarCreditoEnVivo = function() {
    const inputBuscador = document.getElementById('buscador-creditos');
    if (inputBuscador) {
        window.filtroTextoCredito = inputBuscador.value.trim();
        window.paginaActualCreditos = 1; // Al buscar, forzamos regresar siempre a la página 1
        window.cargarHistorialCreditos(); // Refrescamos la lista con el filtro puesto
    }
};

// El "Guardia" para que no se mezcle al cambiar de página (TU GUARDIA INTACTO)
const observador = new MutationObserver(() => aplicarFiltroAlHistorial());
const contenedorHistorial = document.getElementById('historial-capital-lista');
if (contenedorHistorial) {
    observador.observe(contenedorHistorial, { childList: true, subtree: true });
}

// =========================================================================
// 1. CARGAR EL HISTORIAL DE CRÉDITOS (CON BUSCADOR, PAGINACIÓN Y RESTA DE ABONOS)
// =========================================================================
// =========================================================================
// 1. CARGAR EL HISTORIAL DE CRÉDITOS (CON BUSCADOR, PAGINACIÓN Y RESTA DE ABONOS)
// =========================================================================
// =========================================================================
// 1. CARGAR EL HISTORIAL DE CRÉDITOS (CON BUSCADOR, PAGINACIÓN Y RESTA DE ABONOS)
// =========================================================================
window.cargarHistorialCreditos = async function() {
    const contenedor = document.getElementById('lista-creditos-derecha');
    if (!contenedor) return;
    
    const desde = (window.paginaActualCreditos - 1) * window.itemsPorPaginaCreditos;
    const hasta = desde + window.itemsPorPaginaCreditos - 1;

    let consulta = supabaseClient
        .from('creditos') 
        .select(`
            id, cliente_id, monto_capital, total_pagar, monto_mora, tasa_interes, 
            fecha_emision, frecuencia_pago, valor_cuota, forma_entrega, num_cuotas, estado,
            clientes!inner(nombres, apellidos, cedula, estado)
        `, { count: 'exact' })
        .eq('clientes.estado', 'activo') 
        .in('estado', ['activo', 'congelado']); // 🔥 EL CAMBIO MAESTRO: Mostrar activos y congelados      

    if (window.filtroTextoCredito !== "") {
        consulta = consulta.or(
            `nombres.ilike.%${window.filtroTextoCredito}%,apellidos.ilike.%${window.filtroTextoCredito}%,cedula.ilike.%${window.filtroTextoCredito}%`, 
            { foreignTable: 'clientes' }
        );
    }

    const { data, error, count } = await consulta
        .order('id', { ascending: false }) 
        .range(desde, hasta); 

    if (error) {
        console.error("Error al cargar:", error);
        return;
    }

    if (data && data.length > 0) {
        
        const idsCreditosVisibles = data.map(c => c.id);
        let pagosTotalesPorCredito = {};
        
        if (idsCreditosVisibles.length > 0) {
            const { data: historialPagos } = await supabaseClient
                .from('historial_pagos')
                .select('id_credito, abono_total')
                .in('id_credito', idsCreditosVisibles);
                
            if (historialPagos) {
                historialPagos.forEach(p => {
                    if (!pagosTotalesPorCredito[p.id_credito]) pagosTotalesPorCredito[p.id_credito] = 0;
                    pagosTotalesPorCredito[p.id_credito] += parseFloat(p.abono_total || 0);
                });
            }
        }

        const creditosProcesados = await Promise.all(data.map(async (c) => {
            const inicialN = c.clientes?.nombres ? c.clientes.nombres.charAt(0).toUpperCase() : 'X';
            const inicialA = c.clientes?.apellidos ? c.clientes.apellidos.charAt(0).toUpperCase() : 'X';
            const ultimos4 = c.clientes?.cedula ? c.clientes.cedula.slice(-4) : '0000';
            const codigoBancario = `${inicialN}${inicialA}-${ultimos4}`;

            const { data: todosCreditos } = await supabaseClient
                .from('creditos')
                .select('id')
                .eq('cliente_id', c.cliente_id)
                .order('id', { ascending: true });
            
            let numeroCredito = 1;
            if (todosCreditos) {
                const index = todosCreditos.findIndex(tc => tc.id === c.id);
                if (index !== -1) numeroCredito = index + 1;
            }
            
            const codigoCifrado = typeof cifrarNumeroCredito === 'function' ? cifrarNumeroCredito(numeroCredito).toUpperCase() : '?';

            c.codigoOficial = `${codigoBancario} | CRE #${numeroCredito} [${codigoCifrado}]`;
            c.totalAbonado = pagosTotalesPorCredito[c.id] || 0;
            
            return c;
        }));

        const htmlCreditos = creditosProcesados.map(c => {
            const fechaObj = new Date(c.fecha_emision);
            const ahora = new Date().getTime();
            
            const esEditable = (ahora - fechaObj.getTime()) < 86400000; 

            // ==========================================
            // 🔥 FÓRMULA ALPHA: PRECISIÓN TOTAL 🔥
            // Formato exacto: sábado, 19/septiembre/2026 | 10:03:11 a. m.
            // ==========================================
            const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
            const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            
            const nombreDia = dias[fechaObj.getDay()];
            const numDia = String(fechaObj.getDate()).padStart(2, '0');
            const mesNombre = meses[fechaObj.getMonth()];
            const anio = fechaObj.getFullYear();
            
            let horas = fechaObj.getHours();
            let minutos = String(fechaObj.getMinutes()).padStart(2, '0');
            let segundos = String(fechaObj.getSeconds()).padStart(2, '0');
            const ampm = horas >= 12 ? 'p. m.' : 'a. m.';
            horas = horas % 12; 
            horas = horas ? horas : 12;
            horas = String(horas).padStart(2, '0');
            
            const formatoFecha = `${nombreDia}, ${numDia}/${mesNombre}/${anio}`;
            const horaFormateada = `${horas}:${minutos}:${segundos} ${ampm}`;
            // ==========================================
            
            const nombre = c.clientes ? `${c.clientes.nombres} ${c.clientes.apellidos}`.toUpperCase() : 'SIN NOMBRE';

            const moraExtra = parseFloat(c.monto_mora) || 0;
            const deudaTotalCalculada = (parseFloat(c.total_pagar) - c.totalAbonado) + moraExtra;
            
            const etiquetaMora = moraExtra > 0 ? `<span style="color: #ef4444; background: #fee2e2; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; white-space: nowrap;">Mora $${moraExtra.toFixed(2)}</span>` : '';
            const etiquetaDeuda = moraExtra > 0 ? `<span style="margin-left: 6px; color: #854d0e; font-size: 11px; font-weight: bold; background: #fef08a; padding: 2px 6px; border-radius: 4px; border: 1px dashed #ca8a04; white-space: nowrap;">👉 Deuda Total: $${deudaTotalCalculada.toFixed(2)}</span>` : '';

            const esCongelado = c.estado === 'congelado';
            const badgeCongelado = esCongelado ? `<span style="background: #e0f2fe; color: #0284c7; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-left: 8px;">🧊 CONGELADO</span>` : '';

            return `
            <div style="padding: 15px; border-bottom: 2px solid #e2e8f0; background: #fff; margin-bottom: 12px; border-radius: 8px; border-left: 6px solid ${esCongelado ? '#0284c7' : '#10b981'}; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                
                <div style="font-weight: 900; font-size: 13px; color: #1e293b; margin-bottom: 10px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
                    <span>ID: ${c.id}</span> <span style="color: #cbd5e1;">|</span> 
                    <span>${nombre} ${badgeCongelado}</span> <span style="color: #cbd5e1;">|</span> 
                    <span style="color: #0284c7; background: #e0f2fe; padding: 3px 8px; border-radius: 4px; border: 1px solid #bae6fd;">
                        🆔 ${c.codigoOficial}
                    </span> 
                    <span style="color: #cbd5e1;">|</span> 
                    <span style="color: #64748b; font-weight: normal; font-size: 11px;">${formatoFecha} | ${horaFormateada}</span>
                    
                    <div style="margin-left: auto; display: flex; gap: 12px; align-items: center;">
                        <button onclick="reenviarVoucher(${c.id})" style="cursor:pointer; border:none; background:none; font-size: 14px; padding: 0;" title="Reenviar Soporte ($0.50)">📩</button>
                        ${esEditable ? `
                            <button onclick="abrirModalEdicion(${c.id})" style="cursor:pointer; border:none; background:none; font-size: 14px; padding: 0;" title="Editar crédito">✏️</button>
                            <button onclick="intentarAnularCredito(${c.id},${c.monto_capital})" style="cursor:pointer; border:none; background:none; font-size: 14px; padding: 0;" title="Eliminar crédito">🚫</button>
                        ` : ''}
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 120px 1fr; gap: 15px; font-size: 12px; margin-bottom: 10px; align-items: center;">
                    <div>Capital: <b>$${c.monto_capital}</b></div>
                    <div>Interés: <b>${~~c.tasa_interes ? c.tasa_interes : 0}%</b></div>
                    <div>Cuota: <b>$${c.valor_cuota || 0}</b></div>
                    <div style="display: flex; align-items: center; gap: 4px; color: #0284c7;">
                        💰 Total a Pagar: <b>$${parseFloat(c.total_pagar).toFixed(2)}</b> ${etiquetaMora} ${etiquetaDeuda}
                    </div>
                </div>

                <div style="border-top: 1px dashed #cbd5e1; padding-top: 8px; margin-top: 10px; font-size: 12px; color: #475569;">
                    <div>🔄 Frecuencia de Pago: <b>${c.frecuencia_pago || 'No especificada'}</b></div>
                    <div style="margin-top: 4px;">🔢 N° de Cuotas: <b>${c.num_cuotas || 'N/A'}</b></div>
                    <div style="margin-top: 4px;">💳 Forma de Entrega / Origen: <b>${c.forma_entrega || 'No especificada'}</b></div>
                </div>
            </div>`;
        }).join('');

        const totalPaginas = Math.ceil(count / window.itemsPorPaginaCreditos);

        const paginacionHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; padding-top: 12px; border-top: 2px dashed #e2e8f0; gap: 10px;">
                <button onclick="window.cambiarPaginaCreditos(${window.paginaActualCreditos - 1})" ${window.paginaActualCreditos === 1 ? 'disabled' : ''} 
                    style="padding: 6px 12px; font-size: 12px; font-weight: bold; background: ${window.paginaActualCreditos === 1 ? '#f1f5f9' : 'white'}; color: ${window.paginaActualCreditos === 1 ? '#94a3b8' : '#334155'}; border: 1px solid #cbd5e1; border-radius: 6px; cursor: ${window.paginaActualCreditos === 1 ? 'not-allowed' : 'pointer'}; transition: 0.2s;">
                    Anterior
                </button>
                
                <span style="font-size: 12px; font-weight: bold; color: #475569; background: #f8fafc; padding: 4px 10px; border-radius: 20px; border: 1px solid #e2e8f0;">
                    Pág. ${window.paginaActualCreditos} de ${totalPaginas}
                </span>
                
                <button onclick="window.cambiarPaginaCreditos(${window.paginaActualCreditos + 1})" ${window.paginaActualCreditos >= totalPaginas ? 'disabled' : ''} 
                    style="padding: 6px 12px; font-size: 12px; font-weight: bold; background: ${window.paginaActualCreditos >= totalPaginas ? '#f1f5f9' : 'white'}; color: ${window.paginaActualCreditos >= totalPaginas ? '#94a3b8' : '#334155'}; border: 1px solid #cbd5e1; border-radius: 6px; cursor: ${window.paginaActualCreditos >= totalPaginas ? 'not-allowed' : 'pointer'}; transition: 0.2s;">
                    Siguiente
                </button>
            </div>
        `;

        contenedor.innerHTML = htmlCreditos + paginacionHTML;

    } else {
        if (window.filtroTextoCredito !== "") {
            contenedor.innerHTML = `<p style='text-align: center; color: #94a3b8; padding: 15px 0;'>No se encontraron créditos para "<b>${window.filtroTextoCredito}</b>".</p>`;
        } else {
            contenedor.innerHTML = "<p style='text-align: center; color: #94a3b8;'>No hay créditos registrados.</p>";
        }
    }
};


// 🔥 Función global 100% blindada para cambiar de página (AQUÍ ESTÁ LA SOLUCIÓN DEL BOTÓN)
window.cambiarPaginaCreditos = function(nuevaPagina) {
    window.paginaActualCreditos = nuevaPagina;
    window.cargarHistorialCreditos();
};
// ==========================================
// 2. ABRIR EL MODAL DE EDICIÓN
// ==========================================
async function abrirModalEdicion(idCredito) {
    const { data, error } = await supabaseClient
        .from('creditos')
        .select('id, monto_capital, fecha_emision')
        .eq('id', idCredito)
        .single();

    if (error) {
        alert("Error al cargar datos: " + error.message);
        return;
    }

    if ((new Date().getTime() - new Date(data.fecha_emision).getTime()) > 86400000) {
        alert("❌ Este crédito ya superó las 24 horas. No es editable.");
        return;
    }

    document.getElementById('edit-id-credito').value = idCredito;
    document.getElementById('edit-monto').value = data.monto_capital;
    document.getElementById('modal-editar-credito').style.display = 'flex';
}

// ==========================================
// 3. GUARDAR LA EDICIÓN EN SUPABASE Y CAJA (PRODUCCIÓN BLINDADA)
// ==========================================
// ==========================================
// 3. GUARDAR LA EDICIÓN EN SUPABASE Y CAJA (PRODUCCIÓN BLINDADA)
// ==========================================
async function guardarEdicion() {
    const id = document.getElementById('edit-id-credito').value;
    const nuevoMonto = parseFloat(document.getElementById('edit-monto').value);

    if (isNaN(nuevoMonto) || nuevoMonto <= 0) {
        alert("❌ Por favor, ingresa un monto válido.");
        return;
    }

    // A. Obtener los datos originales completos (¡Inyectamos cliente_id!)
    const { data: creditoOriginal, error: errFetch } = await supabaseClient
        .from('creditos')
        .select('tasa_interes, monto_capital, caja_id, valor_cuota, cliente_id') 
        .eq('id', id)
        .single();

    if (errFetch || !creditoOriginal) {
        alert("Error al recuperar el crédito: " + errFetch?.message);
        return;
    }

    // --- ENTRADA DEL MOTOR DE CÓDIGO BANCARIO ---
    // Traemos los datos de identidad del cliente inmediatamente para la auditoría y el SMS
    const { data: cliInfo, error: errCli } = await supabaseClient
        .from('clientes')
        .select('nombres, apellidos, cedula, whatsapp')
        .eq('id', creditoOriginal.cliente_id)
        .single();

    if (errCli || !cliInfo) {
        alert("Error al recuperar datos del cliente: " + errCli?.message);
        return;
    }

    const inicialN = cliInfo.nombres.charAt(0).toUpperCase();
    const inicialA = cliInfo.apellidos.charAt(0).toUpperCase();
    const ultimos4 = cliInfo.cedula.slice(-4);
    const codigoClienteBancario = `${inicialN}${inicialA}-${ultimos4}`;

    // Buscamos la posición cronológica de este crédito en el historial del cliente
    const { data: todosCreditos } = await supabaseClient
        .from('creditos')
        .select('id')
        .eq('cliente_id', creditoOriginal.cliente_id)
        .order('id', { ascending: true });
    
    let numeroCredito = 1;
    if (todosCreditos) {
        const index = todosCreditos.findIndex(c => c.id === Number(id));
        if (index !== -1) numeroCredito = index + 1;
    }
    
    // 🔑 CIFRADO DE SEGURIDAD PARA LA EDICIÓN
    const codigoCifrado = typeof cifrarNumeroCredito === 'function' ? cifrarNumeroCredito(numeroCredito).toUpperCase() : '?';

    // 🛡️ SEPARACIÓN DE CÓDIGOS (INTERNO VS CLIENTE)
    const codigoCreditoOficial = `${codigoClienteBancario} | CRE #${numeroCredito} [${codigoCifrado}]`; // Para tu auditoría
    const codigoCreditoSMS = `${codigoClienteBancario} | CRE #${codigoCifrado}`; // 🎓 SOLO LA LETRA para el cliente

    const nombreCompleto = `${cliInfo.nombres.toUpperCase()} ${cliInfo.apellidos.toUpperCase()}`;
    // --------------------------------------------

    const tasa = parseFloat(creditoOriginal.tasa_interes || 0);
    const capitalAnterior = parseFloat(creditoOriginal.monto_capital || 0);
    const cuotaAnterior = parseFloat(creditoOriginal.valor_cuota || 0);
    const cajaId = creditoOriginal.caja_id;

    // 🛡️ CANDADO DE SEGURIDAD CONTABLE
    const { data: cajaData, error: errCajaCheck } = await supabaseClient
        .from('cajas_capital')
        .select('nombre_caja, saldo_actual')
        .eq('id', cajaId)
        .single();

    if (errCajaCheck || !cajaData) {
        alert("Error al verificar los fondos en la caja: " + errCajaCheck?.message);
        return;
    }

    const saldoDisponible = parseFloat(cajaData.saldo_actual || 0);

    if (nuevoMonto > capitalAnterior) {
        const dineroAdicionalRequerido = nuevoMonto - capitalAnterior;
        if (saldoDisponible < dineroAdicionalRequerido) {
            alert(`❌ Operación Cancelada: Fondos insuficientes en [${cajaData.nombre_caja}].`);
            return;
        }
    }

    const nuevoTotalPagar = nuevoMonto + (nuevoMonto * (tasa / 100));
    const totalAnterior = capitalAnterior + (capitalAnterior * (tasa / 100));
    const nuevoValorCuota = totalAnterior > 0 ? (nuevoTotalPagar * cuotaAnterior) / totalAnterior : 0;

    // B. Actualizar tabla 'creditos'
    const { error: errCredito } = await supabaseClient
        .from('creditos')
        .update({ 
            monto_capital: nuevoMonto,
            total_pagar: nuevoTotalPagar,
            saldo_pendiente: nuevoTotalPagar,
            valor_cuota: nuevoValorCuota 
        })
        .eq('id', id);

    if (errCredito) {
        alert("Error al actualizar el crédito: " + errCredito.message);
        return;
    }

    // C. Corregir Historial con el nuevo concepto bancario unificado
    let conceptoFinal = `DESEMBOLSO: ${codigoCreditoOficial} - ${nombreCompleto}`;
    if (!conceptoFinal.includes('(CORREGIDO)')) { conceptoFinal += " | 🟡 (CORREGIDO)"; }

    await supabaseClient
        .from('historial_capital')
        .update({ monto: -nuevoMonto, concepto: conceptoFinal })
        .eq('credito_id', Number(id)); 

    // D. Corregir saldo caja
    const nuevoSaldoActual = saldoDisponible + (capitalAnterior - nuevoMonto);
    await supabaseClient.from('cajas_capital').update({ saldo_actual: nuevoSaldoActual }).eq('id', cajaId);

    // =========================================================================
    // 🟢 ACTUALIZADO: SMS CON IDENTIFICACIÓN EXCLUSIVA Y FECHA SEPARADA
    // =========================================================================
    try {
        const { data: credInfo } = await supabaseClient.from('creditos').select('*').eq('id', id).single();

        if (credInfo && cliInfo.whatsapp && typeof enviarSMSAutomatico === 'function') {
            let modalidadNombre = (credInfo.frecuencia_pago || "Fija").replace(/.*Cobro\s+/i, "").replace("📅", "").trim();
            
            // Fecha y hora del evento de modificación
            const ahora = new Date();
            const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
            const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            
            const diaCapitalizado = dias[ahora.getDay()].charAt(0).toUpperCase() + dias[ahora.getDay()].slice(1);
            const diaNum = String(ahora.getDate()).padStart(2, '0');
            const mesNombre = meses[ahora.getMonth()];
            const anioCorto = String(ahora.getFullYear()).slice(-2);
            
            const horaFormateada = ahora.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
            
            // Formato exacto manual: Lunes 12/octubre/26 | 10:49 a. m.
            const fechaHoraSMS = `${diaCapitalizado} ${diaNum}/${mesNombre}/${anioCorto} | ${horaFormateada}`;
            // Estructura limpia y corporativa con el código en su propia línea (SOLO LETRA PARA EL CLIENTE)
            const msjMod = `=== SISTEMA ALPHA ===\n${fechaHoraSMS}\n\n🆔 Ref: ${codigoCreditoSMS}\n👤 Cliente: ${nombreCompleto}\n\nHola, los datos de tu credito han sido MODIFICADOS con exito.\n\n💰 Nuevo Monto: $${nuevoMonto.toFixed(2)}\n💵 Nueva Cuota: $${nuevoValorCuota.toFixed(2)}\n🔄 Modalidad: ${modalidadNombre}\n📊 Total: $${nuevoTotalPagar.toFixed(2)}\n🔢 Cuotas: ${credInfo.num_cuotas}\n\nConserva este msj. ¡Gracias!\n🚫 POR FAVOR, NO RESPONDER A ESTE MENSAJE.`;
            
           // 🔥 CONFIGURACIÓN DE RESPALDO PARA EL GERENTE
            const numeroGerente = "0939836191"; // <-- ¡PON TU NÚMERO REAL AQUÍ!

            // 1. Envía el mensaje al cliente
            await enviarSMSAutomatico(cliInfo.whatsapp, msjMod);

            // 2. Envía la copia al gerente (si el cliente no usó tu número)
            if (cliInfo.whatsapp !== numeroGerente) {
                await enviarSMSAutomatico(numeroGerente, `[COPIA EDICIÓN CRÉDITO]\n\n${msjMod}`);
            }
        }
    } catch (errSMS) {
        console.error("⚠️ Error silencioso en SMS de modificación:", errSMS);
    }

    // E. Finalización de interfaz
    document.getElementById('modal-editar-credito').style.display = 'none';
    cargarHistorialCreditos(); 
    if (typeof cargarDatosCapital === 'function') cargarDatosCapital();
    if (typeof cargarHistorialCapital === 'function') cargarHistorialCapital();

    alert(`✅ ¡Éxito! ${codigoCreditoOficial} corregido, historial actualizado y SMS enviado.`);
}
// =========================================================================
// MÓDULO DE SEGURIDAD: ANULACIÓN DE CRÉDITOS (Fase 1 - Sin módulo de pagos)
// =========================================================================
// =========================================================================
// =========================================================================
// MÓDULO DE SEGURIDAD: ANULACIÓN CON ARCHIVADO CONTABLE Y SMS DE EVIDENCIA
// =========================================================================
// =========================================================================
// MÓDULO DE SEGURIDAD: ANULACIÓN CON ARCHIVADO CONTABLE Y SMS DE EVIDENCIA
// =========================================================================
async function intentarAnularCredito(idCredito, capitalPrestado) {
    const confirmacion = confirm(`⚠️ ATENCIÓN ⚠️\n\n¿Estás seguro de anular el crédito #${idCredito}?\n\nEl sistema devolverá automáticamente los $${capitalPrestado} a su caja de origen y lo enviará al Centro de Depuración.`);
    if (!confirmacion) return;

    try {
        // 1. OBTENER DATOS DEL CRÉDITO
        const { data: credito, error: errorInfo } = await supabaseClient
            .from('creditos')
            .select('*')
            .eq('id', idCredito)
            .single();
        
        if (errorInfo) throw errorInfo;

        // 2. OBTENER DATOS DEL CLIENTE
        const { data: infoCliente, error: errorCliente } = await supabaseClient
            .from('clientes')
            .select('nombres, apellidos, cedula, whatsapp') 
            .eq('id', credito.cliente_id)
            .single();

        if (errorCliente) throw errorCliente;

        // =====================================================================
        // MOTOR DE CÓDIGO BANCARIO Y NÚMERO DE CRÉDITO
        // =====================================================================
        const inicialN = infoCliente.nombres.charAt(0).toUpperCase();
        const inicialA = infoCliente.apellidos.charAt(0).toUpperCase();
        const ultimos4 = infoCliente.cedula.slice(-4);
        const codigoClienteBancario = `${inicialN}${inicialA}-${ultimos4}`;

        // Buscamos qué número de crédito exacto estamos anulando
        const { data: todosCreditos } = await supabaseClient
            .from('creditos')
            .select('id')
            .eq('cliente_id', credito.cliente_id)
            .order('id', { ascending: true });
        
        let numeroCredito = 1;
        if (todosCreditos) {
            const index = todosCreditos.findIndex(c => c.id === idCredito);
            if (index !== -1) numeroCredito = index + 1;
        }
        
        // 🔑 CIFRADO DE SEGURIDAD PARA LA ANULACIÓN
        const codigoCifrado = typeof cifrarNumeroCredito === 'function' ? cifrarNumeroCredito(numeroCredito).toUpperCase() : '?';

        // 🛡️ SEPARACIÓN DE CÓDIGOS (INTERNO VS CLIENTE)
    const codigoCreditoOficial = `${codigoClienteBancario} | CRE #${numeroCredito} [${codigoCifrado}]`; // Para tu auditoría
    const codigoCreditoSMS = `${codigoClienteBancario} | CRE #${numeroCredito} [${codigoCifrado}]`; // 🎓 MOSTRAR NÚMERO Y LETRA
        const nombreCompleto = `${infoCliente.nombres.toUpperCase()} ${infoCliente.apellidos.toUpperCase()}`;

        // 3. LÓGICA DE CAJA
        const textoCaja = credito.forma_entrega ? credito.forma_entrega.toLowerCase() : '';
        let idCajaDestino = textoCaja.includes('banco') ? 2 : 1;

        const { data: cajaData, error: errorCaja } = await supabaseClient
            .from('cajas_capital')
            .select('saldo_actual')
            .eq('id', idCajaDestino)
            .single();
        
        if (errorCaja) throw errorCaja;

        const nuevoSaldo = parseFloat(cajaData.saldo_actual) + parseFloat(capitalPrestado);

        // 4. ACTUALIZAR CAJA Y AUDITORÍA UNIFICADA
        await supabaseClient.from('cajas_capital').update({ saldo_actual: nuevoSaldo }).eq('id', idCajaDestino);
        await supabaseClient.from('historial_capital').insert([{
            caja_id: idCajaDestino,
            monto: capitalPrestado,
            concepto: `🟢 REVERSIÓN: Anulación - ${codigoCreditoOficial} - ${nombreCompleto} (Devolución de capital)`
        }]);

        // 5. DISPARAR SMS DE EVIDENCIA
        if (infoCliente && infoCliente.whatsapp && typeof enviarSMSAutomatico === 'function') {
            const modalidad = (credito.frecuencia_pago || "Fija").replace(/.*Cobro\s+/i, "").replace("📅", "").trim();
            
            // 🔥 FÓRMULA ALPHA SMS COMPACTA 🔥
            const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

            const ahora = new Date();
            const diaSemanaA = dias[ahora.getDay()];
            const numDiaA = String(ahora.getDate()).padStart(2, '0');
            const mesNombreA = meses[ahora.getMonth()];
            const anioA = ahora.getFullYear();

            let horasA = ahora.getHours();
            let minutosA = String(ahora.getMinutes()).padStart(2, '0');
            const ampmA = horasA >= 12 ? 'p.m.' : 'a.m.';
            horasA = horasA % 12; horasA = horasA ? horasA : 12;
            horasA = String(horasA).padStart(2, '0');

            const fechaHoraSMS = `${diaSemanaA} ${numDiaA}/${mesNombreA}/${anioA} | ${horasA}:${minutosA} ${ampmA}`;

            // 🎓 AQUÍ SE APLICA EL CÓDIGO OCULTO PARA EL CLIENTE
            const msjAnulacion = `=== SISTEMA ALPHA ===\n${fechaHoraSMS}\n\n🆔 Ref: ${codigoCreditoSMS}\n👤 Cliente: ${nombreCompleto}\n\nHola, tu credito ha sido ANULADO con exito.\n\n💰 Monto devuelto: $${parseFloat(capitalPrestado).toFixed(2)}\n🔄 Modalidad: ${modalidad}\n\nEste es tu soporte oficial. ¡Gracias!\n🚫 POR FAVOR, NO RESPONDER A ESTE MENSAJE.`;
            
            console.log("Enviando SMS de anulación al cliente...");
            // 1. Envío original al cliente
            await enviarSMSAutomatico(infoCliente.whatsapp, msjAnulacion);
            
            // 🕒 2. PAUSA DE 2 SEGUNDOS: Evitamos colapso del chip
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 🔥 3. COPIA DE AUDITORÍA PARA EL GERENTE
            const numeroGerente = "0939836191";
            if (infoCliente.whatsapp !== numeroGerente) {
                console.log("Enviando SMS de anulación al gerente...");
                await enviarSMSAutomatico(numeroGerente, `[ALERTA DE ANULACIÓN DE CRÉDITO]\n\n${msjAnulacion}`);
            }
        }

        // =====================================================================
        // 🌟 PASO 6 MODIFICADO: YA NO BORRAMOS, AHORA ARCHIVAMOS
        // =====================================================================
        

        // =====================================================================
        // 🌟 PASO 6 MODIFICADO: YA NO BORRAMOS, AHORA ARCHIVAMOS
        // =====================================================================
        await supabaseClient
            .from('creditos')
            .update({ estado: 'inactivo' })
            .eq('id', idCredito);

        alert(`✅ ${codigoCreditoOficial} enviado al Centro de Depuración de forma segura.`);
        
        // Recargar pantallas en vivo
        cargarHistorialCreditos();
        if (typeof cargarHistorialCapital === 'function') cargarHistorialCapital();

    } catch (error) {
        console.error("Error al anular:", error);
        alert("Hubo un error al procesar la anulación. Verifica tu conexión.");
    }
}



// ==========================================
// 🚀 MOTOR DE ENVÍO SMS (Vía MacroDroid)
// ==========================================
async function enviarSMSAutomatico(numeroCliente, textoMensaje) {
    // 1. Limpiamos el número (quitamos espacios o guiones)
    let numeroLimpio = numeroCliente.replace(/\D/g, ''); 
    
    // 2. Preparamos el texto para que pueda viajar por internet sin romperse (tildes, espacios, etc)
    let mensajeCodificado = encodeURIComponent(textoMensaje);

    // 3. Tu enlace maestro de MacroDroid uniendo el número y el mensaje
    const urlWebhook = `https://trigger.macrodroid.com/554f217c-000a-4581-896c-551d96459fb2/sms_credito?numero=${numeroLimpio}&mensaje=${mensajeCodificado}`;

    try {
        // 4. Disparamos la orden silenciosamente en segundo plano
        await fetch(urlWebhook, { 
            method: 'GET', 
            mode: 'no-cors' // <-- El truco mágico para que Google Chrome no bloquee el envío
        });
        
        console.log("✅ ¡Orden SMS enviada a MacroDroid!");
    } catch (error) {
        console.error("❌ Falló la orden SMS:", error);
    }
}

// =========================================================================
// =========================================================================
// MÓDULO DE SERVICIO EXTRA: REENVÍO INTELIGENTE (COBRO O GRATIS)
// =========================================================================
// =========================================================================
// MÓDULO DE SERVICIO EXTRA: REENVÍO INTELIGENTE (COBRO O GRATIS)
// =========================================================================
// =========================================================================
// MÓDULO DE SERVICIO EXTRA: REENVÍO INTELIGENTE (COBRO O GRATIS)
// =========================================================================
// =========================================================================
// MÓDULO DE SERVICIO EXTRA: REENVÍO INTELIGENTE (COBRO O GRATIS)
// =========================================================================
async function reenviarVoucher(idCredito) {
    try {
        const { data: credito, error: errCred } = await supabaseClient.from('creditos').select('*').eq('id', idCredito).single();
        if (errCred) throw errCred;

        const { data: cliente, error: errCli } = await supabaseClient.from('clientes').select('*').eq('id', credito.cliente_id).single();
        if (errCli) throw errCli;

        const inicialN = cliente.nombres.charAt(0).toUpperCase();
        const inicialA = cliente.apellidos.charAt(0).toUpperCase();
        const ultimos4 = cliente.cedula.slice(-4);
        const codigoClienteBancario = `${inicialN}${inicialA}-${ultimos4}`;

        const { data: todosCreditos } = await supabaseClient
            .from('creditos')
            .select('id')
            .eq('cliente_id', cliente.id)
            .order('id', { ascending: true });
        
        let numeroCredito = 1;
        if (todosCreditos) {
            const index = todosCreditos.findIndex(c => c.id === idCredito);
            if (index !== -1) numeroCredito = index + 1;
        }
        
        const codigoCifrado = typeof cifrarNumeroCredito === 'function' ? cifrarNumeroCredito(numeroCredito).toUpperCase() : '?';

        const codigoCreditoOficial = `${codigoClienteBancario} | CRE #${numeroCredito} [${codigoCifrado}]`; 
        const codigoCreditoSMS = `${codigoClienteBancario} | CRE #${codigoCifrado}`; 

        const nombreCompleto = `${cliente.nombres.toUpperCase()} ${cliente.apellidos.toUpperCase()}`;

        let numeroGuardado = cliente.whatsapp || "";
        let numeroEnvio = prompt(`📱 REENVÍO DE RESPALDO (${codigoCreditoOficial})\n\nTeléfono registrado:\nSi cambió de chip, pon el nuevo número aquí:`, numeroGuardado);
        
        if (!numeroEnvio || numeroEnvio.trim() === "") return; 

        let cobrar = confirm(`💰 TIPO DE REENVÍO\n\n¿Deseas cobrar los $0.50 de penalidad?\n\n🟢 ACEPTAR = Cobrar $0.50 (Perdió el chip)\n🔴 CANCELAR = Envío GRATIS (Fallo de internet)`);

        let etiquetaMensaje = ""; 

        if (cobrar) {
            const { data: cajaData } = await supabaseClient.from('cajas_capital').select('saldo_actual').eq('id', 1).single();
            const nuevoSaldoCaja = parseFloat(cajaData.saldo_actual) + 0.50;
            await supabaseClient.from('cajas_capital').update({ saldo_actual: nuevoSaldoCaja }).eq('id', 1);
            
            await supabaseClient.from('historial_capital').insert([{
                caja_id: 1,
                monto: 0.50,
                concepto: `🟢 INGRESO: Penalidad por reenvío de voucher - ${codigoCreditoOficial} - ${nombreCompleto}`
            }]);
            
            if (typeof cargarDatosCapital === 'function') cargarDatosCapital();
            if (typeof cargarHistorialCapital === 'function') cargarHistorialCapital();

            etiquetaMensaje = "[COPIA DE RESPALDO] val 0.50ctv\n";
        }

        const modalidad = (credito.frecuencia_pago || "Fija").replace(/.*Cobro\s+/i, "").replace("📅", "").trim();
        
        // 🔥 FÓRMULA ALPHA SMS COMPACTA 🔥
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

        // 🕒 FECHA 1: CUÁNDO SE ESTÁ HACIENDO LA REIMPRESIÓN (HOY)
        const ahora = new Date();
        const diaSemanaA = dias[ahora.getDay()];
        const numDiaA = String(ahora.getDate()).padStart(2, '0');
        const mesNombreA = meses[ahora.getMonth()];
        const anioA = ahora.getFullYear();

        let horasA = ahora.getHours();
        let minutosA = String(ahora.getMinutes()).padStart(2, '0');
        const ampmA = horasA >= 12 ? 'p.m.' : 'a.m.';
        horasA = horasA % 12; horasA = horasA ? horasA : 12;
        horasA = String(horasA).padStart(2, '0');

        const fechaHoraSMS = `${diaSemanaA} ${numDiaA}/${mesNombreA}/${anioA} | ${horasA}:${minutosA} ${ampmA}`;

        // 📅 FECHA 2: CUÁNDO SE CREÓ REALMENTE EL CRÉDITO ORIGINALMENTE (¡AHORA CON HORA EXACTA!)
        let fechaEmisionTexto = "N/A";
        if (credito.fecha_emision) {
            // Pasamos la fecha con todo y hora al motor
            let fechaObjEmi = new Date(credito.fecha_emision);
            
            // Truco de seguridad por si Supabase manda un formato extraño
            if (isNaN(fechaObjEmi.getTime()) && typeof credito.fecha_emision === 'string') {
                fechaObjEmi = new Date(credito.fecha_emision.replace(/-/g, '/').replace('T', ' ').split('.')[0]);
            }

            if (!isNaN(fechaObjEmi.getTime())) {
                const diaSemanaEmi = dias[fechaObjEmi.getDay()];
                const numDiaEmi = String(fechaObjEmi.getDate()).padStart(2, '0');
                const mesNombreEmi = meses[fechaObjEmi.getMonth()];
                const anioEmi = fechaObjEmi.getFullYear();
                
                // Extraemos la hora exacta del momento en que usted le dio clic a "Aprobar"
                let horasEmi = fechaObjEmi.getHours();
                let minutosEmi = String(fechaObjEmi.getMinutes()).padStart(2, '0');
                let segundosEmi = String(fechaObjEmi.getSeconds()).padStart(2, '0');
                const ampmEmi = horasEmi >= 12 ? 'p.m.' : 'a.m.';
                horasEmi = horasEmi % 12; horasEmi = horasEmi ? horasEmi : 12;
                horasEmi = String(horasEmi).padStart(2, '0');
                
                // La línea completa con auditoría de tiempo
                fechaEmisionTexto = `${diaSemanaEmi} ${numDiaEmi}/${mesNombreEmi}/${anioEmi} | ${horasEmi}:${minutosEmi}:${segundosEmi} ${ampmEmi}`;
            }
        }

        // 🚨 LÓGICA DE AUDITORÍA: CÁLCULO DE MORA Y DEUDA TOTAL (Solo se activa si el cliente tiene mora)
        const moraExtra = parseFloat(credito.monto_mora) || 0;
        let bloqueMora = "";
        
        if (moraExtra > 0) {
            const deudaTotal = parseFloat(credito.total_pagar) + moraExtra;
            bloqueMora = `\n⚠️ Mora: $${moraExtra.toFixed(2)}\n👉 Deuda Total: $${deudaTotal.toFixed(2)}`;
        }

        const msjReenvio = `=== SISTEMA ALPHA ===\n${etiquetaMensaje}${fechaHoraSMS}\n\n🆔 Ref: ${codigoCreditoSMS}\n👤 Cliente: ${nombreCompleto}\n📅 Emitido: ${fechaEmisionTexto}\n\nHola, aqui tienes el respaldo de tu credito.\n\n💰 Monto: $${parseFloat(credito.monto_capital).toFixed(2)}\n💵 Cuota: $${parseFloat(credito.valor_cuota).toFixed(2)}\n🔄 Modalidad: ${modalidad}\n📊 Total: $${parseFloat(credito.total_pagar).toFixed(2)}\n🔢 Nro Cuotas: ${credito.num_cuotas}${bloqueMora}\n\nConserva este msj. ¡Gracias!\n🚫 POR FAVOR, NO RESPONDER A ESTE MENSAJE.`; 
     console.log("Reenviando voucher...");
        
        // 1. Envía el mensaje de copia al cliente (o al nuevo número)
        await enviarSMSAutomatico(numeroEnvio.trim(), msjReenvio);

        // 🕒 PAUSA DE 2 SEGUNDOS: Le da tiempo al chip para procesar y no bloquearse
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 2. 🔥 ENVÍA AVISO DE AUDITORÍA AL GERENTE
        const numeroGerente = "0939836191"; 
        if (numeroEnvio.trim() !== numeroGerente) {
            // Etiqueta secreta de auditoría exclusiva para tu teléfono
            const estadoCobro = cobrar ? "COBRADO $0.50" : "GRATIS";
            await enviarSMSAutomatico(numeroGerente, `[AVISO REENVÍO ${estadoCobro}]\n\n${msjReenvio}`);
        }

        if (cobrar) {
            alert(`✅ Copia cobrada ($0.50) y enviada a: ${numeroEnvio}`);
        } else {
            alert(`✅ Mensaje enviado de cortesía (Gratis) a: ${numeroEnvio}`);
        }

    } catch (error) {
        console.error("Error al reenviar voucher:", error);
        alert("Hubo un error al intentar reenviar el mensaje.");
    }
}


// =========================================================================
// 📄 MOTORES DE REPORTES EXCEL Y PDF (CRÉDITOS ORDENADOS + MORA)
// =========================================================================

// =========================================================================
// 📄 MOTORES DE REPORTES EXCEL Y PDF (CRÉDITOS ORDENADOS CRONOLÓGICAMENTE)
// =========================================================================
// =========================================================================
// 📄 MOTORES DE REPORTES EXCEL Y PDF (CRÉDITOS ORDENADOS + HISTORIAL MORAS)
// =========================================================================

window.descargarExcelCreditos = async function() {
    try {
        alert("⏳ Generando Excel de Créditos... Por favor, espere.");

        // 1. Descargamos la data de créditos (CON monto_mora)
        const { data: creditos, error: errCreditos } = await supabaseClient
            .from('creditos')
            .select(`id, monto_capital, total_pagar, valor_cuota, frecuencia_pago, fecha_emision, estado, monto_mora, clientes (nombres, apellidos, cedula)`)
            .eq('estado', 'activo');

        if (errCreditos) throw errCreditos;
        if (!creditos || creditos.length === 0) {
            alert("⚠️ No hay créditos activos para exportar.");
            return;
        }

        // 2. Descargamos el historial de moras para saber quién tiene castigos
        const { data: moras, error: errMoras } = await supabaseClient
            .from('historial_moras')
            .select('credito_id, tipo_accion');
        
        if (errMoras) console.error("Error al cargar moras:", errMoras);

        // Agrupamos las moras por crédito
        const mapaMoras = {};
        if (moras) {
            moras.forEach(m => {
                if (!mapaMoras[m.credito_id]) mapaMoras[m.credito_id] = [];
                mapaMoras[m.credito_id].push(m.tipo_accion);
            });
        }

        // 3. 🔥 EL CEREBRO DEL FILTRO 🔥
        const filtroElegido = document.getElementById('filtro-mes-reportes') ? document.getElementById('filtro-mes-reportes').value : 'todos';
        let datosAExportar = creditos;

        if (filtroElegido !== 'todos') {
            let mesFiltro, anioFiltro;
            if (filtroElegido === 'actual') {
                mesFiltro = new Date().getMonth();
                anioFiltro = new Date().getFullYear();
            } else {
                const partes = filtroElegido.split('-');
                anioFiltro = parseInt(partes[0]);
                mesFiltro = parseInt(partes[1]);
            }

            datosAExportar = creditos.filter(c => {
                const fStr = c.fecha_emision;
                if (!fStr) return false;
                let f;
                if (typeof fStr === 'string' && fStr.includes('/')) {
                    const p = fStr.split(/[\/\s:]+/); 
                    f = new Date(p[2], p[1]-1, p[0]);
                } else {
                    f = new Date(fStr);
                }
                if (isNaN(f.getTime())) return false;
                return f.getMonth() === mesFiltro && f.getFullYear() === anioFiltro;
            });
        }

        if (datosAExportar.length === 0) {
            alert("⚠️ No se emitieron créditos en el mes seleccionado.");
            return;
        }

        // 4. 🔥 MOTOR DE ORDENAMIENTO CRONOLÓGICO 🔥
        datosAExportar.sort((a, b) => {
            const obtenerTiempo = (fechaStr) => {
                if (!fechaStr) return 0;
                if (typeof fechaStr === 'string' && fechaStr.includes('/')) {
                    const p = fechaStr.split(/[\/\s:]+/); 
                    return new Date(p[2], p[1]-1, p[0]).getTime();
                }
                return new Date(fechaStr).getTime();
            };
            return obtenerTiempo(b.fecha_emision) - obtenerTiempo(a.fecha_emision);
        });

        // 5. Mapeamos y formateamos a Nivel VIP
        const datosLimpios = datosAExportar.map(c => {
            let fechaBonita = 'Sin fecha';
            const fStr = c.fecha_emision;
            if (fStr) {
                let f;
                if (typeof fStr === 'string' && fStr.includes('/')) {
                    const p = fStr.split(/[\/\s:]+/); 
                    f = new Date(p[2], p[1]-1, p[0]);
                } else {
                    f = new Date(fStr);
                }
                if (!isNaN(f.getTime())) {
                    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
                    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                    fechaBonita = `${dias[f.getDay()]} ${String(f.getDate()).padStart(2, '0')}/${meses[f.getMonth()]}/${f.getFullYear()}`;
                }
            }

            const cliente = c.clientes || {};
            const nombreCompleto = `${cliente.nombres || ''} ${cliente.apellidos || ''}`.toUpperCase().trim();
            const modalidadLimpia = (c.frecuencia_pago || 'N/A').replace(/📅/g, '').trim();
            const valorMora = parseFloat(c.monto_mora || 0); // 🔥 AQUÍ ESTÁ EL DINERO REAL

            // Lógica de "Estado / Novedades" (SIN EMOJIS PARA EXCEL TAMBIEN PARA EVITAR PROBLEMAS)
            let estadoNovedad = "Normal";
            if (c.estado === 'congelado') {
                estadoNovedad = "[CONGELADO]";
            } else if (mapaMoras[c.id]) {
                const perdones = mapaMoras[c.id].filter(m => m.includes('Perdón')).length;
                const castigos = mapaMoras[c.id].filter(m => m.includes('Mora')).length;
                if (castigos > 0) estadoNovedad = `[MULTADO: ${castigos}v]`;
                if (perdones > 0) estadoNovedad += ` [PERDONADO]`;
            }

            return {
                "N° Crédito": c.id,
                "Cliente": nombreCompleto,
                "Cédula": cliente.cedula || 'N/A',
                "Fecha Emisión": fechaBonita,
                "Capital ($)": parseFloat(c.monto_capital || 0),
                "Total Pagar ($)": parseFloat(c.total_pagar || 0),
                "Cuota ($)": parseFloat(c.valor_cuota || 0),
                "Mora ($)": valorMora,
                "Estado / Novedad": estadoNovedad,
                "Modalidad": modalidadLimpia
            };
        });

        const hoja = XLSX.utils.json_to_sheet(datosLimpios);
        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, hoja, "Créditos Filtrados");

        const anchos = [{ wch: 8 }, { wch: 35 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 30 }, { wch: 20 }];
        hoja['!cols'] = anchos;

        XLSX.writeFile(libro, `REPORTE_CREDITOS_${filtroElegido.toUpperCase()}.xlsx`);

    } catch (error) {
        console.error("Error al exportar Excel:", error);
        alert("❌ Error al generar el Excel: " + error.message);
    }
};

window.generarPDFCreditos = async function() {
    try {
        alert("⏳ Generando PDF de Créditos... Por favor, espere.");

        // 1. Descargamos la data de Supabase
        const { data: creditos, error: errCreditos } = await supabaseClient
            .from('creditos')
            .select(`id, monto_capital, total_pagar, valor_cuota, frecuencia_pago, fecha_emision, estado, monto_mora, clientes (nombres, apellidos, cedula)`)
            .eq('estado', 'activo');

        if (errCreditos) throw errCreditos;
        if (!creditos || creditos.length === 0) {
            alert("⚠️ No hay créditos activos para exportar.");
            return;
        }

        // 2. Descargamos el historial
        const { data: moras, error: errMoras } = await supabaseClient.from('historial_moras').select('credito_id, tipo_accion');
        const mapaMoras = {};
        if (moras) {
            moras.forEach(m => {
                if (!mapaMoras[m.credito_id]) mapaMoras[m.credito_id] = [];
                mapaMoras[m.credito_id].push(m.tipo_accion);
            });
        }

        // 3. 🔥 EL CEREBRO DEL FILTRO 🔥
        const filtroElegido = document.getElementById('filtro-mes-reportes') ? document.getElementById('filtro-mes-reportes').value : 'todos';
        let datosAExportar = creditos;
        let tituloPeriodo = "HISTORIAL COMPLETO DE CRÉDITOS";

        if (filtroElegido !== 'todos') {
            let mesFiltro, anioFiltro;
            if (filtroElegido === 'actual') {
                mesFiltro = new Date().getMonth();
                anioFiltro = new Date().getFullYear();
                tituloPeriodo = `CRÉDITOS EMITIDOS EN EL MES ACTUAL`;
            } else {
                const partes = filtroElegido.split('-');
                anioFiltro = parseInt(partes[0]);
                mesFiltro = parseInt(partes[1]);
                const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                tituloPeriodo = `CRÉDITOS EMITIDOS: ${nombresMeses[mesFiltro].toUpperCase()} ${anioFiltro}`;
            }

            datosAExportar = creditos.filter(c => {
                const fStr = c.fecha_emision;
                if (!fStr) return false;
                let f;
                if (typeof fStr === 'string' && fStr.includes('/')) {
                    const p = fStr.split(/[\/\s:]+/); 
                    f = new Date(p[2], p[1]-1, p[0]);
                } else {
                    f = new Date(fStr);
                }
                if (isNaN(f.getTime())) return false;
                return f.getMonth() === mesFiltro && f.getFullYear() === anioFiltro;
            });
        }

        if (datosAExportar.length === 0) {
            alert("⚠️ No se registraron créditos en el mes seleccionado.");
            return;
        }

        // 4. 🔥 MOTOR DE ORDENAMIENTO CRONOLÓGICO 🔥
        datosAExportar.sort((a, b) => {
            const obtenerTiempo = (fechaStr) => {
                if (!fechaStr) return 0;
                if (typeof fechaStr === 'string' && fechaStr.includes('/')) {
                    const p = fechaStr.split(/[\/\s:]+/); 
                    return new Date(p[2], p[1]-1, p[0]).getTime();
                }
                return new Date(fechaStr).getTime();
            };
            return obtenerTiempo(b.fecha_emision) - obtenerTiempo(a.fecha_emision);
        });

        // 5. Generamos el PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape');

        doc.setFontSize(18);
        doc.setTextColor(15, 23, 42);
        doc.text(`SISTEMA ALPHA V5 - ${tituloPeriodo}`, 14, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        const fechaHoy = new Date().toLocaleString('es-EC');
        doc.text(`Fecha de Auditoría: ${fechaHoy}`, 14, 28);
        doc.text("Estado: CRÉDITOS ACTIVOS (Con auditoría de moras)", 14, 33);

        let sumaCapital = 0; let sumaTotal = 0; let sumaMoraGlobal = 0;

        const filas = datosAExportar.map(c => {
            let fechaBonita = 'Sin fecha';
            const fStr = c.fecha_emision;
            if (fStr) {
                let f;
                if (typeof fStr === 'string' && fStr.includes('/')) {
                    const p = fStr.split(/[\/\s:]+/); 
                    f = new Date(p[2], p[1]-1, p[0]);
                } else {
                    f = new Date(fStr);
                }
                if (!isNaN(f.getTime())) {
                    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
                    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                    fechaBonita = `${dias[f.getDay()]} ${String(f.getDate()).padStart(2, '0')}/${meses[f.getMonth()]}/${f.getFullYear()}`;
                }
            }

            const cliente = c.clientes || {};
            const nombreCompleto = `${cliente.nombres || ''} ${cliente.apellidos || ''}`.toUpperCase().trim();
            const capital = parseFloat(c.monto_capital || 0);
            const total = parseFloat(c.total_pagar || 0);
            const mora = parseFloat(c.monto_mora || 0);
            
            sumaCapital += capital;
            sumaTotal += total;
            sumaMoraGlobal += mora;

            // 🔥 LIMPIEZA DE EMOJIS PARA EVITAR SÍMBOLOS RAROS EN PDF 🔥
            let estadoNovedad = "Normal";
            if (c.estado === 'congelado') {
                estadoNovedad = "[ CONGELADO ]";
            } else if (mapaMoras[c.id]) {
                const perdones = mapaMoras[c.id].filter(m => m.includes('Perdón')).length;
                const castigos = mapaMoras[c.id].filter(m => m.includes('Mora')).length;
                if (castigos > 0) estadoNovedad = `[ MULTADO: ${castigos}v ]`;
                if (perdones > 0) estadoNovedad += ` [ PERDONADO ]`;
            }

            return [
                c.id,
                nombreCompleto,
                fechaBonita,
                `$${capital.toFixed(2)}`,
                `$${total.toFixed(2)}`,
                `$${mora.toFixed(2)}`,
                estadoNovedad
            ];
        });

        // Cuadros de métricas
        doc.setFillColor(255, 247, 237); doc.setDrawColor(254, 215, 170); doc.rect(14, 40, 62, 16, 'FD');
        doc.setFontSize(8); doc.setTextColor(154, 52, 18); doc.text("CAPITAL PRESTADO", 17, 46);
        doc.setFontSize(14); doc.setTextColor(194, 65, 12); doc.text(`$${sumaCapital.toFixed(2)}`, 17, 53);

        doc.setFillColor(240, 253, 244); doc.setDrawColor(187, 247, 208); doc.rect(80, 40, 62, 16, 'FD');
        doc.setFontSize(8); doc.setTextColor(22, 101, 52); doc.text("PROYECCIÓN A RECUPERAR", 83, 46);
        doc.setFontSize(14); doc.setTextColor(21, 128, 61); doc.text(`$${sumaTotal.toFixed(2)}`, 83, 53);

        doc.setFillColor(254, 242, 242); doc.setDrawColor(254, 202, 202); doc.rect(146, 40, 62, 16, 'FD');
        doc.setFontSize(8); doc.setTextColor(153, 27, 27); doc.text("MORA TOTAL ACTIVA", 149, 46);
        doc.setFontSize(14); doc.setTextColor(185, 28, 28); doc.text(`$${sumaMoraGlobal.toFixed(2)}`, 149, 53);

        doc.setFillColor(248, 250, 252); doc.setDrawColor(226, 232, 240); doc.rect(212, 40, 62, 16, 'FD');
        doc.setFontSize(8); doc.setTextColor(71, 85, 105); doc.text("CRÉDITOS EMITIDOS", 215, 46);
        doc.setFontSize(14); doc.setTextColor(15, 23, 42); doc.text(`${datosAExportar.length} Operaciones`, 215, 53);

        doc.autoTable({
            startY: 62,
            head: [["N° CRE", "CLIENTE", "FECHA EMISIÓN", "CAPITAL", "TOTAL", "MORA", "NOVEDADES"]],
            body: filas,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], fontSize: 8 },
            styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
            // Ajustamos el ancho para que NOVEDADES tenga más espacio y no se desborde
            columnStyles: { 
                1: { cellWidth: 55 }, // Cliente
                6: { cellWidth: 65 }  // Novedades (Mucho más ancho)
            },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 14, right: 14 },
            didParseCell: function(data) {
                if (data.section === 'body') {
                    // Pintar Mora de rojo
                    if (data.column.index === 5 && data.cell.raw !== '$0.00') {
                        data.cell.styles.textColor = [220, 38, 38];
                        data.cell.styles.fontStyle = 'bold';
                    }
                    // Resaltar Congelados o Multados
                    if (data.column.index === 6) {
                        const nov = data.cell.raw.toString();
                        if (nov.includes('CONGELADO')) data.cell.styles.textColor = [2, 132, 199];
                        else if (nov.includes('MULTADO')) data.cell.styles.textColor = [220, 38, 38];
                    }
                }
            }
        });

        doc.setFontSize(9); doc.setTextColor(150, 150, 150);
        doc.text(`Documento de control interno - Sistema Alpha V5.`, 14, (doc.lastAutoTable.finalY || 85) + 10);
        doc.save(`Auditoria_Creditos_${filtroElegido}_${new Date().getTime()}.pdf`);

    } catch (error) {
        console.error("Error al generar PDF:", error);
        alert("❌ Error al generar el documento PDF: " + error.message);
    }
};
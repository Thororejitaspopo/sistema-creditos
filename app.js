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
   4. LOGÍSTICA ADMINISTRATIVA: FUNCIONES DE LA BASE DE DATOS (CON FILTRO DE ARCHIVADOS)
   ========================================================================== */

/**
 * Consulta la base de datos remota para bajar la lista de clientes activos.
 */
async function cargarClientes() {
    // Captura el contenedor donde se listan las tarjetas de clientes
    const contenedor = document.getElementById('lista-clientes');
    // Inyecta un texto temporal de carga para avisar al usuario que el sistema está trabajando
    contenedor.innerHTML = '<p style="text-align:center; color:#64748b; font-size:13px;">Cargando base de datos...</p>';

    // =====================================================================
    // 🌟 NUEVO: EL FILTRO INTELIGENTE (.neq('estado', 'inactivo'))
    // Le decimos a Supabase: "Tráeme todos, MENOS los inactivos/archivados"
    // =====================================================================
    const { data: clientes, error } = await supabaseClient
        .from('clientes')
        .select('*')
        .neq('estado', 'inactivo') 
        .order('id', { ascending: false });

    // Verifica si la conexión con la nube falló para reportar el error en pantalla
    if (error) {
        // Pinta el mensaje de error con letras rojas de peligro
        contenedor.innerHTML = `<p style="text-align:center; color:red; font-size:13px;">Error: ${error.message}</p>`;
        // Detiene por completo la función para evitar colapsar el sistema
        return;
    }

    // Guarda los clientes descargados en la memoria global del sistema
    listaClientesGlobal = clientes;
    
    // Ejecuta las dos inyecciones dinámicas en tu pantalla mandando los datos descargados
    renderizarLista(clientes);
    // Actualiza la lista desplegable de garantes disponibles
    actualizarComboGarantes(clientes);
}

/**
 * Agarra la lista de clientes en caché y fabrica las opciones del combo box "cli-garante".
 */
function actualizarComboGarantes(clientes) {
    // Enlaza el elemento Select del formulario destinado a los garantes
    const combo = document.getElementById('cli-garante');
    
    // Mantiene por defecto siempre limpia la opción base
    combo.innerHTML = '<option value="">🚫 Sin Garante / Cliente Directo</option>';
    
    // Mapea los clientes registrados para cargarlos como garantes disponibles
    clientes.forEach(cliente => {
        // Crea una etiqueta de opción HTML vacía en la memoria del navegador
        const option = document.createElement('option');
        // Asigna el ID numérico real del cliente como valor interno del elemento
        option.value = cliente.id; 
        // Genera el texto visible combinando el nombre, apellido y cédula del garante
        option.text = `👤 ${cliente.nombres.toUpperCase()} ${cliente.apellidos.toUpperCase()} (C.I: ${cliente.cedula})`;
        // Agrega la opción terminada dentro del elemento Select del formulario
        combo.appendChild(option);
    });
}

/**
 * Convierte el array de clientes en bloques visuales de tarjetas con paginación de 10 en 10.
 */
/**
 * Convierte el array de clientes en bloques visuales de tarjetas con paginación de 10 en 10.
 */
function renderizarLista(clientes) {
    // Captura el panel donde se van a colgar las tarjetas físicas de los clientes
    const contenedor = document.getElementById('lista-clientes');
    // Captura el contenedor del pie de página que fabricamos en tu HTML para poner los números
    const contenedorPaginacion = document.getElementById('paginacion-clientes');
    
    // Limpia las tarjetas de la página anterior para no duplicar datos viejos
    contenedor.innerHTML = '';
    
    // Limpia los botones numéricos viejos para recalcular la numeración según el filtro actual
    if (contenedorPaginacion) {
        contenedorPaginacion.innerHTML = '';
    }

    // Revisa si el arreglo llegó vacío (ya sea de Supabase o porque el buscador no halló nada)
    if (clientes.length === 0) {
        // Escribe un aviso sutil indicando la ausencia de registros
        contenedor.innerHTML = '<p style="text-align:center; color:#64748b; font-size:13px; margin-top:10px;">No hay clientes en el sistema.</p>';
        // Detiene la función inmediatamente para evitar cálculos innecesarios
        return;
    }

    // Calcula el casillero exacto donde inicia el corte para la página actual
    const indiceInicio = (paginaActual - 1) * clientesPorPagina;
    // Calcula el punto final exacto donde la tejera del código debe cortar la lista
    const indiceFin = indiceInicio + clientesPorPagina;
    // Corta el pastel de datos para extraer únicamente el lote de 10 clientes de esta hoja
    const clientesDeLaPagina = clientes.slice(indiceInicio, indiceFin);

    // Arranca el ciclo principal usando únicamente los 10 clientes recortados para esta pantalla
    clientesDeLaPagina.forEach(cliente => {
        // Genera el código visual con ceros a la izquierda tomando como base el ID real de Supabase
        const codigoSecuencial = 'CLI-' + String(cliente.id).padStart(6, '0');
        // Extrae la inicial del nombre y del apellido para fabricar el avatar circular
        const iniciales = ((cliente.nombres[0] || '') + (cliente.apellidos[0] || '')).toUpperCase();
        
        // Inicializa la variable de color con el azul básico por defecto
        let colorNivel = '#0369a1';
        // Si la categoría contiene la palabra 'Oro', cambia el color al verde de éxito
        if(cliente.nivel.includes('Oro')) colorNivel = 'var(--verde-exito)';
        // Si contiene la palabra 'Plata', le asigna un color gris corporativo elegante
        if(cliente.nivel.includes('Plata')) colorNivel = '#475569';
        // Si contiene la palabra 'Platino', absorbe el color azul premium del sistema
        if(cliente.nivel.includes('Platino')) colorNivel = 'var(--azul-premium)';
        // Si contiene la palabra 'Diamante', le inyecta un color morado de alto estatus
        if(cliente.nivel.includes('Diamante')) colorNivel = '#7c3aed';

        // Fabrica un bloque DIV completamente nuevo en la memoria del navegador
        const tarjeta = document.createElement('div');
        // Le inyecta la clase CSS obligatoria para heredar el diseño de tarjeta flotante
        tarjeta.className = 'tarjeta-cliente';
        // Maqueta la estructura interna combinando el avatar, los datos y los botones de control
        tarjeta.innerHTML = `
            <div class="info-perfil">
                <div class="avatar-letra">${iniciales}</div>
                <div class="detalles-perfil">
                    <h4><span>${codigoSecuencial}</span> - ${cliente.nombres.toUpperCase()} ${cliente.apellidos.toUpperCase()}</h4>
                    <p>C.I: ${cliente.cedula} | ${cliente.ruta}</p>
                    <p style="color: ${colorNivel}; font-weight: 600; font-size: 11px;">${cliente.nivel}</p>
                </div>
            </div>
            <div class="acciones-cliente">
                <button class="btn-accion btn-ver" title="Ver Historial" onclick="verCliente(${cliente.id})">👁️</button>
                <button class="btn-accion btn-edit" title="Editar Datos del Cliente" onclick="prepararEdicion(${cliente.id})">✏️</button>
                
                <button class="btn-accion btn-credito" title="Crear Crédito" onclick="redirigirACrearCredito(${cliente.id})">💳</button>
                
                <button class="btn-accion btn-elim" title="Eliminar de Raíz" onclick="eliminarCliente(${cliente.id})">🗑️</button>
            </div>
        `;
        // Cuelga la tarjeta terminada y estructurada dentro del contenedor visible de tu interfaz
        contenedor.appendChild(tarjeta);
    });

    // Calcula cuántas páginas físicas existen dividiendo el total para 10
    const totalPaginas = Math.ceil(clientes.length / clientesPorPagina);
    // Inicia un ciclo que correrá desde la página 1 hasta llegar al total calculado
    for (let i = 1; i <= totalPaginas; i++) {
        // Crea un elemento de tipo botón HTML dinámicamente en memoria
        const boton = document.createElement('button');
        // Le añade la clase CSS para que absorba los estilos del archivo styles.css
        boton.className = 'btn-pagina';
        // Coloca el número del conteo actual como texto visible del botón (1, 2, 3...)
        boton.innerText = i;

        // Evalúa si el botón que se está construyendo es igual a la página que mira el usuario
        if (i === paginaActual) {
            // Si coincide, le incrusta la clase 'active' para pintarlo de azul corporativo
            boton.classList.add('active');
        }

        // Configura el oído interactivo (Click) para responder inmediatamente al presionarlo
        boton.onclick = function () {
            // Actualiza la variable de control global con el número de página seleccionado
            paginaActual = i;
            // Vuelve a llamar a esta función pasando la misma lista original para actualizar la vista
            renderizarLista(clientes);
        };

        // Verifica si el contenedor inferior existe antes de colgar el botón numérico listo
        if (contenedorPaginacion) {
            contenedorPaginacion.appendChild(boton);
        }
    }
}

// =========================================================================
// BLOCK 30: ATAJO HACIA MÓDULO CRÉDITO (CONEXIÓN INTEGRADA)
// =========================================================================
function redirigirACrearCredito(clienteId) {
    // 1. Guardamos el ID en memoria para que el formulario de crédito lo capture
    localStorage.setItem('cliente_para_credito_id', clienteId);

    // 2. Usamos su función nativa 'cambiarModulo' para activar el DIV correspondiente
    // Según su HTML, el ID del contenedor es 'mod-creditos'
    if (typeof cambiarModulo === 'function') {
        cambiarModulo('creditos'); 
        
        // 3. Opcional: Si su función 'cambiarModulo' no selecciona automáticamente el cliente en el select,
        // forzamos la carga del select después de un pequeño retraso
        setTimeout(() => {
            const selectCliente = document.getElementById('cred-cliente-id');
            if (selectCliente) {
                selectCliente.value = clienteId;
                // Si tiene una función de cálculo, la llamamos para que se activen los valores
                if (typeof calcularProyeccionCredito === 'function') {
                    calcularProyeccionCredito();
                }
            }
        }, 300);
    } else {
        console.error("La función cambiarModulo no está definida.");
    }
}
// ... (El resto de tus funciones de edición, registro y eliminación se mantienen intactas)

/**
 * Captura al cliente seleccionado por ID y rellena todos los inputs de tu formulario para editarlo.
 */
function prepararEdicion(id) {
    // Busca dentro de la memoria global al cliente que coincida exactamente con la ID seleccionada
    const cliente = listaClientesGlobal.find(c => c.id === id);
    // Si por algún motivo extraño no encuentra al cliente, cancela el proceso de inmediato
    if (!cliente) return;

    // Coloca el ID del cliente en el centinela para avisar que entramos en modo Edición
    idClienteEditando = id;

    // Rellena cada uno de los inputs del formulario con la información guardada en Supabase
    document.getElementById('cli-id-auto').value = 'EDITANDO';
    document.getElementById('cli-nombres').value = cliente.nombres;
    document.getElementById('cli-apellidos').value = cliente.apellidos;
    document.getElementById('cli-cedula').value = cliente.cedula;
    document.getElementById('cli-whatsapp').value = cliente.whatsapp;
    document.getElementById('cli-correo').value = cliente.correo || '';
    
    // Muestra al garante que ya tenía asignado (si no tenía, vuelve a "Sin garante")
    document.getElementById('cli-garante').value = cliente.garante_id || '';

    document.getElementById('cli-sector').value = cliente.sector;
    document.getElementById('cli-ruta').value = cliente.ruta;
    document.getElementById('cli-direccion').value = cliente.direccion || '';
    document.getElementById('cli-referencia').value = cliente.referencia || '';
    document.getElementById('cli-tel-referencia').value = cliente.tel_referencia || '';
    document.getElementById('cli-observaciones').value = cliente.observaciones || '';
    document.getElementById('cli-nivel').value = cliente.nivel;
    document.getElementById('cli-limite').value = cliente.limite_creditos;

    // Captura el botón principal de guardar del formulario de la izquierda
    const btn = document.querySelector('.btn-guardar');
    // Modifica su texto para alertar que los cambios actualizarán un registro existente
    btn.innerText = "💾 ACTUALIZAR DATOS ALPHA";
    // Cambia el fondo azul estándar por un color naranja degradado de advertencia comercial
    btn.style.background = "linear-gradient(135deg, var(--naranja-recargo) 0%, #c2410c 100%)";

    // Realiza un desplazamiento suave automático de la pantalla directo hacia el formulario
    document.querySelector('.seccion-formulario').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Recopila los inputs y decide si guarda un nuevo registro o actualiza uno existente en Supabase.
 */
// =========================================================================
// DETECTORES DE ENTRADA: Quitan el color rojo en vivo apenas el usuario escribe
// =========================================================================
document.getElementById('cli-nombres').addEventListener('input', (e) => e.target.classList.remove('campo-error'));
document.getElementById('cli-apellidos').addEventListener('input', (e) => e.target.classList.remove('campo-error'));
document.getElementById('cli-cedula').addEventListener('input', (e) => e.target.classList.remove('campo-error'));
document.getElementById('cli-whatsapp').addEventListener('input', (e) => e.target.classList.remove('campo-error'));
document.getElementById('cli-correo').addEventListener('input', (e) => e.target.classList.remove('campo-error'));
if(document.getElementById('cli-sector')) {
    document.getElementById('cli-sector').addEventListener('change', (e) => e.target.classList.remove('campo-error'));
}
if(document.getElementById('cli-ruta')) {
    document.getElementById('cli-ruta').addEventListener('change', (e) => e.target.classList.remove('campo-error'));
}

async function registrarCliente() {
    // Asegurar que la variable de edición exista de forma segura
    const idEditando = typeof idClienteEditando !== 'undefined' ? idClienteEditando : null;

    // -------------------------------------------------------------------------
    // 1. CAPTURA DE ELEMENTOS HTML
    // -------------------------------------------------------------------------
    const inputNombres = document.getElementById('cli-nombres');
    const inputApellidos = document.getElementById('cli-apellidos');
    const inputCedula = document.getElementById('cli-cedula');
    const inputWhatsapp = document.getElementById('cli-whatsapp');
    const inputCorreo = document.getElementById('cli-correo');
    const inputSector = document.getElementById('cli-sector');
    const inputRuta = document.getElementById('cli-ruta');
    
    // 🔥 CAPTURA DEL NUEVO CAMPO DE INMUNIDAD
    const selectPerfilMora = document.getElementById('cli-perfil-mora');

    // -------------------------------------------------------------------------
    // 2. LIMPIEZA DE ERRORES
    // -------------------------------------------------------------------------
    inputNombres.classList.remove('campo-error');
    inputApellidos.classList.remove('campo-error');
    inputCedula.classList.remove('campo-error');
    inputWhatsapp.classList.remove('campo-error');
    inputCorreo.classList.remove('campo-error');
    if(inputSector) inputSector.classList.remove('campo-error');
    if(inputRuta) inputRuta.classList.remove('campo-error');

    // Extraemos los valores limpios
    const nombres = inputNombres.value.trim();
    const apellidos = inputApellidos.value.trim();
    const cedula = inputCedula.value.trim();
    const whatsapp = inputWhatsapp.value.trim();
    const correo = inputCorreo.value.trim();
    
    // 🔥 VALOR DE INMUNIDAD
    const perfil_cobro = selectPerfilMora ? selectPerfilMora.value : 'Normal';
    
    const garanteSeleccionado = document.getElementById('cli-garante').value;
    const garante_id = garanteSeleccionado ? parseInt(garanteSeleccionado) : null;

    const sector = inputSector ? inputSector.value : '';
    const ruta = inputRuta ? inputRuta.value : '';
    const direccion = document.getElementById('cli-direccion').value.trim();
    const referencia = document.getElementById('cli-referencia').value.trim();
    const tel_referencia = document.getElementById('cli-tel-referencia').value.trim();
    const observaciones = document.getElementById('cli-observaciones').value.trim();
    const nivel = document.getElementById('cli-nivel').value;
    const limite_creditos = parseInt(document.getElementById('cli-limite').value) || 2;

    // -------------------------------------------------------------------------
    // 3. VALIDACIÓN DE CAMPOS VACÍOS
    // -------------------------------------------------------------------------
    let tieneCamposVacios = false;

    if (!nombres) { inputNombres.classList.add('campo-error'); tieneCamposVacios = true; }
    if (!apellidos) { inputApellidos.classList.add('campo-error'); tieneCamposVacios = true; }
    if (!cedula) { inputCedula.classList.add('campo-error'); tieneCamposVacios = true; }
    if (!whatsapp) { inputWhatsapp.classList.add('campo-error'); tieneCamposVacios = true; }
    if (!correo) { inputCorreo.classList.add('campo-error'); tieneCamposVacios = true; }
    if (inputSector && !sector) { inputSector.classList.add('campo-error'); tieneCamposVacios = true; }
    if (inputRuta && !ruta) { inputRuta.classList.add('campo-error'); tieneCamposVacios = true; }

    if (tieneCamposVacios) {
        alert("❌ Error: Nombres, Apellidos, Cédula, WhatsApp, Correo, Sector y Ruta son OBLIGATORIOS.");
        return;
    }

    // -------------------------------------------------------------------------
    // 4. VALIDACIÓN DE CORREO Y CÉDULA
    // -------------------------------------------------------------------------
    const patronCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!patronCorreo.test(correo)) {
        inputCorreo.classList.add('campo-error');
        alert("⚠️ Error: El formato del correo electrónico ingresado no es válido.");
        return;
    }

    if (cedula.length < 10) {
        inputCedula.classList.add('campo-error');
        alert("⚠️ La cédula ingresada está incompleta. Debe tener al menos 10 dígitos.");
        return;
    }

    // -------------------------------------------------------------------------
    // 5. VALIDACIÓN DE DUPLICADOS
    // -------------------------------------------------------------------------
    const cedulaExiste = listaClientesGlobal.some(c => c.cedula === cedula && c.id !== idEditando);
    if (cedulaExiste) {
        inputCedula.classList.add('campo-error');
        alert("⛔ Error: Este número de Cédula / RUC ya está registrado con otro cliente.");
        return;
    }

    if (whatsapp.length !== 10) {
        inputWhatsapp.classList.add('campo-error'); 
        alert(`⚠️ Operación Cancelada: El número de WhatsApp es inválido.\n\nDebe tener exactamente 10 dígitos obligatorios.`);
        return; 
    }

    const whatsappExiste = listaClientesGlobal.some(c => c.whatsapp === whatsapp && c.id !== idEditando);
    if (whatsappExiste) {
        inputWhatsapp.classList.add('campo-error');
        alert("⛔ Error: Este número de WhatsApp ya está asignado a otro cliente.");
        return;
    }

    const correoExiste = listaClientesGlobal.some(c => c.correo && c.correo.toLowerCase() === correo.toLowerCase() && c.id !== idEditando);
    if (correo && correoExiste) {
        inputCorreo.classList.add('campo-error');
        alert("⛔ Error: Este Correo Electrónico ya está registrado con otro cliente.");
        return;
    }

    // -------------------------------------------------------------------------
    // 6. GENERACIÓN DE FECHAS, ARCHIVOS Y CÓDIGO BANCARIO
    // -------------------------------------------------------------------------
    const ahora = new Date();
    
    // Fecha para guardar en la base de datos
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const nombreDia = dias[ahora.getDay()];
    const diaNum = String(ahora.getDate()).padStart(2, '0');
    const mesNombre = meses[ahora.getMonth()];
    const anio = ahora.getFullYear();
    let horas = ahora.getHours();
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    const ampm = horas >= 12 ? 'Pm' : 'Am';
    horas = horas % 12 || 12;
    const fechaRegistro = `${nombreDia} ${diaNum}/${mesNombre}/${anio} hora ${horas}:${minutos} ${ampm}`;

    // Fecha corta y elegante para enviar en el SMS
    const fechaLargaSMS = ahora.toLocaleDateString('es-EC', { weekday: 'long', day: '2-digit', month: '2-digit', year: '2-digit' });
    const horaFormateadaSMS = ahora.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    const fechaHoraSMS = `${fechaLargaSMS.charAt(0).toUpperCase() + fechaLargaSMS.slice(1)} | ${horaFormateadaSMS}`;

    // === GENERACIÓN DEL CÓDIGO DE CLIENTE ===
    const inicialN = nombres.charAt(0).toUpperCase();
    const inicialA = apellidos.charAt(0).toUpperCase();
    const ultimos4 = cedula.slice(-4);
    const codigoUnico = `${inicialN}${inicialA}-${ultimos4}`; // Ej: MA-5760
    const nombreCompleto = `${nombres.toUpperCase()} ${apellidos.toUpperCase()}`;

    const inputFotoCliente = document.getElementById('cli-foto-perfil'); 
    const inputFotoCedula = document.getElementById('cli-foto-cedula');   

    let urlFotoCliente = null;
    let urlFotoCedula = null;

    if (idEditando !== null) {
        const clienteExistente = listaClientesGlobal.find(c => c.id === idEditando);
        if (clienteExistente) {
            urlFotoCliente = clienteExistente.url_foto_cliente; 
            urlFotoCedula = clienteExistente.url_foto_cedula;   
        }
    }

    if (inputFotoCliente && inputFotoCliente.files.length > 0) {
        const archivoPerfil = inputFotoCliente.files[0]; 
        const nombreArchivo = `perfil_${cedula}_${Date.now()}.${archivoPerfil.name.split('.').pop()}`; 
        const { data, error: errorPerfil } = await supabaseClient.storage.from('fotos_clientes').upload(nombreArchivo, archivoPerfil);
        if (errorPerfil) { alert("⚠️ Error foto perfil: " + errorPerfil.message); return; }
        const { data: urlPublica } = supabaseClient.storage.from('fotos_clientes').getPublicUrl(nombreArchivo);
        urlFotoCliente = urlPublica.publicUrl; 
    }

    if (inputFotoCedula && inputFotoCedula.files.length > 0) {
        const archivoCedula = inputFotoCedula.files[0]; 
        const nombreArchivoCed = `cedula_${cedula}_${Date.now()}.${archivoCedula.name.split('.').pop()}`; 
        const { data, error: errorCedula } = await supabaseClient.storage.from('fotos_clientes').upload(nombreArchivoCed, archivoCedula);
        if (errorCedula) { alert("⚠️ Error foto cédula: " + errorCedula.message); return; }
        const { data: urlPublicaCed } = supabaseClient.storage.from('fotos_clientes').getPublicUrl(nombreArchivoCed);
        urlFotoCedula = urlPublicaCed.publicUrl; 
    }

    // 🔥 INYECCIÓN DEL PERFIL DE MORA AQUÍ
    const datosCliente = { 
        nombres, apellidos, cedula, whatsapp, correo, sector, ruta, direccion, referencia, 
        tel_referencia, observaciones, nivel, limite_creditos, garante_id, perfil_cobro,
        fecha_ingreso: idEditando === null ? fechaRegistro : (listaClientesGlobal.find(c => c.id === idEditando)?.fecha_ingreso || fechaRegistro), 
        usuario_registro: 'Administrador', url_foto_cliente: urlFotoCliente, url_foto_cedula: urlFotoCedula    
    };

    // -------------------------------------------------------------------------
    // 7. ENVÍO A SUPABASE Y SMS CON CÓDIGO BANCARIO Y FECHA
    // -------------------------------------------------------------------------
    if (idEditando === null) {
        // ==========================================
        // RUTA 1: CLIENTE NUEVO
        // ==========================================
        const { data, error } = await supabaseClient.from('clientes').insert([datosCliente]);

        if (error) {
            alert("Error de Registro: " + error.message);
        } else {
            let cobrarAfiliacion = confirm(`💰 COBRO DE AFILIACIÓN\n\n¿Deseas cobrar $1.00 de afiliación por ingresar este cliente al sistema?\n\n🟢 ACEPTAR = Cobrar $1.00\n🔴 CANCELAR = Gratis`);

            if (cobrarAfiliacion) {
                try {
                    const { data: cajaData } = await supabaseClient.from('cajas_capital').select('saldo_actual').eq('id', 1).single();
                    await supabaseClient.from('cajas_capital').update({ saldo_actual: parseFloat(cajaData.saldo_actual) + 1.00 }).eq('id', 1);
                    
                    await supabaseClient.from('historial_capital').insert([{
                        caja_id: 1, monto: 1.00,
                        concepto: `🟢 INGRESO: Afiliación nuevo cliente - ${codigoUnico} ${nombreCompleto}`
                    }]);
                    
                    if (typeof cargarDatosCapital === 'function') cargarDatosCapital();
                    if (typeof cargarHistorialCapital === 'function') cargarHistorialCapital();
                } catch (errorCobro) { console.error("Error contable:", errorCobro); }
            }

            try {
                // SMS PROFESIONAL (Fecha y Código separados)
                const msjBienvenida = `=== SISTEMA ALPHA ===\n${fechaHoraSMS}\n\n🆔 ${codigoUnico}\n\nHola ${nombreCompleto}, tu registro ha sido exitoso.\n\nA partir de ahora podras acceder a nuestra linea de creditos.\n\nConserva este msj. ¡Gracias!\n🚫 POR FAVOR, NO RESPONDER A ESTE MENSAJE.`;
                if (typeof enviarSMSAutomatico === 'function') await enviarSMSAutomatico(whatsapp, msjBienvenida);
            } catch (errorSMS) { console.error("Error SMS:", errorSMS); }

            if (cobrarAfiliacion) { alert(`✅ ¡${codigoUnico} guardado, $1.00 cobrado y SMS enviado!`);
            } else { alert(`✅ ¡${codigoUnico} guardado (Gratis) y SMS enviado!`); }

            if (typeof limpiarFormularioClientes === 'function') limpiarFormularioClientes(); 
            if (typeof cargarClientes === 'function') cargarClientes();
        }

    } else {
        // ==========================================
        // RUTA 2: EDICIÓN DE CLIENTE
        // ==========================================
        const { data, error } = await supabaseClient.from('clientes').update(datosCliente).eq('id', idEditando);

        if (error) {
            alert("Error al actualizar: " + error.message);
        } else {
            let cobrarEdicion = confirm(`💰 COBRO POR ACTUALIZACIÓN\n\n¿Deseas cobrar $0.50 por actualizar los datos de este cliente?\n\n🟢 ACEPTAR = Cobrar $0.50\n🔴 CANCELAR = Gratis`);

            if (cobrarEdicion) {
                try {
                    const { data: cajaData } = await supabaseClient.from('cajas_capital').select('saldo_actual').eq('id', 1).single();
                    await supabaseClient.from('cajas_capital').update({ saldo_actual: parseFloat(cajaData.saldo_actual) + 0.50 }).eq('id', 1);
                    
                    await supabaseClient.from('historial_capital').insert([{
                        caja_id: 1, monto: 0.50,
                        concepto: `🟢 INGRESO: Actualización de datos - ${codigoUnico} ${nombreCompleto}`
                    }]);
                    
                    if (typeof cargarDatosCapital === 'function') cargarDatosCapital();
                    if (typeof cargarHistorialCapital === 'function') cargarHistorialCapital();
                } catch (errorCobro) { console.error("Error contable:", errorCobro); }
            }

            try {
                // SMS PROFESIONAL (Fecha y Código separados)
                const msjActualizacion = `=== SISTEMA ALPHA ===\n${fechaHoraSMS}\n\n🆔 ${codigoUnico}\n\nHola ${nombreCompleto}, tus datos han sido actualizados exitosamente en nuestro sistema.\n\nConserva este msj. ¡Gracias!\n🚫 POR FAVOR, NO RESPONDER A ESTE MENSAJE.`;
                if (typeof enviarSMSAutomatico === 'function') await enviarSMSAutomatico(whatsapp, msjActualizacion);
            } catch (errorSMS) { console.error("Error SMS:", errorSMS); }

            if (cobrarEdicion) { alert(`✅ ¡Datos de ${codigoUnico} actualizados, $0.50 cobrados y SMS enviado!`);
            } else { alert(`✅ ¡Datos de ${codigoUnico} actualizados (Gratis) y SMS enviado!`); }

            if (typeof limpiarFormularioClientes === 'function') limpiarFormularioClientes(); 
            if (typeof cargarClientes === 'function') cargarClientes();
        }
    }
}

/**
 * Devuelve el formulario de la izquierda a sus valores limpios vacíos de fábrica.
 */
function limpiarFormularioClientes() {
    // Resetea el centinela regresándolo al valor null de registro nuevo
    idClienteEditando = null;

    // Borra minuciosamente los textos internos de cada input del formulario
    document.getElementById('cli-id-auto').value = 'AUTO';
    document.getElementById('cli-nombres').value = '';
    document.getElementById('cli-apellidos').value = '';
    document.getElementById('cli-cedula').value = '';
    document.getElementById('cli-whatsapp').value = '';
    document.getElementById('cli-correo').value = '';
    document.getElementById('cli-garante').value = ''; 
    document.getElementById('cli-sector').value = ''; 
    document.getElementById('cli-ruta').value = ''; 
    document.getElementById('cli-direccion').value = '';
    document.getElementById('cli-referencia').value = '';
    document.getElementById('cli-tel-referencia').value = '';
    document.getElementById('cli-observaciones').value = '';
    document.getElementById('cli-nivel').value = 'Bronce'; 
    document.getElementById('cli-limite').value = '2';

    // Captura el botón de guardar para restablecer su estética original azul
    const btn = document.querySelector('.btn-guardar');
    // Le devuelve su texto corporativo inicial de registro
    btn.innerText = "💾 REGISTRAR CLIENTE ALPHA";
    // Le vuelve a inyectar el degradado azul rey estándar del sistema
    btn.style.background = "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)";
}
/**
 * ELIMINACIÓN INTELIGENTE: Borra de raíz si no hay historial, archiva si hay créditos.
 */
async function eliminarCliente(id) {
    try {
        // 1. ESCANEO RÁPIDO: Verificamos si tiene créditos (vivos o muertos)
        const { data: creditos, error: errCreditos } = await supabaseClient
            .from('creditos')
            .select('id')
            .eq('cliente_id', id);

        if (errCreditos) {
            alert("⚠️ Error al verificar el historial del cliente: " + errCreditos.message);
            return;
        }

        // 2. RUTA A: CLIENTE SIN HISTORIAL (Cero créditos) -> BORRADO DEFINITIVO
        if (creditos.length === 0) {
            if (confirm("🗑️ Este cliente NO tiene historial de créditos ni deudas.\n\n¿Seguro que deseas ELIMINARLO permanentemente del sistema?")) {
                
                const { error } = await supabaseClient
                    .from('clientes')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                if (typeof idClienteEditando !== 'undefined' && idClienteEditando === id) {
                    limpiarFormularioClientes();
                }
                
                alert("✅ Cliente eliminado definitivamente (Sin impacto contable).");
                cargarClientes(); 
            }
        } 
        // 3. RUTA B: CLIENTE CON HISTORIAL -> ARCHIVADO LÓGICO
        else {
            if (confirm(`📂 Este cliente tiene ${creditos.length} crédito(s) en su historial.\n\nPara proteger los cuadres de tu caja matriz, no se puede destruir su registro.\n\n¿Deseas ARCHIVARLO (Inactivarlo) para que desaparezca de tu lista principal?`)) {
                
                // Actualizamos el estado a 'inactivo' en lugar de borrar la fila
                const { error } = await supabaseClient
                    .from('clientes')
                    .update({ estado: 'inactivo' })
                    .eq('id', id);

                if (error) throw error;

                if (typeof idClienteEditando !== 'undefined' && idClienteEditando === id) {
                    limpiarFormularioClientes();
                }
                
                alert("✅ Cliente archivado exitosamente. Tu contabilidad está a salvo.");
                cargarClientes(); 
            }
        }
    } catch (error) {
        console.error("Error en eliminación inteligente:", error);
        alert("❌ Hubo un error al procesar la solicitud: " + error.message);
    }
}

/**
 * Filtra en vivo la lista interna según texto tipeado en el buscador.
 */
function filtrarClientes() {
    // Captura las letras escritas en el input del buscador convirtiéndolas a minúsculas
    const texto = document.getElementById('input-buscar-cliente').value.toLowerCase();
    
    // Filtra la caché local comparando nombres, apellidos o la cédula con el término escrito
    const filtrados = listaClientesGlobal.filter(c => 
        c.nombres.toLowerCase().includes(texto) || 
        c.apellidos.toLowerCase().includes(texto) || 
        c.cedula.includes(texto)
    );
    
    // Obliga al sistema a regresar a la página 1 para evitar desborde visual en los filtros
    paginaActual = 1;
    
    // Envía la sublista filtrada a renderizarse con la matemática de paginación activa
    renderizarLista(filtrados);
}

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


/**
 * Busca al cliente seleccionado y despliega el modal flotante con sus datos completos.
 */
/**
 * Despliega la ficha técnica detallada del cliente seleccionado dentro del modal.
 * @param {number} id - El ID único del cliente que el administrador desea visualizar.
 */
/**
 * Despliega la ficha técnica detallada del cliente seleccionado dentro del modal.
 * @param {number} id - El ID único del cliente que el administrador desea visualizar.
 */
/**
 * Despliega la ficha técnica detallada del cliente seleccionado dentro del modal.
 * @param {number} id - El ID único del cliente que el administrador desea visualizar.
 */
/**
 * Despliega la ficha técnica detallada del cliente seleccionado dentro del modal.
 * @param {number} id - El ID único del cliente que el administrador desea visualizar.
 */
function verCliente(id) {
    // Rastrea en la caché al cliente seleccionado por medio de su identificador único
    const cliente = listaClientesGlobal.find(c => c.id === id);
    // Cancela la operación de inmediato si la coincidencia no existe en memoria
    if (!cliente) return;

    // Establece el texto por defecto para clientes directos sin obligaciones de garantía
    let nombreGarante = "🚫 Sin Garante / Cliente Directo";
    // Valida si la fila del cliente cuenta con una ID de garante vinculada en Supabase
    if (cliente.garante_id) {
        // Busca al garante dentro de nuestra misma lista global para obtener su identidad
        const garante = listaClientesGlobal.find(c => c.id === cliente.garante_id);
        // Si el garante fue localizado con éxito en el arreglo local
        if (garante) {
            // Reescribe la variable dándole el formato visual de usuario con nombres y cédula
            nombreGarante = `👤 ${garante.nombres.toUpperCase()} ${garante.apellidos.toUpperCase()} (C.I: ${garante.cedula})`;
        }
    }

    // Calcula el número de folio secuencial con ceros de empaque para el modal informativo
    const codigoSecuencial = 'CLI-' + String(cliente.id).padStart(6, '0');
    
    // --- SOLUCIÓN DE BLOQUEO: Forzamos scroll interno y tamaño máximo en el contenedor ---
    const cuerpo = document.getElementById('modal-cuerpo-detalles');
    if (cuerpo) {
        cuerpo.style.maxHeight = "70vh"; // Limita el alto al 70% de la pantalla para que no tape los botones
        cuerpo.style.overflowY = "auto"; // Activa la barra de desplazamiento vertical si el contenido es largo
        cuerpo.style.paddingRight = "10px"; // Evita que el scroll tape el texto
    }
    
    // --- AJUSTE DE IMÁGENES CONTROLADAS (MÁXIMO 100PX / 140PX) ---
    const HTMLFotoCliente = cliente.url_foto_cliente 
        ? `<div class="detalle-foto-contenedor" style="text-align: center; margin-bottom: 15px;">
             <p style="font-weight: 500; margin-bottom: 5px; color: var(--azul-premium); font-size: 14px;">📸 Foto del Cliente:</p>
             <img src="${cliente.url_foto_cliente}" alt="Foto Perfil" style="width: 100px; height: 100px; border-radius: 50%; border: 3px solid var(--azul-premium); object-fit: cover; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
           </div>`
        : `<div class="detalle-fila"><span class="detalle-label">📸 Foto Perfil:</span><span class="detalle-valor" style="font-style: italic; color:#94a3b8;">No cargada en sistema</span></div>`;

    const HTMLFotoCedula = cliente.url_foto_cedula 
        ? `<div class="detalle-foto-contenedor" style="text-align: center; margin-top: 15px; margin-bottom: 15px; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px dashed #cbd5e1;">
             <p style="font-weight: 500; margin-bottom: 5px; color: #334155; font-size: 14px;">🪪 Documento de Cédula:</p>
             <img src="${cliente.url_foto_cedula}" alt="Foto Cédula" style="max-width: 100%; max-height: 140px; border-radius: 6px; object-fit: contain; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
             <br>
             <a href="${cliente.url_foto_cedula}" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin-top: 8px; font-size: 12px; color: #0284c7; text-decoration: none; font-weight: 500;">👁️ Ver en pestaña nueva (Pantalla Completa)</a>
           </div>`
        : `<div class="detalle-fila"><span class="detalle-label">🪪 Foto Cédula:</span><span class="detalle-valor" style="font-style: italic; color:#94a3b8;">No cargada en sistema</span></div>`;

    // Inyectamos de forma limpia los campos mapeados dentro de la estructura interna del modal
    cuerpo.innerHTML = `
        ${HTMLFotoCliente}

        <div class="detalle-fila"><span class="detalle-label">Código:</span><span class="detalle-valor" style="font-weight:bold; color:var(--azul-premium);">${codigoSecuencial}</span></div>
        <div class="detalle-fila"><span class="detalle-label">Nombres completos:</span><span class="detalle-valor">${cliente.nombres.toUpperCase()} ${cliente.apellidos.toUpperCase()}</span></div>
        <div class="detalle-fila"><span class="detalle-label">Cédula / RUC:</span><span class="detalle-valor">${cliente.cedula}</span></div>
        <div class="detalle-fila"><span class="detalle-label">WhatsApp:</span><span class="detalle-valor">${cliente.whatsapp || 'No registrado'}</span></div>
        <div class="detalle-fila"><span class="detalle-label">Correo:</span><span class="detalle-valor">${cliente.correo || 'No registrado'}</span></div>
        <div class="detalle-fila"><span class="detalle-label">Garante Asociado:</span><span class="detalle-valor" style="color: #0369a1; font-weight: 500;">${nombreGarante}</span></div>
        <div class="detalle-fila"><span class="detalle-label">Sector:</span><span class="detalle-valor">${cliente.sector}</span></div>
        <div class="detalle-fila"><span class="detalle-label">Ruta de Cobro:</span><span class="detalle-valor">${cliente.ruta}</span></div>
        <div class="detalle-fila"><span class="detalle-label">Dirección Exacta:</span><span class="detalle-valor">${cliente.direccion || 'No registrada'}</span></div>
        <div class="detalle-fila"><span class="detalle-label">Referencia Física:</span><span class="detalle-valor">${cliente.referencia || 'No registrada'}</span></div>
        <div class="detalle-fila"><span class="detalle-label">Teléf. Referencia:</span><span class="detalle-valor">${cliente.tel_referencia || 'No registrado'}</span></div>
        <div class="detalle-fila"><span class="detalle-label">Categoría Perfil:</span><span class="detalle-valor">${cliente.nivel}</span></div>
        <div class="detalle-fila"><span class="detalle-label">Observaciones:</span><span class="detalle-valor" style="font-style: italic; color:#64748b;">"${cliente.observaciones || 'Sin observaciones particulares'}"</span></div>
        
        ${HTMLFotoCedula}

        <div class="detalle-fila" style="border-top: 1px solid #e2e8f0; margin-top: 10px; padding-top: 10px;">
            <span class="detalle-label" style="color: #64748b;">📅 Ingresado el:</span>
            <span class="detalle-valor" style="font-weight: 600; color: #64748b;">${cliente.fecha_ingreso || 'Sin fecha registrada'}</span>
        </div>
        <div class="detalle-fila" style="border-bottom: none;">
            <span class="detalle-label" style="color: #64748b;">👤 Por:</span>
            <span class="detalle-valor" style="font-weight: 600; color: #64748b;">${cliente.usuario_registro || 'Administrador'}</span>
        </div>
    `;

    // Añade la clase activa para encender visualmente la ventana modal sobre la pantalla
    document.getElementById('modal-ver-cliente').classList.add('active');
}

/**
 * Remueve la clase activa para ocultar de nuevo el cuadro flotante de detalles.
 */
function cerrarModal() {
    // Quita la clase activa apagando por completo el modal de la vista del navegador
    document.getElementById('modal-ver-cliente').classList.remove('active');
}
/**
 * Detecta el cambio en el selector de nivel y asigna automáticamente
 * el límite de créditos correspondiente al campo 'cli-limite'.
 */
function actualizarLimite() {
    // Captura el valor seleccionado actualmente en el menú de niveles
    const nivel = document.getElementById('cli-nivel').value;
    // Captura el elemento del campo de texto donde se muestra el límite
    const campoLimite = document.getElementById('cli-limite');

    // Define los límites según la categoría elegida
    let limite = 2; // Por defecto empezamos con Bronce

    if (nivel === "🥉 Bronce(Nuevo)") {
        limite = 2;
    } else if (nivel === "🥈 Plata(Cumplidor)") {
        limite = 4;
    } else if (nivel === "🥇 Oro(Excelente)") {
        limite = 6;
    } else if (nivel === "💎 Platino(Vip)") {
        limite = 8;
    } else if (nivel === "👑 Diamante(Inversionista)") {
        limite = 15;
    }

    // Asigna el valor calculado al campo de entrada del formulario
    campoLimite.value = limite;
}
/**
 * Genera un reporte en Excel limpio y estructurado de la lista global de clientes.
 * Limpia los emojis de los niveles para permitir filtros contables exactos.
 */
function exportarExcelClientes() {
    if (!listaClientesGlobal || listaClientesGlobal.length === 0) {
        alert("⚠️ No hay datos de clientes para exportar en este momento.");
        return;
    }

    // Mapeamos y limpiamos los datos para que el Excel quede impecable
    const datosLimpios = listaClientesGlobal.map(c => {
        // Quitamos los emojis del nivel para que no estorben en tablas dinámicas
        let nivelLimpio = c.nivel || "Bronce (Nuevo)";
        nivelLimpio = nivelLimpio.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, "").trim();

        return {
            "CÓDIGO": 'CLI-' + String(c.id).padStart(6, '0'),
            "NOMBRES": c.nombres.toUpperCase(),
            "APELLIDOS": c.apellidos.toUpperCase(),
            "CÉDULA / RUC": c.cedula,
            "WHATSAPP": c.whatsapp || 'No registrado',
            "CORREO": c.correo || 'No registrado',
            "SECTOR": c.sector || 'Sin sector',
            "RUTA": c.ruta || 'Sin ruta',
            "CATEGORÍA": nivelLimpio,
            "FECHA INGRESO": c.fecha_ingreso || 'Sin fecha'
        };
    });

    // Creamos el libro de Excel
    const hoja = XLSX.utils.json_to_sheet(datosLimpios);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Clientes Alpha V5");

    // Ajuste automático del ancho de las columnas para que no se corten los textos
    const anchos = Object.keys(datosLimpios[0]).map(key => ({ wch: Math.max(key.length + 4, 15) }));
    hoja['!cols'] = anchos;

    // Descarga inmediata del archivo
    XLSX.writeFile(libro, `REPORTE_CLIENTES_ALPHA_V5.xlsx`);
}
/**
 * Genera un PDF Ejecutivo con diseño corporativo, membrete dinámico
 * y renderizado limpio en formato horizontal (Landscape) ideal para auditorías.
 */
function generarPdfClientes() {
    if (!listaClientesGlobal || listaClientesGlobal.length === 0) {
        alert("⚠️ No hay datos para generar el PDF.");
        return;
    }

    // Creamos un contenedor temporal oculto en el HTML para diseñar el PDF
    const elementoTemporal = document.createElement('div');
    elementoTemporal.style.padding = '20px';
    elementoTemporal.style.fontFamily = "'Segoe UI', Helvetica, Arial, sans-serif";
    elementoTemporal.style.color = '#334155';

    // Obtener la fecha actual con formato legible
    const fechaHoy = new Date().toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    // Contadores analíticos rápidos para el encabezado del reporte
    const totalClientes = listaClientesGlobal.length;
    const excelentes = listaClientesGlobal.filter(c => String(c.nivel).toUpperCase().includes('ORO') || String(c.nivel).toUpperCase().includes('DIAMANTE')).length;

    // Inyectamos el diseño corporativo premium dentro del documento temporal
    elementoTemporal.innerHTML = `
        <div style="border-bottom: 3px solid #0284c7; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h1 style="margin: 0; color: #0f172a; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">SISTEMA ALPHA V5</h1>
                <p style="margin: 3px 0 0 0; color: #64748b; font-size: 13px; font-weight: 500;">📋 Reporte Ejecutivo de Control de Créditos y Clientes</p>
            </div>
            <div style="text-align: right;">
                <p style="margin: 0; font-size: 11px; color: #64748b;"><b>Generado el:</b> ${fechaHoy}</p>
                <p style="margin: 2px 0 0 0; font-size: 11px; color: #0284c7; font-weight: 600;">Estado: Auditoría Interna</p>
            </div>
        </div>

        <div style="display: flex; gap: 15px; margin-bottom: 25px;">
            <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 15px; border-radius: 8px;">
                <span style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Total Cartera Activa</span>
                <h3 style="margin: 5px 0 0 0; font-size: 20px; color: #0f172a; font-weight: 700;">${totalClientes} Clientes</h3>
            </div>
            <div style="flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px 15px; border-radius: 8px;">
                <span style="font-size: 11px; color: #166534; font-weight: 600; text-transform: uppercase;">Clientes de Alto Rendimiento</span>
                <h3 style="margin: 5px 0 0 0; font-size: 20px; color: #15803d; font-weight: 700;">${excelentes} VIP / Excelentes</h3>
            </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left;">
            <thead>
                <tr style="background: #0f172a; color: white;">
                    <th style="padding: 8px; border: 1px solid #1e293b;">CÓDIGO</th>
                    <th style="padding: 8px; border: 1px solid #1e293b;">NOMBRES Y APELLIDOS</th>
                    <th style="padding: 8px; border: 1px solid #1e293b;">CÉDULA / RUC</th>
                    <th style="padding: 8px; border: 1px solid #1e293b;">WHATSAPP</th>
                    <th style="padding: 8px; border: 1px solid #1e293b;">SECTOR / RUTA</th>
                    <th style="padding: 8px; border: 1px solid #1e293b;">PERFIL DE CLIENTE</th>
                </tr>
            </thead>
            <tbody>
                ${listaClientesGlobal.map((c, index) => `
                    <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 8px; font-weight: bold; color: #0284c7;">CLI-${String(c.id).padStart(6, '0')}</td>
                        <td style="padding: 8px; font-weight: 500; color: #1e293b;">${c.nombres.toUpperCase()} ${c.apellidos.toUpperCase()}</td>
                        <td style="padding: 8px; color: #334155;">${c.cedula}</td>
                        <td style="padding: 8px; color: #334155;">${c.whatsapp || 'No registrado'}</td>
                        <td style="padding: 8px; color: #475569;">${c.sector} (${c.ruta})</td>
                        <td style="padding: 8px; font-weight: 600; color: #0f172a;">${c.nivel || '🥉 Bronce (Nuevo)'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; font-size: 10px; color: #94a3b8;">
            Este documento es un reporte oficial emitido de forma automatizada por el Sistema de Control de Créditos Alpha V5 enlazado con bases seguras de Supabase.
        </div>
    `;

    // Opciones avanzadas de configuración para html2pdf (Formato horizontal para que quepan todos los campos)
    const opcionesConfig = {
        margin:       10,
        filename:     `REPORTE_EJECUTIVO_CLIENTES.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, logging: false, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' } // Formato Horizontal de amplio rango
    };

    // Disparar la generación y descarga directa del PDF
    html2pdf().set(opcionesConfig).from(elementoTemporal).save();
}

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

// =========================================================================
// VARIABLE GLOBAL DE CONTROL FINANCIERO
// DESCRIPCIÓN: Almacena en la memoria del navegador la tasa base del sistema
//              para mantenerla disponible sin importar en qué pestaña esté.
// =========================================================================
let tasaBaseSistema = 20; 

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

/**
 * REGISTRAR UN NUEVO CRÉDITO EN EL SISTEMA
 * Captura los datos de colocación, valida saldos en boveda,
 * inserta el crédito en Supabase y descuenta el capital de la caja elegida.
 */
async function guardarCreditoEnSistema() {
    // 1. CAPTURA DE CAMPOS (Asegúrate de tener estos IDs en tu HTML de créditos)
    const selectorCliente = document.getElementById('cred-cliente-id'); // Select con el ID del cliente
    const selectorCaja = document.getElementById('cred-caja-origen');   // Select para elegir de qué caja sale el dinero
    const inputMonto = document.getElementById('cred-monto');
    const inputTasa = document.getElementById('cred-tasa-interes');
    const inputCuotas = document.getElementById('cred-cuotas');

    if (!selectorCliente || !selectorCaja || !inputMonto || !inputTasa || !inputCuotas) {
        alert("❌ Error: Faltan componentes de interfaz en el módulo de créditos.");
        return;
    }

    const clienteId = parseInt(selectorCliente.value);
    const cajaId = parseInt(selectorCaja.value);
    const monto = parseFloat(inputMonto.value) || 0;
    const tasa = parseFloat(inputTasa.value) || 0;
    const cuotas = parseInt(inputCuotas.value) || 0;

    // 2. VALIDACIÓN PREVENTIVA DE ENTRADAS
    if (!clienteId || !cajaId || monto <= 0 || cuotas <= 0) {
        alert("⚠️ Por favor, complete todos los campos: seleccione cliente, caja de origen, monto y cuotas.");
        return;
    }

    try {
        // 3. VERIFICACIÓN DE FONDOS: ¿Hay dinero en la caja elegida para prestar?
        const { data: caja, error: errorCaja } = await supabaseClient
            .from('cajas_capital')
            .select('saldo_actual, nombre_caja')
            .eq('id', cajaId)
            .single();

        if (errorCaja) throw errorCaja;

        if (monto > parseFloat(caja.saldo_actual)) {
            alert(`❌ Fondos insuficientes en "${caja.nombre_caja}". Saldo disponible: $${parseFloat(caja.saldo_actual).toFixed(2)}`);
            return;
        }

        // 4. MATEMÁTICA DE AUDITORÍA
        const totalInteres = monto * (tasa / 100);
        const totalPagar = monto + totalInteres;
        const valorCuota = totalPagar / cuotas;

        // Confirmación final del operador
        const seguro = confirm(`¿Está seguro de colocar este crédito por un total de $${totalPagar.toFixed(2)} (${cuotas} cuotas de $${valorCuota.toFixed(2)})?`);
        if (!seguro) return;

        
        // 6. DESCUENTO DE FONDOS DE LA CAJA SELECCIONADA
        const nuevoSaldoCaja = parseFloat(caja.saldo_actual) - monto;
        const { error: errorUpdateCaja } = await supabaseClient
            .from('cajas_capital')
            .update({ saldo_actual: nuevoSaldoCaja })
            .eq('id', cajaId);

        if (errorUpdateCaja) throw errorUpdateCaja;

        // 7. REGISTRO EN EL HISTORIAL DE CAPITAL (Auditoría de salida)
        const { error: errorHistorial } = await supabaseClient
            .from('historial_capital')
            .insert([{
                caja_id: cajaId,
                monto: -monto, // Negativo porque es desembolso
                concepto: `DESEMBOLSO CRÉDITO #CLI-${String(clienteId).padStart(6, '0')}`
            }]);

        if (errorHistorial) throw errorHistorial;

        // 8. ÉXITO Y RESETEO
        alert(`🎉 ¡Crédito generado con éxito! ID de operación asignado.`);
        inputMonto.value = '';
        inputCuotas.value = '';
        
        // Si el operador tiene abierto el módulo de capital de fondo, lo actualizamos en vivo
        if (typeof inicializarModuloCapital === 'function') {
            await inicializarModuloCapital();
        }

    } catch (error) {
        console.error('Error crítico al generar crédito:', error.message);
        alert('La operación fue cancelada por error en el servidor: ' + error.message);
    }
}

// 1. FUNCIÓN PARA CALCULAR LOS NÚMEROS EN VIVO MIENTRAS ESCRIBES
function calcularProyeccionCredito() {
    const monto = parseFloat(document.getElementById('cred-monto').value) || 0;
    const tasa = parseFloat(document.getElementById('cred-tasa-interes').value) || 0;
    const cuotas = parseInt(document.getElementById('cred-cuotas').value) || 1;

    // Cálculos matemáticos limpios
    const totalInteres = (monto * tasa) / 100;
    const totalPagar = monto + totalInteres;
    const valorCuota = cuotas > 0 ? (totalPagar / cuotas) : 0;

    // Inyectar los resultados en las etiquetas negras de tu HTML
    document.getElementById('lbl-interes-total').innerText = `$${totalInteres.toFixed(2)}`;
    document.getElementById('lbl-pagar-total').innerText = `$${totalPagar.toFixed(2)}`;
    document.getElementById('lbl-cuota-valor').innerText = `$${valorCuota.toFixed(2)}`;
}

// =========================================================================
// 2. FUNCIÓN PARA GUARDAR EL CRÉDITO EN SUPABASE AL DAR CLIC AL BOTÓN
// =========================================================================
// =========================================================================
// =========================================================================
// 2. FUNCIÓN PARA GUARDAR EL CRÉDITO EN SUPABASE AL DAR CLIC AL BOTÓN
// 2. FUNCIÓN PARA GUARDAR EL CRÉDITO EN SUPABASE AL DAR CLIC AL BOTÓN
// =========================================================================
async function guardarNuevoCredito() {
    // BLOCK 1: CAPTURA DE DATOS DESDE LA INTERFAZ HTML
    const selectorCliente = document.getElementById('cred-cliente-id');
    const clienteId = selectorCliente.value;
    
    // TRUCO DE ORO: Captura el Nombre y Apellido tal como aparece escrito en el selector de la pantalla
    const nombreCliente = selectorCliente.options[selectorCliente.selectedIndex].text;

    const monto = parseFloat(document.getElementById('cred-monto').value);
    const tasa = parseFloat(document.getElementById('cred-tasa-interes').value);
    const cuotas = parseInt(document.getElementById('cred-cuotas').value);
    const cajaId = document.getElementById('cred-forma-entrega').value; // Retorna "1" o "2"

    // BLOCK 2: VALIDACIÓN DE SEGURIDAD PREVENTIVA
    if (!clienteId || !monto || isNaN(monto) || !cuotas || !cajaId) {
        alert("⚠️ Por favor, complete todos los campos obligatorios antes de aprobar.");
        return;
    }

    // BLOCK 2.5: CONTROL DE MONTOS EN NEGATIVO O CERO
    if (monto <= 0) {
        alert("⚠️ Error: El monto del crédito debe ser un valor positivo mayor a cero.");
        return;
    }

    // BLOCK 3: CÁLCULOS MATEMÁTICOS DEL CRÉDITO
    const totalInteres = parseFloat(((monto * tasa) / 100).toFixed(2));
    const totalPagar = parseFloat((monto + totalInteres).toFixed(2));
    const valorCuota = parseFloat((totalPagar / cuotas).toFixed(2));

    try {
        // BLOCK 4: CONSULTAR EL SALDO ACTUAL DE LA BÓVEDA/CAJA
        const { data: caja, error: errorCaja } = await supabaseClient
            .from('cajas_capital')
            .select('saldo_actual, nombre_caja')
            .eq('id', parseInt(cajaId))
            .single();

        if (errorCaja) throw errorCaja;

        // BLOCK 4.5: VALIDACIÓN DE FONDOS INSUFICIENTES
        if (monto > parseFloat(caja.saldo_actual)) {
            alert(`❌ Operación Cancelada: Fondos insuficientes en [${caja.nombre_caja}].\n\nSaldo disponible actual: $${parseFloat(caja.saldo_actual).toFixed(2)}\nMonto que intenta prestar: $${monto.toFixed(2)}`);
            return;
        }

        // BLOCK 4.7: OBTENER DATOS COMPLETOS DEL CLIENTE PARA EL CÓDIGO BANCARIO
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

        // === MAGIA CONTABLE: CÁLCULO DEL NÚMERO DE CRÉDITO ===
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
                    forma_entrega: document.getElementById('cred-forma-entrega').options[document.getElementById('cred-forma-entrega').selectedIndex].text
                }
            ])
            .select();

        if (error) throw error;

        // 🌟 EXTRAEMOS EL ID RECIÉN GENERADO POR SUPABASE
        const nuevoCreditoId = resultadoCredito && resultadoCredito.length > 0 ? resultadoCredito[0].id : null;

        // BLOCK 6: DESCUENTO DE DINERO DE LA CAJA SELECCIONADA
        const nuevoSaldoCaja = parseFloat(caja.saldo_actual) - monto;
        
        const { error: errorUpdateCaja } = await supabaseClient
            .from('cajas_capital')
            .update({ saldo_actual: nuevoSaldoCaja })
            .eq('id', parseInt(cajaId));

        if (errorUpdateCaja) throw errorUpdateCaja;

        // === GENERACIÓN DEL CÓDIGO BANCARIO ÚNICO ===
        const inicialN = infoCliente.nombres.charAt(0).toUpperCase();
        const inicialA = infoCliente.apellidos.charAt(0).toUpperCase();
        const ultimos4 = infoCliente.cedula.slice(-4);
        const codigoClienteBancario = `${inicialN}${inicialA}-${ultimos4}`; // Ej: MA-5760
        
        // 🔑 CIFRADO DE SEGURIDAD PARA EL NUEVO CRÉDITO
        const codigoCifrado = typeof cifrarNumeroCredito === 'function' ? cifrarNumeroCredito(numeroCredito).toUpperCase() : '?';

        // 🛡️ SEPARACIÓN DE CÓDIGOS (INTERNO VS CLIENTE)
        // Para uso interno (Auditoría): Muestra número y letra
        const codigoCreditoOficial = `${codigoClienteBancario} | CRE #${numeroCredito} [${codigoCifrado}]`;
        // Para el cliente (SMS): Muestra SOLO la letra
        const codigoCreditoSMS = `${codigoClienteBancario} | CRE #${codigoCifrado}`;

        // BLOCK 7: REGISTRO DE AUDITORÍA EN EL HISTORIAL DE CAPITAL
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

        // BLOCK 8: MENSAJE DE ÉXITO AL OPERADOR
        alert(`🚀 ¡${codigoCreditoOficial} aprobado, registrado y descontado con éxito!`);
        
        // =========================================================================
        // 🟢 NUEVO: ¡DISPARO AUTOMÁTICO DE SMS VOUCHER (VÍA MACRODROID)!
        // =========================================================================
        if (infoCliente.whatsapp && typeof enviarSMSAutomatico === 'function') {
            const nombreLimpio = nombreCompletoHistorial;
            
            const modalidadSelect = document.getElementById('cred-modalidad');
            let modalidadNombre = modalidadSelect ? modalidadSelect.options[modalidadSelect.selectedIndex].text : "Fija";
            modalidadNombre = modalidadNombre.replace(/.*Cobro\s+/i, "");

            // GENERAR FECHA Y HORA EXACTA CON DÍA DE LA SEMANA
            const ahora = new Date();
            const fechaLarga = ahora.toLocaleDateString('es-EC', { weekday: 'long', day: '2-digit', month: '2-digit', year: '2-digit' });
            const horaFormateada = ahora.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });

            // 🎓 Diseño final con Fecha y Código Bancario (SOLO LETRA PARA EL CLIENTE)
            const mensajeVoucher = `=== SISTEMA ALPHA ===\n${fechaLarga.charAt(0).toUpperCase() + fechaLarga.slice(1)} | ${horaFormateada}\n\n🆔 Ref: ${codigoCreditoSMS}\n👤 Cliente: ${nombreLimpio}\n\n💰 Monto: $${monto.toFixed(2)}\n💵 Cuota: $${valorCuota.toFixed(2)}\n🔄 Modalidad: ${modalidadNombre}\n📊 Total: $${totalPagar.toFixed(2)}\n🔢 Cuotas: ${cuotas}\n\nConserva este msj. ¡Gracias!\n🚫 POR FAVOR, NO RESPONDER A ESTE MENSAJE.`;
            
            enviarSMSAutomatico(infoCliente.whatsapp, mensajeVoucher);
        }
        
        // =========================================================================
        // 🔥 CORRECCIÓN CIRUGÍA: Llamamos a la versión global blindada
        // =========================================================================
        if (typeof window.cargarHistorialCreditos === 'function') {
            window.cargarHistorialCreditos();
        } else if (typeof cargarHistorialCreditos === 'function') {
            cargarHistorialCreditos();
        }
        
        // BLOCK 9: LIMPIEZA DE FORMULARIO DE INTERFAZ
        document.getElementById('cred-cliente-id').value = '';
        document.getElementById('cred-monto').value = '';
        document.getElementById('cred-cuotas').value = '1';
        document.getElementById('cred-forma-entrega').value = '';

        document.getElementById('lbl-cuota-valor').innerText = '$0.00';
        document.getElementById('lbl-interes-total').innerText = '$0.00';
        document.getElementById('lbl-pagar-total').innerText = '$0.00';

        // BLOCK 10: ACTUALIZACIÓN EN VIVO
        if (typeof inicializarModuloCapital === 'function') {
            await inicializarModuloCapital();
        }

        if (typeof cargarSaldosEnSelectorCredito === 'function') {
            await cargarSaldosEnSelectorCredito();
        }

        if (typeof cargarHistorialCapital === 'function') {
            cargarHistorialCapital();
        }

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

            const formatoFecha = fechaObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' });
            const horaFormateada = fechaObj.toLocaleTimeString('es-ES', { hour12: false });
            
            const nombre = c.clientes ? `${c.clientes.nombres} ${c.clientes.apellidos}`.toUpperCase() : 'SIN NOMBRE';

            const moraExtra = parseFloat(c.monto_mora) || 0;
            const deudaTotalCalculada = (parseFloat(c.total_pagar) - c.totalAbonado) + moraExtra;
            
            const etiquetaMora = moraExtra > 0 ? `<span style="color: #ef4444; background: #fee2e2; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; white-space: nowrap;">Mora $${moraExtra.toFixed(2)}</span>` : '';
            const etiquetaDeuda = moraExtra > 0 ? `<span style="margin-left: 6px; color: #854d0e; font-size: 11px; font-weight: bold; background: #fef08a; padding: 2px 6px; border-radius: 4px; border: 1px dashed #ca8a04; white-space: nowrap;">👉 Deuda Total: $${deudaTotalCalculada.toFixed(2)}</span>` : '';

            // 🔥 Diseño especial para distinguir créditos congelados
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
                    <span style="color: #64748b; font-weight: normal; font-size: 11px;">${formatoFecha}, ${horaFormateada}</span>
                    
                    <div style="margin-left: auto; display: flex; gap: 12px; align-items: center;">
                        <button onclick="reenviarVoucher(${c.id})" style="cursor:pointer; border:none; background:none; font-size: 14px; padding: 0;" title="Reenviar Soporte ($0.50)">📩</button>
                        ${esEditable ? `
                            <button onclick="abrirModalEdicion(${c.id})" style="cursor:pointer; border:none; background:none; font-size: 14px; padding: 0;" title="Editar crédito">✏️</button>
                            <button onclick="intentarAnularCredito(${c.id}, ${c.monto_capital})" style="cursor:pointer; border:none; background:none; font-size: 14px; padding: 0;" title="Eliminar crédito">🚫</button>
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
            const fechaLarga = ahora.toLocaleDateString('es-EC', { weekday: 'long', day: '2-digit', month: '2-digit', year: '2-digit' });
            const horaFormateada = ahora.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
            const fechaHoraSMS = `${fechaLarga.charAt(0).toUpperCase() + fechaLarga.slice(1)} | ${horaFormateada}`;

            // Estructura limpia y corporativa con el código en su propia línea (SOLO LETRA PARA EL CLIENTE)
            const msjMod = `=== SISTEMA ALPHA ===\n${fechaHoraSMS}\n\n🆔 Ref: ${codigoCreditoSMS}\n👤 Cliente: ${nombreCompleto}\n\nHola, los datos de tu credito han sido MODIFICADOS con exito.\n\n💰 Nuevo Monto: $${nuevoMonto.toFixed(2)}\n💵 Nueva Cuota: $${nuevoValorCuota.toFixed(2)}\n🔄 Modalidad: ${modalidadNombre}\n📊 Total: $${nuevoTotalPagar.toFixed(2)}\n🔢 Cuotas: ${credInfo.num_cuotas}\n\nConserva este msj. ¡Gracias!\n🚫 POR FAVOR, NO RESPONDER A ESTE MENSAJE.`;
            
            await enviarSMSAutomatico(cliInfo.whatsapp, msjMod);
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
        const codigoCreditoOficial = `${codigoClienteBancario} | CRE #${numeroCredito} [${codigoCifrado}]`; // Para tu auditoría interna
        const codigoCreditoSMS = `${codigoClienteBancario} | CRE #${codigoCifrado}`; // 🎓 SOLO LA LETRA para el cliente

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
            
            const ahora = new Date();
            const fechaLarga = ahora.toLocaleDateString('es-EC', { weekday: 'long', day: '2-digit', month: '2-digit', year: '2-digit' });
            const horaFormateada = ahora.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
            const fechaHoraSMS = `${fechaLarga.charAt(0).toUpperCase() + fechaLarga.slice(1)} | ${horaFormateada}`;

            // 🎓 AQUÍ SE APLICA EL CÓDIGO OCULTO PARA EL CLIENTE
            const msjAnulacion = `=== SISTEMA ALPHA ===\n${fechaHoraSMS}\n\n🆔 Ref: ${codigoCreditoSMS}\n👤 Cliente: ${nombreCompleto}\n\nHola, tu credito ha sido ANULADO con exito.\n\n💰 Monto devuelto: $${parseFloat(capitalPrestado).toFixed(2)}\n🔄 Modalidad: ${modalidad}\n\nEste es tu soporte oficial. ¡Gracias!\n🚫 POR FAVOR, NO RESPONDER A ESTE MENSAJE.`;
            
            console.log("Enviando SMS de anulación...");
            await enviarSMSAutomatico(infoCliente.whatsapp, msjAnulacion);
            await new Promise(r => setTimeout(r, 800));
        }

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
async function reenviarVoucher(idCredito) {
    try {
        // 1. Buscar datos del crédito y cliente
        const { data: credito, error: errCred } = await supabaseClient.from('creditos').select('*').eq('id', idCredito).single();
        if (errCred) throw errCred;

        const { data: cliente, error: errCli } = await supabaseClient.from('clientes').select('*').eq('id', credito.cliente_id).single();
        if (errCli) throw errCli;

        // === MAGIA CONTABLE: CÁLCULO DEL CÓDIGO BANCARIO Y NÚMERO DE CRÉDITO ===
        const inicialN = cliente.nombres.charAt(0).toUpperCase();
        const inicialA = cliente.apellidos.charAt(0).toUpperCase();
        const ultimos4 = cliente.cedula.slice(-4);
        const codigoClienteBancario = `${inicialN}${inicialA}-${ultimos4}`;

        // Buscar qué número de crédito es este en la historia exacta del cliente
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
        
        // 🔑 CIFRADO DE SEGURIDAD PARA EL REENVÍO
        const codigoCifrado = typeof cifrarNumeroCredito === 'function' ? cifrarNumeroCredito(numeroCredito).toUpperCase() : '?';

        // 🛡️ SEPARACIÓN DE CÓDIGOS (INTERNO VS CLIENTE)
        const codigoCreditoOficial = `${codigoClienteBancario} | CRE #${numeroCredito} [${codigoCifrado}]`; // Para tu auditoría y el prompt
        const codigoCreditoSMS = `${codigoClienteBancario} | CRE #${codigoCifrado}`; // 🎓 SOLO LA LETRA para el cliente

        const nombreCompleto = `${cliente.nombres.toUpperCase()} ${cliente.apellidos.toUpperCase()}`;
        // =========================================================================

        // 2. Confirmar número (Tú verás el código completo aquí)
        let numeroGuardado = cliente.whatsapp || "";
        let numeroEnvio = prompt(`📱 REENVÍO DE RESPALDO (${codigoCreditoOficial})\n\nTeléfono registrado:\nSi cambió de chip, pon el nuevo número aquí:`, numeroGuardado);
        
        if (!numeroEnvio || numeroEnvio.trim() === "") return; 

        // 3. LA PREGUNTA DEL MILLÓN (Cobrar o No Cobrar)
        let cobrar = confirm(`💰 TIPO DE REENVÍO\n\n¿Deseas cobrar los $0.50 de penalidad?\n\n🟢 ACEPTAR = Cobrar $0.50 (Perdió el chip)\n🔴 CANCELAR = Envío GRATIS (Fallo de internet)`);

        let etiquetaMensaje = ""; 

        if (cobrar) {
            // LOGICA DE COBRO
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

            // Sello de copia cobrada
            etiquetaMensaje = "[COPIA DE RESPALDO] val 0.50ctv\n";
        }

        // 4. Armar el mensaje con el diseño bancario oficial
        const modalidad = (credito.frecuencia_pago || "Fija").replace(/.*Cobro\s+/i, "").replace("📅", "").trim();
        
        // 🕒 FECHA 1: CUÁNDO SE ESTÁ HACIENDO LA REIMPRESIÓN (HOY)
        const ahora = new Date();
        const fechaLarga = ahora.toLocaleDateString('es-EC', { weekday: 'long', day: '2-digit', month: '2-digit', year: '2-digit' });
        const horaFormateada = ahora.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
        const fechaHoraSMS = `${fechaLarga.charAt(0).toUpperCase() + fechaLarga.slice(1)} | ${horaFormateada}`;

        // 📅 FECHA 2: CUÁNDO SE CREÓ REALMENTE EL CRÉDITO ORIGINALMENTE
        let fechaEmisionTexto = "N/A";
        if (credito.fecha_emision) {
            const fechaObjEmi = new Date(credito.fecha_emision);
            const fEmiLarga = fechaObjEmi.toLocaleDateString('es-EC', { weekday: 'long', day: '2-digit', month: '2-digit', year: '2-digit' });
            fechaEmisionTexto = fEmiLarga.charAt(0).toUpperCase() + fEmiLarga.slice(1);
        }

        // 🎓 AQUÍ ESTÁ LA MAGIA DOBLE: Código SMS oculto + Fecha Original insertada
        const msjReenvio = `=== SISTEMA ALPHA ===\n${etiquetaMensaje}${fechaHoraSMS}\n\n🆔 Ref: ${codigoCreditoSMS}\n👤 Cliente: ${nombreCompleto}\n📅 Emitido: ${fechaEmisionTexto}\n\nHola, aqui tienes el respaldo de tu credito.\n\n💰 Monto: $${parseFloat(credito.monto_capital).toFixed(2)}\n💵 Cuota: $${parseFloat(credito.valor_cuota).toFixed(2)}\n🔄 Modalidad: ${modalidad}\n📊 Total: $${parseFloat(credito.total_pagar).toFixed(2)}\n🔢 Nro Cuotas: ${credito.num_cuotas}\n\nConserva este msj. ¡Gracias!\n🚫 POR FAVOR, NO RESPONDER A ESTE MENSAJE.`;
        
        // 5. Disparar el mensaje
        console.log("Reenviando voucher...");
        await enviarSMSAutomatico(numeroEnvio.trim(), msjReenvio);

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


/* ==========================================================================
   MÓDULO DE DEPURACIÓN (PAPELERA GLOBAL)
   ========================================================================== */
async function cargarPapelera(categoria) {
    const contenedor = document.getElementById('contenedor-papelera');
    
    // 🧹 Limpiamos el buscador global cada vez que cambias de pestaña
    const buscadorGlobal = document.getElementById('input-buscador-global-papelera');
    if (buscadorGlobal) buscadorGlobal.value = '';

    // =====================================================================
    // SECCIÓN A: CLIENTES ARCHIVADOS
    // =====================================================================
    if (categoria === 'clientes') {
        contenedor.innerHTML = '<p style="color:#64748b; font-size:13px;">Buscando clientes en el archivo...</p>';
        try {
            const { data: archivados, error } = await supabaseClient
                .from('clientes')
                .select('*')
                .eq('estado', 'inactivo')
                .order('id', { ascending: false });

            if (error) throw error;
            if (archivados.length === 0) {
                contenedor.innerHTML = `<p style="color: #10b981; font-weight: bold;">✨ El archivo de clientes está limpio.</p>`;
                return;
            }

            contenedor.innerHTML = archivados.map(c => {
                const nombreCompleto = `${c.nombres} ${c.apellidos}`.toUpperCase();
                const textoBusqueda = `${nombreCompleto} ${c.cedula} ${c.id}`.toLowerCase(); // 🔑 DATO INVISIBLE

                return `
                <div class="item-papelera-global" data-busqueda="${textoBusqueda}" style="background: #fff; border: 1px solid #e2e8f0; border-left: 5px solid #64748b; border-radius: 8px; padding: 15px; margin-bottom: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <span style="background: #f1f5f9; color: #475569; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: bold;">ID CLI: ${c.id}</span>
                            <h3 style="margin: 8px 0 4px 0; font-size: 14px; color: #1e293b;">${nombreCompleto}</h3>
                            <p style="margin: 0; font-size: 12px; color: #64748b;">🆔 Cédula: ${c.cedula}</p>
                        </div>
                        <span style="font-size: 20px;">👥</span>
                    </div>
                    <div style="margin-top: 15px; display: flex; gap: 8px; border-top: 1px dashed #cbd5e1; padding-top: 12px;">
                        <button onclick="reactivarClienteDesdePapelera(${c.id}, '${nombreCompleto}')" style="flex: 1; padding: 8px; background: #10b981; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px;">♻️ Restaurar</button>
                        <button onclick="forzarEliminacionCliente(${c.id}, '${nombreCompleto}')" style="padding: 8px 12px; background: #ef4444; color: white; border: none; border-radius: 5px; cursor: pointer;">💥</button>
                    </div>
                </div>`;
            }).join('');
        } catch (error) { contenedor.innerHTML = `<p style="color:red; font-size:13px;">Error: ${error.message}</p>`; }
    } 
    // =====================================================================
    // 🌟 SECCIÓN B: CRÉDITOS ANULADOS
    // =====================================================================
    else if (categoria === 'creditos') {
        contenedor.innerHTML = '<p style="color:#64748b; font-size:13px;">Abriendo bóveda de auditoría de créditos...</p>';
        try {
            const { data: anulados, error } = await supabaseClient
                .from('creditos')
                .select(`id, monto_capital, total_pagar, forma_entrega, fecha_emision, clientes!inner(nombres, apellidos, cedula)`)
                .eq('estado', 'inactivo')
                .order('id', { ascending: false });

            if (error) throw error;
            if (anulados.length === 0) {
                contenedor.innerHTML = `<p style="color: #0284c7; font-weight: bold;">✨ No hay alertas ni créditos anulados en la bitácora.</p>`;
                return;
            }

            contenedor.innerHTML = anulados.map(cre => {
                const nombreCliente = `${cre.clientes.nombres} ${cre.clientes.apellidos}`.toUpperCase();
                const textoBusqueda = `${nombreCliente} ${cre.clientes.cedula} ${cre.id} ${cre.monto_capital}`.toLowerCase(); // 🔑 DATO INVISIBLE

                return `
                <div class="item-papelera-global" data-busqueda="${textoBusqueda}" style="background: #fff; border: 1px solid #e2e8f0; border-left: 5px solid #ef4444; border-radius: 8px; padding: 15px; margin-bottom: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <span style="background: #ffe4e6; color: #e11d48; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: bold;">CRÉDITO ANULADO #${cre.id}</span>
                            <h3 style="margin: 8px 0 4px 0; font-size: 14px; color: #1e293b;">${nombreCliente}</h3>
                            <p style="margin: 0; font-size: 12px; color: #475569;">Capital Original: <b>$${cre.monto_capital}</b></p>
                        </div>
                        <span style="font-size: 20px;" title="Caja origen: ${cre.forma_entrega}">💸</span>
                    </div>
                    <div style="margin-top: 15px; display: flex; gap: 8px; border-top: 1px dashed #cbd5e1; padding-top: 12px;">
                        <button onclick="reactivarCreditoDesdePapelera(${cre.id}, ${cre.monto_capital}, '${cre.forma_entrega}', '${nombreCliente}')" style="flex: 1; padding: 8px; background: #0284c7; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;">♻️ Re-Activar</button>
                        <button onclick="forzarEliminacionCredito(${cre.id})" style="padding: 8px 12px; background: #ef4444; color: white; border: none; border-radius: 5px; cursor: pointer;">💥</button>
                    </div>
                </div>`;
            }).join('');
        } catch (error) { contenedor.innerHTML = `<p style="color:red; font-size:13px;">Error: ${error.message}</p>`; }
    }
    // =====================================================================
    // 🛡️ SECCIÓN C: BÓVEDA DE PAGOS ELIMINADOS (AUDITORÍA COMPLETA)
    // =====================================================================
    else if (categoria === 'pagos_eliminados') {
        contenedor.innerHTML = '<p style="color:#64748b; font-size:13px;">Abriendo bóveda y cruzando datos de clientes...</p>';
        try {
            const { data: pagosBorrados, error } = await supabaseClient
                .from('auditoria_pagos_eliminados')
                .select('*')
                .order('fecha_eliminacion', { ascending: false });

            if (error) throw error;
            if (pagosBorrados.length === 0) {
                contenedor.innerHTML = `<p style="color: #f59e0b; font-weight: bold;">✨ La bóveda está limpia. No hay abonos anulados.</p>`;
                return;
            }

            const idsCreditos = [...new Set(pagosBorrados.map(p => p.id_credito))];
            let diccionarioClientes = {};
            if (idsCreditos.length > 0) {
                const { data: creditosData } = await supabaseClient.from('creditos').select('id, clientes(nombres, apellidos, cedula)').in('id', idsCreditos);
                if (creditosData) { creditosData.forEach(c => { diccionarioClientes[c.id] = c.clientes; }); }
            }

            contenedor.innerHTML = pagosBorrados.map(pago => {
                const fEli = new Date(pago.fecha_eliminacion);
                const fechaEliminacionTxt = `${fEli.toLocaleDateString('es-EC')} | H:${fEli.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}`;
                
                let fechaOriginalTxt = 'Fecha original no registrada';
                if (pago.fecha_pago_original) {
                    const fOri = new Date(pago.fecha_pago_original);
                    const diaOri = fOri.toLocaleDateString('es-EC', { weekday: 'long' });
                    fechaOriginalTxt = `📅 ${diaOri.charAt(0).toUpperCase() + diaOri.slice(1)} ${fOri.toLocaleDateString('es-EC')} | H:${fOri.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}`;
                }

                const metodoPago = pago.forma_pago ? pago.forma_pago.toUpperCase() : 'EFECTIVO';
                const creCifrado = pago.codigo_cre || 'CRE #?';
                
                const cli = diccionarioClientes[pago.id_credito] || {};
                const nombreCliente = cli.nombres ? `${cli.nombres} ${cli.apellidos}`.toUpperCase() : 'CLIENTE DESCONOCIDO';
                
                const iN = (cli.nombres || 'X').trim().charAt(0).toUpperCase();
                const iA = (cli.apellidos || 'X').trim().charAt(0).toUpperCase();
                const refFinal = `REF: ${iN}${iA}-${(cli.cedula || '0000').trim().slice(-4)}`;

                const textoBusqueda = `${nombreCliente} ${cli.cedula} ${refFinal} ${pago.id_credito} ${creCifrado} ${metodoPago}`.toLowerCase();

                return `
                <div class="item-papelera-global" data-busqueda="${textoBusqueda}" style="background: #fff; border: 1px solid #cbd5e1; border-left: 6px solid #ef4444; border-radius: 10px; padding: 15px; margin-bottom: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                    <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 10px; flex-wrap: wrap;">
                        <span style="background: #f1f5f9; color: #334155; font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 900; border: 1px solid #cbd5e1;">${refFinal}</span>
                        <span style="background: #e0f2fe; color: #0369a1; font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 900; border: 1px solid #bae6fd;">${creCifrado}</span>
                        <span style="background: #fef3c7; color: #b45309; font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 900; border: 1px solid #fde68a;">CRÉDITO #${pago.id_credito}</span>
                        <span style="background: #fee2e2; color: #b91c1c; font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 900; border: 1px solid #fecaca;">PAGO #${pago.numero_pago}</span>
                        <span style="background: #dcfce7; color: #15803d; font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 900; border: 1px solid #bbf7d0;">${metodoPago}</span>
                        <span style="margin-left: auto; font-size: 18px;">🔒</span>
                    </div>
                    
                    <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #0f172a; font-weight: 900;">👤 ${nombreCliente}</h3>
                    <p style="margin: 0 0 10px 0; font-size: 13px; color: #64748b; font-weight: 600;">Pago original: ${fechaOriginalTxt}</p>
                    
                    <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px dashed #94a3b8; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <p style="margin: 0; font-size: 12px; color: #475569; font-weight: bold;">Monto Reversado:</p>
                            <p style="margin: 0; font-size: 22px; color: #ef4444; font-weight: 900;">$${parseFloat(pago.abono_total).toFixed(2)}</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="margin: 0 0 5px 0; font-size: 11px; color: #64748b; font-weight: 600;">🗑️ Anulado: ${fechaEliminacionTxt}</p>
                            <p style="margin: 0; font-size: 11px; color: #475569; background: #e2e8f0; padding: 4px 8px; border-radius: 4px; display: inline-block; font-weight: bold;">📝 ${pago.motivo_eliminacion || 'Auditoría Interna'}</p>
                        </div>
                    </div>
                </div>`;
            }).join('');
        } catch (error) { contenedor.innerHTML = `<p style="color:red; font-size:13px;">Error de Bóveda: ${error.message}</p>`; }
    }
    // =====================================================================
    // 🏆 SECCIÓN D: CRÉDITOS FINALIZADOS (CON BOTÓN DE HISTORIAL)
    // =====================================================================
    else if (categoria === 'finalizados') {
        contenedor.innerHTML = '<p style="color:#64748b; font-size:13px;">Abriendo bóveda histórica y calculando últimos pagos...</p>';
        try {
            // 🔥 AÑADIDO: "cliente_id" a la consulta para calcular CRE exacto
            const { data: finalizados, error } = await supabaseClient
                .from('creditos')
                .select(`id, monto_capital, total_pagar, monto_mora, fecha_emision, frecuencia_pago, num_cuotas, valor_cuota, cliente_id, clientes!inner(nombres, apellidos, cedula)`)
                .eq('estado', 'finalizado')
                .order('id', { ascending: false });

            if (error) throw error;
            if (finalizados.length === 0) {
                contenedor.innerHTML = `<p style="color: #8b5cf6; font-weight: bold;">✨ Aún no hay créditos finalizados en el historial.</p>`;
                return;
            }

            // 🔥 MAGIA: Calculamos el historial para saber el número exacto (Ej: 38)
            const { data: todosLosCreditos } = await supabaseClient
                .from('creditos')
                .select('id, cliente_id')
                .order('id', { ascending: true });
                
            let mapaNumeroCredito = {};
            if (todosLosCreditos) {
                let conteos = {};
                todosLosCreditos.forEach(c => {
                    if (!conteos[c.cliente_id]) conteos[c.cliente_id] = 0;
                    conteos[c.cliente_id]++;
                    mapaNumeroCredito[c.id] = conteos[c.cliente_id];
                });
            }

            const idsCreditos = finalizados.map(c => c.id);
            let ultimosPagos = {};
            if (idsCreditos.length > 0) {
                const { data: pagos } = await supabaseClient
                    .from('historial_pagos')
                    .select('id_credito, fecha_pago')
                    .in('id_credito', idsCreditos)
                    .order('fecha_pago', { ascending: false });
                
                if (pagos) {
                    pagos.forEach(p => {
                        if (!ultimosPagos[p.id_credito]) ultimosPagos[p.id_credito] = p.fecha_pago;
                    });
                }
            }

            const formatearFechaAlpha = (fechaISO) => {
                if (!fechaISO) return 'N/A';
                const f = new Date(fechaISO);
                const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
                const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                let hora = f.getHours();
                const ampm = hora >= 12 ? 'pm' : 'am';
                hora = hora % 12 || 12; 
                const min = f.getMinutes().toString().padStart(2, '0');
                return `${dias[f.getDay()]} ${f.getDate()}/${meses[f.getMonth()]}/${f.getFullYear()} | h ${hora}:${min} ${ampm}`;
            };

            contenedor.innerHTML = finalizados.map(cre => {
                const cli = cre.clientes || {};
                const nombreCliente = `${cli.nombres} ${cli.apellidos}`.toUpperCase();
                const iN = (cli.nombres || 'X').trim().charAt(0).toUpperCase();
                const iA = (cli.apellidos || 'X').trim().charAt(0).toUpperCase();
                const u4 = (cli.cedula || '0000').trim().slice(-4);
                const refFinal = `REF: ${iN}${iA}-${u4}`;
                
                // 🔥 AQUÍ ARMAMOS LA ETIQUETA PERFECTA (Ej: CRE #38 [RJ])
                let numeroCredito = mapaNumeroCredito[cre.id] || '?';
                let creCifrado = typeof cifrarNumeroCredito === 'function' ? cifrarNumeroCredito(numeroCredito).toUpperCase() : '?';
                let etiquetaCRE = `CRE #${numeroCredito} [${creCifrado}]`;

                const capital = parseFloat(cre.monto_capital) || 1;
                const total = parseFloat(cre.total_pagar) || 1;
                const calcInteresPorcentaje = Math.round(((total - capital) / capital) * 100);

                // 🔥 INYECCIÓN DE MORA Y TOTAL REAL CANCELADO
                const moraExtra = parseFloat(cre.monto_mora) || 0;
                let visualTotalAPagar = `<span style="font-size: 14px; color: #166534; font-weight: 900;">💰 Total a Pagar: $${total.toFixed(2)}</span>`;
                
                if (moraExtra > 0) {
                    const totalCancelado = total + moraExtra;
                    visualTotalAPagar += ` <span style="background: #fee2e2; color: #ef4444; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-left: 5px;">+ Mora $${moraExtra.toFixed(2)}</span>`;
                    visualTotalAPagar += ` <span style="background: #f8fafc; border: 1px dashed #cbd5e1; color: #334155; font-size: 12px; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-left: 5px;">👉 Cancelado: $${totalCancelado.toFixed(2)}</span>`;
                }

                let fechaEmisionTxt = formatearFechaAlpha(cre.fecha_emision);
                let fechaUltimoPagoTxt = ultimosPagos[cre.id] ? formatearFechaAlpha(ultimosPagos[cre.id]) : 'Sin pagos registrados';

                const textoBusqueda = `${nombreCliente} ${cli.cedula} ${refFinal} ${cre.id}`.toLowerCase();

                return `
                <div class="item-papelera-global" data-busqueda="${textoBusqueda}" style="background: #fff; border: 1px solid #cbd5e1; border-left: 6px solid #8b5cf6; border-radius: 10px; padding: 15px; margin-bottom: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                    
                    <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 10px; flex-wrap: wrap; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
                        <span style="background: #f1f5f9; color: #334155; font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 900; border: 1px solid #cbd5e1;">${refFinal}</span>
                        <span style="background: #ede9fe; color: #5b21b6; font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 900; border: 1px solid #ddd6fe;">CRÉDITO #${cre.id}</span>
                        <span style="background: #fef08a; color: #854d0e; font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 900; border: 1px solid #fde047;">${etiquetaCRE}</span>
                        <span style="background: #dcfce7; color: #166534; font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 900; border: 1px solid #bbf7d0;">✅ PAGADO AL 100%</span>
                        <span style="margin-left: auto; font-size: 18px;">🏆</span>
                    </div>
                    
                    <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #0f172a; font-weight: 900;">👤 ${nombreCliente}</h3>
                    <p style="margin: 0 0 10px 0; font-size: 12px; color: #64748b;">🆔 Cédula: ${cli.cedula}</p>
                    
                    <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px dashed #94a3b8; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 8px;">
                            <span style="font-size: 13px; color: #334155;"><strong>Capital:</strong> $${capital.toFixed(2)}</span>
                            <span style="font-size: 13px; color: #334155;"><strong>Interés:</strong> ${calcInteresPorcentaje}%</span>
                            <span style="font-size: 13px; color: #334155;"><strong>Cuota:</strong> $${parseFloat(cre.valor_cuota || 0).toFixed(2)}</span>
                            ${visualTotalAPagar}
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 4px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
                            <span style="font-size: 12px; color: #475569;">🔄 <strong>Frecuencia de Pago:</strong> ${cre.frecuencia_pago || 'Cobro Diario'}</span>
                            <span style="font-size: 12px; color: #475569;">🔢 <strong>N° de Cuotas:</strong> ${cre.num_cuotas || '0'}</span>
                        </div>
                    </div>

                    <div style="background: #f1f5f9; padding: 12px; border-radius: 6px; display: flex; flex-direction: column; gap: 8px;">
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <span style="font-size: 14px;">🗓️</span>
                            <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 600;">Inicio de crédito: <span style="color: #0f172a; font-weight: bold;">${fechaEmisionTxt}</span></p>
                        </div>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <span style="font-size: 14px;">🏆</span>
                            <p style="margin: 0; font-size: 12px; color: #166534; font-weight: 900;">Último pago (Cancelación): <span style="color: #166534;">${fechaUltimoPagoTxt}</span></p>
                        </div>
                    </div>

                    <div style="margin-top: 15px;">
                        <button onclick="verHistorialPagosFinalizado(${cre.id}, '${nombreCliente.replace(/'/g, "\\'")}')" style="width: 100%; padding: 10px; background: #0f172a; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">📑 Ver Historial de Pagos</button>
                    </div>

                </div>`;
            }).join('');

        } catch (error) { 
            contenedor.innerHTML = `<p style="color:red; font-size:13px;">Error histórico: ${error.message}</p>`; 
        }
    }
}


// =========================================================================
// 📄 VISOR FLOTANTE DE HISTORIAL DE PAGOS (CON FECHAS ALPHA Y CRE)
// =========================================================================
async function verHistorialPagosFinalizado(idCredito, nombreCliente) {
    try {
        // 1. Buscamos TODOS los pagos de ese crédito en Supabase
        const { data: pagos, error } = await supabaseClient
            .from('historial_pagos')
            .select('*')
            .eq('id_credito', idCredito)
            .order('numero_pago', { ascending: true });

        if (error) throw error;

        if (!pagos || pagos.length === 0) {
            alert(`⚠️ No se encontraron pagos registrados para el crédito #${idCredito}.`);
            return;
        }

        // 2. ⏱️ FORMATEADOR EXACTO ALPHA PARA LA TABLA (ej. lunes 11/julio/2026 - 10:14 a. m.)
        const formatearFechaTabla = (fechaISO) => {
            if (!fechaISO) return 'N/A';
            const f = new Date(fechaISO);
            const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
            const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            let hora = f.getHours();
            const ampm = hora >= 12 ? 'p. m.' : 'a. m.';
            hora = hora % 12 || 12; // Formato 12 horas
            const min = f.getMinutes().toString().padStart(2, '0');
            return `${dias[f.getDay()]} ${f.getDate()}/${meses[f.getMonth()]}/${f.getFullYear()} - ${hora}:${min} ${ampm}`;
        };

        // 3. Generamos la etiqueta CRE cifrada para el encabezado
        let creCifrado = typeof cifrarNumeroCredito === 'function' ? cifrarNumeroCredito(idCredito).toUpperCase() : '';
        let etiquetaCRE = creCifrado ? `CRE #${idCredito} [${creCifrado}]` : `CRE #${idCredito}`;

        // 4. Armamos las filas de la tabla con los pagos extraídos y la fecha pulida
        let filasHTML = pagos.map(p => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px; text-align: center; color: #475569; font-weight: bold;">#${p.numero_pago}</td>
                <td style="padding: 10px; color: #0f172a;">${formatearFechaTabla(p.fecha_pago)}</td>
                <td style="padding: 10px; text-align: center;">
                    <span style="background: #e2e8f0; color: #475569; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                        ${(p.forma_pago || 'EFECTIVO').toUpperCase()}
                    </span>
                </td>
                <td style="padding: 10px; text-align: right; color: #166534; font-weight: 900;">$${parseFloat(p.abono_total).toFixed(2)}</td>
            </tr>
        `).join('');

        const totalPagado = pagos.reduce((sum, p) => sum + parseFloat(p.abono_total || 0), 0);
        const modalId = 'modal-historial-pagos-alpha';

        // Borramos si quedó uno abierto antes
        const modalPrevio = document.getElementById(modalId);
        if (modalPrevio) modalPrevio.remove();

        // 5. Diseñamos la Ventana Flotante (Pop-up)
        const modalHTML = `
        <div id="${modalId}" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.7); display: flex; justify-content: center; align-items: center; z-index: 9999; padding: 20px; box-sizing: border-box; backdrop-filter: blur(3px);">
            <div style="background: white; border-radius: 12px; width: 100%; max-width: 550px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">
                
                <div style="background: #0f172a; padding: 15px 20px; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h3 style="margin: 0; color: white; font-size: 16px;">📑 Auditoría de Pagos</h3>
                        <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px; display: flex; align-items: center;">
                            <span style="background: #334155; padding: 2px 6px; border-radius: 4px; color: #e2e8f0; font-weight: bold; margin-right: 6px;">${etiquetaCRE}</span> 
                            CRÉDITO #${idCredito} - ${nombreCliente}
                        </p>
                    </div>
                    <button onclick="document.getElementById('${modalId}').remove()" style="background: #ef4444; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center;">X</button>
                </div>

                <div style="padding: 20px; overflow-y: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <thead>
                            <tr style="background: #f8fafc; color: #64748b; text-align: left; border-bottom: 2px solid #e2e8f0;">
                                <th style="padding: 10px; text-align: center;">N°</th>
                                <th style="padding: 10px;">Fecha y Hora</th>
                                <th style="padding: 10px; text-align: center;">Método</th>
                                <th style="padding: 10px; text-align: right;">Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filasHTML}
                        </tbody>
                    </table>
                </div>

                <div style="padding: 15px 20px; background: #f8fafc; border-top: 2px solid #e2e8f0; border-radius: 0 0 12px 12px; display: flex; justify-content: space-between; align-items: center;">
                    <button onclick="document.getElementById('${modalId}').remove()" style="padding: 8px 16px; border: 1px solid #cbd5e1; background: white; border-radius: 6px; cursor: pointer; font-weight: bold; color: #475569;">Cerrar Vista</button>
                    <div style="text-align: right;">
                        <span style="font-size: 12px; color: #64748b; font-weight: bold;">TOTAL RECAUDADO</span><br>
                        <span style="font-size: 18px; color: #166534; font-weight: 900;">$${totalPagado.toFixed(2)}</span>
                    </div>
                </div>

            </div>
        </div>`;

        // Lo inyectamos en la pantalla
        document.body.insertAdjacentHTML('beforeend', modalHTML);

    } catch (err) {
        alert("❌ Error crítico al cargar el historial: " + err.message);
    }
}
window.verHistorialPagosFinalizado = verHistorialPagosFinalizado;


// =========================================================================
// 🔍 MOTOR UNIVERSAL DE BÚSQUEDA PARA LA DEPURACIÓN
// =========================================================================
function filtrarPapeleraGlobal() {
    const textoInput = document.getElementById('input-buscador-global-papelera').value.toLowerCase();
    // Busca todas las tarjetas, sin importar en qué pestaña estemos
    const tarjetas = document.querySelectorAll('.item-papelera-global');

    tarjetas.forEach(tarjeta => {
        const datosTarjeta = tarjeta.getAttribute('data-busqueda') || '';
        
        if (datosTarjeta.includes(textoInput)) {
            tarjeta.style.display = 'block';
        } else {
            tarjeta.style.display = 'none';
        }
    });
}
window.filtrarPapeleraGlobal = filtrarPapeleraGlobal;






/**
 * Función para revivir a un cliente archivado
 */
async function reactivarClienteDesdePapelera(id, nombre) {
    if (confirm(`♻️ ¿Estás seguro de que deseas RESTAURAR al cliente [${nombre}]?\n\nVolverá a aparecer en tu lista principal con todo su historial intacto.`)) {
        try {
            const { error } = await supabaseClient
                .from('clientes')
                .update({ estado: 'activo' })
                .eq('id', id);

            if (error) throw error;

            alert(`✅ ¡El cliente ${nombre} ha vuelto a la vida con éxito!`);
            
            // Recargamos la papelera para que desaparezca de esta pantalla
            cargarPapelera('clientes'); 
            
            // Si tienes la función cargarClientes() global, la llamamos para actualizar el fondo
            if (typeof cargarClientes === 'function') cargarClientes();

        } catch (error) {
            alert("❌ Error al restaurar: " + error.message);
        }
    }
}

/**
 * Función PELIGROSA: Nuke total (Borrado definitivo saltándose la seguridad contable)
 */
async function forzarEliminacionCliente(id, nombre) {
    let confirmacionNivel1 = confirm(`⚠️ ALERTA CRÍTICA ⚠️\n\nEstás a punto de DESTRUIR permanentemente el registro de [${nombre}].\n\nSi este cliente tiene créditos asociados, causará un descuadre irremediable en tu base de datos.\n\n¿Deseas continuar bajo tu propio riesgo?`);
    
    if (confirmacionNivel1) {
        let confirmacionNivel2 = prompt(`Escribe la palabra ELIMINAR para confirmar la destrucción de ${nombre}:`);
        
        if (confirmacionNivel2 === 'ELIMINAR') {
            try {
                // Aquí usamos el borrado fuerte (Hard Delete)
                const { error } = await supabaseClient.from('clientes').delete().eq('id', id);
                if (error) throw error;

                alert(`💥 Registro destruido permanentemente.`);
                cargarPapelera('clientes');

            } catch (error) {
                alert("❌ Fallo en la destrucción: " + error.message);
            }
        } else {
            alert("Operación de destrucción cancelada. La palabra clave no coincide.");
        }
    }
}

/**
 * RE-ACTIVACIÓN FINANCIERA: Devuelve el crédito a la vida, resta el capital, actualiza auditoría y envía SMS de restauración.
 */
async function reactivarCreditoDesdePapelera(idCredito, capital, formaEntrega, nombreCliente) {
    if (!confirm(`♻️ ¿Deseas RE-ACTIVAR el crédito #${idCredito} de [${nombreCliente}]?\n\nAl hacerlo, se volverá a descontar los $${capital} de la caja fuerte correspondiente y se notificará al cliente.`)) return;

    try {
        // --- 1. TRAER DATOS COMPLETOS DEL CRÉDITO Y CLIENTE PARA EL SMS ---
        const { data: credito, error: errCred } = await supabaseClient
            .from('creditos')
            .select('*')
            .eq('id', idCredito)
            .single();
        
        if (errCred) throw errCred;

        const { data: cliente, error: errCli } = await supabaseClient
            .from('clientes')
            .select('nombres, apellidos, cedula, whatsapp')
            .eq('id', credito.cliente_id)
            .single();
        
        if (errCli) throw errCli;

        // --- 2. MAGIA CRIPTOGRÁFICA Y CÓDIGO BANCARIO ---
        const inicialN = cliente.nombres.charAt(0).toUpperCase();
        const inicialA = cliente.apellidos.charAt(0).toUpperCase();
        const ultimos4 = cliente.cedula.slice(-4);
        const codigoClienteBancario = `${inicialN}${inicialA}-${ultimos4}`;

        // Buscar qué número de crédito es en la historia exacta del cliente
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

        const codigoCifrado = typeof cifrarNumeroCredito === 'function' ? cifrarNumeroCredito(numeroCredito).toUpperCase() : '?';

        // SEPARACIÓN DE CÓDIGOS (INTERNO VS CLIENTE)
        const codigoCreditoOficial = `${codigoClienteBancario} | CRE #${numeroCredito} [${codigoCifrado}]`; // Auditoría interna
        const codigoCreditoSMS = `${codigoClienteBancario} | CRE #${codigoCifrado}`; // SMS para el cliente
        const nombreLimpio = `${cliente.nombres.toUpperCase()} ${cliente.apellidos.toUpperCase()}`;

        // --- 3. LÓGICA DE LA CAJA FUERTE ---
        const textoCaja = formaEntrega ? formaEntrega.toLowerCase() : '';
        let idCaja = textoCaja.includes('banco') ? 2 : 1;

        const { data: caja, error: errCaja } = await supabaseClient
            .from('cajas_capital')
            .select('saldo_actual')
            .eq('id', idCaja)
            .single();

        if (errCaja) throw errCaja;

        if (parseFloat(caja.saldo_actual) < parseFloat(capital)) {
            alert(`❌ Fondos insuficientes en la caja para restaurar este crédito. Saldo disponible: $${caja.saldo_actual}`);
            return;
        }

        const nuevoSaldo = parseFloat(caja.saldo_actual) - parseFloat(capital);
        await supabaseClient.from('cajas_capital').update({ saldo_actual: nuevoSaldo }).eq('id', idCaja);

        // --- 4. REGISTRAR AUDITORÍA UNIFICADA ---
        await supabaseClient.from('historial_capital').insert([{
            caja_id: idCaja,
            monto: -parseFloat(capital), // Sale dinero de la caja
            concepto: `🔴 RESTAURACIÓN: Re-activación - ${codigoCreditoOficial} - ${nombreLimpio} (Re-desembolso)`
        }]);

        // --- 5. ACTIVAR EL CRÉDITO EN LA NUBE ---
        await supabaseClient.from('creditos').update({ estado: 'activo' }).eq('id', idCredito);

        // --- 6. 🟢 DISPARAR SMS DE REACTIVACIÓN (TONO POSITIVO Y CIFRADO) ---
        if (cliente.whatsapp && typeof enviarSMSAutomatico === 'function') {
            const modalidadNombre = (credito.frecuencia_pago || "Fija").replace(/.*Cobro\s+/i, "").replace("📅", "").trim();
            
            const ahora = new Date();
            const fechaLarga = ahora.toLocaleDateString('es-EC', { weekday: 'long', day: '2-digit', month: '2-digit', year: '2-digit' });
            const horaFormateada = ahora.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
            const fechaHoraSMS = `${fechaLarga.charAt(0).toUpperCase() + fechaLarga.slice(1)} | ${horaFormateada}`;

            // MENSAJE DE IMPACTO POSITIVO: Se centra en la restauración exitosa
            const msjReactivacion = `=== SISTEMA ALPHA ===\n${fechaHoraSMS}\n\n🆔 Ref: ${codigoCreditoSMS}\n👤 Cliente: ${nombreLimpio}\n\nHola, te informamos que tu credito ha sido RESTAURADO exitosamente y se encuentra ACTIVO en nuestro sistema.\n\n💰 Monto: $${parseFloat(credito.monto_capital).toFixed(2)}\n💵 Cuota: $${parseFloat(credito.valor_cuota).toFixed(2)}\n🔄 Modalidad: ${modalidadNombre}\n📊 Total: $${parseFloat(credito.total_pagar).toFixed(2)}\n🔢 Cuotas: ${credito.num_cuotas}\n\nEste es tu soporte oficial. ¡Gracias!\n🚫 POR FAVOR, NO RESPONDER A ESTE MENSAJE.`;
            
            console.log("Enviando SMS de restauración...");
            await enviarSMSAutomatico(cliente.whatsapp, msjReactivacion);
        }

        alert("✅ Crédito reactivado exitosamente. Volvió a la cartera activa y se notificó al cliente.");
        
        // --- 7. ACTUALIZACIÓN EN VIVO DE LAS PANTALLAS ---
        if (typeof cargarPapelera === 'function') cargarPapelera('creditos');
        if (typeof cargarHistorialCreditos === 'function') cargarHistorialCreditos();
        if (typeof cargarDatosCapital === 'function') cargarDatosCapital();
        if (typeof cargarHistorialCapital === 'function') cargarHistorialCapital();

    } catch (error) {
        console.error("Error al restaurar crédito:", error);
        alert("❌ Error al restaurar crédito: " + error.message);
    }
}

/**
 * ELIMINACIÓN DE REGISTRO DE AUDITORÍA (Nuke total de un crédito anulado)
 */
async function forzarEliminacionCredito(idCredito) {
    if (!confirm(`⚠️ ALERTA DE AUDITORÍA ⚠️\n\n¿Estás seguro de destruir el registro histórico del crédito #${idCredito}?\n\nEsta acción borrará el comprobante anulado de la base de datos permanentemente.`)) return;

    let token = prompt("🔒 Ingrese la palabra ELIMINAR para purgar el registro:");
    if (token !== 'ELIMINAR') {
        alert("Operación cancelada.");
        return;
    }

    try {
        await supabaseClient.from('creditos').delete().eq('id', idCredito);
        alert("💥 Registro de auditoría eliminado para siempre.");
        cargarPapelera('creditos');
    } catch (error) {
        alert("❌ Error al eliminar registro: " + error.message);
    }
}

// =========================================================================
// MÓDULO DE REPORTES: EXCEL Y PDF DE CRÉDITOS ACTIVOS
// =========================================================================

async function descargarExcelCreditos() {
    try {
        alert("Generando Excel de Créditos... Por favor espera.");
        
        const { data: creditos, error } = await supabaseClient
            .from('creditos')
            .select(`
                id, monto_capital, total_pagar, valor_cuota, frecuencia_pago, fecha_emision,
                clientes (nombres, apellidos, cedula)
            `)
            .eq('estado', 'activo')
            .order('id', { ascending: false });

        if (error) throw error;
        if (!creditos || creditos.length === 0) {
            alert("No hay créditos activos para exportar.");
            return;
        }

        const datosLimpios = creditos.map(c => {
            const cliente = c.clientes || {};
            const nombreCompleto = `${cliente.nombres || ''} ${cliente.apellidos || ''}`.toUpperCase();
            const fechaFormateada = new Date(c.fecha_emision).toLocaleDateString('es-EC');
            
            // 🔥 Limpiamos el emoji para que Excel también quede pulcro
            const modalidadLimpia = (c.frecuencia_pago || 'N/A').replace(/📅/g, '').trim();

            return {
                "N° Crédito": c.id,
                "Cliente": nombreCompleto,
                "Cédula": cliente.cedula || 'N/A',
                "Fecha Emisión": fechaFormateada,
                "Capital Prestado ($)": parseFloat(c.monto_capital || 0),
                "Total a Pagar ($)": parseFloat(c.total_pagar || 0),
                "Valor Cuota ($)": parseFloat(c.valor_cuota || 0),
                "Modalidad": modalidadLimpia
            };
        });

        const hoja = XLSX.utils.json_to_sheet(datosLimpios);
        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, hoja, "Créditos Activos");

        XLSX.writeFile(libro, `Reporte_Creditos_Alpha_${new Date().getTime()}.xlsx`);

    } catch (error) {
        console.error("Error al exportar Excel:", error);
        alert("Error al generar el archivo Excel: " + error.message);
    }
}

async function generarPDFCreditos() {
    try {
        alert("Generando PDF de Créditos... Por favor espera.");

        const { data: creditos, error } = await supabaseClient
            .from('creditos')
            .select(`
                id, monto_capital, total_pagar, valor_cuota, frecuencia_pago, fecha_emision,
                clientes (nombres, apellidos, cedula)
            `)
            .eq('estado', 'activo')
            .order('id', { ascending: false });

        if (error) throw error;
        if (!creditos || creditos.length === 0) {
            alert("No hay créditos activos para exportar.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape');

        doc.setFontSize(18);
        doc.setTextColor(15, 23, 42);
        doc.text("SISTEMA ALPHA V5 - REPORTE DE CARTERA", 14, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        const fechaActual = new Date().toLocaleString('es-EC');
        doc.text(`Fecha de Auditoría: ${fechaActual}`, 14, 28);
        doc.text("Estado: CRÉDITOS ACTIVOS", 14, 33);

        const columnas = ["N° CRE", "CLIENTE", "CÉDULA", "FECHA", "CAPITAL", "TOTAL", "CUOTA", "MODALIDAD"];
        
        let sumaCapital = 0;
        let sumaTotal = 0;

        const filas = creditos.map(c => {
            const cliente = c.clientes || {};
            const nombreCompleto = `${cliente.nombres || ''} ${cliente.apellidos || ''}`.toUpperCase();
            const fechaFormateada = new Date(c.fecha_emision).toLocaleDateString('es-EC');
            
            const capital = parseFloat(c.monto_capital || 0);
            const total = parseFloat(c.total_pagar || 0);
            
            sumaCapital += capital;
            sumaTotal += total;

            // 🔥 LIMPIEZA EXTREMA: Solo permite letras, números, espacios y paréntesis. Destruye cualquier emoji o símbolo raro.
            let modalidadOriginal = c.frecuencia_pago || 'N/A';
            let modalidadLimpia = modalidadOriginal.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ( )\.]/g, '').trim();

            return [
                c.id,
                nombreCompleto,
                cliente.cedula || 'N/A',
                fechaFormateada,
                `$${capital.toFixed(2)}`,
                `$${total.toFixed(2)}`,
                `$${parseFloat(c.valor_cuota || 0).toFixed(2)}`,
                modalidadLimpia
            ];
        });

        doc.autoTable({
            startY: 40,
            head: [columnas],
            body: filas,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], fontSize: 9 },
            
            // 🔥 AJUSTE ESTRICTO DE TEXTO
            styles: { 
                fontSize: 8, 
                cellPadding: 3, 
                overflow: 'linebreak' // Obliga al texto a saltar de línea
            },
            columnStyles: {
                1: { cellWidth: 55 }, // Le da un ancho máximo al nombre del cliente
                7: { cellWidth: 50 }  // Le da un ancho máximo a la modalidad para que no se salga de la hoja
            },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 14, right: 14 } // Respeta los márgenes de la página
        });

        const yFinal = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text(`Total Capital Prestado: $${sumaCapital.toFixed(2)}`, 14, yFinal);
        doc.text(`Total Dinero Proyectado (a cobrar): $${sumaTotal.toFixed(2)}`, 14, yFinal + 7);

        doc.save(`Auditoria_Creditos_${new Date().getTime()}.pdf`);

    } catch (error) {
        console.error("Error al generar PDF:", error);
        alert("Error al generar el documento PDF: " + error.message);
    }
}
// aqui empieza el modulo registrar pago 

// aqui termina el modulo registrar pago


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
// 🔎 BUSCADOR INTELIGENTE POR MENÚ DESPLEGABLE (ALPHA V5 - MULTICRÉDITO)
// =========================================================================
let listaCreditosActivosCliente = [];

async function buscarCreditoParaCobro() {
    const busqueda = document.getElementById('selector-cliente-recaudacion').value.trim();
    
    if (!busqueda) {
        alert("Por favor, selecciona un cliente de la lista.");
        return;
    }

    try {
        // 🔥 EL CAMBIO MAESTRO: Ahora el cajero puede ver créditos 'activos' y 'congelados' (acuerdos verbales)
        const { data: creditos, error } = await supabaseClient
            .from('creditos')
            .select(`id, monto_capital, total_pagar, monto_mora, valor_cuota, frecuencia_pago, estado, fecha_emision, cliente_id, num_cuotas, clientes (nombres, apellidos, cedula)`)
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

        // 🌟 TRAMOS EL HISTORIAL COMPLETO PARA SABER QUÉ NÚMERO DE CRÉDITO ES CADA UNO
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
                const prestamo = parseFloat(c.total_pagar).toFixed(0);
                
                const moraCredito = parseFloat(c.monto_mora) || 0;
                let textoMoraExtra = "";
                
                if (moraCredito > 0) {
                    let totalPagadoHastaHoy = 0;
                    if (pagosCliente) {
                        pagosCliente.forEach(p => {
                            if (p.id_credito === c.id) {
                                totalPagadoHastaHoy += parseFloat(p.abono_total || 0);
                            }
                        });
                    }
                    const deudaTotalCalc = (parseFloat(c.total_pagar) - totalPagadoHastaHoy) + moraCredito;
                    textoMoraExtra = ` | Mora $${moraCredito.toFixed(0)} | 👉 Deuda Total: $${deudaTotalCalc.toFixed(2)}`;
                }
                
                // 🔥 Etiqueta visual si es un acuerdo verbal (Congelado)
                const alertaCongelado = c.estado === 'congelado' ? ' [🧊 CONGELADO]' : '';
                
                const textoOpcion = `CRÉDITO #${c.id} | CRE #${numeroCredito} [${codigoCifrado}]${alertaCongelado} | ${fechaTxt} | ${cli.nombres.split(' ')[0]} ${cli.apellidos.split(' ')[0]} (${cli.cedula}) | Préstamo de $${prestamo}${textoMoraExtra}`;
                
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
// 🌟 SISTEMA DE PAGINACIÓN DE ABONOS (VARIABLES GLOBALES)
// =========================================================================
let abonosClienteActual = []; // Memoria temporal para los abonos del cliente
let paginaActualAbonos = 1;
const ABONOS_POR_PAGINA = 4;  // Límite exacto de abonos que pediste

// =========================================================================
// 🎯 CARGADOR DE ESTADO DE CUENTA Y GENERADOR DE HISTORIAL (ALPHA V5)
// =========================================================================
async function cargarEstadoCuentaCredito(idCredito) {
    if (!idCredito) return;
    
    // 🔥 MAGIA DE UX: Si tiene más de 1 crédito, dejamos el menú visible para cambiar rápido.
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
    
    // Reseteamos la memoria de páginas cada vez que buscamos un nuevo cliente
    abonosClienteActual = [];
    paginaActualAbonos = 1;

    try {
        const { data: pagosPrevios, errorPagos } = await supabaseClient
            .from('historial_pagos')
            .select('*')
            .eq('id_credito', encontrado.id)
            .order('fecha_pago', { ascending: false });

        if (!errorPagos && pagosPrevios && pagosPrevios.length > 0) {
            // 1. Calculamos la matemática sumando TODOS los abonos (sin ocultar ninguno)
            pagosPrevios.forEach(p => {
                totalPagadoHastaHoy += parseFloat(p.abono_total || 0);
                interesYaPagado += parseFloat(p.monto_interes || 0);
            });
            // 2. Guardamos la lista en la memoria para que el paginador haga su trabajo
            abonosClienteActual = pagosPrevios;
        } else {
            abonosClienteActual = [];
        }
    } catch (e) {
        console.log("Historial vacío o por inicializar.");
        abonosClienteActual = [];
    }

    // -------------------------------------------------------------------------
    // CONTINÚA LA ACTUALIZACIÓN DE DATOS DE LA TARJETA PRINCIPAL
    // -------------------------------------------------------------------------
    interesTotalPactado = parseFloat(encontrado.total_pagar) - parseFloat(encontrado.monto_capital);
    const saldoRestanteNeto = parseFloat(encontrado.total_pagar) - totalPagadoHastaHoy;
    creditoSeleccionadoCobro.saldoNeto = saldoRestanteNeto;

    const cli = encontrado.clientes || {};
    const iN = (cli.nombres || '').trim().charAt(0);
    const iA = (cli.apellidos || '').trim().charAt(0);
    const u4 = (cli.cedula || '').trim().slice(-4);
    const refFinal = `${iN}${iA}-${u4}`.toUpperCase();

    let fechaEmisionStr = 'N/A';
    if(encontrado.fecha_emision) {
        const fEmi = new Date(encontrado.fecha_emision);
        const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        fechaEmisionStr = `${dias[fEmi.getDay()]} ${fEmi.getDate()}/${meses[fEmi.getMonth()]}/${fEmi.getFullYear()}`;
    }

    let numCre = '?';
    try {
        const { data: credFull } = await supabaseClient
            .from('creditos')
            .select('*')
            .eq('id', encontrado.id)
            .single();
            
        if (credFull && credFull.numero_credito) {
            numCre = credFull.numero_credito;
        } else if (credFull && credFull.cliente_id) {
            const { data: historialCli } = await supabaseClient
                .from('creditos')
                .select('id')
                .eq('cliente_id', credFull.cliente_id)
                .order('id', { ascending: true });
                
            if (historialCli) {
                const pos = historialCli.findIndex(c => c.id == encontrado.id);
                if (pos !== -1) numCre = pos + 1;
            }
        }
    } catch (errorCRE) {
        console.log("Error buscando el CRE:", errorCRE);
    }

    const codigoCifrado = typeof cifrarNumeroCredito === 'function' ? cifrarNumeroCredito(numCre).toUpperCase() : '?';

    document.getElementById('lbl-recaudacion-ref').innerText = `REF: ${refFinal} | CRÉDITO #${encontrado.id} | CRE #${numCre} [${codigoCifrado}] | 📅 ${fechaEmisionStr}`;
    document.getElementById('lbl-recaudacion-cliente').innerText = `${cli.nombres} ${cli.apellidos}`.toUpperCase();
    document.getElementById('lbl-recaudacion-cedula').innerText = `Cédula: ${cli.cedula || 'N/A'}`;
    document.getElementById('lbl-recaudacion-cuota').innerText = `$${parseFloat(encontrado.valor_cuota).toFixed(2)}`;
    document.getElementById('lbl-recaudacion-frecuencia').innerText = (encontrado.frecuencia_pago || 'DIARIO').replace('📅', '').trim().toUpperCase();
    
    // MAGIA MATEMÁTICA: Cuotas pendientes
    const elCuotas = document.getElementById('lbl-recaudacion-num-cuotas');
    if (elCuotas) {
        const cuotasTotales = parseInt(encontrado.num_cuotas) || 1;
        const valorDeCuota = parseFloat(encontrado.valor_cuota) || 1;
        
        let cuotasPendientes = Math.ceil(saldoRestanteNeto / valorDeCuota);
        if (cuotasPendientes < 0) cuotasPendientes = 0; 

        elCuotas.innerHTML = `${cuotasTotales} &nbsp; <span style="color: #ef4444; font-size: 11px; font-weight: bold; background: #fee2e2; padding: 2px 6px; border-radius: 4px;">(${cuotasPendientes} Pendientes)</span>`;
    }

    // 🔥 INYECCIÓN: Lógica matemática para sumar mora y dibujar las etiquetas en la tarjeta
    const moraGuardada = parseFloat(encontrado.monto_mora) || 0;
    const saldoFinalMora = saldoRestanteNeto + moraGuardada;
    
    const etiquetaMora = moraGuardada > 0 ? `<span style="margin-left: 10px; color: #ef4444; font-size: 12px; font-weight: bold; background: #fee2e2; padding: 2px 6px; border-radius: 4px;">+ Mora $${moraGuardada.toFixed(2)}</span>` : '';
    
    // Dejamos el Préstamo Original intacto
    document.getElementById('lbl-recaudacion-total').innerText = `$${parseFloat(encontrado.total_pagar).toFixed(2)}`;
    
    // Imprimimos el Saldo Real (Capital/Interés pendiente + Mora) y le pegamos la etiqueta
    document.getElementById('lbl-recaudacion-saldo').innerHTML = `$${saldoFinalMora.toFixed(2)} ${etiquetaMora}`;

    document.getElementById('monto-cobro-input').value = encontrado.valor_cuota;
    
    if (typeof simularEnrutamientoFlujo === 'function') {
        simularEnrutamientoFlujo(encontrado.valor_cuota);
    }

    document.getElementById('recaudacion-espera-msg').style.display = 'none';
    document.getElementById('panel-recaudacion-activo').style.display = 'block';

    // 🎨 LLAMAMOS A LA FUNCIÓN QUE DIBUJA SOLO 4 ABONOS EN PANTALLA
    // (Ahora se ejecuta al final para asegurar que el CRE cifrado ya está calculado)
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

        // Formato de fecha exacto solicitado: "viernes 10/julio/2026 | H:11:20"
        const diasAbono = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const mesesAbono = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const diaSemana = diasAbono[fPago.getDay()];
        const dia = String(fPago.getDate()).padStart(2, '0');
        const mes = mesesAbono[fPago.getMonth()];
        const anio = fPago.getFullYear();
        const horas = String(fPago.getHours()).padStart(2, '0');
        const minutos = String(fPago.getMinutes()).padStart(2, '0');
        
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
                        <span style="text-transform: lowercase;">📅 ${diaSemana} ${dia}/${mes}/${anio}</span>
                        <span style="color: #cbd5e1;">|</span>
                        <span>H:${horas}:${minutos}</span>
                    </div>
                    <span style="font-size: 10px; font-weight: 800; background: #e0f2fe; color: #0284c7; padding: 3px 6px; border-radius: 4px; margin-left: 10px;">${metodoTxt}</span>
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
                ${p.detalles_banco ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 8px; border-top: 1px dashed #cbd5e1; padding-top: 8px;">Ref: ${p.detalles_banco}</div>` : ''}
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
// ✏️ 1. EDITAR ABONO (Motor Matemático + SMS de Actualización Blindado)
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

        let nuevoMonto = prompt(`✏️ EDICIÓN DE ABONO #${numPago}\n\nMonto actual: $${parseFloat(abonoActual.abono_total).toFixed(2)}\n\nEscribe el NUEVO monto total correcto para este pago:`, parseFloat(abonoActual.abono_total));
        
        if (!nuevoMonto || isNaN(nuevoMonto)) return;
        
        nuevoMonto = parseFloat(nuevoMonto);
        if (nuevoMonto <= 0) {
            alert("❌ El monto debe ser mayor a cero.");
            return;
        }

        if (!confirm(`¿Confirmas que quieres cambiar este abono de $${parseFloat(abonoActual.abono_total).toFixed(2)} a $${nuevoMonto.toFixed(2)}?\n\nEl sistema recalculará automáticamente la distribución de Capital e Interés.`)) return;

        // 🔥 LA PREGUNTA DEL GERENTE
        const enviarSMS = confirm("📲 ¿Deseas notificar al cliente sobre esta corrección en su pago vía SMS?");

        // 🧠 Re-enrutamiento matemático Alpha
        const interesPactadoTotal = parseFloat(creditoAct.total_pagar) - parseFloat(creditoAct.monto_capital);
        
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
        // 🚀 LA SORPRESA: MENSAJE DE AUDITORÍA Y ACTUALIZACIÓN
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
                
                // 🔥 FILTRO INTELIGENTE: Extraer solo el CRE con su letra cifrada (Ej: CRE #[Ñ])
                let creText = "CRE # ?";
                const lblRef = document.getElementById('lbl-recaudacion-ref');
                if (lblRef && lblRef.innerText) {
                    const match = lblRef.innerText.match(/CRE\s*#[^|]+/);
                    if (match) {
                        const textoCrudo = match[0].trim(); // Trae "CRE #9 [Ñ]"
                        const matchLetra = textoCrudo.match(/\[.*?\]/); // Busca solo lo que está entre corchetes "[Ñ]"
                        if (matchLetra) {
                            creText = `CRE #${matchLetra[0]}`; // Lo convierte a "CRE #[Ñ]"
                        } else {
                            creText = textoCrudo;
                        }
                    }
                }

                const ahora = new Date();
                const fechaLarga = ahora.toLocaleDateString('es-EC', { weekday: 'long', day: '2-digit', month: '2-digit', year: '2-digit' });
                const horaFormateada = ahora.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
                const fechaHoraSMS = `${fechaLarga.charAt(0).toUpperCase() + fechaLarga.slice(1)} | ${horaFormateada}`;

                // 🧮 Calculamos el SALDO REAL GOBAL sumando todos los pagos a este momento
                const { data: todosLosPagos } = await supabaseClient.from('historial_pagos').select('abono_total').eq('id_credito', abonoActual.id_credito);
                let pagadoTotalActualizado = 0;
                if (todosLosPagos) {
                    pagadoTotalActualizado = todosLosPagos.reduce((sum, p) => sum + parseFloat(p.abono_total || 0), 0);
                }
                const nuevoSaldoFinal = parseFloat(creditoAct.total_pagar) - pagadoTotalActualizado;

                const cuotasTotales = parseInt(creditoAct.num_cuotas) || 1;
                const valorDeCuota = parseFloat(creditoAct.valor_cuota) || 1;
                let cuotasPendientes = Math.ceil(nuevoSaldoFinal / valorDeCuota);
                if (cuotasPendientes < 0) cuotasPendientes = 0;

                const metodoTxt = abonoActual.forma_pago ? abonoActual.forma_pago.toUpperCase() : 'EFECTIVO';

                // 📝 EL MENSAJE ESTRATÉGICO (Ahora con el CRE encriptado)
                const msjActualizacion = `=== SISTEMA ALPHA (Actualización) ===\n${fechaHoraSMS}\n\n🆔 Ref: ${refFinal} | ${creText}\n👤 Cliente: ${nombre}\n\nHola, te notificamos un ajuste en tu historial tras nuestra revisión de caja.\n\n🔄 Pago Corregido: #${numPago}\n💰 Monto Exacto: $${nuevoMonto.toFixed(2)}\n📉 Nuevo Saldo: $${nuevoSaldoFinal.toFixed(2)}\n🔢 N° de Cuotas: ${cuotasPendientes}/${cuotasTotales}\n💳 Método: ${metodoTxt}\n\nLamentamos las molestias. ¡Gracias!\n🚫 NO RESPONDER A ESTE MENSAJE.`;

                enviarSMSAutomatico(numeroCliente, msjActualizacion);
            }
        }

        alert("✅ Abono editado y saldos recalculados exitosamente.");
        
        // Refrescamos toda la pantalla visual de inmediato
        if (creditoSeleccionadoCobro) {
            await cargarEstadoCuentaCredito(creditoSeleccionadoCobro.id);
        }
        
    } catch (error) {
        alert("❌ Error al editar el abono: " + error.message);
    }
}

// -------------------------------------------------------------------------
// 🚫 2. ELIMINAR ABONO (Bóveda de Auditoría Avanzada + SMS)
// -------------------------------------------------------------------------
async function eliminarAbono(idAbono) {
    const idNum = parseInt(idAbono);
    const esValido = await validarRegla24HorasAbono(idNum);
    if (!esValido) return;

    if (!confirm("⚠️ ALERTA DE AUDITORÍA GERENCIAL ⚠️\n\n¿Estás absolutamente seguro de ELIMINAR este abono de la historia?\nEl saldo de la deuda del cliente volverá a subir inmediatamente.")) return;

    const enviarSMS = confirm("📲 ¿Deseas enviar el comprobante de ANULACIÓN OFICIAL por SMS al cliente?");

    try {
        // 🔥 EXTRAER EL 'CRE' DESDE LA PANTALLA ANTES DE BORRAR
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

        // 2. SEGUNDO: Guardamos TODO en la Bóveda (incluyendo los datos nuevos)
        const { error: errAuditoria } = await supabaseClient
            .from('auditoria_pagos_eliminados')
            .insert([{
                id_credito: abonoABorrar.id_credito,
                abono_total: abonoABorrar.abono_total,
                numero_pago: abonoABorrar.numero_pago,
                motivo_eliminacion: 'Corrección interna por gerente',
                forma_pago: abonoABorrar.forma_pago || 'EFECTIVO', // Nuevo
                fecha_pago_original: abonoABorrar.fecha_pago,      // Nuevo
                codigo_cre: creText                                // Nuevo
            }]);

        if (errAuditoria) {
            alert("⚠️ Error: No se pudo guardar el respaldo. Anulación cancelada.");
            return;
        }

        // 3. TERCERO: Eliminamos de la tabla activa
        const { error: errBorrado } = await supabaseClient.from('historial_pagos').delete().eq('id', idNum);
        if (errBorrado) throw errBorrado;

        // =================================================================
        // 🚀 SMS DE ANULACIÓN
        // =================================================================
        if (enviarSMS) {
            const { data: creditoAct } = await supabaseClient.from('creditos').select('*').eq('id', abonoABorrar.id_credito).single();
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
                
                const ahora = new Date();
                const fechaHoraSMS = `${ahora.toLocaleDateString('es-EC', { weekday: 'long' })} | ${ahora.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}`;

                const nuevoSaldoFinal = parseFloat(creditoSeleccionadoCobro.saldoNeto) + parseFloat(abonoABorrar.abono_total);
                const cuotasTotales = parseInt(creditoAct.num_cuotas) || 1;
                let cuotasPendientes = Math.ceil(nuevoSaldoFinal / (parseFloat(creditoAct.valor_cuota) || 1));
                if (cuotasPendientes > cuotasTotales) cuotasPendientes = cuotasTotales;

                const msjAnulacion = `=== SISTEMA ALPHA (Anulación Oficial) ===\n${fechaHoraSMS}\n\n🆔 Ref: ${refFinal} | ${creText}\n👤 Cliente: ${nombre}\n\nPor transparencia y control de auditoría, te notificamos que el siguiente abono ha sido ELIMINADO del sistema por una corrección interna.\n\n❌ Pago Anulado: #${abonoABorrar.numero_pago}\n💰 Monto Reversado: $${parseFloat(abonoABorrar.abono_total).toFixed(2)}\n📈 Saldo Restablecido: $${nuevoSaldoFinal.toFixed(2)}\n🔢 Cuotas Pendientes: ${cuotasPendientes}/${cuotasTotales}\n\nTu cuenta está protegida. Conserva este msj.\n🚫 NO RESPONDER A ESTE MENSAJE.`;

                enviarSMSAutomatico(numeroCliente, msjAnulacion);
            }
        }

        if (creditoSeleccionadoCobro.estado === 'finalizado') {
             await supabaseClient.from('creditos').update({ estado: 'activo' }).eq('id', creditoSeleccionadoCobro.id);
        }

        alert("✅ Abono borrado y respaldado con todos los detalles en la bóveda.");
        if (creditoSeleccionadoCobro) await cargarEstadoCuentaCredito(creditoSeleccionadoCobro.id);
        
    } catch (error) {
        alert("❌ Error al procesar la anulación: " + error.message);
    }
}

// -------------------------------------------------------------------------
// 📩 3. REENVIAR RECIBO DE ABONO (PROGRAMACIÓN OFICIAL)
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
        
        // 🔥 FILTRO INTELIGENTE: Extraer solo el CRE con su letra cifrada (Ej: CRE #[Ñ])
        let creText = "CRE # ?";
        const lblRef = document.getElementById('lbl-recaudacion-ref');
        if (lblRef && lblRef.innerText) {
            const match = lblRef.innerText.match(/CRE\s*#[^|]+/);
            if (match) {
                const textoCrudo = match[0].trim(); // Trae "CRE #9 [Ñ]"
                const matchLetra = textoCrudo.match(/\[.*?\]/); // Busca solo lo que está entre corchetes "[Ñ]"
                if (matchLetra) {
                    creText = `CRE #${matchLetra[0]}`; // Lo convierte a "CRE #[Ñ]"
                } else {
                    creText = textoCrudo;
                }
            }
        }

        // 5. Formateo de la fecha y hora original de ese abono
        const fPago = new Date(abono.fecha_pago);
        const fechaLarga = fPago.toLocaleDateString('es-EC', { weekday: 'long', day: '2-digit', month: '2-digit', year: '2-digit' });
        const horaFormateada = fPago.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
        const fechaHoraSMS = `${fechaLarga.charAt(0).toUpperCase() + fechaLarga.slice(1)} | ${horaFormateada}`;

        // 6. Matemática reconstructiva: Calcular el saldo y cuotas en ESE momento exacto
        const pagosHastaAqui = abonosClienteActual.filter(a => new Date(a.fecha_pago) <= fPago);
        const totalPagadoHastaAqui = pagosHastaAqui.reduce((sum, a) => sum + parseFloat(a.abono_total || 0), 0);
        
        const saldoEnEseMomento = parseFloat(creditoSeleccionadoCobro.total_pagar) - totalPagadoHastaAqui;
        const cuotasTotales = parseInt(creditoSeleccionadoCobro.num_cuotas) || 1;
        const valorDeCuota = parseFloat(creditoSeleccionadoCobro.valor_cuota) || 1;
        
        let cuotasPendientes = Math.ceil(saldoEnEseMomento / valorDeCuota);
        if (cuotasPendientes < 0) cuotasPendientes = 0;

        const metodoTxt = abono.forma_pago ? abono.forma_pago.toUpperCase() : 'EFECTIVO';

        // 7. Armado del Mensaje Comercial con el encabezado dinámico 🔥
        const msjAbono = `${encabezadoSMS}\n${fechaHoraSMS}\n\n🆔 Ref: ${refFinal} | ${creText}\n👤 Cliente: ${nombre}\n\nHola, aquí tienes el respaldo de tu abono.\n\n✅ Pago: #${numPago}\n💰 Monto: $${parseFloat(abono.abono_total).toFixed(2)}\n📊 Saldo: $${saldoEnEseMomento.toFixed(2)}\n🔢 N° de Cuotas: ${cuotasPendientes}/${cuotasTotales}\n💳 Método: ${metodoTxt}\n\nConserva este msj. ¡Gracias!\n🚫 POR FAVOR, NO RESPONDER A ESTE MENSAJE.`;

        // 8. Disparo directo a tu MacroDroid sin bloqueos
        enviarSMSAutomatico(numeroCliente, msjAbono);
        
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
// ⚡ SIMULADOR DE ENRUTAMIENTO EN VIVO (REGLA DE ORO ALPHA)
// =========================================================================
function simularEnrutamientoFlujo(valor) {
    const monto = parseFloat(valor);
    if (isNaN(monto) || monto <= 0 || !creditoSeleccionadoCobro) return;

    // 🔥 REGLA DE ORO ALPHA: La mora es pura ganancia, se suma al interés esperado
    const moraExtra = parseFloat(creditoSeleccionadoCobro.monto_mora) || 0;
    const interesFaltantePorAsegurar = (interesTotalPactado + moraExtra) - interesYaPagado;
    
    let destinoInteres = 0; let destinoCapital = 0;

    if (interesFaltantePorAsegurar > 0) {
        if (monto <= interesFaltantePorAsegurar) {
            destinoInteres = monto; destinoCapital = 0;
            document.getElementById('sim-leyenda-fase').innerHTML = `👑 FASE 1: Asegurando Utilidades ($${(interesFaltantePorAsegurar - monto).toFixed(2)} restantes)`;
            document.getElementById('sim-leyenda-fase').style.color = "#ca8a04";
        } else {
            destinoInteres = interesFaltantePorAsegurar;
            destinoCapital = monto - interesFaltantePorAsegurar;
            document.getElementById('sim-leyenda-fase').innerHTML = `🚀 FRONTERA CRUZADA! Excedente ($${destinoCapital.toFixed(2)}) repone Capital.`;
            document.getElementById('sim-leyenda-fase').style.color = "#0284c7";
        }
    } else {
        destinoInteres = 0; destinoCapital = monto;
        document.getElementById('sim-leyenda-fase').innerText = "🛡️ FASE 2: Interés blindado. Todo repone tu Capital.";
        document.getElementById('sim-leyenda-fase').style.color = "#10b981";
    }

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
        const { count } = await supabaseClient
            .from('historial_pagos')
            .select('*', { count: 'exact', head: true })
            .eq('id_credito', creditoSeleccionadoCobro.id);
        
        const numeroNuevoPago = (count || 0) + 1;

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
        // 🚀 LÓGICA INTELIGENTE DE ENVÍO DE SMS (NORMAL O DE FELICITACIÓN)
        // =================================================================
        if (enviarSMS) {
            if (!numeroCliente) {
                alert("⚠️ El SMS NO se envió: Este cliente definitivamente no tiene un número en la base de datos.");
            } else if (typeof enviarSMSAutomatico !== 'function') {
                alert("⚠️ El SMS NO se envió: El sistema no detecta la función 'enviarSMSAutomatico'.");
            } else {
                try {
                    const nombre = `${cli.nombres} ${cli.apellidos}`.toUpperCase();
                    const iN = (cli.nombres || '').trim().charAt(0);
                    const iA = (cli.apellidos || '').trim().charAt(0);
                    const u4 = (cli.cedula || '').trim().slice(-4);
                    const refFinal = `${iN}${iA}-${u4}`.toUpperCase();
                    
                    // Extraer solo el CRE con su letra cifrada (Ej: CRE #[Ñ])
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

                    const ahora = new Date();
                    const fechaLarga = ahora.toLocaleDateString('es-EC', { weekday: 'long', day: '2-digit', month: '2-digit', year: '2-digit' });
                    const horaFormateada = ahora.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
                    const fechaHoraSMS = `${fechaLarga.charAt(0).toUpperCase() + fechaLarga.slice(1)} | ${horaFormateada}`;

                    let msjSalida = "";

                    if (esCancelacionTotal) {
                        // 🏆 SMS PREMIUM DE FELICITACIONES
                        msjSalida = `=== SISTEMA ALPHA ===\n${fechaHoraSMS}\n\n🆔 Ref: ${refFinal} | ${creText}\n👤 Cliente: ${nombre}\n\n🎉 ¡CONTRATO CANCELADO AL 100%! 🎉\n\nTe notificamos de manera oficial que tu crédito ha sido liquidado exitosamente en nuestra base de datos.\n\n✅ Pago de Cierre: #${numeroNuevoPago}\n💰 Monto Recibido: $${montoInput.toFixed(2)}\n📉 Saldo Pendiente: $0.00\n📊 Récord Crediticio: EXCELENTE / IMPECABLE\n\nQueremos agradecer enormemente tu compromiso y puntualidad. ¡Tienes las puertas totalmente abiertas para tu siguiente solicitud cuando la requieras! 🚀\n\n🚫 POR FAVOR, NO RESPONDER A ESTE MENSAJE.`;
                    } else {
                        // 💳 SMS DE ABONO NORMAL
                        const cuotasTotales = parseInt(creditoSeleccionadoCobro.num_cuotas) || 1;
                        const valorDeCuota = parseFloat(creditoSeleccionadoCobro.valor_cuota) || 1;
                        let cuotasPendientes = Math.ceil(nuevoSaldo / valorDeCuota);
                        if (cuotasPendientes < 0) cuotasPendientes = 0;

                        msjSalida = `=== SISTEMA ALPHA ===\n${fechaHoraSMS}\n\n🆔 Ref: ${refFinal} | ${creText}\n👤 Cliente: ${nombre}\n\nHola, aquí tienes el respaldo de tu abono.\n\n✅ Pago: #${numeroNuevoPago}\n💰 Monto: $${montoInput.toFixed(2)}\n📉 Saldo: $${nuevoSaldo.toFixed(2)}\n🔢 Cuotas: ${cuotasPendientes}/${cuotasTotales}\n💳 Método: ${metodoPago.toUpperCase()}\n\nConserva este msj. ¡Gracias!\n🚫 POR FAVOR, NO RESPONDER A ESTE MENSAJE.`;
                    }
                    
                    await enviarSMSAutomatico(numeroCliente.toString(), msjSalida);
                    console.log("✅ SMS enviado con éxito al número: " + numeroCliente);
                } catch (errorSMS) {
                    alert(`❌ Falló el envío del SMS: ${errorSMS.message}`);
                }
            }
        }

        // 2. ACTUALIZAR ESTADO DEL CRÉDITO SI QUEDÓ LIQUIDADO
        if (esCancelacionTotal) {
            await supabaseClient
                .from('creditos')
                .update({ estado: 'finalizado' })
                .eq('id', creditoSeleccionadoCobro.id);
        }

        // =================================================================
        // 🔥 TICKET DIGITAL DINÁMICO (ESTILO WALL STREET)
        // =================================================================
        const ticketDiv = document.createElement('div');
        
        // Si el crédito se liquidó, le ponemos un borde morado de gala
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

        // Título del ticket según el estado
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
        if (typeof cambiarMetodoPago === 'function') cambiarMetodoPago('efectivo');

    } catch (err) {
        alert("Error crítico al registrar abono: " + err.message);
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
        
        // 1. EXTRAER EL CRE CIFRADO DE LA PANTALLA (Ej: CRE #[Ñ])
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

        // 2. FORMATEAR LA FECHA ORIGINAL DEL CRÉDITO
        let fechaEmisionCredito = "Fecha no disponible";
        if (creditoSeleccionadoCobro.fecha_emision) {
            const fObj = new Date(creditoSeleccionadoCobro.fecha_emision);
            const fLarga = fObj.toLocaleDateString('es-EC', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
            fechaEmisionCredito = fLarga.charAt(0).toUpperCase() + fLarga.slice(1);
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

        // --- DATOS DEL CLIENTE Y CRÉDITO ---
        doc.setDrawColor(200, 200, 200);
        doc.line(14, 38, 196, 38); // Línea separadora

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        
        // Columna Izquierda (4 líneas)
        doc.text(`Cliente: ${nombreCompleto}`, 14, 46);
        doc.text(`Cédula: ${cli.cedula}`, 14, 52);
        doc.text(`Referencia: ${creText}`, 14, 58); 
        doc.text(`Fecha de Crédito: ${fechaEmisionCredito}`, 14, 64); 
        
        // Columna Derecha (4 líneas)
        const totalPagar = parseFloat(creditoSeleccionadoCobro.total_pagar).toFixed(2);
        const saldoActual = parseFloat(creditoSeleccionadoCobro.saldoNeto).toFixed(2);
        const cuotaFija = parseFloat(creditoSeleccionadoCobro.valor_cuota).toFixed(2);
        
        // 🧮 Matemática de Cuotas Pendientes
        const cuotasTotales = parseInt(creditoSeleccionadoCobro.num_cuotas) || 1;
        let cuotasPendientes = Math.ceil(parseFloat(saldoActual) / parseFloat(cuotaFija));
        if (cuotasPendientes < 0) cuotasPendientes = 0;

        doc.text(`Total del Crédito: $${totalPagar}`, 120, 46);
        doc.text(`Valor de Cuota: $${cuotaFija}`, 120, 52);
        doc.text(`N° de Cuotas: ${cuotasTotales} (${cuotasPendientes} Pendientes)`, 120, 58); // 🔥 El toque del gerente
        
        doc.setFont(undefined, 'bold');
        doc.text(`Saldo Pendiente Actual: $${saldoActual}`, 120, 64);
        doc.setFont(undefined, 'normal');

        // --- MATEMÁTICA PARA LA TABLA HISTÓRICA ---
        let abonosOrdenados = [...abonosClienteActual].sort((a, b) => new Date(a.fecha_pago) - new Date(b.fecha_pago));
        
        let saldoEnTransito = parseFloat(creditoSeleccionadoCobro.total_pagar);
        const filasTabla = [];

        abonosOrdenados.forEach((abono) => {
            const fPago = new Date(abono.fecha_pago);
            const diaNombre = fPago.toLocaleDateString('es-EC', { weekday: 'short' }); 
            const diaNum = fPago.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' }); 
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

        // --- DIBUJAR LA TABLA ---
        doc.autoTable({
            startY: 78, // Bajamos el inicio de la tabla para que respiren las 4 líneas de arriba
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

        // --- PIE DE PÁGINA LEGAL ---
        const finalY = doc.lastAutoTable.finalY || 78;
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
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

    // 4. Montos y Cuotas
    const totalPagar = parseFloat(creditoSeleccionadoCobro.total_pagar);
    const saldo = parseFloat(creditoSeleccionadoCobro.saldoNeto);
    const cuotaFija = parseFloat(creditoSeleccionadoCobro.valor_cuota);
    const cuotasTotales = parseInt(creditoSeleccionadoCobro.num_cuotas) || 1;
    let cuotasPendientes = Math.ceil(saldo / cuotaFija);
    if (cuotasPendientes < 0) cuotasPendientes = 0;

    // 5. Historial (MÁXIMO LOS ÚLTIMOS 3 PAGOS)
    let historialTxt = "";
    if (abonosClienteActual && abonosClienteActual.length > 0) {
        let abonosOrdenados = [...abonosClienteActual].sort((a, b) => new Date(a.fecha_pago) - new Date(b.fecha_pago));
        
        let saldoEnTransito = totalPagar;
        let abonosConSaldo = abonosOrdenados.map(abono => {
            saldoEnTransito -= parseFloat(abono.abono_total);
            if (saldoEnTransito < 0) saldoEnTransito = 0;
            return { ...abono, saldoRestante: saldoEnTransito };
        });

        let ultimos3 = abonosConSaldo.slice(-3);
        
        historialTxt += `\n🧾 ÚLTIMOS MOVIMIENTOS:\n`;
        ultimos3.forEach((abono) => {
            const fPago = new Date(abono.fecha_pago);
            const diaFormato = fPago.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' }); 
            const horaFormato = fPago.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
            const montoPagado = parseFloat(abono.abono_total);
            let met = abono.forma_pago ? abono.forma_pago.toUpperCase() : 'EFECTIVO';
            if (met === 'TRANSFERENCIA') met = 'TRANSF.';
            
            historialTxt += `• N°${abono.numero_pago} | ${diaFormato} - ${horaFormato}\n  Abono: $${montoPagado.toFixed(2)} | Saldo: $${abono.saldoRestante.toFixed(2)} | ${met}\n`;
        });
        
        if (abonosConSaldo.length > 3) {
            historialTxt += `(Y ${abonosConSaldo.length - 3} pagos anteriores)\n`;
        }
    } else {
        historialTxt += `\n🧾 MOVIMIENTOS:\nSin abonos registrados.\n`;
    }

    // 6. Ensamblar Mensaje Final
    const etiqueta = cobrar ? "[ESTADO DE CTA] val $1.00\n" : "";
    const msj = `=== SISTEMA ALPHA ===\n${etiqueta}Impreso: ${fechaImpreso} a las ${horaImpreso}\n\n🆔 ${creText}\n👤 Cliente: ${cli.nombres.toUpperCase()} ${cli.apellidos.toUpperCase()}\n💳 Cédula: ${cli.cedula || 'N/A'}\n📅 Fecha Crédito: ${fechaEmisionCredito}\n\n📊 Total Crédito: $${totalPagar.toFixed(2)}\n💵 Valor Cuota: $${cuotaFija.toFixed(2)}\n📉 Saldo Pendiente: $${saldo.toFixed(2)}\n🔢 N° Cuotas: ${cuotasTotales} (${cuotasPendientes} Pendientes)\n${historialTxt}\n¡Gracias por tu confianza!\n🚫 NO RESPONDER AL MENSAJE.`;

    // 🚀 DISPARO A MACRODROID (Viajará instantáneo)
    enviarSMSAutomatico(numeroCliente, msj);
    alert("✅ Resumen enviado exitosamente a: " + numeroCliente);
}
// =========================================================================
// ⚖️ MÓDULO MAESTRO DE GESTIÓN DE MORA Y CONVENIOS (VERSIÓN DEFINITIVA)
// =========================================================================

window.cargarTablaGestionMora = async function() {
    const contenedor = document.getElementById('contenedor-tabla-mora');
    const selectorBuscador = document.getElementById('buscador-gestion-mora');
    if (!contenedor) return;
    
    // 1. CAPTURAMOS EL CLIENTE ELEGIDO EN EL SELECTOR
    const clienteSeleccionado = selectorBuscador ? selectorBuscador.value : '';

    contenedor.innerHTML = '<p style="color:#64748b; font-size:14px; text-align:center;">⏳ Escaneando cartera y calculando saldos reales...</p>';
    
    try {
        // 🔥 TRAEMOS LOS DATOS: ACTIVOS Y CONGELADOS
        const { data: creditosActivos, error } = await supabaseClient
            .from('creditos')
            .select(`id, monto_capital, total_pagar, monto_mora, saldo_pendiente, fecha_emision, tasa_interes, estado, clientes!inner(id, nombres, apellidos, cedula), historial_pagos(abono_total)`)
            .in('estado', ['activo', 'congelado'])
            .order('fecha_emision', { ascending: true });

        if (error) throw error;

        // 🌟 MAGIA NUEVA: Traemos el historial para calcular el "N° de Crédito del Cliente"
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

        if (!creditosActivos || creditosActivos.length === 0) {
            contenedor.innerHTML = `<p style="color: #10b981; font-weight: bold; text-align:center;">✨ Toda tu cartera está limpia. No hay créditos pendientes.</p>`;
            if (selectorBuscador) selectorBuscador.innerHTML = '<option value="">🌍 TODOS LOS CLIENTES ACTIVOS</option>';
            return;
        }

        // 2. LLENAR EL SELECTOR CON LOS CLIENTES (SIN REPETIR)
        if (selectorBuscador) {
            const mapClientes = new Map();
            const clientesUnicos = [];
            
            creditosActivos.forEach(cre => {
                const cli = cre.clientes;
                if (cli && cli.id && !mapClientes.has(cli.id)) {
                    mapClientes.set(cli.id, true);
                    clientesUnicos.push(cli);
                }
            });

            clientesUnicos.sort((a, b) => a.nombres.localeCompare(b.nombres));

            let opcionesHTML = '<option value="">🌍 TODOS LOS CLIENTES ACTIVOS</option>';
            clientesUnicos.forEach(cli => {
                const nombreCompleto = `${cli.nombres} ${cli.apellidos}`.toUpperCase();
                opcionesHTML += `<option value="${cli.id}">${nombreCompleto} (${cli.cedula})</option>`;
            });
            
            selectorBuscador.innerHTML = opcionesHTML;
            if (clienteSeleccionado) {
                selectorBuscador.value = clienteSeleccionado;
            }
        }

        // 3. FILTRAMOS LOS RESULTADOS SI ELEGISTE ALGO EN EL SELECTOR
        let creditosFiltrados = creditosActivos || [];
        const valorFiltro = selectorBuscador ? selectorBuscador.value : '';

        if (valorFiltro !== '') {
            creditosFiltrados = creditosFiltrados.filter(cre => cre.clientes && cre.clientes.id.toString() === valorFiltro);
        }

        if (creditosFiltrados.length === 0) {
             contenedor.innerHTML = `<p style="color: #ef4444; font-weight: bold; text-align:center;">🔍 Este cliente no tiene créditos pendientes en este momento.</p>`;
             return;
        }

        // 4. DIBUJAMOS LA TABLA CON LOS DATOS FILTRADOS Y MATEMÁTICAS EXACTAS
        let filasHTML = creditosFiltrados.map(cre => {
            const cli = cre.clientes || {};
            const nombreCliente = `${cli.nombres} ${cli.apellidos}`.toUpperCase();
            
            // ==========================================================
            // 🛡️ REFERENCIA BANCARIA Y NÚMERO DE CRÉDITO DEL CLIENTE
            // ==========================================================
            const inicialN = cli.nombres ? cli.nombres.charAt(0).toUpperCase() : '';
            const inicialA = cli.apellidos ? cli.apellidos.charAt(0).toUpperCase() : '';
            const ultimos4 = cli.cedula ? cli.cedula.slice(-4) : '0000';
            const refBancaria = `REF: ${inicialN}${inicialA}-${ultimos4}`;
            
            const esCongelado = cre.estado === 'congelado';
            const badgeCongelado = esCongelado ? `<span style="background: #e0f2fe; color: #0284c7; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-left: 8px;">🧊 CONGELADO</span>` : '';
            
            const numLocal = mapNumCreditoLocal[cre.id] || 1;
            let creCifrado = typeof cifrarNumeroCredito === 'function' ? cifrarNumeroCredito(numLocal).toUpperCase() : '';
            let etiquetaCRE = creCifrado ? `CRE #${numLocal} [${creCifrado}]` : `CRE #${numLocal}`;

            const fEmi = new Date(cre.fecha_emision);
            const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
            const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            const nombreDia = dias[fEmi.getDay()];
            const diaCap = nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1);
            const fechaTxt = `${diaCap} ${fEmi.getDate()}/${meses[fEmi.getMonth()]}/${fEmi.getFullYear()}`;

            // 🔥 MATEMÁTICA PURA Y DURA ALPHA
            const moraExtra = parseFloat(cre.monto_mora) || 0;
            const prestamoOriginal = parseFloat(cre.total_pagar) || 0;
            
            // 1. Total a Pagar Real: Préstamo original + todas las moras acumuladas
            const deudaTotalReal = prestamoOriginal + moraExtra;

            // 2. Sumamos todo el dinero que el cliente ya abonó
            const pagos = cre.historial_pagos || [];
            const totalAbonado = pagos.reduce((sum, pago) => sum + (parseFloat(pago.abono_total) || 0), 0);
            
            // 3. Saldo Neto Actual = La deuda real menos lo que ya pagó
            let saldoReal = deudaTotalReal - totalAbonado;
            if (saldoReal < 0) saldoReal = 0; 

            const tasaOriginal = parseFloat(cre.tasa_interes) || 20;

            return `
            <tr style="border-bottom: 1px solid #e2e8f0; transition: background 0.2s; ${esCongelado ? 'background: #f8fafc; border-left: 4px solid #0284c7;' : ''}" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='${esCongelado ? '#f8fafc' : 'transparent'}'">
                <td style="padding: 12px; font-size: 12px;">
                    <div style="color: #64748b; font-weight: bold; font-size: 10px; margin-bottom: 4px; letter-spacing: 0.5px;">ID: ${cre.id} | ${refBancaria}</div>
                    <span style="background: #e0f2fe; color: #0369a1; padding: 3px 6px; border-radius: 4px; font-weight: bold;">${etiquetaCRE}</span>
                </td>
                <td style="padding: 12px; font-weight: bold; font-size: 13px;">${nombreCliente} ${badgeCongelado}</td>
                <td style="padding: 12px; font-size: 12px; color: #475569;">${fechaTxt}</td>
                <td style="padding: 12px; text-align: center; font-weight: bold;">$${parseFloat(cre.monto_capital).toFixed(2)}</td>
                <td style="padding: 12px; text-align: center; color: #ca8a04; font-weight: bold;">$${deudaTotalReal.toFixed(2)}</td>
                
                <!-- 🔥 AQUÍ INYECTAMOS LA NUEVA COLUMNA DE ABONOS -->
                <td style="padding: 12px; text-align: center; color: #16a34a; font-weight: bold;">$${totalAbonado.toFixed(2)}</td>
                
                <td style="padding: 12px; text-align: center; color: #ef4444; font-weight: 900;">$${saldoReal.toFixed(2)}</td>
                <td style="padding: 12px; text-align: center;">
                    <button onclick="abrirPanelSancion(${cre.id}, '${nombreCliente.replace(/'/g, "\\'")}', ${cre.monto_capital}, ${deudaTotalReal}, ${saldoReal}, ${tasaOriginal}, '${cre.estado}', '${etiquetaCRE}', '${refBancaria}')" style="background: #0f172a; color: white; border: none; padding: 6px 12px; border-radius: 5px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        ⚙️ GESTIONAR
                    </button>
                </td>
            </tr>`;
        }).join('');

        contenedor.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
            <thead>
                <tr style="background: #f1f5f9; text-align: left; border-bottom: 2px solid #cbd5e1;">
                    <th style="padding: 12px; font-size: 12px;">N° CRÉDITO</th>
                    <th style="padding: 12px; font-size: 12px;">CLIENTE</th>
                    <th style="padding: 12px; font-size: 12px;">EMISIÓN</th>
                    <th style="padding: 12px; font-size: 12px; text-align: center;">CAPITAL INTACTO</th>
                    <th style="padding: 12px; font-size: 12px; text-align: center;">TOTAL A PAGAR</th>
                    <!-- 🔥 CABECERA DE LA NUEVA COLUMNA -->
                    <th style="padding: 12px; font-size: 12px; text-align: center;">ABONOS</th>
                    <th style="padding: 12px; font-size: 12px; text-align: center;">SALDO ACTUAL</th>
                    <th style="padding: 12px; font-size: 12px; text-align: center;">ACCIÓN</th>
                </tr>
            </thead>
            <tbody>${filasHTML}</tbody>
        </table>`;
    } catch (error) {
        contenedor.innerHTML = `<p style="color:red; text-align:center;">❌ Error: ${error.message}</p>`;
    }
};

// =========================================================================
// ⚙️ PANEL VISUAL DE SANCIONES Y CONEXIÓN A BASE DE DATOS
// =========================================================================
window.abrirPanelSancion = function(idCredito, nombreCliente, capital, total, saldo, tasaOriginal, estadoActual, etiquetaCRE, refBancaria) {
    const capitalNum = parseFloat(capital) || 1;
    const saldoNum = parseFloat(saldo) || 0;
    const interesPorcentaje = parseFloat(tasaOriginal) || 20;
    const esCongelado = estadoActual === 'congelado';
    
    // Matemática pura y dura sobre el porcentaje original
    const multaSobreCapital = capitalNum * (interesPorcentaje / 100);
    const multaSobreSaldo = saldoNum * (interesPorcentaje / 100);

    const modalId = 'modal-sancion-alpha';
    const modalPrevio = document.getElementById(modalId);
    if (modalPrevio) modalPrevio.remove();

    // BOTONES DINÁMICOS SEGÚN EL ESTADO
    const btnCapitalHTML = esCongelado 
        ? `<button disabled style="padding: 12px; background: #fca5a5; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: not-allowed; display: flex; justify-content: space-between; align-items: center;"><span>🚨 Mora s/ Capital (BLOQUEADO)</span></button>`
        : `<button onclick="aplicarMoraSobreCapital(${idCredito}, ${multaSobreCapital}, ${saldoNum})" style="padding: 12px; background: #dc2626; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.2);"><span>🚨 Mora s/ Capital</span><span style="background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 4px;">Sumar $${multaSobreCapital.toFixed(2)}</span></button>`;

    const btnSaldoHTML = esCongelado
        ? `<button disabled style="padding: 12px; background: #fdba74; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: not-allowed; display: flex; justify-content: space-between; align-items: center;"><span>⚡ Mora s/ Saldo (BLOQUEADO)</span></button>`
        : `<button onclick="aplicarMoraSobreSaldo(${idCredito}, ${multaSobreSaldo}, ${saldoNum})" style="padding: 12px; background: #ea580c; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(234, 88, 12, 0.2);"><span>⚡ Mora s/ Saldo</span><span style="background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 4px;">Sumar $${multaSobreSaldo.toFixed(2)}</span></button>`;

    const btnCongelarHTML = esCongelado
        ? `<button onclick="alternarCongelamiento(${idCredito}, 'activo')" style="padding: 12px; background: #f59e0b; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.2);"><span>🔥 Descongelar Cuenta</span><span style="background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 4px;">Reactivar recargos</span></button>`
        : `<button onclick="alternarCongelamiento(${idCredito}, 'congelado')" style="padding: 12px; background: #0284c7; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(2, 132, 199, 0.2);"><span>🧊 Congelar Cuenta</span><span style="background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 4px;">Pausar recargos</span></button>`;

    const modalHTML = `
    <div id="${modalId}" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.8); display: flex; justify-content: center; align-items: center; z-index: 9999; padding: 20px; backdrop-filter: blur(4px);">
        <div style="background: white; border-radius: 12px; width: 100%; max-width: 450px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); overflow: hidden;">
            
            <div style="background: #0f172a; padding: 20px; text-align: center;">
                <h3 style="margin: 0; color: white; font-size: 18px;">⚖️ Panel de Resolución de Cartera</h3>
                <!-- 🔥 AQUI ESTÁ EL CÓDIGO IDENTICO AL DE LA TABLA -->
                <p style="margin: 8px 0 2px 0; color: #94a3b8; font-size: 11px; font-weight: bold; letter-spacing: 0.5px;">ID: ${idCredito} | ${refBancaria}</p>
                <p style="margin: 0 0 5px 0; color: #ca8a04; font-weight: bold; font-size: 16px;">${etiquetaCRE}</p>
                <p style="margin: 5px 0 0 0; color: #f8fafc; font-size: 14px; text-transform: uppercase;">${nombreCliente}</p>
                ${esCongelado ? '<div style="margin-top: 10px; display: inline-block; background: #e0f2fe; color: #0284c7; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold;">🧊 CUENTA CONGELADA Y PROTEGIDA</div>' : ''}
            </div>

            <div style="padding: 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: #64748b; font-size: 13px; font-weight: bold;">Capital Protegido:</span>
                    <span style="color: #0f172a; font-weight: 900; font-size: 13px;">$${capitalNum.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: #64748b; font-size: 13px; font-weight: bold;">Interés del Contrato Original:</span>
                    <span style="color: #0f172a; font-weight: 900; font-size: 13px;">${interesPorcentaje}%</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 2px dashed #cbd5e1;">
                    <span style="color: #ef4444; font-weight: bold; font-size: 15px;">Saldo Pendiente Actual:</span>
                    <span style="color: #ef4444; font-weight: 900; font-size: 20px;">$${saldoNum.toFixed(2)}</span>
                </div>
            </div>

            <div style="padding: 20px; display: flex; flex-direction: column; gap: 12px;">
                ${btnCapitalHTML}
                ${btnSaldoHTML}
                ${btnCongelarHTML}
            </div>

            <div style="padding: 15px 20px; background: #f1f5f9; text-align: center;">
                <button onclick="document.getElementById('${modalId}').remove()" style="padding: 10px 25px; background: white; color: #64748b; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">Cancelar y Cerrar</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

// =========================================================================
// 🚀 INYECCIONES DIRECTAS A SUPABASE (LOS CEREBROS DE LOS BOTONES)
// =========================================================================
window.aplicarMoraSobreCapital = async function(idCredito, montoMulta, saldoActual) {
    if (!confirm(`¿Aplicar una multa de $${parseFloat(montoMulta).toFixed(2)} a este crédito?`)) return;
    try {
        // 🛑 CAMBIO CLAVE: Leemos el monto_mora y saldo_pendiente, JAMÁS pedimos el total_pagar
        const { data: credOriginal, error: errBusq } = await supabaseClient.from('creditos').select('monto_mora, saldo_pendiente').eq('id', idCredito).single();
        if (errBusq) throw errBusq;
        
        const moraAnterior = parseFloat(credOriginal.monto_mora) || 0;
        const saldoAnterior = parseFloat(credOriginal.saldo_pendiente) || parseFloat(saldoActual);
        
        const nuevaMora = moraAnterior + parseFloat(montoMulta);
        const nuevoSaldo = saldoAnterior + parseFloat(montoMulta);
        
        // 🛑 CAMBIO CLAVE: Guardamos el nuevo saldo y la mora extra. El 'total_pagar' se queda intocable.
        const { error } = await supabaseClient.from('creditos').update({ 
            saldo_pendiente: nuevoSaldo, 
            monto_mora: nuevaMora 
        }).eq('id', idCredito);
        
        if (error) throw error;
        
        alert("✅ Multa sobre capital aplicada. El saldo ha aumentado de forma segura.");
        document.getElementById('modal-sancion-alpha').remove();
        cargarTablaGestionMora();
    } catch (error) { alert("❌ Error al procesar: " + error.message); }
};

window.aplicarMoraSobreSaldo = async function(idCredito, montoMulta, saldoActual) {
    if (!confirm(`¿Aplicar una multa de $${parseFloat(montoMulta).toFixed(2)} a este crédito?`)) return;
    try {
        // 🛑 CAMBIO CLAVE: Leemos el monto_mora y saldo_pendiente, JAMÁS pedimos el total_pagar
        const { data: credOriginal, error: errBusq } = await supabaseClient.from('creditos').select('monto_mora, saldo_pendiente').eq('id', idCredito).single();
        if (errBusq) throw errBusq;
        
        const moraAnterior = parseFloat(credOriginal.monto_mora) || 0;
        const saldoAnterior = parseFloat(credOriginal.saldo_pendiente) || parseFloat(saldoActual);
        
        const nuevaMora = moraAnterior + parseFloat(montoMulta);
        const nuevoSaldo = saldoAnterior + parseFloat(montoMulta);
        
        // 🛑 CAMBIO CLAVE: Guardamos el nuevo saldo y la mora extra. El 'total_pagar' se queda intocable.
        const { error } = await supabaseClient.from('creditos').update({ 
            saldo_pendiente: nuevoSaldo, 
            monto_mora: nuevaMora 
        }).eq('id', idCredito);
        
        if (error) throw error;
        
        alert("✅ Multa sobre saldo aplicada. El saldo ha aumentado de forma segura.");
        document.getElementById('modal-sancion-alpha').remove();
        cargarTablaGestionMora();
    } catch (error) { alert("❌ Error al procesar: " + error.message); }
};

window.alternarCongelamiento = async function(idCredito, nuevoEstado) {
    const accionTexto = nuevoEstado === 'congelado' ? 'CONGELAR' : 'DESCONGELAR';
    if (!confirm(`¿Estás seguro de ${accionTexto} esta cuenta?`)) return;
    try {
        const { error } = await supabaseClient.from('creditos').update({ estado: nuevoEstado }).eq('id', idCredito);
        if (error) throw error;
        
        const mensaje = nuevoEstado === 'congelado' 
            ? "🧊 Cuenta congelada exitosamente. Protegida contra recargos." 
            : "🔥 Cuenta descongelada exitosamente. Lista para nuevas multas.";
        alert(mensaje);
        
        document.getElementById('modal-sancion-alpha').remove();
        cargarTablaGestionMora();
    } catch (error) { alert("❌ Error al procesar: " + error.message); }
};


// =========================================================================
// 🤖 ROBOT DEL DASHBOARD (ACTUALIZA NÚMEROS EN TIEMPO REAL)
// =========================================================================
// =========================================================================
// 🤖 ROBOT DEL DASHBOARD (VERSIÓN DEFINITIVA: ASISTENTE DE VENCIMIENTOS)
// =========================================================================
window.despertarRobotDashboard = async function() {
    try {
        // 1. FECHA Y HORA ACTUAL
        const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const fechaHoy = new Date();
        let fechaString = fechaHoy.toLocaleDateString('es-ES', opcionesFecha);
        const txtFecha = document.getElementById('dash-fecha');
        if (txtFecha) txtFecha.innerText = fechaString.charAt(0).toUpperCase() + fechaString.slice(1);

        // 2. CONSULTAR CAPITAL GENERAL (EFECTIVO + BANCOS)
        const { data: cajas } = await supabaseClient.from('cajas_capital').select('saldo_actual');
        if (cajas && cajas.length > 0) {
            let capitalTotalGeneral = 0;
            cajas.forEach(caja => capitalTotalGeneral += parseFloat(caja.saldo_actual || 0));
            if(document.getElementById('dash-caja')) document.getElementById('dash-caja').innerText = `$${capitalTotalGeneral.toFixed(2)}`;
        }

        // 3. TRAER CRÉDITOS (AHORA INCLUYE FECHAS Y PERFIL DE COBRO) 🔥
        const { data: creditos } = await supabaseClient
            .from('creditos')
            .select('id, monto_capital, total_pagar, monto_mora, valor_cuota, total_interes, estado, fecha_emision, num_cuotas, clientes(nombres, apellidos, perfil_cobro)')
            .in('estado', ['activo', 'congelado']);

        if (creditos && creditos.length > 0) {
            let gananciaProyectada = 0;
            let cuentasCongeladas = 0;
            let metaHoy = 0;
            let deudaTotalEsperada = 0;
            let idsActivos = [];
            let alertasVencimiento = [];

            creditos.forEach(c => {
                idsActivos.push(c.id);
                
                if (c.estado === 'congelado') cuentasCongeladas++;
                if (c.estado === 'activo') metaHoy += parseFloat(c.valor_cuota || 0);
                gananciaProyectada += parseFloat(c.total_interes || 0);
                deudaTotalEsperada += parseFloat(c.total_pagar || 0) + parseFloat(c.monto_mora || 0);

                // 🔥 LÓGICA DE FECHAS PARA EL ASISTENTE DE VENCIMIENTOS
                if (c.estado === 'activo') {
                    // Si el crédito no tiene fecha de emisión guardada, la inventamos como hoy para que no de error
                    const fechaEmision = c.fecha_emision ? new Date(c.fecha_emision) : new Date();
                    
                    // Calculamos la fecha de vencimiento sumando los días (cuotas) a la fecha de emisión
                    const diasCredito = parseInt(c.num_cuotas) || 30; // Asume 30 si no hay dato
                    const fechaVence = new Date(fechaEmision);
                    fechaVence.setDate(fechaVence.getDate() + diasCredito);
                    
                    // Calculamos la diferencia en días exactos entre hoy y el vencimiento
                    // Hacemos que ambas fechas arranquen a las 00:00:00 para evitar errores de horas
                    const hoyLimpiado = new Date(fechaHoy.getFullYear(), fechaHoy.getMonth(), fechaHoy.getDate());
                    const venceLimpiado = new Date(fechaVence.getFullYear(), fechaVence.getMonth(), fechaVence.getDate());
                    
                    const diferenciaTiempo = venceLimpiado.getTime() - hoyLimpiado.getTime();
                    const diferenciaDias = Math.round(diferenciaTiempo / (1000 * 3600 * 24));
                    const perfilCliente = c.clientes?.perfil_cobro || 'Normal';

                    // Si vence hoy (0), o ya venció hace menos de 10 días (-1 a -10)
                    if (diferenciaDias <= 0 && diferenciaDias >= -10) {
                        const esHoy = diferenciaDias === 0;
                        const diasAtraso = Math.abs(diferenciaDias);
                        
                        alertasVencimiento.push({
                            nombre: `${c.clientes?.nombres} ${c.clientes?.apellidos}`,
                            emisionTxt: fechaEmision.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
                            venceTxt: fechaVence.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
                            diasAtraso: diasAtraso,
                            esHoy: esHoy,
                            perfil: perfilCliente
                        });
                    }
                }
            });

            // 4. RESTAR LOS ABONOS PARA EL CAPITAL EN LA CALLE
            let totalAbonado = 0;
            if(idsActivos.length > 0) {
                const { data: pagos } = await supabaseClient
                    .from('historial_pagos')
                    .select('abono_total')
                    .in('id_credito', idsActivos);
                if (pagos) pagos.forEach(p => totalAbonado += parseFloat(p.abono_total || 0));
            }
            const capitalEnLaCalle = deudaTotalEsperada - totalAbonado;

            // 5. IMPRIMIR INDICADORES
            if(document.getElementById('dash-capital-calle')) document.getElementById('dash-capital-calle').innerText = `$${capitalEnLaCalle.toFixed(2)}`;
            if(document.getElementById('dash-congeladas')) document.getElementById('dash-congeladas').innerText = cuentasCongeladas;
            if(document.getElementById('dash-ganancia')) document.getElementById('dash-ganancia').innerText = `$${gananciaProyectada.toFixed(2)}`;
            if(document.getElementById('dash-meta-hoy')) document.getElementById('dash-meta-hoy').innerText = `$${metaHoy.toFixed(2)}`;

            // 6. 🔥 DIBUJAR LAS ALERTAS INTELIGENTES (Reemplaza a los morosos)
            let htmlAlertas = '';
            if (alertasVencimiento.length > 0) {
                htmlAlertas = alertasVencimiento.map(alerta => {
                    const colorBorde = alerta.esHoy ? '#eab308' : '#ef4444';
                    const titulo = alerta.esHoy ? '¡VENCE HOY!' : `Vencido hace ${alerta.diasAtraso} días`;
                    const badgePerfil = alerta.perfil === 'Social' 
                        ? `<span style="background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">🛡️ SOCIAL (Exento)</span>`
                        : `<span style="background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">⚠️ NORMAL (Aplica Mora)</span>`;

                    return `
                    <div style="margin-bottom:12px; background: #f8fafc; border-left: 4px solid ${colorBorde}; padding: 12px; border-radius: 6px; font-size: 12px; line-height: 1.5;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                            <strong style="color: #0f172a; font-size: 13px;">${alerta.nombre.toUpperCase()}</strong>
                            <span style="color: ${colorBorde}; font-weight: 900; font-size: 11px;">${titulo}</span>
                        </div>
                        <div style="color: #475569; margin-bottom: 5px;">
                            El crédito de ${alerta.nombre.toUpperCase()} prestado el <b>${alerta.emisionTxt}</b> finaliza el <b>${alerta.venceTxt}</b>.
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #64748b; font-size: 11px;">(10 días de gracia. Regla: Mitad+1)</span>
                            ${badgePerfil}
                        </div>
                    </div>`;
                }).join('');
            } else {
                htmlAlertas = `
                <div style="text-align:center; padding:30px 10px;">
                    <div style="font-size: 40px; margin-bottom: 10px;">✅</div>
                    <p style="color:#10b981; font-weight:bold; margin: 0;">¡Día despejado, Gerente Miguel!</p>
                    <p style="color:#64748b; font-size: 12px; margin-top: 5px;">No hay créditos que se venzan hoy ni en periodo de gracia.</p>
                </div>`;
            }
            // Inyectamos en el nuevo div de vencimientos
            if(document.getElementById('dash-lista-vencimientos')) document.getElementById('dash-lista-vencimientos').innerHTML = htmlAlertas;
            
            // 7. LOS MEJORES PAGADORES
            if(document.getElementById('dash-lista-buenos')) document.getElementById('dash-lista-buenos').innerHTML = '<p style="text-align:center; color:#334155; padding:20px 0; font-size: 13px;">⭐ Analizando historial de pagos...</p>';
        }

    } catch (error) {
        console.error("Error al despertar el robot:", error);
    }
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
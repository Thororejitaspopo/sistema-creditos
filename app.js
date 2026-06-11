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

/* ==========================================================================
   3. ARRANCADORES AUTOMÁTICOS AL INICIAR LA HOJA
   ========================================================================== */
// Detecta cuando el navegador termina de cargar el HTML para encender el sistema
document.addEventListener('DOMContentLoaded', () => {
    // Llama inmediatamente a la función que descarga los datos de la nube
    cargarClientes();
});

/* ==========================================================================
   4. LOGÍSTICA ADMINISTRATIVA: FUNCIONES DE LA BASE DE DATOS
   ========================================================================== */

/**
 * Consulta la base de datos remota para bajar la lista de clientes actualizados.
 */
async function cargarClientes() {
    // Captura el contenedor donde se listan las tarjetas de clientes
    const contenedor = document.getElementById('lista-clientes');
    // Inyecta un texto temporal de carga para avisar al usuario que el sistema está trabajando
    contenedor.innerHTML = '<p style="text-align:center; color:#64748b; font-size:13px;">Cargando base de datos...</p>';

    // Realiza la petición asíncrona a Supabase para traer los registros ordenados por ID descendente
    const { data: clientes, error } = await supabaseClient
        .from('clientes')
        .select('*')
        .order('id', { ascending: false });

    // Verifica si la conexión con la nube falló para reportar el error en pantalla
    if (error) {
        // Pinta el mensaje de error con letras rojas de peligro
        contenedor.innerHTML = `<p style="text-align:center; color:var(--rojo-peligro); font-size:13px;">Error: ${error.message}</p>`;
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
                <button class="btn-accion btn-credito" title="Crear Crédito">💳</button>
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
    // 1. CAPTURA DE ELEMENTOS HTML (Nodos completos para aplicar las clases CSS)
    // -------------------------------------------------------------------------
    const inputNombres = document.getElementById('cli-nombres');
    const inputApellidos = document.getElementById('cli-apellidos');
    const inputCedula = document.getElementById('cli-cedula');
    const inputWhatsapp = document.getElementById('cli-whatsapp');
    const inputCorreo = document.getElementById('cli-correo');
    const inputSector = document.getElementById('cli-sector');
    const inputRuta = document.getElementById('cli-ruta');

    // -------------------------------------------------------------------------
    // 2. LIMPIEZA DE ERRORES: Removemos la clase roja antes de validar
    // -------------------------------------------------------------------------
    inputNombres.classList.remove('campo-error');
    inputApellidos.classList.remove('campo-error');
    inputCedula.classList.remove('campo-error');
    inputWhatsapp.classList.remove('campo-error');
    inputCorreo.classList.remove('campo-error');
    if(inputSector) inputSector.classList.remove('campo-error');
    if(inputRuta) inputRuta.classList.remove('campo-error');

    // Extraemos los valores limpios de espacios
    const nombres = inputNombres.value.trim();
    const apellidos = inputApellidos.value.trim();
    const cedula = inputCedula.value.trim();
    const whatsapp = inputWhatsapp.value.trim();
    const correo = inputCorreo.value.trim();
    
    // Captura el ID del garante seleccionado
    const garanteSeleccionado = document.getElementById('cli-garante').value;
    const garante_id = garanteSeleccionado ? parseInt(garanteSeleccionado) : null;

    // Captura los datos de ubicación, rutas y nivel del cliente
    const sector = inputSector ? inputSector.value : '';
    const ruta = inputRuta ? inputRuta.value : '';
    const direccion = document.getElementById('cli-direccion').value.trim();
    const referencia = document.getElementById('cli-referencia').value.trim();
    const tel_referencia = document.getElementById('cli-tel-referencia').value.trim();
    const observaciones = document.getElementById('cli-observaciones').value.trim();
    const nivel = document.getElementById('cli-nivel').value;
    const limite_creditos = parseInt(document.getElementById('cli-limite').value) || 2;

    // -------------------------------------------------------------------------
    // 3. VALIDACIÓN DE CAMPOS VACÍOS: Pinta de rojo campos obligatorios faltantes
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
    // 4. VALIDACIÓN DE FORMATO DE CORREO
    // -------------------------------------------------------------------------
    const patronCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!patronCorreo.test(correo)) {
        inputCorreo.classList.add('campo-error');
        alert("⚠️ Error: El formato del correo electrónico ingresado no es válido.");
        return;
    }

    // -------------------------------------------------------------------------
    // 5. VALIDACIÓN DE LONGITUD DE CÉDULA
    // -------------------------------------------------------------------------
    if (cedula.length < 10) {
        inputCedula.classList.add('campo-error');
        alert("⚠️ La cédula ingresada está incompleta. Debe tener al menos 10 dígitos.");
        return;
    }

    // -------------------------------------------------------------------------
    // 6. VALIDACIÓN DE DUPLICADOS LOCALES
    // -------------------------------------------------------------------------
    const cedulaExiste = listaClientesGlobal.some(c => c.cedula === cedula && c.id !== idEditando);
    if (cedulaExiste) {
        inputCedula.classList.add('campo-error');
        alert("⛔ Error: Este número de Cédula / RUC ya está registrado con otro cliente.");
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
    // 7. GENERACIÓN AUTOMÁTICA DE FECHA Y HORA
    // -------------------------------------------------------------------------
    const ahora = new Date();
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

    // -------------------------------------------------------------------------
    // 8. SUBIDA DE ARCHIVOS A SUPABASE STORAGE
    // -------------------------------------------------------------------------
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
        
        const { data, error: errorPerfil } = await supabaseClient.storage
            .from('fotos_clientes')
            .upload(nombreArchivo, archivoPerfil);

        if (errorPerfil) {
            alert("⚠️ Error al subir la foto de perfil: " + errorPerfil.message);
            return; 
        }
        
        const { data: urlPublica } = supabaseClient.storage.from('fotos_clientes').getPublicUrl(nombreArchivo);
        urlFotoCliente = urlPublica.publicUrl; 
    }

    if (inputFotoCedula && inputFotoCedula.files.length > 0) {
        const archivoCedula = inputFotoCedula.files[0]; 
        const nombreArchivoCed = `cedula_${cedula}_${Date.now()}.${archivoCedula.name.split('.').pop()}`; 
        
        const { data, error: errorCedula } = await supabaseClient.storage
            .from('fotos_clientes')
            .upload(nombreArchivoCed, archivoCedula);

        if (errorCedula) {
            alert("⚠️ Error al subir la foto de la cédula: " + errorCedula.message);
            return;
        }

        const { data: urlPublicaCed } = supabaseClient.storage.from('fotos_clientes').getPublicUrl(nombreArchivoCed);
        urlFotoCedula = urlPublicaCed.publicUrl; 
    }

    // -------------------------------------------------------------------------
    // 9. EMPAQUETADO DE DATOS FINALES (¡Corregido garante_id!)
    // -------------------------------------------------------------------------
    const datosCliente = { 
        nombres, apellidos, cedula, whatsapp, correo, 
        sector, ruta, direccion, referencia, 
        tel_referencia, observaciones, nivel, limite_creditos,
        garante_id, // <-- ¡Corregido aquí! Antes decía gerante_id
        fecha_ingreso: idEditando === null ? fechaRegistro : (listaClientesGlobal.find(c => c.id === idEditando)?.fecha_ingreso || fechaRegistro), 
        usuario_registro: 'Administrador',
        url_foto_cliente: urlFotoCliente, 
        url_foto_cedula: urlFotoCedula    
    };

    // -------------------------------------------------------------------------
    // 10. ENVÍO DE DATOS A SUPABASE (Inserción o Actualización)
    // -------------------------------------------------------------------------
    if (idEditando === null) {
        const { data, error } = await supabaseClient
            .from('clientes')
            .insert([datosCliente]);

        if (error) {
            alert("Error de Registro: " + error.message);
        } else {
            alert("¡Cliente guardado con éxito en Sistema Alpha V5 con sus documentos!");
            limpiarFormularioClientes();
            cargarClientes();
        }
    } else {
        const { data, error } = await supabaseClient
            .from('clientes')
            .update(datosCliente)
            .eq('id', idEditando);

        if (error) {
            alert("Error al actualizar: " + error.message);
        } else {
            alert("¡Cambios del cliente actualizados correctamente en la nube!");
            limpiarFormularioClientes();
            cargarClientes();
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
 * Remueve registros del sistema permanentemente usando la ID.
 */
async function eliminarCliente(id) {
    // Despliega una advertencia de seguridad nativa consultando la intención del usuario
    if (confirm("¿Seguro que deseas eliminar este cliente del sistema permanentemente?")) {
        // Lanza la orden de eliminación filtrando rigurosamente por la ID del cliente
        const { error } = await supabaseClient
            .from('clientes')
            .delete()
            .eq('id', id);

        // Valida si ocurrió algún fallo de red o permisos con la base remota
        if (error) {
            alert("Error al eliminar: " + error.message);
        } else {
            // Si el cliente eliminado era el mismo que se estaba editando, limpia el formulario
            if(idClienteEditando === id) {
                limpiarFormularioClientes();
            }
            // Recarga la lista desde la nube para actualizar la interfaz en tiempo real
            cargarClientes();
        }
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
 * Altera la visibilidad de los paneles del software según el botón seleccionado del menú.
 */
function cambiarModulo(idModulo) {
    // 1. Remueve la clase activa de todos los bloques
    document.querySelectorAll('.modulo-contenido').forEach(mod => mod.classList.remove('active'));
    document.querySelectorAll('.btn-menu').forEach(btn => btn.classList.remove('active'));
    
    // 2. Añade la clase activa al módulo solicitado
    // OJO: Asegúrate que tu div en HTML sea <div id="mod-capital" ...> 
    // Si tu div tiene id="modulo-capital", cámbialo aquí a `modulo-${idModulo}`
    document.getElementById(`mod-${idModulo}`).classList.add('active');
    
    if(window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add('active');
    }

    // 3. Diccionario de títulos
    const titulos = {
        'inicio': ['Bienvenido, Administrador', 'Resumen general del estado de tu negocio.'],
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
        'eliminar': ['Auditoría Estricta', 'Eliminación controlada de transacciones erróneas.']
    };

    document.getElementById('titulo-panel').innerText = titulos[idModulo][0];
    document.getElementById('subtitulo-panel').innerText = titulos[idModulo][1];

    // 4. Lógica de activación específica
    if (idModulo === 'creditos') {
        setTimeout(() => { aplicarTasaAlAbrirModulo(); }, 50);
    }

    // --- AQUÍ ESTÁ LO QUE ME PEDISTE: EL DISPARADOR DE CAPITAL ---
    if (idModulo === 'capital') {
        inicializarModuloCapital();
    }
}



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
// 6. MOTOR DEL MÓDULO DE CAPITAL (SISTEMA ALPHA V5)
// =========================================================================

/**
 * CARGAR SALDOS EN VIVO Y LLENAR EL SELECTOR DE CAJAS
 * Conecta con Supabase, descarga los saldos reales de la bóveda,
 * calcula los totales por tipo y llena el combobox del formulario.
 */
async function inicializarModuloCapital() {
    try {
        // 1. CONEXIÓN CORREGIDA: Traemos las cajas usando 'supabaseClient'
        const { data: cajas, error } = await supabaseClient
            .from('cajas_capital')
            .select('*');

        if (error) throw error;

        // 2. VALIDACIÓN: Verificamos si el HTML cuenta con el selector listo en pantalla
        const selector = document.getElementById('cap-caja-destino');
        if (!selector) {
            alert("Error del HTML: No se encontró el elemento id='cap-caja-destino'. Revisa el módulo en tu index.html");
            return;
        }

        // 3. LIMPIEZA: Dejamos el selector vacío con su opción informativa por defecto
        selector.innerHTML = '<option value="" selected disabled>-- Seleccione la Caja --</option>';

        // 4. CONTROL: Si la tabla de la base de datos no tiene registros aún
        if (!cajas || cajas.length === 0) {
            alert("Aviso: Las tablas existen en Supabase pero no hay cajas registradas.");
            return;
        }

        let totalEfectivo = 0;
        let totalBancos = 0;
        let totalCobradores = 0;

        // 5. PROCESAMIENTO: Iteramos los datos de Supabase para acumular dinero y fabricar las opciones
        cajas.forEach(caja => {
            if (caja.tipo === 'efectivo') totalEfectivo += parseFloat(caja.saldo_actual || 0);
            if (caja.tipo === 'banco') totalBancos += parseFloat(caja.saldo_actual || 0);
            if (caja.tipo === 'cobrador') totalCobradores += parseFloat(caja.saldo_actual || 0);

            // Añadimos cada caja disponible dentro del selector desplegable
            const option = document.createElement('option');
            option.value = caja.id;
            option.textContent = caja.nombre_caja;
            selector.appendChild(option);
        });

        // 6. INYECCIÓN VISUAL: Mostramos los montos consolidados en las tarjetas de la interfaz
        document.getElementById('saldo-efectivo-txt').textContent = `$${totalEfectivo.toFixed(2)}`;
        document.getElementById('saldo-bancos-txt').textContent = `$${totalBancos.toFixed(2)}`;
        document.getElementById('saldo-cobradores-txt').textContent = `$${totalCobradores.toFixed(2)}`;

    } catch (error) {
        console.error('Error al cargar la bóveda:', error.message);
        // Alerta informativa si la red o Supabase deniega la solicitud
        alert('Supabase rechazó la lectura de capital: ' + error.message);
    }
}

/**
 * PROCESAR E INYECTAR EL DINERO REAL A LA BÓVEDA
 * Captura el monto del formulario, inserta el registro en el historial
 * de movimientos y actualiza el saldo de la caja seleccionada.
 */
async function procesarIngresoCapital() {
    // 1. CAPTURA: Obtenemos los valores que el administrador digitó en pantalla
    const cajaId = document.getElementById('cap-caja-destino').value;
    const montoInput = document.getElementById('cap-monto').value;
    const concepto = document.getElementById('cap-concepto').value.trim();

    // 2. AUDITORÍA INTERNA: Frenamos el envío si faltan campos obligatorios
    if (!cajaId || !montoInput || !concepto) {
        alert('Por favor, completa todos los campos para registrar el movimiento.');
        return;
    }

    const monto = parseFloat(montoInput);

    try {
        // 3. HISTORIAL: Agregamos la auditoría del movimiento en la tabla 'historial_capital'
        const { error: errorHistorial } = await supabaseClient
            .from('historial_capital')
            .insert([{ caja_id: parseInt(cajaId), monto: monto, concepto: concepto }]);

        if (errorHistorial) throw errorHistorial;

        // 4. LECTURA SÍNCRONA: Consultamos el saldo actual para efectuar el cálculo exacto
        const { data: caja, error: errorFetch } = await supabaseClient
            .from('cajas_capital')
            .select('saldo_actual')
            .eq('id', cajaId)
            .single();

        if (errorFetch) throw errorFetch;

        // Sumamos el capital entrante al dinero que ya custodiaba la caja
        const nuevoSaldo = parseFloat(caja.saldo_actual) + monto;

        // 5. ACTUALIZACIÓN: Guardamos el nuevo balance finalizado en Supabase
        const { error: errorUpdate } = await supabaseClient
            .from('cajas_capital')
            .update({ saldo_actual: nuevoSaldo })
            .eq('id', cajaId);

        if (errorUpdate) throw errorUpdate;

        // 6. CONCLUSIÓN: Limpiamos el formulario e informamos del éxito
        alert('¡Capital inyectado con éxito en la bóveda!');
        document.getElementById('cap-monto').value = '';
        document.getElementById('cap-concepto').value = '';

        // 7. SINCRONIZACIÓN: Forzamos la recarga de saldos en pantalla de inmediato
        await inicializarModuloCapital();

    } catch (error) {
        console.error('Error en la transacción:', error.message);
        alert('No se pudo procesar la inyección de capital de manera segura.');
    }
}
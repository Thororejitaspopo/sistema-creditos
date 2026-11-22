 // =========================================================
    // 🚀 VARIABLES GLOBALES BLINDADAS
    // =========================================================
    var windowPagosGlobal = [];
    var windowInteresTotalPactado = 0;
    var windowInteresYaPagado = 0;
    var abonosClienteActual = []; 
    var paginaActualAbonos = 1;
    var ABONOS_POR_PAGINA = 4;  

    // =========================================================
    // 🖥️ CONTROL DE NAVEGACIÓN
    // =========================================================
    function abrirModulo(modulo) {
        window.scrollTo(0, 0);
        document.getElementById('vista-inicio').style.display = 'none';
        document.getElementById('vista-modulos').style.display = 'none';
        
        if (modulo === 'inicio') {
            document.getElementById('vista-inicio').style.display = 'block';
        } 
        else if (modulo === 'perfil') {
            const vistaModulos = document.getElementById('vista-modulos');
            vistaModulos.style.display = 'block';
            vistaModulos.innerHTML = 
                '<div class="seccion-titulo" style="margin-top: 30px;">Mi Perfil y Resumen</div>' +
                '<div style="margin: 20px; background: #e0f2fe; border: 1px solid #7dd3fc; border-radius: 16px; padding: 15px; text-align: center;">' +
                '  <span class="icono-grande" style="font-size: 40px;">💼</span>' +
                '  <h3 style="color: #0369a1; margin: 10px 0;">Dashboard Gerencial</h3>' +
                '  <span class="texto-btn" style="color: #0c4a6e; font-size: 13px;">Aquí cargaremos los valores de Caja Matriz y Capital en la Calle.</span>' +
                '</div>' +
                '<div style="margin: 30px 20px;">' +
                '  <button onclick="cerrarSesion()" style="width: 100%; background: #ef4444; color: white; border: none; padding: 15px; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(239,68,68,0.3);">🚪 Cerrar Sesión</button>' +
                '</div>';
        }
        else if (modulo === 'pago') {
            const vistaModulos = document.getElementById('vista-modulos');
            vistaModulos.style.display = 'block';
            
            vistaModulos.innerHTML = `
                <div class="seccion-titulo" style="margin-top: 25px;">💵 Registrar Cobro</div>

                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; margin: 0 20px 15px 20px; text-align: left; padding: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
                    <label style="font-size: 12px; font-weight: bold; color: var(--texto-claro); margin-bottom: 8px; display: block;">1. Seleccionar Cliente</label>
                    
                    <select id="filtro-sector-recaudacion" onchange="cargarListaClientesMovil()" style="width: 100%; padding: 14px 10px; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 10px; background: #f8fafc; outline: none; font-size: 14px;">
                        <option value="">🌎 TODOS LOS SECTORES</option>
                        <option value="Sector 1">📍 Sector 1 (San Camilo)</option>
                        <option value="Sector 2">📍 Sector 2 (San Cristóbal)</option>
                        <option value="Sector 3">📍 Sector 3 (Venus del Río Quevedo)</option>
                        <option value="Sector 4">📍 Sector 4 (Nicolás Infante Díaz)</option>
                        <option value="Sector 5">📍 Sector 5 (Guayacán)</option>
                        <option value="Sector 6">📍 Sector 6 (Siete de Octubre)</option>
                        <option value="Sector 7">📍 Sector 7 (24 de Mayo)</option>
                        <option value="Sector 8">📍 Sector 8 (Viva Alfaro)</option>
                        <option value="Sector 9">📍 Sector 9 (Ruta del Río)</option>
                        <option value="Sector 10">📍 Sector 10 (Zona Periférica)</option>
                    </select>

                    <select id="selector-cliente-recaudacion" style="width: 100%; padding: 14px 10px; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 10px; background: white; outline: none; font-size: 14px; font-weight: bold;">
                        <option value="">-- Cliente --</option>
                    </select>
                    
                    <button onclick="buscarCreditoMovil()" onmousedown="this.style.transform='scale(0.96)'" onmouseup="this.style.transform='scale(1)'" onmouseleave="this.style.transform='scale(1)'" ontouchstart="this.style.transform='scale(0.96)'" ontouchend="this.style.transform='scale(1)'" style="width: 100%; padding: 14px; background: var(--primario); color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 6px rgba(2, 132, 199, 0.3); transition: transform 0.1s;">🔍 Buscar Cuenta</button>
                </div>

                <div id="contenedor-multicredito" style="display: none; margin: 0 20px 15px 20px; padding: 15px; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 16px;">
                    <label style="font-size: 12px; font-weight: bold; color: #b91c1c; display: block; margin-bottom: 8px;">⚠️ Tiene múltiples créditos:</label>
                    <select id="selector-multicredito" onchange="cargarEstadoCuentaCreditoMovil(this.value)" style="width: 100%; padding: 12px; border: 1px solid #f87171; border-radius: 8px; background: white; font-weight: bold; font-size: 13px;"></select>
                </div>

                <div id="recaudacion-espera-msg" style="text-align: center; padding: 20px; color: #94a3b8;">
                    <span style="font-size: 40px; display: block; margin-bottom: 10px;">💳</span>
                    <p style="font-size: 13px; margin:0;">Busque un cliente arriba.</p>
                </div>

                <div id="panel-recaudacion-activo" style="display: none;">
                    
                    <!-- PANEL ESTÁTICO DE CLIENTE -->
                    <div style="background: white; margin: 0 20px 15px 20px; text-align: left; padding: 15px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
                        <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 15px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 10px;">
                            <span id="lbl-recaudacion-ref" style="color: #0284c7; font-size: 11px; font-weight: bold;">REF: --- | CRÉDITO #---</span>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="font-size: 14px;">🗂️</span>
                                <span id="lbl-recaudacion-fecha-emision" style="font-size: 11px; color: #475569; font-weight: 600;">---</span>
                            </div>
                        </div>
                        
                        <h3 id="lbl-recaudacion-cliente" style="margin: 0 0 4px 0; font-size: 18px; font-weight: 900; color: var(--texto-oscuro);">CLIENTE</h3>
                        <p id="lbl-recaudacion-cedula" style="margin: 0 0 15px 0; font-size: 13px; color: var(--texto-claro);">Cédula: ---</p>
                        
                        <div id="contenedor-banderas-recaudacion"></div>
                        
                        <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px; line-height: 1.4;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="color: var(--texto-oscuro); white-space: nowrap; display: flex; align-items: center; gap: 6px;"><span style="font-size: 14px;">💵</span> Cuota:</div>
                                <div id="lbl-recaudacion-cuota" style="text-align: right; font-weight: 600; color: var(--texto-oscuro); white-space: nowrap;">$0.00</div>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="color: var(--texto-oscuro); white-space: nowrap; display: flex; align-items: center; gap: 6px;"><span style="font-size: 14px;">🔄</span> Pago:</div>
                                <div id="lbl-recaudacion-frecuencia" style="text-align: right; font-weight: 600; color: var(--texto-oscuro); white-space: nowrap;">---</div>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="color: var(--texto-oscuro); white-space: nowrap; display: flex; align-items: center; gap: 6px;"><span style="font-size: 14px;">📊</span> Total:</div>
                                <div id="lbl-recaudacion-total" style="text-align: right; font-weight: 600; color: #0284c7; white-space: nowrap;">$0.00</div>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="color: var(--texto-oscuro); white-space: nowrap; display: flex; align-items: center; gap: 6px;"><span style="font-size: 14px;">🔢</span> Cuotas:</div>
                                <div id="lbl-recaudacion-num-cuotas" style="text-align: right; white-space: nowrap;">--</div>
                            </div>
                        </div>
                        
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end;">
                            <div style="color: var(--texto-oscuro); display: flex; align-items: center; gap: 6px; white-space: nowrap;"><span style="font-size: 16px;">📉</span> <span style="font-size: 14px; font-weight: bold;">Saldo Neto:</span></div>
                            <div id="lbl-recaudacion-saldo" style="text-align: right;">$0.00</div>
                        </div>
                    </div>

                    <!-- PANEL ESTÁTICO DE COBRO -->
                    <div style="background: white; margin: 0 20px 15px 20px; text-align: left; padding: 15px; border-radius: 16px; border: 2px solid #fef08a; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
                        <h4 style="margin: 0 0 15px 0; font-size: 15px; color: var(--texto-oscuro); border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                            <span>📥</span> Registro de Cobro Efectivo
                        </h4>

                        <label style="font-size: 12px; font-weight: bold; color: var(--texto-claro); display: block; margin-bottom: 8px;">Monto Recaudado Hoy ($):</label>
                        <div style="position: relative; margin-bottom: 15px;">
                            <input type="number" id="monto-cobro-input" step="0.01" oninput="simularEnrutamientoFlujo(this.value)" style="width: 100%; padding: 15px 40px 15px 15px; border: 2px solid var(--primario); border-radius: 8px; font-size: 24px; font-weight: 900; color: var(--texto-oscuro); text-align: left; box-sizing: border-box; outline:none; background:#f8fafc;" placeholder="0.00">
                        </div>
                        
                        <label style="font-size: 10px; font-weight: bold; color: var(--texto-claro); display: block; margin-bottom: 8px; text-transform: uppercase;">Forma de Pago:</label>
                        <div style="display: flex; margin-bottom: 20px; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; background: #f8fafc;">
                            <button id="btn-metodo-efectivo" onclick="cambiarMetodoPago('efectivo')" style="flex: 1; padding: 12px 5px; background: #4f46e5; color: white; border: none; font-weight: bold; font-size: 12px; transition:0.3s; display: flex; justify-content: center; align-items: center; gap: 6px;">
                                <span>💵</span> EFECTIVO
                            </button>
                            <button id="btn-metodo-transf" onclick="cambiarMetodoPago('transferencia')" style="flex: 1; padding: 12px 5px; background: transparent; color: var(--texto-claro); border: none; font-weight: bold; font-size: 12px; transition:0.3s; display: flex; justify-content: center; align-items: center; gap: 6px;">
                                <span>🏦</span> DEPÓSITO / TRANSF.
                            </button>
                        </div>

                        <div id="caja-detalles-transferencia" style="display: none; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #cbd5e1; margin-bottom: 20px;">
                            <label style="font-size: 10px; font-weight: bold; color: #0284c7; display: block; margin-bottom: 8px;">DETALLES DE LA TRANSFERENCIA:</label>
                            <select id="select-banco" onchange="unirDetallesTransferencia()" style="width: 100%; padding: 12px; margin-bottom: 10px; border-radius: 6px; border: 1px solid #0284c7; font-size: 13px; outline: none; background:white;">
                                <option value="">-- Seleccione Banco --</option>
                                <option value="Pichincha">Banco Pichincha</option>
                                <option value="Guayaquil">Banco Guayaquil</option>
                                <option value="Produbanco">Produbanco</option>
                                <option value="Pacifico">Banco del Pacífico</option>
                                <option value="Otro">Otro Banco</option>
                            </select>
                            <input type="text" id="input-referencia" oninput="unirDetallesTransferencia()" placeholder="Ej: Ref: 123456" style="width: 100%; padding: 12px; border-radius: 6px; border: 1px solid #0284c7; font-size: 13px; box-sizing: border-box; outline: none;">
                            <input type="hidden" id="input-detalles-banco" value="">
                        </div>
                        <input type="hidden" id="metodo-pago-seleccionado" value="efectivo">

                        <div style="margin-bottom: 20px; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px; background: white;">
                            <label style="font-size: 10px; font-weight: bold; color: #d97706; display: flex; align-items: center; gap: 6px; margin-bottom: 10px; text-transform: uppercase;">
                                <span>⚡</span> DESTINO DE LOS FONDOS:
                            </label>
                            <div style="display: flex; gap: 10px;">
                                <div style="flex: 1; background: #fffdf5; border: 2px solid #fef08a; padding: 10px; border-radius: 8px; text-align: center;">
                                    <div style="font-size: 11px; color: #92400e; font-weight: bold; margin-bottom: 4px; display: flex; justify-content: center; align-items: center; gap: 4px;">
                                        <span>💼</span> Interés
                                    </div>
                                    <div id="sim-boveda-interes" style="font-size: 18px; font-weight: 900; color: #d97706;">$0.00</div>
                                </div>
                                <div style="flex: 1; background: #f0f9ff; border: 2px solid #bae6fd; padding: 10px; border-radius: 8px; text-align: center;">
                                    <div style="font-size: 11px; color: #075985; font-weight: bold; margin-bottom: 4px; display: flex; justify-content: center; align-items: center; gap: 4px;">
                                        <span>🏦</span> Capital
                                    </div>
                                    <div id="sim-boveda-capital" style="font-size: 18px; font-weight: 900; color: #0284c7;">$0.00</div>
                                </div>
                            </div>
                            <div id="sim-leyenda-fase" style="display: none; margin-top: 10px; background: #fef9c3; color: #a16207; font-size: 11px; font-weight: bold; text-align: center; padding: 6px; border-radius: 4px; border: 1px solid #fde047;"></div>
                        </div>

                        <!-- 🔥 EL BOTÓN CONECTADO AL MOTOR 🔥 -->
                        <button onclick="procesarCobroOficial()" 
                                onmousedown="this.style.transform='scale(0.96)'; this.style.boxShadow='0 2px 4px rgba(16,185,129,0.5)';" 
                                onmouseup="this.style.transform='scale(1)'; this.style.boxShadow='0 8px 16px rgba(16,185,129,0.4)';" 
                                onmouseleave="this.style.transform='scale(1)'; this.style.boxShadow='0 8px 16px rgba(16,185,129,0.4)';" 
                                ontouchstart="this.style.transform='scale(0.96)'; this.style.boxShadow='0 2px 4px rgba(16,185,129,0.5)';" 
                                ontouchend="this.style.transform='scale(1)'; this.style.boxShadow='0 8px 16px rgba(16,185,129,0.4)';" 
                                style="width: 100%; padding: 18px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; border-radius: 12px; font-weight: 900; font-size: 16px; text-transform: uppercase; box-shadow: 0 8px 16px rgba(16,185,129,0.4); display: flex; justify-content: center; align-items: center; gap: 8px; transition: transform 0.1s ease, box-shadow 0.1s ease;">
                            <span style="font-size: 20px;">✅</span> Confirmar e Inyectar Abono
                        </button>
                    </div>

                   <!-- 🔥 PANEL ESTÁTICO DE HISTORIAL PREMIUM (CON BOTONES VIP) 🔥 -->
                    <div style="background: white; margin: 0 20px 20px 20px; text-align: left; padding: 15px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; flex-wrap: wrap; gap: 10px;">
                            <h4 style="margin: 0; font-size: 15px; color: var(--texto-oscuro); display: flex; align-items: center; gap: 5px;">
                                <span>🧾</span> Abonos Registrados
                            </h4>
                            <div style="display: flex; gap: 5px;">
                                <!-- Botón PDF (Opcional en móvil, pero mantenemos la estructura) -->
                                <button onclick="generarEstadoCuentaPDF()" style="background: #dc2626; color: white; border: none; padding: 6px 10px; border-radius: 5px; font-size: 11px; font-weight: bold; box-shadow: 0 2px 4px rgba(220,38,38,0.2); cursor: pointer;">
                                  📄 PDF Historial
                                </button>
                                <!-- Botón SMS Activo -->
                                <button onclick="enviarResumenSMS()" style="background: #0ea5e9; color: white; border: none; padding: 6px 10px; border-radius: 5px; font-size: 11px; font-weight: bold; box-shadow: 0 2px 4px rgba(14,165,233,0.2); cursor: pointer; display: flex; align-items: center; gap: 4px;">
                                    <span>📲</span> Enviar Resumen SMS
                                </button>
                            </div>
                        </div>
                        <div id="lista-historial-abonos" style="max-height: 500px; overflow-y: auto; font-size: 12px; padding-right: 5px;">
                            <div style="text-align: center; color: #94a3b8; padding: 10px;">Cargando pagos...</div>
                        </div>
                    </div>
                </div>
            `; 
            
            requestAnimationFrame(() => {
                setTimeout(() => cargarListaClientesMovil(), 150); 
            });
        }
       else if (modulo === 'matriz') {
            const vistaModulos = document.getElementById('vista-modulos');
            vistaModulos.style.display = 'block';
            
            vistaModulos.innerHTML = `
                <style>
                    /* 🔥 MAGIA DEL CARRUSEL (UN CLIENTE A LA VEZ) 🔥 */
                    .contenedor-carrusel {
                        display: flex !important;
                        flex-direction: row !important;
                        overflow-x: auto !important;
                        overflow-y: hidden !important;
                        scroll-snap-type: x mandatory !important;
                        gap: 15px;
                        padding-bottom: 10px;
                        -webkit-overflow-scrolling: touch;
                    }
                    /* Ocultamos la barra gris fea de scroll para que parezca App nativa */
                    .contenedor-carrusel::-webkit-scrollbar {
                        display: none; 
                    }
                    /* Forzamos a que cada cliente ocupe casi toda la pantalla y se "imante" al centro */
                    .contenedor-carrusel > div {
                        min-width: 90% !important;
                        max-width: 90% !important;
                        scroll-snap-align: center !important;
                        margin-bottom: 0 !important;
                    }
                </style>
                
                <div style="padding: 20px; padding-bottom: 90px; background-color: var(--fondo); min-height: 100vh;">
                    
                    <!-- Encabezado Matriz -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px;">
                        <div>
                            <h2 style="margin: 0; font-size: 22px; color: var(--texto-oscuro); font-weight: 900;">¡Buenos días, Miguel! ☀️</h2>
                            <div id="lbl-fecha-matriz" style="color: #64748b; font-size: 12px; margin-top: 4px; font-weight: 600;">Cargando fecha...</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="background: #fef08a; color: #a16207; font-size: 10px; font-weight: 900; padding: 4px 8px; border-radius: 20px; margin-bottom: 6px; border: 1px solid #fde047;">🎯 Meta Hoy: <span id="lbl-meta-hoy">$0.00</span></div>
                            <button onclick="alert('Función de Moras en desarrollo para móvil')" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; box-shadow: 0 2px 4px rgba(239,68,68,0.3); display: flex; align-items: center; gap: 4px; margin-left: auto;">
                                ⚡ Aplicar Moras
                            </button>
                        </div>
                    </div>

                    <!-- 4 TARJETAS FINANCIERAS (Grid 2x2) -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 25px;">
                        <div style="background: white; border-radius: 12px; padding: 15px; border-top: 4px solid #10b981; box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; flex-direction: column; justify-content: center;">
                            <div style="font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 8px; display: flex; align-items: center; gap: 4px;"><span>💵</span> CAJA MATRIZ</div>
                            <div id="monto-caja-matriz" style="font-size: 20px; font-weight: 900; color: #1e293b;">$0.00</div>
                        </div>
                        <div style="background: white; border-radius: 12px; padding: 15px; border-top: 4px solid #ef4444; box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; flex-direction: column; justify-content: center;">
                            <div style="font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 8px; display: flex; align-items: center; gap: 4px;"><span>📈</span> CAP EN CALLE</div>
                            <div id="monto-capital-calle" style="font-size: 20px; font-weight: 900; color: #1e293b;">$0.00</div>
                        </div>
                        <div style="background: white; border-radius: 12px; padding: 15px; border-top: 4px solid #3b82f6; box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; flex-direction: column; justify-content: center;">
                            <div style="font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 8px; display: flex; align-items: center; gap: 4px;"><span>🧊</span> CONGELADAS</div>
                            <div id="num-cuentas-congeladas" style="font-size: 20px; font-weight: 900; color: #1e293b;">0</div>
                        </div>
                        <div style="background: white; border-radius: 12px; padding: 15px; border-top: 4px solid #8b5cf6; box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; flex-direction: column; justify-content: center;">
                            <div style="font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 8px; display: flex; align-items: center; gap: 4px;"><span>💎</span> GANANCIA</div>
                            <div id="monto-ganancia-proyectada" style="font-size: 20px; font-weight: 900; color: #1e293b;">$0.00</div>
                        </div>
                    </div>

                    <!-- CONTENEDOR RUTA DE COBRO -->
                    <div style="background: white; border-radius: 16px; border: 1px solid #10b981; margin-bottom: 20px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
                        <div style="background: #f0fdf4; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #10b981;">
                            <h3 style="margin: 0; font-size: 15px; color: #047857; display: flex; align-items: center; gap: 6px;">
                                <span>🗺️</span> Ruta de Cobro (Hoy)
                            </h3>
                            <span id="contador-ruta" style="background: #10b981; color: white; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold;">0 Visitas</span>
                        </div>
                        
                        <div style="padding: 15px 0 15px 15px;">
                            <div style="padding-right: 15px;">
                                <input type="text" id="buscador-ruta-movil" onkeyup="filtrarListaMovil('lista-ruta-movil', this.value)" placeholder="🔍 Buscar cliente..." style="width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc; font-size: 13px; outline: none; margin-bottom: 15px; box-sizing: border-box;">
                            </div>
                            
                            <!-- 🔥 LISTA CARRUSEL 🔥 -->
                            <div id="lista-ruta-movil" class="contenedor-carrusel">
                                <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px; min-width: 100%;">⏳ Calculando ruta...</div>
                            </div>
                        </div>
                    </div>

                    <!-- CONTENEDOR ALERTAS DE CARTERA -->
                    <div style="background: white; border-radius: 16px; border: 1px solid #ef4444; margin-bottom: 20px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
                        <div style="background: #fef2f2; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ef4444;">
                            <h3 style="margin: 0; font-size: 15px; color: #b91c1c; display: flex; align-items: center; gap: 6px;">
                                <span>🔔</span> Alertas de Cartera
                            </h3>
                            <span id="contador-alertas" style="background: #fca5a5; color: #7f1d1d; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold;">0 Vencidos</span>
                        </div>
                        
                        <div style="padding: 15px 0 15px 15px;">
                            <div style="padding-right: 15px;">
                                <input type="text" id="buscador-alertas-movil" onkeyup="filtrarListaMovil('lista-alertas-movil', this.value)" placeholder="🔍 Buscar vencido..." style="width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc; font-size: 13px; outline: none; margin-bottom: 15px; box-sizing: border-box;">
                            </div>
                            
                            <!-- 🔥 LISTA CARRUSEL 🔥 -->
                            <div id="lista-alertas-movil" class="contenedor-carrusel">
                                <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px; min-width: 100%;">⏳ Analizando cartera...</div>
                            </div>
                        </div>
                    </div>

                </div>
            `;

            const ahora = new Date();
            const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            document.getElementById('lbl-fecha-matriz').innerText = `${dias[ahora.getDay()]}, ${ahora.getDate()} de ${meses[ahora.getMonth()]} de ${ahora.getFullYear()}`;

            requestAnimationFrame(() => {
                setTimeout(() => {
                    if (typeof cargarMatrizGlobalMovil === 'function') {
                        cargarMatrizGlobalMovil();
                    }
                }, 100);
            });
        }

else if (modulo === 'gestion_mora' || modulo === 'mora') {
            const vistaModulos = document.getElementById('vista-modulos');
            vistaModulos.style.display = 'block';
            vistaModulos.innerHTML = `
                <div style="padding: 20px; padding-bottom: 90px; background-color: var(--fondo); min-height: 100vh;">
                    <div style="margin-bottom: 15px;">
                        <h2 style="margin: 0; font-size: 20px; color: var(--texto-oscuro); font-weight: 900;">⚖️ Gestión y Mora</h2>
                        <div style="color: #64748b; font-size: 12px; margin-top: 4px;">Control de cartera, sanciones y convenios</div>
                    </div>

                    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; margin-bottom: 16px; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
                        <label style="font-size: 11px; font-weight: bold; color: #64748b; display: block; margin-bottom: 6px;">📍 Filtrar Cartera:</label>
                        <select id="buscador-gestion-mora-movil" onchange="cargarTablaGestionMoraMovil()" style="width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc; font-size: 13px; font-weight: bold; outline: none;">
                            <option value="">🌍 TODOS LOS CLIENTES ACTIVOS</option>
                        </select>
                    </div>

                    <div id="contenedor-tabla-mora-movil">
                        <div style="text-align:center; padding:25px; color:#94a3b8; font-size:13px;">⏳ Cargando cartera...</div>
                    </div>
                </div>
            `;
            requestAnimationFrame(() => {
                setTimeout(() => {
                    if (typeof cargarTablaGestionMoraMovil === 'function') cargarTablaGestionMoraMovil();
                }, 100);
            });
        }
else if (modulo === 'credito' || modulo === 'creditos') {
            const vistaModulos = document.getElementById('vista-modulos');
            vistaModulos.style.display = 'block';
            const tasaDefecto = typeof tasaBaseSistema !== 'undefined' ? tasaBaseSistema : 20;

            vistaModulos.innerHTML = `
                <div style="padding: 20px; padding-bottom: 90px; background-color: var(--fondo); min-height: 100vh;">
                    <div style="margin-bottom: 15px;">
                        <h2 style="margin: 0; font-size: 20px; color: var(--texto-oscuro); font-weight: 900;">💳 Crear Crédito</h2>
                        <div id="cred-fecha-servidor-movil" style="color: #64748b; font-size: 11px; margin-top: 4px; font-weight: 600;">Cargando reloj...</div>
                    </div>

                    <!-- FORMULARIO DE CRÉDITO -->
                    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 15px; margin-bottom: 16px; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
                        <label style="font-size: 11px; font-weight: bold; color: #475569; display: block; margin-bottom: 6px;">1. Cliente:</label>
                        <input type="text" id="cred-cliente-buscar-movil" oninput="filtrarClientesCreditoMovil(this.value)" placeholder="🔍 Escribe para buscar cliente..." style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc; font-size: 13px; margin-bottom: 8px; box-sizing: border-box;">
                        <select id="cred-cliente-id-movil" style="width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; background: white; font-size: 13px; font-weight: bold; margin-bottom: 14px;">
                            <option value="">-- Seleccione un cliente activo --</option>
                        </select>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;">
                            <div>
                                <label style="font-size: 11px; font-weight: bold; color: #475569; display: block; margin-bottom: 5px;">2. Monto ($):</label>
                                <input type="text" inputmode="decimal" id="cred-monto-movil" oninput="calcularProyeccionCreditoMovil()" placeholder="Ej: 100" style="width: 100%; padding: 12px; border: 2px solid #0284c7; border-radius: 8px; font-size: 16px; font-weight: 900; box-sizing: border-box;">
                            </div>
                            <div>
                                <label style="font-size: 11px; font-weight: bold; color: #475569; display: block; margin-bottom: 5px;">3. Interés (%):</label>
                                <input type="number" id="cred-tasa-interes-movil" value="${tasaDefecto}" oninput="calcularProyeccionCreditoMovil()" style="width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 16px; font-weight: bold; box-sizing: border-box;">
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;">
                            <div>
                                <label style="font-size: 11px; font-weight: bold; color: #475569; display: block; margin-bottom: 5px;">4. Modalidad:</label>
                                <select id="cred-modalidad-movil" style="width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc; font-size: 12px; font-weight: bold;">
                                    <option value="Diario">📅 Cobro Diario (Lun a Sáb)</option>
                                    <option value="Semanal">📅 Cobro Semanal</option>
                                    <option value="Quincenal">📅 Cobro Quincenal</option>
                                    <option value="Mensual">📅 Cobro Mensual</option>
                                </select>
                            </div>
                            <div>
                                <label style="font-size: 11px; font-weight: bold; color: #475569; display: block; margin-bottom: 5px;">5. N° Cuotas:</label>
                                <input type="number" id="cred-cuotas-movil" value="30" min="1" oninput="calcularProyeccionCreditoMovil()" style="width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 16px; font-weight: bold; box-sizing: border-box;">
                            </div>
                        </div>

                        <label style="font-size: 11px; font-weight: bold; color: #475569; display: block; margin-bottom: 5px;">6. Forma de Entrega (Caja):</label>
                        <select id="cred-forma-entrega-movil" style="width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc; font-size: 13px; font-weight: bold; margin-bottom: 16px;">
                            <option value="">-- Seleccione forma de entrega --</option>
                        </select>

                        <!-- TABLERO NEGRO DE PROYECCIÓN -->
                        <div style="background: #0f172a; color: white; border-radius: 12px; padding: 14px; margin-bottom: 16px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; text-align: center;">
                            <div>
                                <div style="font-size: 9px; color: #94a3b8; font-weight: bold;">CUOTA</div>
                                <div id="lbl-cuota-valor-movil" style="font-size: 16px; font-weight: 900; color: #38bdf8;">$0.00</div>
                            </div>
                            <div>
                                <div style="font-size: 9px; color: #94a3b8; font-weight: bold;">INTERÉS</div>
                                <div id="lbl-interes-total-movil" style="font-size: 16px; font-weight: 900; color: #facc15;">$0.00</div>
                            </div>
                            <div>
                                <div style="font-size: 9px; color: #94a3b8; font-weight: bold;">TOTAL</div>
                                <div id="lbl-pagar-total-movil" style="font-size: 16px; font-weight: 900; color: #4ade80;">$0.00</div>
                            </div>
                        </div>

                        <button onclick="guardarNuevoCreditoMovil()" style="width: 100%; padding: 15px; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: white; border: none; border-radius: 10px; font-weight: 900; font-size: 15px; box-shadow: 0 4px 10px rgba(2,132,199,0.3);">
                            ✅ Aprobar y Desembolsar Crédito
                        </button>
                    </div>

                    <!-- HISTORIAL DE CRÉDITOS -->
                    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 15px; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
                        <h3 style="margin: 0 0 10px 0; font-size: 15px; color: #1e293b;">📋 Créditos Recientes</h3>
                        <input type="text" id="buscador-creditos-movil" onkeyup="buscarCreditoEnVivoMovil()" placeholder="🔍 Buscar por nombre o cédula..." style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc; font-size: 13px; margin-bottom: 12px; box-sizing: border-box;">
                        <div id="lista-creditos-movil"></div>
                    </div>
                </div>
            `;

            requestAnimationFrame(() => {
                setTimeout(() => {
                    if (typeof iniciarRelojCreditoMovil === 'function') iniciarRelojCreditoMovil();
                    if (typeof cargarClientesDropdownMovil === 'function') cargarClientesDropdownMovil();
                    if (typeof cargarSaldosEnSelectorCreditoMovil === 'function') cargarSaldosEnSelectorCreditoMovil();
                    if (typeof cargarHistorialCreditosMovil === 'function') cargarHistorialCreditosMovil();
                }, 100);
            });
        }

else if (modulo === 'depurar' || modulo === 'papelera' || modulo === 'eliminar') {
            const vistaModulos = document.getElementById('vista-modulos');
            vistaModulos.style.display = 'block';

            vistaModulos.innerHTML = `
                <div style="padding: 16px; padding-bottom: 90px; background-color: var(--fondo); min-height: 100vh;">
                    
                    <!-- ENCABEZADO EJECUTIVO -->
                    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; border-radius: 16px; padding: 18px; margin-bottom: 14px; box-shadow: 0 6px 15px rgba(15,23,42,0.18);">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                            <span style="font-size: 24px;">🗑️</span>
                            <div>
                                <h2 style="margin: 0; font-size: 18px; font-weight: 900; letter-spacing: 0.3px;">Centro de Depuración</h2>
                                <div style="color: #94a3b8; font-size: 11px;">Auditoría estricta y restauración de registros</div>
                            </div>
                        </div>
                        <input type="text" id="input-buscador-global-papelera-movil" onkeyup="filtrarPapeleraGlobalMovil()" placeholder="🔍 Buscar por nombre, cédula o # de crédito..." style="width: 100%; margin-top: 10px; padding: 11px 14px; border: none; border-radius: 10px; background: rgba(255,255,255,0.95); color: #0f172a; font-size: 13px; box-sizing: border-box; outline: none;">
                    </div>

                    <!-- LAS 5 BÓVEDAS VISIBLES EN CUADRÍCULA -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px;">
                        <button class="btn-tab-papelera-movil" data-cat="creditos" onclick="cargarPapeleraMovil('creditos')" style="padding: 11px 8px; background: #10b981; color: white; border: none; border-radius: 10px; font-weight: bold; font-size: 12px; box-shadow: 0 2px 5px rgba(16,185,129,0.25);">💸 Créditos Anulados</button>
                        <button class="btn-tab-papelera-movil" data-cat="clientes" onclick="cargarPapeleraMovil('clientes')" style="padding: 11px 8px; background: #0284c7; color: white; border: none; border-radius: 10px; font-weight: bold; font-size: 12px; box-shadow: 0 2px 5px rgba(2,132,199,0.25);">👥 Clientes Archivados</button>
                        <button class="btn-tab-papelera-movil" data-cat="pagos_eliminados" onclick="cargarPapeleraMovil('pagos_eliminados')" style="padding: 11px 8px; background: #f59e0b; color: white; border: none; border-radius: 10px; font-weight: bold; font-size: 12px; box-shadow: 0 2px 5px rgba(245,158,11,0.25);">🛡️ Bóveda Pagos</button>
                        <button class="btn-tab-papelera-movil" data-cat="finalizados" onclick="cargarPapeleraMovil('finalizados')" style="padding: 11px 8px; background: #8b5cf6; color: white; border: none; border-radius: 10px; font-weight: bold; font-size: 12px; box-shadow: 0 2px 5px rgba(139,92,246,0.25);">🏆 Créditos Pagados</button>
                        <button class="btn-tab-papelera-movil" data-cat="personal" onclick="cargarPapeleraMovil('personal')" style="grid-column: span 2; padding: 11px 8px; background: #475569; color: white; border: none; border-radius: 10px; font-weight: bold; font-size: 12px; box-shadow: 0 2px 5px rgba(71,85,105,0.25);">👔 Personal Inactivo (Cobradores y Supervisores)</button>
                    </div>

                    <div id="contenedor-papelera-movil"></div>
                </div>
            `;

            requestAnimationFrame(() => {
                setTimeout(() => {
                    if (typeof cargarPapeleraMovil === 'function') cargarPapeleraMovil('creditos');
                }, 100);
            });
        }

else if (modulo === 'clientes' || modulo === 'cliente') {
            const vistaModulos = document.getElementById('vista-modulos');
            vistaModulos.style.display = 'block';

            const estiloLabel = 'display:block; font-size:11px; font-weight:700; color:#475569; margin-bottom:5px;';
            const estiloInput = 'width:100%; padding:11px 12px; border:1px solid #cbd5e1; border-radius:8px; font-size:13px; color:#0f172a; background:#ffffff; box-sizing:border-box; outline:none;';
            const estiloTarjeta = 'background:white; border:1px solid #e2e8f0; border-radius:14px; padding:16px; margin-bottom:16px; box-shadow:0 2px 8px rgba(15,23,42,0.04);';
            const estiloTituloBloque = 'font-size:12px; font-weight:900; color:#2563eb; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid #f1f5f9; padding-bottom:10px; margin:0 0 14px 0;';

            vistaModulos.innerHTML = `
                <div style="padding: 16px; padding-bottom: 95px; background-color: var(--fondo); min-height: 100vh;">
                    
                    <div style="margin-bottom: 16px;">
                        <h2 style="margin: 0; font-size: 21px; color: #0f172a; font-weight: 900;">Gestión de Clientes</h2>
                        <div style="color: #64748b; font-size: 12px; margin-top: 2px;">Fichas técnicas y registro de usuarios.</div>
                    </div>

                    <!-- ===================================================== -->
                    <!-- BLOQUE 1: PERSONAL Y IDENTIFICACIÓN                   -->
                    <!-- ===================================================== -->
                    <div style="${estiloTarjeta}">
                        <h3 style="${estiloTituloBloque}">PERSONAL Y IDENTIFICACIÓN</h3>

                        <div style="display: grid; grid-template-columns: 1fr 1.6fr; gap: 10px; margin-bottom: 12px;">
                            <div>
                                <label style="${estiloLabel}">ID Sistema</label>
                                <input type="text" id="cli-id-auto-movil" value="AUTO" readonly style="width:100%; padding:11px 12px; border:1px dashed #cbd5e1; border-radius:8px; font-size:13px; font-weight:800; color:#64748b; background:#f8fafc; box-sizing:border-box;">
                            </div>
                            <div>
                                <label style="${estiloLabel}">Nombres</label>
                                <input type="text" id="cli-nombres-movil" placeholder="Ej: JUAN CARLOS" style="${estiloInput}">
                            </div>
                        </div>

                        <div style="margin-bottom: 12px;">
                            <label style="${estiloLabel}">Apellidos</label>
                            <input type="text" id="cli-apellidos-movil" placeholder="Ej: PÉREZ MORA" style="${estiloInput}">
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                            <div>
                                <label style="${estiloLabel}">Cédula / RUC</label>
                                <input type="tel" id="cli-cedula-movil" placeholder="Ej: 120XXXXXXX" style="${estiloInput}">
                            </div>
                            <div>
                                <label style="${estiloLabel}">WhatsApp</label>
                                <input type="tel" id="cli-whatsapp-movil" placeholder="Ej: 09XXXXXXXX" maxlength="10" style="${estiloInput}">
                            </div>
                        </div>

                        <div style="margin-bottom: 12px;">
                            <label style="${estiloLabel}">Correo Electrónico</label>
                            <input type="email" id="cli-correo-movil" placeholder="juan@gmail.com" style="${estiloInput}">
                        </div>

                        <div style="margin-bottom: 12px;">
                            <label style="${estiloLabel}">Garante / Referido (Clientes Guardados en Sistema)</label>
                            <select id="cli-garante-movil" style="${estiloInput} background:#f8fafc;">
                                <option value="">🚫 Sin Garante / Cliente Directo</option>
                            </select>
                        </div>

                        <div>
                            <label style="${estiloLabel}">Perfil / Castigo de Mora</label>
                            <select id="cli-perfil-mora-movil" style="${estiloInput} border:1.5px solid #0284c7; font-weight:700;">
                                <option value="Normal">🟢 Mora NORMAL (Multar al vencer)</option>
                                <option value="Social">🛡️ Perfil SOCIAL (Inmune a Mora)</option>
                            </select>
                        </div>
                    </div>

                    <!-- ===================================================== -->
                    <!-- BLOQUE 2: UBICACIÓN Y LOGÍSTICA DE RUTA               -->
                    <!-- ===================================================== -->
                    <div style="${estiloTarjeta}">
                        <h3 style="${estiloTituloBloque}">UBICACIÓN Y LOGÍSTICA DE RUTA</h3>

                        <div style="margin-bottom: 12px;">
                            <label style="${estiloLabel}">Sector (Quevedo)</label>
                            <select id="cli-sector-movil" style="${estiloInput} background:#f8fafc;">
                                <option value="">-- Seleccione un Sector --</option>
                                <option value="Sector 1 (San Camilo)">📍 Sector 1 (San Camilo)</option>
                                <option value="Sector 2 (San Cristóbal)">📍 Sector 2 (San Cristóbal)</option>
                                <option value="Sector 3 (Venus del Río Quevedo)">📍 Sector 3 (Venus del Río Quevedo)</option>
                                <option value="Sector 4 (Nicolás Infante Díaz)">📍 Sector 4 (Nicolás Infante Díaz)</option>
                                <option value="Sector 5 (Guayacán)">📍 Sector 5 (Guayacán)</option>
                                <option value="Sector 6 (Siete de Octubre)">📍 Sector 6 (Siete de Octubre)</option>
                                <option value="Sector 7 (24 de Mayo)">📍 Sector 7 (24 de Mayo)</option>
                                <option value="Sector 8 (Viva Alfaro)">📍 Sector 8 (Viva Alfaro)</option>
                                <option value="Sector 9 (Ruta del Río)">📍 Sector 9 (Ruta del Río)</option>
                                <option value="Sector 10 (Zona Periférica)">📍 Sector 10 (Zona Periférica)</option>
                            </select>
                        </div>

                        <div style="margin-bottom: 12px;">
                            <label style="${estiloLabel}">Ruta de Cobro</label>
                            <input type="text" id="cli-ruta-movil" list="rutas-sugeridas-movil" placeholder="-- Seleccione una Ruta --" style="${estiloInput}">
                            <datalist id="rutas-sugeridas-movil">
                                <option value="Ruta Centro"><option value="Ruta 1"><option value="Ruta 2"><option value="Ruta 3"><option value="Ruta 4"><option value="Ruta 5">
                            </datalist>
                        </div>

                        <div style="margin-bottom: 12px;">
                            <label style="${estiloLabel}">Dirección Exacta</label>
                            <input type="text" id="cli-direccion-movil" placeholder="Ej: AV. QUITO Y CALLE 12" style="${estiloInput}">
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                            <div>
                                <label style="${estiloLabel}">Referencia Física</label>
                                <input type="text" id="cli-referencia-movil" placeholder="Ej: JUNTO A LA FARMACIA" style="${estiloInput}">
                            </div>
                            <div>
                                <label style="${estiloLabel}">Teléfono Referencia</label>
                                <input type="tel" id="cli-tel-referencia-movil" placeholder="Ej: 09XXXXXXXX" style="${estiloInput}">
                            </div>
                        </div>

                        <div>
                            <label style="${estiloLabel}">Observaciones de Ruta</label>
                            <textarea id="cli-observaciones-movil" rows="2" placeholder="Ej: COBRAR SOLO LOS SÁBADOS POR LA MAÑANA" style="${estiloInput} resize:vertical;"></textarea>
                        </div>
                    </div>

                    <!-- ===================================================== -->
                    <!-- BLOQUE 3: INFORMACIÓN FINANCIERA                      -->
                    <!-- ===================================================== -->
                    <div style="${estiloTarjeta}">
                        <h3 style="${estiloTituloBloque}">INFORMACIÓN FINANCIERA</h3>

                        <div style="display: grid; grid-template-columns: 1.6fr 1fr; gap: 10px;">
                            <div>
                                <label style="${estiloLabel}">Nivel de Cliente</label>
                                <select id="cli-nivel-movil" onchange="actualizarLimiteMovil()" style="${estiloInput} background:#f8fafc;">
                                    <option value="🥉 Bronce(Nuevo)">🥉 Bronce(Nuevo)</option>
                                    <option value="🥈 Plata(Cumplidor)">🥈 Plata(Cumplidor)</option>
                                    <option value="🥇 Oro(Excelente)">🥇 Oro(Excelente)</option>
                                    <option value="💎 Platino(Vip)">💎 Platino(Vip)</option>
                                    <option value="👑 Diamante(Inversionista)">👑 Diamante(Inversionista)</option>
                                </select>
                            </div>
                            <div>
                                <label style="${estiloLabel}">Límite de Créditos Activos</label>
                                <input type="number" id="cli-limite-movil" value="2" min="1" style="${estiloInput} font-weight:900; text-align:center;">
                            </div>
                        </div>
                    </div>

                    <!-- ===================================================== -->
                    <!-- BLOQUE 4: DOCUMENTACIÓN DIGITAL                       -->
                    <!-- ===================================================== -->
                    <div style="${estiloTarjeta}">
                        <h3 style="${estiloTituloBloque}">DOCUMENTACIÓN DIGITAL</h3>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px;">
                                <label style="${estiloLabel}">Foto del Cliente</label>
                                <input type="file" id="cli-foto-perfil-movil" accept="image/*" style="width:100%; font-size:11px; color:#475569;">
                            </div>
                            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px;">
                                <label style="${estiloLabel}">Foto de la Cédula</label>
                                <input type="file" id="cli-foto-cedula-movil" accept="image/*" style="width:100%; font-size:11px; color:#475569;">
                            </div>
                        </div>
                    </div>

                    <!-- BOTÓN PRINCIPAL DE REGISTRO -->
                    <div style="display: flex; gap: 10px; margin-bottom: 22px;">
                        <button id="btn-guardar-cliente-movil" onclick="registrarClienteMovil()" style="flex:1; padding:15px; background:linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color:white; border:none; border-radius:10px; font-weight:900; font-size:14px; box-shadow:0 4px 12px rgba(37,99,235,0.3);">💾 REGISTRAR CLIENTE ALPHA</button>
                        <button onclick="limpiarFormularioClientesMovil()" title="Limpiar formulario" style="padding:15px 16px; background:white; color:#475569; border:1px solid #cbd5e1; border-radius:10px; font-weight:bold;">🧹</button>
                    </div>

                    <!-- ===================================================== -->
                    <!-- BLOQUE 5: CLIENTES REGISTRADOS EN SISTEMA             -->
                    <!-- ===================================================== -->
                    <div style="${estiloTarjeta}">
                        <h3 style="${estiloTituloBloque}">CLIENTES REGISTRADOS EN SISTEMA</h3>
                        <input type="text" id="input-buscar-cliente-movil" onkeyup="filtrarClientesMovil()" placeholder="🔍 Buscar por Nombre o Cédula..." style="${estiloInput} background:#f8fafc; margin-bottom:14px;">
                        <div id="lista-clientes-movil"></div>
                        <div id="paginacion-clientes-movil"></div>
                    </div>

                </div>
            `;

            requestAnimationFrame(() => {
                setTimeout(() => {
                    if (typeof cargarClientesMovil === 'function') cargarClientesMovil();
                }, 100);
            });
        }

        else {
            const vistaModulos = document.getElementById('vista-modulos');
            vistaModulos.style.display = 'block';
            vistaModulos.innerHTML = 
                '<div class="seccion-titulo" style="margin-top: 30px;">MÓDULO: ' + modulo.toUpperCase() + '</div>' +
                '<div style="margin: 20px; background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 15px; text-align: center;">' +
                '  <span class="icono-grande">⚙️</span>' +
                '  <span class="texto-btn">Conectando base de datos...<br>Pronto verá las funciones aquí.</span>' +
                '</div>';
        }

        const navItems = document.querySelectorAll('.nav-item');
        if (navItems && navItems.length > 0) {
            navItems.forEach(item => item.classList.remove('activo'));
            if (modulo === 'inicio' && navItems.length > 0) navItems[0].classList.add('activo');
            else if (modulo === 'pago' && navItems.length > 1) navItems[1].classList.add('activo');
        }
    }

    // =========================================================
// 🚀 FUNCIONES AUXILIARES MÓVILES (CRIPTO ALPHA)
// =========================================================
function cifrarNumeroCreditoMovil(numero) {
    if (!numero && numero !== 0) return 'P';
    
    const numStr = numero.toString();
    let codigoOculto = '';
    
    const diccionario = {
        '1': 'H', '2': 'Y', '3': 'R', '4': 'V', '5': 'T',
        '6': 'N', '7': 'G', '8': 'J', '9': 'Ñ', '0': 'P'
    };
    
    for (let i = 0; i < numStr.length; i++) {
        const digito = numStr[i];
        codigoOculto += diccionario[digito] || digito;
    }
    
    return codigoOculto;
}

    async function esperarSupabase() {
        let intentos = 0;
        while (!window.supabaseClient && intentos < 30) {
            await new Promise(r => setTimeout(r, 100)); 
            intentos++;
        }
        return window.supabaseClient;
    }

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

    function unirDetallesTransferencia() {
        const banco = document.getElementById('select-banco').value;
        const ref = document.getElementById('input-referencia').value.trim();
        const inputOculto = document.getElementById('input-detalles-banco');
        if (banco && ref) inputOculto.value = `${banco} #${ref}`; 
        else inputOculto.value = ""; 
    }

    // =========================================================
    // 🚀 LA ANTENA DIRECTA A MACRODROID (INDEPENDIENTE DE APP.JS)
    // =========================================================
    async function invocarSMSDesdeMovil(numero, mensaje) {
        try {
            if (typeof window.enviarSMSAutomatico === 'function') {
                await window.enviarSMSAutomatico(numero, mensaje);
                return true;
            } 
            else if (window.parent && typeof window.parent.enviarSMSAutomatico === 'function') {
                await window.parent.enviarSMSAutomatico(numero, mensaje);
                return true;
            } 
            else {
                console.log("📡 Usando antena SMS independiente del móvil...");
                const urlMacroDroid = `https://trigger.macrodroid.com/554f217c-000a-4581-896c-551d96459fb2/sms_credito?numero=${encodeURIComponent(numero)}&mensaje=${encodeURIComponent(mensaje)}`;
                await fetch(urlMacroDroid, { mode: 'no-cors' });
                return true;
            }
        } catch (error) {
            console.error("Fallo SMS Independiente:", error);
            return false;
        }
    }

    // =========================================================
    // 🚀 CEREBRO EXCLUSIVO PARA MÓVILES
    // =========================================================
    async function cargarListaClientesMovil() {
        const dropdown = document.getElementById('selector-cliente-recaudacion');
        const sectorSeleccionado = document.getElementById('filtro-sector-recaudacion').value;
        if (!dropdown) return;
        dropdown.innerHTML = '<option value="">⏳ Conectando...</option>';

        try {
            const supa = await esperarSupabase();
            if (!supa) {
                dropdown.innerHTML = '<option value="">-- Sin conexión --</option>';
                return;
            }

            const { data: creditos, error } = await supa.from('creditos').select('clientes(nombres, apellidos, cedula, sector)').eq('estado', 'activo');
            if (error) throw error;

            let clientesUnicos = new Map();
            creditos.forEach(c => {
                const cli = c.clientes || {};
                const sectorCliente = cli.sector || ''; 
                if (!sectorSeleccionado || sectorCliente.includes(sectorSeleccionado)) {
                    const nombreCompleto = `${cli.nombres || ''} ${cli.apellidos || ''}`.trim().toUpperCase();
                    const cedula = cli.cedula || 'S/N';
                    if (!clientesUnicos.has(cedula)) clientesUnicos.set(cedula, { nombre: nombreCompleto, cedula: cedula });
                }
            });

            dropdown.innerHTML = '<option value="">-- Seleccione Cliente --</option>';
            if (clientesUnicos.size === 0) {
                dropdown.innerHTML = '<option value="">🚫 Sin clientes</option>';
                return;
            }

            const clientesArray = Array.from(clientesUnicos.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
            clientesArray.forEach(cli => {
                const option = document.createElement('option');
                option.value = cli.cedula; option.text = cli.nombre; 
                dropdown.appendChild(option);
            });
        } catch (err) {
            dropdown.innerHTML = '<option value="">⚠️ Error de red</option>';
        }
    }

    async function buscarCreditoMovil() {
        const busqueda = document.getElementById('selector-cliente-recaudacion').value.trim();
        if (!busqueda) { alert("⚠️ Selecciona un cliente."); return; }
        const supa = await esperarSupabase();
        if (!supa) return;

        try {
            const { data: creditos, error } = await supa
                .from('creditos')
                .select('id, monto_capital, total_pagar, monto_mora, valor_cuota, frecuencia_pago, estado, fecha_emision, fecha_vencimiento_actual, cliente_id, num_cuotas, clientes(nombres, apellidos, cedula, whatsapp)')
                .in('estado', ['activo', 'congelado']); 

            if (error) throw error;

            const creditosDelCliente = creditos.filter(c => (c.clientes.cedula || '').trim() === busqueda);
            if (creditosDelCliente.length === 0) { alert("🔍 No hay crédito ACTIVO para este cliente."); return; }

            const idDelCliente = creditosDelCliente[0].cliente_id;
            const { data: todosCreditosCliente } = await supa.from('creditos').select('id').eq('cliente_id', idDelCliente).order('id', { ascending: true });
            
            const idsActivos = creditosDelCliente.map(c => c.id);
            const { data: pagosCliente } = await supa.from('historial_pagos').select('id_credito, abono_total, monto_interes, fecha_pago').in('id_credito', idsActivos);
            const { data: morasCliente } = await supa.from('historial_moras').select('credito_id, tipo_accion').in('credito_id', idsActivos).order('id', { ascending: true });
            
            window.listaCreditosActivosCliente = creditosDelCliente;
            windowPagosGlobal = pagosCliente || [];

            if (creditosDelCliente.length === 1) {
                cargarEstadoCuentaCreditoMovil(creditosDelCliente[0].id);
            } else {
                const selectMulti = document.getElementById('selector-multicredito');
                selectMulti.innerHTML = '<option value="">-- Seleccione el crédito --</option>';
                
                creditosDelCliente.forEach(c => {
                    let numeroCredito = todosCreditosCliente ? (todosCreditosCliente.findIndex(tc => tc.id === c.id) + 1) : 1;
                    const codigoCifrado = cifrarNumeroCreditoMovil(numeroCredito);
                    
                    let totalPagadoHastaHoy = windowPagosGlobal.filter(p => p.id_credito === c.id).reduce((sum, p) => sum + parseFloat(p.abono_total||0), 0);
                    let saldoNeto = (parseFloat(c.total_pagar) || 0) - totalPagadoHastaHoy;
                    if (saldoNeto < 0) saldoNeto = 0;

                    const moraCredito = parseFloat(c.monto_mora) || 0;
                    const deudaTotalConMora = saldoNeto + moraCredito;
                    
                    let textoMoraExtra = "";
                    if (moraCredito > 0) {
                        textoMoraExtra = ` | 🚨 Mora $${moraCredito.toFixed(0)} | 👉 Deuda Total: $${deudaTotalConMora.toFixed(2)}`;
                    }

                    let etiquetaAccion = "";
                    if (morasCliente) {
                        const morasEsteCredito = morasCliente.filter(m => m.credito_id === c.id);
                        if (morasEsteCredito.length > 0) {
                            const ultimaAccion = morasEsteCredito[morasEsteCredito.length - 1].tipo_accion || '';
                            if (ultimaAccion.includes('Refinanciamiento') || ultimaAccion.includes('Renovación')) etiquetaAccion = " | 🔄 RENOVADO";
                            else if (ultimaAccion.includes('Perdón')) etiquetaAccion = " | 🛡️ PERDONADO";
                        }
                    }
let alertaCongelado = c.estado === 'congelado' ? ' [🧊 CONGELADO]' : '';

                const f = new Date(c.fecha_emision);
                const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
                const fechaTxtCorta = `${f.getDate()}/${meses[f.getMonth()]}/${f.getFullYear()}`;

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

                const textoOpcion = `CRÉDITO #${c.id} | CRE #${numeroCredito} ${codigosVisuales} | Emitido: ${fechaTxtCorta} | Total: $${parseFloat(c.total_pagar).toFixed(2)} ➡️ Saldo: $${saldoNeto.toFixed(2)}${textoMoraExtra}${etiquetaAccion}${alertaCongelado}`;
                
                selectMulti.innerHTML += `<option value="${c.id}">${textoOpcion}</option>`;
            });
                
                document.getElementById('recaudacion-espera-msg').style.display = 'none';
                document.getElementById('panel-recaudacion-activo').style.display = 'none';
                document.getElementById('contenedor-multicredito').style.display = 'block';
            }
        } catch (err) { alert("❌ Error: " + err.message); }
    }

    async function cargarEstadoCuentaCreditoMovil(idCreditoInput) {
        if (!idCreditoInput) return;
        
        const idCredito = parseInt(idCreditoInput, 10);
        
        const supa = await esperarSupabase();
        try {
            const { data: pagosFrescos } = await supa.from('historial_pagos').select('id_credito, abono_total, monto_interes, fecha_pago').eq('id_credito', idCredito);
            if(pagosFrescos) {
                 windowPagosGlobal = windowPagosGlobal.filter(p => p.id_credito !== idCredito).concat(pagosFrescos);
            }
        } catch(e) { console.error("Error refrescando pagos:", e); }

        const encontrado = (window.listaCreditosActivosCliente || []).find(c => c.id === idCredito);
        if (!encontrado) return;
        window.creditoSeleccionadoCobro = encontrado;

        let totalPagadoHastaHoy = 0;
        windowInteresYaPagado = 0;
        
        windowPagosGlobal.forEach(p => {
            if (p.id_credito === idCredito) {
                totalPagadoHastaHoy += parseFloat(p.abono_total || 0);
                windowInteresYaPagado += parseFloat(p.monto_interes || 0);
            }
        });

        windowInteresTotalPactado = parseFloat(encontrado.total_pagar) - parseFloat(encontrado.monto_capital);
        const saldoRestanteNeto = parseFloat(encontrado.total_pagar) - totalPagadoHastaHoy;
        window.creditoSeleccionadoCobro.saldoNeto = saldoRestanteNeto > 0 ? saldoRestanteNeto : 0;

        const cli = encontrado.clientes || {};
        const iN = (cli.nombres || '').trim().charAt(0);
        const iA = (cli.apellidos || '').trim().charAt(0);
        const u4 = (cli.cedula || '').trim().slice(-4);
        const refFinal = `${iN}${iA}-${u4}`.toUpperCase();
        
        let numeroCredito = 1;
        if(window.listaCreditosActivosCliente) {
             const todosDelCliente = window.listaCreditosActivosCliente.sort((a,b) => a.id - b.id);
             numeroCredito = todosDelCliente.findIndex(c => c.id === idCredito) + 1;
        }
        const creCifrado = cifrarNumeroCreditoMovil(numeroCredito);
        const refTextoCompleto = `CRE #${numeroCredito} [${creCifrado}]`;

        let fechaEmisionStr = 'N/A';
        if(encontrado.fecha_emision) {
            let fEmi = new Date(encontrado.fecha_emision);
            if (!isNaN(fEmi.getTime())) {
                const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
                const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                let horasEmi = fEmi.getHours();
                let minutosEmi = String(fEmi.getMinutes()).padStart(2, '0');
                const ampmEmi = horasEmi >= 12 ? 'P. M.' : 'A. M.';
                horasEmi = horasEmi % 12; horasEmi = horasEmi ? horasEmi : 12;
                horasEmi = String(horasEmi).padStart(2, '0');
                fechaEmisionStr = `${dias[fEmi.getDay()]}, ${fEmi.getDate()}/${meses[fEmi.getMonth()]}/${fEmi.getFullYear()} | ${horasEmi}:${minutosEmi} ${ampmEmi}`.toUpperCase();
            }
        }

        document.getElementById('lbl-recaudacion-ref').innerHTML = `REF: ${refFinal} | CRÉDITO #${encontrado.id} | ${refTextoCompleto}`;
        document.getElementById('lbl-recaudacion-fecha-emision').innerText = fechaEmisionStr;
        document.getElementById('lbl-recaudacion-cliente').innerText = `${cli.nombres} ${cli.apellidos}`.toUpperCase();
        document.getElementById('lbl-recaudacion-cedula').innerText = `Cédula: ${cli.cedula || 'N/A'}`;
        
        let cuotaFinal = parseFloat(encontrado.valor_cuota) || 1;
        let frecuenciaDB = (encontrado.frecuencia_pago || 'DIARIO').toUpperCase();
        let frecuenciaFinal = '';
        
        if (frecuenciaDB.includes('DIARIO')) frecuenciaFinal = 'LUN A SÁB';
        else if (frecuenciaDB.includes('SEMANAL')) frecuenciaFinal = 'SEMANAL';
        else if (frecuenciaDB.includes('QUINCENAL')) frecuenciaFinal = 'QUINCENAL';
        else if (frecuenciaDB.includes('MENSUAL')) frecuenciaFinal = 'MENSUAL';
        else frecuenciaFinal = frecuenciaDB;

        let textoAcuerdo = '';

        if (encontrado.estado === 'congelado' && encontrado.acuerdo_pago) {
            textoAcuerdo = encontrado.acuerdo_pago;
            const acuerdoLower = textoAcuerdo.toLowerCase();
            const matchMonto = textoAcuerdo.match(/\$?\s*(\d+(\.\d{1,2})?)/);
            if (matchMonto) cuotaFinal = parseFloat(matchMonto[1]);
            
            if (acuerdoLower.includes('diario') || acuerdoLower.includes('al dia')) frecuenciaFinal = 'LUN A SÁB';
            else if (acuerdoLower.includes('semanal') || acuerdoLower.includes('por semana')) frecuenciaFinal = 'SEMANAL';
            else if (acuerdoLower.includes('quincenal') || acuerdoLower.includes('cada 15')) frecuenciaFinal = 'QUINCENAL';
            else if (acuerdoLower.includes('mensual') || acuerdoLower.includes('al mes')) frecuenciaFinal = 'MENSUAL';
            
            document.getElementById('lbl-recaudacion-cuota').innerHTML = `<span style="color: #ca8a04; background: #fef08a; padding: 2px 5px; border-radius: 4px; font-weight: bold;">$${cuotaFinal.toFixed(2)}</span>`;
            document.getElementById('lbl-recaudacion-frecuencia').innerHTML = `<span style="color: #ca8a04;">${frecuenciaFinal} (CONG.)</span>`;
        } else {
            document.getElementById('lbl-recaudacion-cuota').innerHTML = `<strong>$${cuotaFinal.toFixed(2)}</strong>`;
            document.getElementById('lbl-recaudacion-frecuencia').innerHTML = frecuenciaFinal;
        }

        document.getElementById('lbl-recaudacion-total').innerHTML = `<strong>$${parseFloat(encontrado.total_pagar).toFixed(2)}</strong>`;
        
        let cuotasPendientes = Math.ceil(window.creditoSeleccionadoCobro.saldoNeto / cuotaFinal);
        const numeroCuotasOriginales = parseInt(encontrado.num_cuotas) || 1;
        let cuotasPagadas = numeroCuotasOriginales - cuotasPendientes;
        if (cuotasPagadas < 0) cuotasPagadas = 0;

        const textoCuotasTotales = textoAcuerdo !== '' ? 'N/A' : `<strong>${numeroCuotasOriginales}</strong>`;
        
        document.getElementById('lbl-recaudacion-num-cuotas').innerHTML = `${textoCuotasTotales} <div style="display: flex; gap: 4px; margin-top: 4px; justify-content: flex-end;"><span style="color: #15803d; font-size: 10px; font-weight: bold;">(✔️ ${cuotasPagadas} Pagadas)</span> <span style="color: #ef4444; font-size: 10px; font-weight: bold;">(${cuotasPendientes} Pendientes)</span></div>`;

        const moraGuardada = parseFloat(encontrado.monto_mora) || 0;
        const saldoFinalMora = window.creditoSeleccionadoCobro.saldoNeto + moraGuardada;
        
        let htmlSaldoNeto = `<div style="display: flex; flex-direction: column; align-items: flex-end; line-height: 1.2;">
            <span style="font-size: 24px; font-weight: 900; color: #dc2626; white-space: nowrap;">$${saldoFinalMora.toFixed(2)}</span>`;
        
        if (moraGuardada > 0) {
            htmlSaldoNeto += `<span style="font-size: 11px; font-weight: normal; color: #475569; margin-top: 4px; white-space: nowrap;">(Incl. $${moraGuardada.toFixed(2)} mora)</span>`;
        }
        htmlSaldoNeto += `</div>`;

        document.getElementById('lbl-recaudacion-saldo').innerHTML = htmlSaldoNeto;

        const cajaBanderas = document.getElementById('contenedor-banderas-recaudacion');
        if (encontrado.estado === 'congelado' && textoAcuerdo.trim() !== '') {
            cajaBanderas.innerHTML = `<div style="background: linear-gradient(135deg, #fef08a 0%, #fde047 100%); border: 1px solid #eab308; border-left: 6px solid #ca8a04; border-radius: 8px; padding: 10px; margin-top: 10px; margin-bottom: 15px;"><div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;"><span style="font-size: 14px;">🤝</span><span style="color: #854d0e; font-weight: 900; font-size: 11px; text-transform: uppercase;">Acuerdo Activo</span></div><div style="color: #422006; font-size: 12px; font-weight: bold; padding-left: 22px;">"${textoAcuerdo}"</div></div>`;
        } else if (encontrado.estado === 'congelado' && textoAcuerdo.trim() === '') {
             cajaBanderas.innerHTML = `<div style="background: #e0f2fe; border: 1px solid #bae6fd; border-left: 6px solid #0284c7; border-radius: 8px; padding: 10px; margin-top: 10px; margin-bottom: 15px;"><div style="display: flex; align-items: center; gap: 8px;"><span style="font-size: 14px;">🧊</span><span style="color: #0369a1; font-weight: 800; font-size: 11px;">Cuenta Protegida</span></div></div>`;
        } else {
            cajaBanderas.innerHTML = ''; 
        }

        document.getElementById('monto-cobro-input').value = cuotaFinal.toFixed(2);
        document.getElementById('recaudacion-espera-msg').style.display = 'none';
        document.getElementById('panel-recaudacion-activo').style.display = 'block';

        simularEnrutamientoFlujo(cuotaFinal);
        
        paginaActualAbonos = 1;
        cargarHistorialMovil(idCredito);
    }

    function simularEnrutamientoFlujo(montoIngresado) {
        let monto = parseFloat(montoIngresado) || 0;
        if (monto <= 0 || !window.creditoSeleccionadoCobro) return;

        const moraExtra = parseFloat(window.creditoSeleccionadoCobro.monto_mora) || 0;
        const interesFaltantePorAsegurar = (windowInteresTotalPactado + moraExtra) - windowInteresYaPagado;
        
        let destinoInteres = 0; let destinoCapital = 0;

        if (interesFaltantePorAsegurar > 0) {
            if (monto <= interesFaltantePorAsegurar) {
                destinoInteres = monto; destinoCapital = 0;
                document.getElementById('sim-leyenda-fase').innerHTML = `👑 Asegurando Utilidades ($${(interesFaltantePorAsegurar - monto).toFixed(2)} restantes)`;
            } else {
                destinoInteres = interesFaltantePorAsegurar; destinoCapital = monto - interesFaltantePorAsegurar;
                document.getElementById('sim-leyenda-fase').innerHTML = `🚀 FRONTERA CRUZADA! Excedente ($${destinoCapital.toFixed(2)}) repone Capital.`;
            }
        } else {
            destinoInteres = 0; destinoCapital = monto;
            document.getElementById('sim-leyenda-fase').innerText = "🛡️ Interés blindado. Todo repone tu Capital.";
        }

        document.getElementById('sim-leyenda-fase').style.display = 'block';
        document.getElementById('sim-boveda-interes').innerText = `$${destinoInteres.toFixed(2)}`;
        document.getElementById('sim-boveda-capital').innerText = `$${destinoCapital.toFixed(2)}`;
    }

    // =========================================================
    // 🔥 EL MOTOR PRINCIPAL: PROCESAR COBRO EN EL MÓVIL 🔥
    // =========================================================
    async function procesarCobroOficial() {
        const montoInput = parseFloat(document.getElementById('monto-cobro-input').value);
        const metodoPago = document.getElementById('metodo-pago-seleccionado').value;
        const detallesBanco = document.getElementById('input-detalles-banco').value.trim();
        
        if (isNaN(montoInput) || montoInput <= 0 || !window.creditoSeleccionadoCobro) {
            alert("⚠️ Por favor introduce un monto de abono válido.");
            return;
        }

        if (metodoPago === 'transferencia' && detallesBanco === '') {
            alert("⚠️ Seleccionaste Transferencia. Por favor ingresa los datos del banco o comprobante.");
            return;
        }

        const moraExtra = parseFloat(window.creditoSeleccionadoCobro.monto_mora) || 0;
        const saldoRealTotal = parseFloat(window.creditoSeleccionadoCobro.saldoNeto) + moraExtra;

        if (montoInput > saldoRealTotal) {
            alert(`⚠️ El abono no puede ser mayor al saldo pendiente actual ($${saldoRealTotal.toFixed(2)}).`);
            return;
        }

        if (!confirm(`¿Estás seguro de registrar un cobro de $${montoInput.toFixed(2)} en ${metodoPago.toUpperCase()}?`)) return;

        const enviarSMS = confirm("📲 ¿Deseas enviar el comprobante de este abono por SMS al cliente?");

        const supa = await esperarSupabase();
        
        try {
            const interesFaltante = (windowInteresTotalPactado + moraExtra) - windowInteresYaPagado;
            let finalInteres = 0; let finalCapital = 0;

            if (interesFaltante > 0) {
                if (montoInput <= interesFaltante) {
                    finalInteres = montoInput;
                } else {
                    finalInteres = interesFaltante;
                    finalCapital = montoInput - interesFaltante;
                }
            } else {
                finalCapital = montoInput;
            }

            const { data: pagosExistentes } = await supa.from('historial_pagos').select('id').eq('id_credito', window.creditoSeleccionadoCobro.id);
            const numeroNuevoPago = (pagosExistentes ? pagosExistentes.length : 0) + 1;

            const { error: errHistorial } = await supa.from('historial_pagos').insert([{
                id_credito: window.creditoSeleccionadoCobro.id,
                abono_total: montoInput,
                monto_interes: finalInteres,
                monto_capital: finalCapital,
                forma_pago: metodoPago,
                detalles_banco: detallesBanco,
                fecha_pago: new Date().toISOString(),
                numero_pago: numeroNuevoPago
            }]);
            
            if (errHistorial) throw errHistorial;

            if (finalCapital > 0) {
                const tipoCaja = metodoPago === 'transferencia' ? 'banco' : 'efectivo';
                const { data: cajasTarget } = await supa.from('cajas_capital').select('id, saldo_actual').eq('tipo', tipoCaja).limit(1);
                if (cajasTarget && cajasTarget.length > 0) {
                    const cajaId = cajasTarget[0].id;
                    const nuevoSaldoCaja = parseFloat(cajasTarget[0].saldo_actual || 0) + finalCapital;
                    await supa.from('cajas_capital').update({ saldo_actual: nuevoSaldoCaja }).eq('id', cajaId);
                }
            }

            const nuevoSaldo = parseFloat((saldoRealTotal - montoInput).toFixed(2));
            if (nuevoSaldo <= 0) {
                await supa.from('creditos').update({ estado: 'finalizado', acuerdo_pago: '' }).eq('id', window.creditoSeleccionadoCobro.id);
            }

            alert("✅ ¡Pago registrado correctamente!");
            
            // =================================================================
            // 🚀 ENVÍO DE SMS VIP
            // =================================================================
            if (enviarSMS) {
                const cli = window.creditoSeleccionadoCobro.clientes || {};
                let numeroCliente = cli.whatsapp; 

                if (!numeroCliente) {
                    const { data: infoDB } = await supa.from('clientes').select('whatsapp').eq('id', window.creditoSeleccionadoCobro.cliente_id).single();
                    if (infoDB && infoDB.whatsapp) numeroCliente = infoDB.whatsapp;
                }

                if (!numeroCliente) {
                    alert("⚠️ El SMS NO se envió: Este cliente no tiene número registrado.");
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
                        
                        let infoMetodo = `💳 Método: ${metodoPago.toUpperCase()}`;
                        if (metodoPago === 'transferencia' && detallesBanco !== "") {
                            infoMetodo += `\n🏦 Banco: ${detallesBanco}`;
                        }

                        let msjSalida = "";
                        const esCancelacionTotal = nuevoSaldo <= 0;

                        if (esCancelacionTotal) {
                            msjSalida = `=== SISTEMA ALPHA ===\n${fechaHoraSMS}\n\n🆔 Ref: ${refFinal} | ${creText}\n👤 Cliente: ${nombre}\n\n🎉 ¡CONTRATO CANCELADO AL 100%! 🎉\n\nTe notificamos de manera oficial que tu crédito ha sido liquidado exitosamente en nuestra base de datos.\n\n✅ Pago de Cierre: #${numeroNuevoPago}\n💰 Monto Recibido: $${montoInput.toFixed(2)}\n📉 Saldo Pendiente: $0.00\n${infoMetodo}\n📊 Récord Crediticio: EXCELENTE / IMPECABLE\n\nQueremos agradecer enormemente tu compromiso y puntualidad. ¡Tienes las puertas totalmente abiertas para tu siguiente solicitud cuando la requieras! 🚀\n\n🚫 POR FAVOR, NO RESPONDER A ESTE MENSAJE.`;
                        } else {
                            const cuotasTotales = parseInt(window.creditoSeleccionadoCobro.num_cuotas) || 1;
                            const valorDeCuota = parseFloat(window.creditoSeleccionadoCobro.valor_cuota) || 1;
                            let cuotasPendientes = Math.ceil(nuevoSaldo / valorDeCuota);
                            if (cuotasPendientes < 0) cuotasPendientes = 0;

                            msjSalida = `=== SISTEMA ALPHA ===\n${fechaHoraSMS}\n\n🆔 Ref: ${refFinal} | ${creText}\n👤 Cliente: ${nombre}\n\nHola, aquí tienes el respaldo de tu abono.\n\n✅ Pago: #${numeroNuevoPago}\n💰 Monto: $${montoInput.toFixed(2)}\n📉 Saldo: $${nuevoSaldo.toFixed(2)}\n🔢 Cuotas: ${cuotasPendientes}/${cuotasTotales}\n${infoMetodo}\n\nConserva este msj. ¡Gracias!\n🚫 POR FAVOR, NO RESPONDER A ESTE MENSAJE.`;
                        }
                        
                        const exitoCliente = await invocarSMSDesdeMovil(numeroCliente.toString(), msjSalida);
                        
                        if (exitoCliente) {
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            const numeroGerente = "0939836191";
                            if (numeroCliente.toString().trim() !== numeroGerente) {
                                const etiquetaAuditoria = esCancelacionTotal ? "[COPIA LIQUIDACIÓN]" : "[COPIA NUEVO ABONO]";
                                await invocarSMSDesdeMovil(numeroGerente, `${etiquetaAuditoria}\n\n${msjSalida}`);
                            }
                            alert("📲 SMS enviado a MacroDroid para el cliente y copia al gerente.");
                        } else {
                            alert("⚠️ El pago se guardó, pero hubo un error de red al contactar con MacroDroid.");
                        }
                    } catch (errorSMS) {
                        alert(`❌ Falló el armado del SMS: ${errorSMS.message}`);
                    }
                }
            }

            document.getElementById('monto-cobro-input').value = "";
            await cargarEstadoCuentaCreditoMovil(window.creditoSeleccionadoCobro.id);

        } catch (err) {
            alert("❌ Error crítico al registrar abono: " + err.message);
        }
    }

    // =========================================================
    // 🎨 RENDERIZADOR DE HISTORIAL PREMIUM (PAGINADO Y DETALLADO)
    // =========================================================
    function renderizarAbonosPaginadosMovil() {
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
        const abonosOrdenados = abonosClienteActual.sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago));
        const abonosPagina = abonosOrdenados.slice(inicio, fin);
        const totalPaginas = Math.ceil(abonosOrdenados.length / ABONOS_POR_PAGINA);

        const cli = window.creditoSeleccionadoCobro.clientes || {};
        const iN = (cli.nombres || '').trim().charAt(0);
        const iA = (cli.apellidos || '').trim().charAt(0);
        const u4 = (cli.cedula || '').trim().slice(-4);
        const refFinal = `${iN}${iA}-${u4}`.toUpperCase();
        
        let creText = "CRE # ?";
        const lblRef = document.getElementById('lbl-recaudacion-ref');
        if (lblRef && lblRef.innerText) {
            const match = lblRef.innerText.match(/CRE\s*#[^|]+/); 
            if (match) creText = match[0].trim();
        }

        let htmlHistorial = '';

        abonosPagina.forEach((p) => {
            const numeroPago = p.numero_pago || '?';
            const fPago = new Date(p.fecha_pago);
            const ahora = new Date().getTime();
            const esEditable = (ahora - fPago.getTime()) < 86400000;

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
                            <span style="font-size: 12px; font-weight: 900; color: #1e293b; background: #e2e8f0; padding: 2px 8px; border-radius: 4px;">Pago #${numeroPago}</span>
                            <span style="color: #0284c7;">REF: ${refFinal}</span>
                            <span style="color: #cbd5e1;">|</span>
                            <span style="color: #65a30d;">${creText}</span>
                            <span style="color: #cbd5e1;">|</span>
                            <span style="text-transform: lowercase;">📅 ${diaSemana}, ${dia}/${mes}/${anio} | ${horas}:${minutos}:${segundos} ${ampm}</span>
                        </div>
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
                            <button onclick="reenviarReciboAbono(${p.id})" title="Reenviar" style="background:none; border:none; font-size:16px; cursor:pointer;">📩</button>
                            ${esEditable ? `
                                <button onclick="editarAbono(${p.id})" title="Editar" style="background:none; border:none; font-size:16px; cursor:pointer;">✏️</button>
                                <button onclick="eliminarAbono(${p.id})" title="Eliminar" style="background:none; border:none; font-size:16px; cursor:pointer;">🚫</button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });

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
            renderizarAbonosPaginadosMovil();
        }
    }

    // =========================================================
    // ⚔️ FUNCIONES DE AUDITORÍA: REENVIAR, EDITAR Y ELIMINAR (CON AUDITORÍA)
    // =========================================================
    async function validarRegla24HorasAbono(idAbono) {
        const idNum = parseInt(idAbono);
        const supa = await esperarSupabase();
        const { data: abono, error } = await supa.from('historial_pagos').select('fecha_pago').eq('id', idNum).single();
        if (error || !abono) { alert("❌ Error al verificar la fecha del abono."); return false; }

        const fPago = new Date(abono.fecha_pago).getTime();
        const ahora = new Date().getTime();
        
        if ((ahora - fPago) >= 86400000) { 
            alert("🔒 REGLA DE ORO ALPHA:\nHan pasado más de 24 horas. Este abono está sellado y NO puede ser modificado ni eliminado por seguridad.");
            return false;
        }
        return true;
    }
async function reenviarReciboAbono(idAbono) {
        const abono = abonosClienteActual.find(a => a.id == idAbono);
        if (!abono) return;
        const numPago = abono.numero_pago || '?';
        const cobrarCosto = confirm(`¿Deseas incluir el recargo por reenvío del Pago #${numPago}?\n\n• [ACEPTAR] = Cobrar 0.50 ctv.\n• [CANCELAR] = Gratis (Ayuda Social).`);
        const encabezadoSMS = cobrarCosto ? `=== SISTEMA ALPHA (Copia)(VAL 0.50 ctv) ===` : `=== SISTEMA ALPHA (Copia) ===`;
        
        try {
            const cli = window.creditoSeleccionadoCobro.clientes || {};
            let numeroCliente = cli.whatsapp;
            const supa = await esperarSupabase();
            
            if (!numeroCliente) {
                const { data: infoDB } = await supa.from('clientes').select('whatsapp').eq('id', window.creditoSeleccionadoCobro.cliente_id).single();
                if (infoDB && infoDB.whatsapp) numeroCliente = infoDB.whatsapp;
            }

            if (!numeroCliente) { alert("⚠️ El cliente no tiene un número registrado."); return; }

            if (cobrarCosto) {
                const { data: cajaData } = await supa.from('cajas_capital').select('id, saldo_actual').eq('tipo', 'efectivo').limit(1);
                if(cajaData && cajaData.length > 0) {
                    await supa.from('cajas_capital').update({ saldo_actual: parseFloat(cajaData[0].saldo_actual) + 0.50 }).eq('id', cajaData[0].id);
                }
            }

            const nombre = `${cli.nombres} ${cli.apellidos}`.toUpperCase();
            
            // 🔥 RESCATAMOS LA REF COMPLETA DEL HTML (EJ: MV-4578 | CRE #[C]) 🔥
            let refFinalCompleta = "CRE # ?";
            const lblRef = document.getElementById('lbl-recaudacion-ref');
            if (lblRef && lblRef.innerText) {
                // Buscamos algo como "REF: MV-4578 | CRÉDITO #603 | CRE #3 [C]"
                const textoRef = lblRef.innerText;
                const partes = textoRef.split('|');
                if (partes.length >= 3) {
                     // Extraemos "MV-4578" y "CRE #3 [C]" o "CRE #[C]"
                     const refCliente = partes[0].replace('REF:', '').trim();
                     const creParte = partes[2].trim();
                     const matchLetra = creParte.match(/\[.*?\]/);
                     const creLimpio = matchLetra ? `CRE #${matchLetra[0]}` : creParte;
                     refFinalCompleta = `${refCliente} | ${creLimpio}`;
                }
            }

            const fPago = new Date(abono.fecha_pago);
            const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            const fechaHoraSMS = `${dias[fPago.getDay()]} ${String(fPago.getDate()).padStart(2, '0')}/${meses[fPago.getMonth()]}/${fPago.getFullYear()} | ${String(fPago.getHours()%12||12).padStart(2,'0')}:${String(fPago.getMinutes()).padStart(2,'0')} ${fPago.getHours()>=12?'p.m.':'a.m.'}`;

            const pagosHastaAqui = abonosClienteActual.filter(a => new Date(a.fecha_pago) <= fPago);
            const totalPagadoHastaAqui = pagosHastaAqui.reduce((sum, a) => sum + parseFloat(a.abono_total || 0), 0);
            const saldoEnEseMomento = parseFloat(window.creditoSeleccionadoCobro.total_pagar) - totalPagadoHastaAqui;
            
            const cuotasTotales = parseInt(window.creditoSeleccionadoCobro.num_cuotas) || 1;
            const cuotasPendientes = Math.max(0, Math.ceil(saldoEnEseMomento / (parseFloat(window.creditoSeleccionadoCobro.valor_cuota) || 1)));

            // 🔥 AÑADIMOS EL DETALLE DEL BANCO SI ES TRANSFERENCIA 🔥
            let infoMetodo = `💳 Método: ${abono.forma_pago ? abono.forma_pago.toUpperCase() : 'EFECTIVO'}`;
            if (abono.forma_pago === 'transferencia' && abono.detalles_banco) {
                infoMetodo += `\n🏦 Banco: ${abono.detalles_banco}`;
            }

            const msjAbono = `${encabezadoSMS}\n${fechaHoraSMS}\n\n🆔 Ref: ${refFinalCompleta}\n👤 Cliente: ${nombre}\n\nHola, aquí tienes el respaldo de tu abono.\n\n✅ Pago: #${numPago}\n💰 Monto: $${parseFloat(abono.abono_total).toFixed(2)}\n📉 Saldo: $${saldoEnEseMomento.toFixed(2)}\n🔢 Cuotas: ${cuotasPendientes}/${cuotasTotales}\n${infoMetodo}\n\nConserva este msj. ¡Gracias!\n🚫 POR FAVOR, NO RESPONDER A ESTE MENSAJE.`;
            
            const exitoCliente = await invocarSMSDesdeMovil(numeroCliente.toString(), msjAbono);
            
            if (exitoCliente) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                const numGerente = "0939836191";
                if (numeroCliente.toString().trim() !== numGerente) {
                    await invocarSMSDesdeMovil(numGerente, `[AVISO REENVÍO - ${cobrarCosto ? 'COBRADO' : 'GRATIS'}]\n\n${msjAbono}`);
                }
                alert(`✅ Recibo enviado exitosamente.`);
            } else {
                 alert("⚠️ No se pudo ejecutar el puente SMS.");
            }
        } catch(e) { alert("Error: " + e.message); }
    }

    async function editarAbono(idAbono) {
        const idNum = parseInt(idAbono);
        const esValido = await validarRegla24HorasAbono(idNum);
        if (!esValido) return;

        try {
            const supa = await esperarSupabase();
            const { data: abonoActual, error: errAbono } = await supa.from('historial_pagos').select('*').eq('id', idNum).single();
            if (errAbono || !abonoActual) throw new Error("No se pudo obtener el abono.");

            const { data: creditoAct, error: errCredito } = await supa.from('creditos').select('*').eq('id', abonoActual.id_credito).single();
            if (errCredito || !creditoAct) throw new Error("No se pudo obtener el crédito.");

            const numPago = abonoActual.numero_pago || '?';
            const capitalViejo = parseFloat(abonoActual.monto_capital || 0);
            const metodoPago = abonoActual.forma_pago || 'efectivo';

            let nuevoMonto = prompt(`✏️ EDICIÓN DE ABONO #${numPago}\n\nMonto actual: $${parseFloat(abonoActual.abono_total).toFixed(2)}\n\nEscribe el NUEVO monto total correcto:`, parseFloat(abonoActual.abono_total));
            if (!nuevoMonto || isNaN(nuevoMonto)) return;
            
            nuevoMonto = parseFloat(nuevoMonto);
            if (nuevoMonto <= 0) { alert("❌ El monto debe ser mayor a cero."); return; }

            if (!confirm(`¿Confirmas cambiar el abono de $${parseFloat(abonoActual.abono_total).toFixed(2)} a $${nuevoMonto.toFixed(2)}?`)) return;

            const enviarSMS = confirm("📲 ¿Deseas notificar al cliente sobre esta corrección vía SMS?");

            const moraExtra = parseFloat(creditoAct.monto_mora) || 0;
            const interesPactadoTotal = parseFloat(creditoAct.total_pagar) - parseFloat(creditoAct.monto_capital) + moraExtra;
            
            const { data: otrosPagos } = await supa.from('historial_pagos').select('monto_interes').eq('id_credito', abonoActual.id_credito).neq('id', idNum);
            let interesYaPagadoOtros = 0;
            if (otrosPagos) interesYaPagadoOtros = otrosPagos.reduce((sum, p) => sum + parseFloat(p.monto_interes || 0), 0);

            const interesRestante = interesPactadoTotal - interesYaPagadoOtros;
            let nuevoInteres = 0; let nuevoCapital = 0;

            if (nuevoMonto <= interesRestante) {
                nuevoInteres = nuevoMonto; nuevoCapital = 0;
            } else {
                nuevoInteres = interesRestante; nuevoCapital = nuevoMonto - interesRestante;
            }

            const { data: updatedRows, error: errUpdate } = await supa.from('historial_pagos').update({ 
                abono_total: nuevoMonto, monto_interes: nuevoInteres > 0 ? nuevoInteres : 0, monto_capital: nuevoCapital > 0 ? nuevoCapital : 0 
            }).eq('id', idNum).select();
            if (errUpdate) throw errUpdate;

            const diferenciaCapital = nuevoCapital - capitalViejo;

            let creTextHistorial = "CRE # ?";
            const lblRefH = document.getElementById('lbl-recaudacion-ref');
            if (lblRefH && lblRefH.innerText) {
                const matchH = lblRefH.innerText.match(/CRE\s*#[^|]+/);
                if (matchH) {
                    const matchLetraH = matchH[0].match(/\[.*?\]/);
                    creTextHistorial = matchLetraH ? `CRE #${matchLetraH[0]}` : matchH[0].trim();
                }
            }

            if (diferenciaCapital !== 0) {
                const tipoCaja = (metodoPago.toLowerCase() === 'transferencia' || metodoPago.toLowerCase() === 'banco') ? 'banco' : 'efectivo';
                const { data: cajasTarget } = await supa.from('cajas_capital').select('id, saldo_actual').eq('tipo', tipoCaja).order('id', { ascending: true }).limit(1);
                
                if (cajasTarget && cajasTarget.length > 0) {
                    const cajaId = cajasTarget[0].id;
                    const nuevoSaldoCaja = parseFloat(cajasTarget[0].saldo_actual || 0) + diferenciaCapital;
                    await supa.from('cajas_capital').update({ saldo_actual: nuevoSaldoCaja }).eq('id', cajaId);

                    const cliInfo = window.creditoSeleccionadoCobro.clientes || {};
                    const nomCliente = `${cliInfo.nombres || ''} ${cliInfo.apellidos || ''}`.toUpperCase().trim();

                    await supa.from('historial_capital').insert([{
                        caja_id: cajaId, monto: diferenciaCapital,
                        concepto: `AJUSTE DE EDICIÓN: Abono #${numPago} | ${creTextHistorial} | ${nomCliente} (Ajuste cap. de $${capitalViejo} a $${nuevoCapital})`
                    }]);
                }
            }

            // Recalcular Fecha
            try {
                const oldMonto = parseFloat(abonoActual.abono_total || 0);
                const { data: todosPagosActuales } = await supa.from('historial_pagos').select('abono_total').eq('id_credito', creditoAct.id);
                let pagadoTotalActualizado = todosPagosActuales ? todosPagosActuales.reduce((acc, p) => acc + parseFloat(p.abono_total || 0), 0) : 0;
                
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
                    if (matchMonto && parseFloat(matchMonto[0]) > 0) valorDeUnaCuota = parseFloat(matchMonto[0]);
                }

                const cuotasAntes = Math.floor(totalPagadoAntes / valorDeUnaCuota);
                const cuotasDespues = Math.floor(pagadoTotalActualizado / valorDeUnaCuota);
                const diferenciaCuotas = cuotasDespues - cuotasAntes;

                if (diferenciaCuotas !== 0 && creditoAct.fecha_vencimiento_actual) {
                    let fechaObj = new Date(creditoAct.fecha_vencimiento_actual + 'T12:00:00');
                    if (freq.includes('SEMANAL')) fechaObj.setDate(fechaObj.getDate() + (7 * diferenciaCuotas));
                    else if (freq.includes('QUINCENAL')) fechaObj.setDate(fechaObj.getDate() + (15 * diferenciaCuotas));
                    else if (freq.includes('MENSUAL')) fechaObj.setMonth(fechaObj.getMonth() + (1 * diferenciaCuotas));
                    else if (freq.includes('DIARIO')) fechaObj.setDate(fechaObj.getDate() + (1 * diferenciaCuotas));
                    
                    const nuevaFechaCalculada = fechaObj.toISOString().split('T')[0];
                    await supa.from('creditos').update({ fecha_vencimiento_actual: nuevaFechaCalculada }).eq('id', creditoAct.id);
                }
            } catch (e) { console.error(e); }

            if (enviarSMS) {
                const cli = window.creditoSeleccionadoCobro.clientes || {};
                let numeroCliente = cli.whatsapp; 
                if (!numeroCliente) {
                    const { data: infoDB } = await supa.from('clientes').select('whatsapp').eq('id', creditoAct.cliente_id).single();
                    if (infoDB && infoDB.whatsapp) numeroCliente = infoDB.whatsapp;
                }
                
                if (numeroCliente) {
                    const nombre = `${cli.nombres} ${cli.apellidos}`.toUpperCase();
                    const refFinal = document.getElementById('lbl-recaudacion-ref').innerText.split('|')[0].replace('REF:','').trim();
                    const ahora = new Date();
                    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                    let h = ahora.getHours(); let m = String(ahora.getMinutes()).padStart(2,'0'); const ampm = h >= 12 ? 'p.m.' : 'a.m.';
                    h = h % 12; h = h ? h : 12;
                    const fechaHoraSMS = `${dias[ahora.getDay()]} ${String(ahora.getDate()).padStart(2,'0')}/${meses[ahora.getMonth()]}/${ahora.getFullYear()} | ${String(h).padStart(2,'0')}:${m} ${ampm}`;

                    const { data: todosLosPagos } = await supa.from('historial_pagos').select('abono_total').eq('id_credito', abonoActual.id_credito);
                    let pTotal = todosLosPagos ? todosLosPagos.reduce((s, p) => s + parseFloat(p.abono_total||0), 0) : 0;
                    
                    const saldoConMora = parseFloat(creditoAct.total_pagar) + parseFloat(creditoAct.monto_mora || 0);
                    const nuevoSaldoFinal = saldoConMora - pTotal;
                    
                    let infoMetodo = `💳 Método: ${abonoActual.forma_pago ? abonoActual.forma_pago.toUpperCase() : 'EFECTIVO'}`;
                    if (abonoActual.forma_pago === 'transferencia' && abonoActual.detalles_banco) infoMetodo += `\n🏦 Banco: ${abonoActual.detalles_banco}`;

                    const msjActualizacion = `=== SISTEMA ALPHA (Actualización) ===\n${fechaHoraSMS}\n\n🆔 Ref: ${refFinal} | ${creTextHistorial}\n👤 Cliente: ${nombre}\n\nHola, te notificamos un ajuste en tu historial tras nuestra revisión de caja.\n\n🔄 Pago Corregido: #${numPago}\n💰 Monto Exacto: $${nuevoMonto.toFixed(2)}\n📉 Nuevo Saldo: $${nuevoSaldoFinal.toFixed(2)}\n${infoMetodo}\n\nLamentamos las molestias. ¡Gracias!\n🚫 NO RESPONDER A ESTE MENSAJE.`;
                    
                    await invocarSMSDesdeMovil(numeroCliente.toString(), msjActualizacion);
                    await new Promise(r => setTimeout(r, 2000));
                    const nGer = "0939836191";
                    if (numeroCliente.toString().trim() !== nGer) await invocarSMSDesdeMovil(nGer, `[COPIA EDICIÓN ABONO]\n\n${msjActualizacion}`);
                }
            }

            alert("✅ Abono editado y saldos recalculados exitosamente.");
            await cargarEstadoCuentaCreditoMovil(window.creditoSeleccionadoCobro.id);

        } catch (error) { alert("❌ Error al editar: " + error.message); }
    }

    async function eliminarAbono(idAbono) {
        const idNum = parseInt(idAbono);
        const esValido = await validarRegla24HorasAbono(idNum);
        if (!esValido) return;

        if (!confirm("⚠️ ALERTA DE AUDITORÍA GERENCIAL ⚠️\n\n¿Estás absolutamente seguro de ELIMINAR este abono de la historia?\nEl saldo de la deuda del cliente volverá a subir y las cajas se ajustarán.")) return;

        const enviarSMS = confirm("📲 ¿Deseas enviar el comprobante de ANULACIÓN OFICIAL por SMS al cliente?");

        try {
            const supa = await esperarSupabase();

            let creText = "CRE # ?";
            const lblRef = document.getElementById('lbl-recaudacion-ref');
            if (lblRef && lblRef.innerText) {
                const match = lblRef.innerText.match(/CRE\s*#[^|]+/);
                if (match) {
                    const matchLetra = match[0].match(/\[.*?\]/);
                    creText = matchLetra ? `CRE #${matchLetra[0]}` : match[0].trim();
                }
            }

            const { data: abonoABorrar, error: errLectura } = await supa.from('historial_pagos').select('*').eq('id', idNum).single();
            if (errLectura || !abonoABorrar) { alert("⚠️ Error: No se pudo leer el abono para su auditoría."); return; }

            const { data: creditoAct } = await supa.from('creditos').select('*').eq('id', abonoABorrar.id_credito).single();

            // 🔥 MAGIA RESTAURADA: INSERCIÓN EN PAPELERA 🔥
            const { error: errAuditoria } = await supa.from('auditoria_pagos_eliminados').insert([{
                id_credito: abonoABorrar.id_credito, abono_total: abonoABorrar.abono_total, numero_pago: abonoABorrar.numero_pago,
                motivo_eliminacion: 'Corrección interna por gerente (Móvil)', forma_pago: abonoABorrar.forma_pago || 'EFECTIVO',
                fecha_pago_original: abonoABorrar.fecha_pago, codigo_cre: creText
            }]);
            if (errAuditoria) { alert("⚠️ Error al guardar respaldo. Anulación cancelada."); return; }

            const { error: errBorrado } = await supa.from('historial_pagos').delete().eq('id', idNum);
            if (errBorrado) throw errBorrado;

            // Reverso de caja y auditoría
            const cap = parseFloat(abonoABorrar.monto_capital || 0);
            if (cap > 0) {
                const tipoCaja = (abonoABorrar.forma_pago || '').toLowerCase() === 'transferencia' ? 'banco' : 'efectivo';
                const { data: cajas } = await supa.from('cajas_capital').select('id, saldo_actual').eq('tipo', tipoCaja).limit(1);
                if (cajas && cajas.length > 0) {
                    await supa.from('cajas_capital').update({ saldo_actual: parseFloat(cajas[0].saldo_actual) - cap }).eq('id', cajas[0].id);
                    
                    const cliInfo = window.creditoSeleccionadoCobro.clientes || {};
                    const nomCliente = `${cliInfo.nombres || ''} ${cliInfo.apellidos || ''}`.toUpperCase().trim();
                    await supa.from('historial_capital').insert([{
                        caja_id: cajas[0].id, monto: -cap,
                        concepto: `REVERSO DE ANULACIÓN: Abono #${abonoABorrar.numero_pago} | ${creText} | ${nomCliente} (Eliminado)`
                    }]);
                }
            }
            
            // Recalcular Fecha de Vencimiento
            if (creditoAct) {
                try {
                    const oldMonto = parseFloat(abonoABorrar.abono_total || 0);
                    const { data: todosPagosActuales } = await supa.from('historial_pagos').select('abono_total').eq('id_credito', creditoAct.id);
                    let pagadoTotalActualizado = todosPagosActuales ? todosPagosActuales.reduce((acc, p) => acc + parseFloat(p.abono_total || 0), 0) : 0;
                    
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
                        if (matchMonto && parseFloat(matchMonto[0]) > 0) valorDeUnaCuota = parseFloat(matchMonto[0]);
                    }

                    const cuotasAntes = Math.floor(totalPagadoAntes / valorDeUnaCuota);
                    const cuotasDespues = Math.floor(pagadoTotalActualizado / valorDeUnaCuota);
                    const diferenciaCuotas = cuotasDespues - cuotasAntes;

                    if (diferenciaCuotas !== 0 && creditoAct.fecha_vencimiento_actual) {
                        let fechaObj = new Date(creditoAct.fecha_vencimiento_actual + 'T12:00:00');
                        if (freq.includes('SEMANAL')) fechaObj.setDate(fechaObj.getDate() + (7 * diferenciaCuotas));
                        else if (freq.includes('QUINCENAL')) fechaObj.setDate(fechaObj.getDate() + (15 * diferenciaCuotas));
                        else if (freq.includes('MENSUAL')) fechaObj.setMonth(fechaObj.getMonth() + (1 * diferenciaCuotas));
                        else if (freq.includes('DIARIO')) fechaObj.setDate(fechaObj.getDate() + (1 * diferenciaCuotas));
                        
                        const nuevaFechaCalculada = fechaObj.toISOString().split('T')[0];
                        await supa.from('creditos').update({ fecha_vencimiento_actual: nuevaFechaCalculada }).eq('id', creditoAct.id);
                    }
                } catch (e) { console.error(e); }
            }

            if (window.creditoSeleccionadoCobro.estado === 'finalizado') {
                 await supa.from('creditos').update({ estado: 'activo' }).eq('id', window.creditoSeleccionadoCobro.id);
            }

            if (enviarSMS) {
                const cli = window.creditoSeleccionadoCobro.clientes || {};
                let numeroCliente = cli.whatsapp; 
                if (!numeroCliente && creditoAct) {
                    const { data: infoDB } = await supa.from('clientes').select('whatsapp').eq('id', creditoAct.cliente_id).single();
                    if (infoDB && infoDB.whatsapp) numeroCliente = infoDB.whatsapp;
                }
                
                if (numeroCliente) {
                    const nombre = `${cli.nombres} ${cli.apellidos}`.toUpperCase();
                    const refFinal = document.getElementById('lbl-recaudacion-ref').innerText.split('|')[0].replace('REF:','').trim();
                    const ahora = new Date();
                    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                    let h = ahora.getHours(); let m = String(ahora.getMinutes()).padStart(2,'0'); const ampm = h >= 12 ? 'p.m.' : 'a.m.';
                    h = h % 12; h = h ? h : 12;
                    const fechaHoraSMS = `${dias[ahora.getDay()]} ${String(ahora.getDate()).padStart(2,'0')}/${meses[ahora.getMonth()]}/${ahora.getFullYear()} | ${String(h).padStart(2,'0')}:${m} ${ampm}`;

                    const nuevoSaldoFinal = parseFloat(window.creditoSeleccionadoCobro.saldoNeto) + parseFloat(abonoABorrar.abono_total);
                    let infoMetodo = `💳 Método: ${abonoABorrar.forma_pago ? abonoABorrar.forma_pago.toUpperCase() : 'EFECTIVO'}`;
                    if (abonoABorrar.forma_pago === 'transferencia' && abonoABorrar.detalles_banco) infoMetodo += `\n🏦 Banco: ${abonoABorrar.detalles_banco}`;

                    const msjAnulacion = `=== SISTEMA ALPHA (Anulación Oficial) ===\n${fechaHoraSMS}\n\n🆔 Ref: ${refFinal} | ${creText}\n👤 Cliente: ${nombre}\n\nPor transparencia y control de auditoría, te notificamos que el siguiente abono ha sido ELIMINADO del sistema por una corrección interna.\n\n❌ Pago Anulado: #${abonoABorrar.numero_pago}\n💰 Monto Reversado: $${parseFloat(abonoABorrar.abono_total).toFixed(2)}\n📈 Saldo Restablecido: $${nuevoSaldoFinal.toFixed(2)}\n${infoMetodo}\n\nTu cuenta está protegida. Conserva este msj.\n🚫 NO RESPONDER A ESTE MENSAJE.`;
                    
                    await invocarSMSDesdeMovil(numeroCliente.toString(), msjAnulacion);
                    await new Promise(r => setTimeout(r, 2000));
                    const nGer = "0939836191";
                    if (numeroCliente.toString().trim() !== nGer) await invocarSMSDesdeMovil(nGer, `[COPIA ANULACIÓN ABONO]\n\n${msjAnulacion}`);
                }
            }

            alert("✅ Abono borrado y FECHAS recalculadas. Respaldado en Bóveda de Pagos (Papelera).");
            await cargarEstadoCuentaCreditoMovil(window.creditoSeleccionadoCobro.id);

        } catch (e) { alert("Error al anular: " + e.message); }
    }

    async function cargarHistorialMovil(idCredito) {
        const contenedor = document.getElementById('lista-historial-abonos');
        contenedor.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 10px;">Cargando historial...</div>';
        const supa = await esperarSupabase();
        if (!supa) return;

        try {
            const { data: pagos, error } = await supa.from('historial_pagos').select('*').eq('id_credito', idCredito).order('fecha_pago', { ascending: false });
            if (error) throw error;
            
            abonosClienteActual = pagos || [];
            paginaActualAbonos = 1;
            renderizarAbonosPaginadosMovil();
            
        } catch(e) {
             contenedor.innerHTML = '<div style="text-align: center; color: #ef4444; padding: 10px;">Error al cargar historial.</div>';
        }
    }
// =========================================================================
    // 📲 ENVÍO DE ESTADO DE CUENTA POR SMS (RESUMEN VIP PARA MÓVIL)
    // =========================================================================
    async function enviarResumenSMS() {
        if (!window.creditoSeleccionadoCobro) {
            alert("⚠️ Selecciona un cliente primero.");
            return;
        }

        // 🛡️ BLINDAJE DE DATOS Y BÚSQUEDA DE WHATSAPP
        let cli = window.creditoSeleccionadoCobro.clientes || {};
        let numeroCliente = cli.whatsapp;

        try {
            const supa = await esperarSupabase();
            
            if (!numeroCliente || numeroCliente.trim() === "") {
                const { data: infoDB } = await supa.from('clientes').select('whatsapp').eq('id', window.creditoSeleccionadoCobro.cliente_id).single();
                if (infoDB && infoDB.whatsapp) numeroCliente = infoDB.whatsapp;
            }

            if (!numeroCliente || numeroCliente.trim() === "") {
                alert("❌ Error: Este cliente NO tiene un número de WhatsApp registrado en la base de datos.");
                return;
            }

            const cobrar = confirm("💰 SERVICIO DE AUDITORÍA SMS\n\n¿Deseas cobrar $1.00 por el envío de este estado de cuenta detallado?\n\n🟢 [ACEPTAR] = Cobrar $1.00\n🔴 [CANCELAR] = Envío GRATIS (Cortesía)");

            // 1. Cobrar si el gerente aceptó
            if (cobrar) {
                const { data: cajaData } = await supa.from('cajas_capital').select('id, saldo_actual').eq('tipo', 'efectivo').limit(1);
                if(cajaData && cajaData.length > 0) {
                    await supa.from('cajas_capital').update({ saldo_actual: parseFloat(cajaData[0].saldo_actual) + 1.00 }).eq('id', cajaData[0].id);
                    await supa.from('historial_capital').insert([{
                        caja_id: cajaData[0].id,
                        monto: 1.00,
                        concepto: `🟢 INGRESO: Servicio Estado de Cuenta SMS - ${cli.nombres} ${cli.apellidos}`
                    }]);
                }
            }

            // 2. Extraer Referencia Completa (Ej: MV-4578 | CRE #[C])
            let refFinalCompleta = "CRE # ?";
            const lblRef = document.getElementById('lbl-recaudacion-ref');
            if (lblRef && lblRef.innerText) {
                const textoRef = lblRef.innerText;
                const partes = textoRef.split('|');
                if (partes.length >= 3) {
                     const refCliente = partes[0].replace('REF:', '').trim();
                     const creParte = partes[2].trim();
                     const matchLetra = creParte.match(/\[.*?\]/);
                     const creLimpio = matchLetra ? `CRE #${matchLetra[0]}` : creParte;
                     refFinalCompleta = `${refCliente} | ${creLimpio}`;
                }
            }

            // 3. Formatear Fecha "Impreso" 
            const ahora = new Date();
            const diasArr = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
            const mesesArr = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            
            let hImp = ahora.getHours();
            let mImp = String(ahora.getMinutes()).padStart(2, '0');
            const ampmImp = hImp >= 12 ? 'p. m.' : 'a. m.';
            hImp = hImp % 12; hImp = hImp ? hImp : 12;
            
            const fechaImpreso = `${diasArr[ahora.getDay()]} ${ahora.getDate()} de ${mesesArr[ahora.getMonth()]} de ${ahora.getFullYear()} a las ${String(hImp).padStart(2,'0')}:${mImp} ${ampmImp}`;

            // 4. Formatear Fecha Original Crédito
            let fechaEmisionCredito = "N/A";
            if (window.creditoSeleccionadoCobro.fecha_emision) {
                const fObj = new Date(window.creditoSeleccionadoCobro.fecha_emision);
                if(!isNaN(fObj.getTime())) {
                    const diaSemanaCap = diasArr[fObj.getDay()].charAt(0).toUpperCase() + diasArr[fObj.getDay()].slice(1);
                    const diaNum = String(fObj.getDate()).padStart(2, '0');
                    const mesNombre = mesesArr[fObj.getMonth()];
                    const anioNum = fObj.getFullYear();
                    fechaEmisionCredito = `${diaSemanaCap} ${diaNum}/${mesNombre}/${anioNum}`;
                }
            }

            // 5. Montos y Cuotas
            let totalPagar = parseFloat(window.creditoSeleccionadoCobro.total_pagar);
            let saldo = parseFloat(window.creditoSeleccionadoCobro.saldoNeto);
            const cuotaFija = parseFloat(window.creditoSeleccionadoCobro.valor_cuota) || 1;
            const cuotasTotales = parseInt(window.creditoSeleccionadoCobro.num_cuotas) || 1;
            
            let cuotasPendientes = Math.ceil(saldo / cuotaFija);
            if (cuotasPendientes < 0) cuotasPendientes = 0;

            // 6. Historial (Últimos 5 pagos)
            let historialTxt = "";
            if (abonosClienteActual && abonosClienteActual.length > 0) {
                let abonosOrdenados = [...abonosClienteActual].sort((a, b) => new Date(a.fecha_pago) - new Date(b.fecha_pago));
                
                const totalAbonado = abonosOrdenados.reduce((sum, abono) => sum + parseFloat(abono.abono_total), 0);
                let saldoEnTransito = saldo + totalAbonado; 
                
                let abonosConSaldo = abonosOrdenados.map(abono => {
                    saldoEnTransito -= parseFloat(abono.abono_total);
                    if (saldoEnTransito < 0) saldoEnTransito = 0;
                    return { ...abono, saldoRestante: saldoEnTransito };
                });

                let ultimos5 = abonosConSaldo.slice(-5);
                
                historialTxt += `\n🧾 ÚLTIMOS 5 MOVIMIENTOS:\n`;
                ultimos5.forEach((abono) => {
                    const fPago = new Date(abono.fecha_pago);
                    const diaFormato = `${String(fPago.getDate()).padStart(2,'0')}/${String(fPago.getMonth()+1).padStart(2,'0')}/${fPago.getFullYear()}`; 
                    const montoPagado = parseFloat(abono.abono_total);
                    
                    historialTxt += `- Pago #${abono.numero_pago || '?'} | ${diaFormato}\n  Abono: $${montoPagado.toFixed(2)} | Queda: $${abono.saldoRestante.toFixed(2)}\n`;
                });
                
                if (abonosConSaldo.length > 5) {
                    const anteriores = abonosConSaldo.length - 5;
                    historialTxt += `(Y ${anteriores} pagos anteriores)\n`;
                }
            } else {
                historialTxt += `\n🧾 MOVIMIENTOS:\nSin abonos registrados.\n`;
            }

            // 7. Ensamblar Mensaje Final
            const etiqueta = cobrar ? "[ESTADO DE CTA] val $1.00\n" : "";
            const msj = `=== SISTEMA ALPHA ===\n${etiqueta}Impreso: ${fechaImpreso}\n\n🆔 Ref: ${refFinalCompleta}\n👤 Cliente: ${cli.nombres.toUpperCase()} ${cli.apellidos.toUpperCase()}\n💳 Cédula: ${cli.cedula || 'N/A'}\n📅 Fecha Crédito: ${fechaEmisionCredito}\n\n📊 Total Crédito: $${totalPagar.toFixed(2)}\n💵 Valor Cuota: $${cuotaFija.toFixed(2)}\n📉 Saldo Pendiente: $${saldo.toFixed(2)}\n🔢 N° Cuotas: ${cuotasTotales} (${cuotasPendientes} Pendientes)\n${historialTxt}\n¡Gracias por tu confianza!\n🚫 NO RESPONDER AL MENSAJE.`;

            // 8. Enviar SMS con la Antena Independiente
            const exitoCliente = await invocarSMSDesdeMovil(numeroCliente.toString(), msj);
            
            if (exitoCliente) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                const numeroGerente = "0939836191"; 
                if (numeroCliente.toString().trim() !== numeroGerente) {
                    await invocarSMSDesdeMovil(numeroGerente, `[COPIA RESUMEN SMS]\n\n${msj}`);
                }
                alert("✅ Resumen SMS enviado a: " + numeroCliente + "\n👮‍♂️ Copia de auditoría enviada al Gerente.");
            } else {
                 alert("⚠️ Error al intentar enviar el Resumen SMS mediante MacroDroid.");
            }

        } catch(e) {
            console.error("Error en Resumen SMS:", e);
            alert("❌ Error al procesar el resumen SMS: " + e.message);
        }
    }

// =========================================================================
    // 📄 GENERADOR DE ESTADO DE CUENTA CORPORATIVO PARA MÓVIL (PDF)
    // =========================================================================
    async function generarEstadoCuentaPDF() {
        if (!window.creditoSeleccionadoCobro || !abonosClienteActual) {
            alert("⚠️ Por favor, selecciona un cliente primero.");
            return;
        }

        // 🔥 Blindaje: Si el celular no tiene cargadas las librerías PDF, las inyecta en vivo
        if (!window.jspdf) {
            alert("⏳ Preparando motor PDF... Haga clic en Aceptar, espere 3 segundos y vuelva a presionar el botón rojo.");
            const script1 = document.createElement('script');
            script1.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
            document.head.appendChild(script1);
            
            const script2 = document.createElement('script');
            script2.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js";
            document.head.appendChild(script2);
            return;
        }

        try {
            const cli = window.creditoSeleccionadoCobro.clientes || {};
            const nombreCompleto = `${cli.nombres || ''} ${cli.apellidos || ''}`.toUpperCase();
            
            let creText = "CRE # ?";
            const lblRef = document.getElementById('lbl-recaudacion-ref');
            if (lblRef && lblRef.innerText) {
                const match = lblRef.innerText.match(/CRE\s*#[^|]+/);
                if (match) {
                    const matchLetra = match[0].trim().match(/\[.*?\]/);
                    creText = matchLetra ? `CRE #${matchLetra[0]}` : match[0].trim();
                }
            }

            let fechaEmisionCredito = "Fecha no disponible";
            if (window.creditoSeleccionadoCobro.fecha_emision) {
                const fObj = new Date(window.creditoSeleccionadoCobro.fecha_emision);
                const mesesArr = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                const diaSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][fObj.getDay()];
                fechaEmisionCredito = `${diaSemana} ${String(fObj.getDate()).padStart(2, '0')}/${mesesArr[fObj.getMonth()]}/${fObj.getFullYear()}`;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // --- ENCABEZADO CORPORATIVO ---
            doc.setFontSize(22);
            doc.setTextColor(16, 185, 129); // Verde Alpha
            doc.text("SISTEMA ALPHA V6", 14, 20);
            
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text("ESTADO DE CUENTA OFICIAL (MÓVIL)", 14, 28);
            
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            const hoy = new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            doc.text(`Impreso: ${hoy}`, 14, 34);

            doc.setDrawColor(200, 200, 200);
            doc.line(14, 38, 196, 38); 
            
            let startYDatos = 46; 
            
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            
            doc.text(`Cliente: ${nombreCompleto}`, 14, startYDatos);
            doc.text(`Cédula: ${cli.cedula || 'N/A'}`, 14, startYDatos + 6);
            doc.text(`Referencia: ${creText}`, 14, startYDatos + 12); 
            doc.text(`Fecha de Crédito: ${fechaEmisionCredito}`, 14, startYDatos + 18); 

            let totalPagar = parseFloat(window.creditoSeleccionadoCobro.total_pagar).toFixed(2);
            const cuotaFija = parseFloat(window.creditoSeleccionadoCobro.valor_cuota).toFixed(2);
            let saldoActual = parseFloat(window.creditoSeleccionadoCobro.saldoNeto).toFixed(2);
            
            const moraPDF = parseFloat(window.creditoSeleccionadoCobro.monto_mora) || 0;
            if(moraPDF > 0) {
                saldoActual = (parseFloat(saldoActual) + moraPDF).toFixed(2);
            }

            const cuotasTotales = parseInt(window.creditoSeleccionadoCobro.num_cuotas) || 1;
            let cuotasPendientes = Math.ceil(parseFloat(saldoActual) / parseFloat(cuotaFija));
            if (cuotasPendientes < 0) cuotasPendientes = 0;

            doc.text(`Total del Crédito: $${totalPagar}`, 120, startYDatos);
            doc.text(`Valor de Cuota: $${cuotaFija}`, 120, startYDatos + 6);
            doc.text(`N° de Cuotas: ${cuotasTotales} (${cuotasPendientes} Pendientes)`, 120, startYDatos + 12);

            let inicioTablaY = startYDatos + 28; 
            if (moraPDF > 0) {
                doc.setTextColor(220, 38, 38); 
                doc.setFont(undefined, 'bold');
                doc.text(`Mora Acumulada: $${moraPDF.toFixed(2)}`, 120, startYDatos + 18);
                doc.setTextColor(0, 0, 0);
                doc.text(`Deuda Total a Pagar: $${saldoActual}`, 120, startYDatos + 24);
                doc.setFont(undefined, 'normal');
                inicioTablaY = startYDatos + 36;
            } else {
                doc.setFont(undefined, 'bold');
                doc.text(`Saldo Pendiente: $${saldoActual}`, 120, startYDatos + 18);
                doc.setFont(undefined, 'normal');
            }

            // --- TABLA HISTÓRICA ---
            let abonosOrdenados = [...abonosClienteActual].sort((a, b) => new Date(a.fecha_pago) - new Date(b.fecha_pago));
            let saldoEnTransito = parseFloat(window.creditoSeleccionadoCobro.total_pagar);
            const filasTabla = [];

            abonosOrdenados.forEach((abono) => {
                const fPago = new Date(abono.fecha_pago);
                const diaNombre = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][fPago.getDay()];
                const mesesArr = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
                const diaNum = `${String(fPago.getDate()).padStart(2, '0')}/${mesesArr[fPago.getMonth()]}/${fPago.getFullYear()}`; 
                
                let h = fPago.getHours();
                let m = String(fPago.getMinutes()).padStart(2, '0');
                const ampm = h >= 12 ? 'p.m.' : 'a.m.';
                h = h % 12; h = h ? h : 12;
                const horaExacta = `${String(h).padStart(2,'0')}:${m} ${ampm}`;
                
                const fechaTabla = `${diaNombre}. ${diaNum} - ${horaExacta}`;
                const montoPagado = parseFloat(abono.abono_total);
                
                saldoEnTransito = saldoEnTransito - montoPagado;
                if (saldoEnTransito < 0) saldoEnTransito = 0;

                filasTabla.push([
                    abono.numero_pago || '-',
                    fechaTabla,
                    abono.forma_pago ? abono.forma_pago.toUpperCase() : 'EFECTIVO',
                    `$${montoPagado.toFixed(2)}`,
                    `$${saldoEnTransito.toFixed(2)}`
                ]);
            });

            doc.autoTable({
                startY: inicioTablaY, 
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

            // --- PIE DE PÁGINA ---
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.setFont(undefined, 'normal');
            doc.text("Este documento es un comprobante de auditoría emitido por Sistema Alpha V6 (Móvil).", 14, finalY + 15);
            doc.text("Las fechas y horas exactas garantizan la validez e inmutabilidad de cada abono.", 14, finalY + 20);

            doc.save(`Estado_Cuenta_${cli.cedula || 'Cliente'}.pdf`);
            
        } catch (error) {
            alert("❌ Error al generar el PDF: " + error.message);
            console.error(error);
        }
    }
    async function cerrarSesion() {
        if(confirm("¿Seguro que desea cerrar sesión en este dispositivo?")) {
            const supa = await esperarSupabase();
            if(supa) await supa.auth.signOut();
            window.location.href = 'index.html'; 
        }
    }
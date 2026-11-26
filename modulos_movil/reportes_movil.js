// =========================================================================
// 👑 CENTRO DE REPORTES E INTELIGENCIA DE NEGOCIO (CLON MÓVIL COMPLETO)
// Archivo: modulos_movil/reportes_movil.js
// =========================================================================

window.inicializarFechasReportesMovil = function() {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const inpDesde = document.getElementById('mega-fecha-desde-movil');
    const inpHasta = document.getElementById('mega-fecha-hasta-movil');
    if (inpDesde && !inpDesde.value) inpDesde.value = fmt(primerDia);
    if (inpHasta && !inpHasta.value) inpHasta.value = fmt(hoy);
};

function obtenerRangoFiltroMovil(valorFiltro) {
    const hoy = new Date();
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    if (valorFiltro === 'actual') {
        const ini = new Date(hoy.getFullYear(), hoy.getMonth(), 1, 0, 0, 0, 0);
        const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59, 999);
        return { ini: ini.toISOString(), fin: fin.toISOString(), titulo: `MES ACTUAL (${meses[hoy.getMonth()].toUpperCase()} ${hoy.getFullYear()})` };
    }
    if (valorFiltro === 'anterior') {
        let m = hoy.getMonth() - 1, a = hoy.getFullYear();
        if (m < 0) { m = 11; a--; }
        const ini = new Date(a, m, 1, 0, 0, 0, 0);
        const fin = new Date(a, m + 1, 0, 23, 59, 59, 999);
        return { ini: ini.toISOString(), fin: fin.toISOString(), titulo: `MES ANTERIOR (${meses[m].toUpperCase()} ${a})` };
    }
    return { ini: new Date(2020, 0, 1).toISOString(), fin: new Date(2050, 11, 31).toISOString(), titulo: 'HISTORIAL COMPLETO' };
}

// =========================================================================
// 1. MEGA-REPORTE: AUDITORÍA CORPORATIVA (PDF)
// =========================================================================
window.generarAuditoriaCorporativaPDFMovil = async function() {
    const fechaDesdeStr = document.getElementById('mega-fecha-desde-movil')?.value;
    const fechaHastaStr = document.getElementById('mega-fecha-hasta-movil')?.value;

    if (!fechaDesdeStr || !fechaHastaStr) { alert("⚠️ Seleccione Fecha de Inicio y Fecha de Corte."); return; }
    if (new Date(fechaDesdeStr) > new Date(fechaHastaStr)) { alert("⚠️ La Fecha de Inicio no puede ser mayor a la de Corte."); return; }

    try {
        alert("⏳ Calculando Estado de Resultados... Presione Aceptar.");
        const supa = window.supabaseClient;
        const isoIni = new Date(`${fechaDesdeStr}T00:00:00`).toISOString();
        const isoFin = new Date(`${fechaHastaStr}T23:59:59`).toISOString();

        const [resPagos, resCreditos, resGastos] = await Promise.all([
            supa.from('historial_pagos').select('*').gte('fecha_pago', isoIni).lte('fecha_pago', isoFin),
            supa.from('creditos').select('*').gte('fecha_emision', isoIni).lte('fecha_emision', isoFin),
            supa.from('gastos_varios').select('*').gte('fecha_gasto', isoIni).lte('fecha_gasto', isoFin)
        ]);

        let capPrestado = 0, capRecuperado = 0, intCobrado = 0, gastosOp = 0;
        (resCreditos.data || []).forEach(c => capPrestado += parseFloat(c.monto_capital || c.monto || 0));
        (resPagos.data || []).forEach(p => { capRecuperado += parseFloat(p.monto_capital || 0); intCobrado += parseFloat(p.monto_interes || 0); });
        (resGastos.data || []).forEach(g => gastosOp += parseFloat(g.monto || 0));
        const utilidadNeta = intCobrado - gastosOp;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('portrait', 'mm', 'a4');
        doc.setFillColor(15, 23, 42); doc.rect(0, 0, 210, 40, 'F');
        doc.setFont("helvetica", "bold"); doc.setFontSize(24); doc.setTextColor(255, 255, 255);
        doc.text("SISTEMA ALPHA V6", 14, 20);
        doc.setFontSize(14); doc.setTextColor(56, 189, 248);
        doc.text("ESTADO DE RESULTADOS Y AUDITORÍA CORPORATIVA", 14, 28);
        doc.setFontSize(10); doc.setTextColor(148, 163, 184); doc.setFont(undefined, 'normal');
        doc.text(`PERIODO AUDITADO: Del ${fechaDesdeStr} al ${fechaHastaStr}`, 14, 34);

        let y = 50;
        doc.setFontSize(14); doc.setTextColor(15, 23, 42); doc.setFont(undefined, 'bold');
        doc.text("1. FLUJO DE EFECTIVO Y CAPITALIZACIÓN", 14, y); y += 10;

        doc.setFillColor(241, 245, 249); doc.roundedRect(14, y, 88, 22, 2, 2, 'F');
        doc.setFontSize(10); doc.setTextColor(71, 85, 105); doc.text("Total Capital Prestado (Inversión)", 18, y + 8);
        doc.setFontSize(16); doc.setTextColor(220, 38, 38); doc.text(`$${capPrestado.toFixed(2)}`, 18, y + 18);

        doc.setFillColor(240, 253, 244); doc.roundedRect(108, y, 88, 22, 2, 2, 'F');
        doc.setFontSize(10); doc.setTextColor(71, 85, 105); doc.text("Total Capital Recuperado", 112, y + 8);
        doc.setFontSize(16); doc.setTextColor(22, 163, 74); doc.text(`$${capRecuperado.toFixed(2)}`, 112, y + 18);

        y += 35;
        doc.setFontSize(14); doc.setTextColor(15, 23, 42);
        doc.text("2. RENTABILIDAD Y GASTOS (ESTADO DE RESULTADOS)", 14, y); y += 10;

        doc.setFillColor(254, 252, 232); doc.roundedRect(14, y, 56, 22, 2, 2, 'F');
        doc.setFontSize(9); doc.setTextColor(161, 98, 7); doc.text("Intereses Brutos", 18, y + 8);
        doc.setFontSize(14); doc.setTextColor(202, 138, 4); doc.text(`+$${intCobrado.toFixed(2)}`, 18, y + 18);

        doc.setFillColor(254, 242, 242); doc.roundedRect(77, y, 56, 22, 2, 2, 'F');
        doc.setFontSize(9); doc.setTextColor(153, 27, 27); doc.text("Gastos Operativos", 81, y + 8);
        doc.setFontSize(14); doc.setTextColor(220, 38, 38); doc.text(`-$${gastosOp.toFixed(2)}`, 81, y + 18);

        doc.setFillColor(15, 23, 42); doc.roundedRect(140, y, 56, 22, 2, 2, 'F');
        doc.setFontSize(9); doc.setTextColor(148, 163, 184); doc.text("UTILIDAD NETA", 144, y + 8);
        doc.setFontSize(16);
        doc.setTextColor(...(utilidadNeta >= 0 ? [52, 211, 153] : [248, 113, 113]));
        doc.text(`${utilidadNeta >= 0 ? '' : '-'}$${Math.abs(utilidadNeta).toFixed(2)}`, 144, y + 18);

        y += 35;
        doc.setFontSize(11); doc.setTextColor(71, 85, 105); doc.setFont(undefined, 'normal');
        doc.text("DIAGNÓSTICO EJECUTIVO:", 14, y); y += 7; doc.setFontSize(10);
        if (utilidadNeta >= 0) {
            doc.text(`La empresa cubrió sus gastos operativos ($${gastosOp.toFixed(2)}) y generó una ganancia neta de $${utilidadNeta.toFixed(2)}.`, 14, y);
        } else {
            doc.text(`ALERTA: Los gastos ($${gastosOp.toFixed(2)}) superaron a los intereses. Déficit de $${Math.abs(utilidadNeta).toFixed(2)}.`, 14, y);
        }

        doc.save(`Auditoria_Corporativa_${fechaDesdeStr}_al_${fechaHastaStr}.pdf`);
    } catch (e) { alert("❌ Error en Auditoría: " + e.message); }
};

// =========================================================================
// 2. BASE DE DATOS DE CLIENTES (EXCEL Y PDF)
// =========================================================================
window.exportarClientesExcelMovil = async function() {
    if (typeof XLSX === 'undefined') { alert("⚠️ Librería Excel no cargada."); return; }
    try {
        const filtro = document.getElementById('filtro-mes-reportes-movil')?.value || 'todos';
        const rango = obtenerRangoFiltroMovil(filtro);
        let q = window.supabaseClient.from('clientes').select('*').neq('estado', 'inactivo').order('id', { ascending: false });
        if (filtro !== 'todos') q = q.gte('created_at', rango.ini).lte('created_at', rango.fin);
        const { data, error } = await q;
        if (error) throw error;
        if (!data || data.length === 0) { alert("⚠️ No hay clientes registrados en este periodo."); return; }

        const filas = data.map(c => ({
            "CÓDIGO": 'CLI-' + String(c.id).padStart(6, '0'),
            "NOMBRES": (c.nombres || '').toUpperCase(),
            "APELLIDOS": (c.apellidos || '').toUpperCase(),
            "CÉDULA / RUC": c.cedula,
            "WHATSAPP": c.whatsapp || 'N/A',
            "CORREO": c.correo || 'N/A',
            "SECTOR": c.sector || 'N/A',
            "RUTA": c.ruta || 'N/A',
            "CATEGORÍA": (c.nivel || 'Bronce').replace(/[^\w\s()]/gi, '').trim()
        }));

        const ws = XLSX.utils.json_to_sheet(filas);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Clientes");
        XLSX.writeFile(wb, `REPORTE_CLIENTES_${filtro.toUpperCase()}.xlsx`);
    } catch (e) { alert("❌ Error Excel Clientes: " + e.message); }
};

window.exportarClientesPDFMovil = async function() {
    try {
        const filtro = document.getElementById('filtro-mes-reportes-movil')?.value || 'todos';
        const rango = obtenerRangoFiltroMovil(filtro);
        let q = window.supabaseClient.from('clientes').select('*').neq('estado', 'inactivo').order('id', { ascending: false });
        if (filtro !== 'todos') q = q.gte('created_at', rango.ini).lte('created_at', rango.fin);
        const { data, error } = await q;
        if (error) throw error;
        if (!data || data.length === 0) { alert("⚠️ No hay clientes registrados en este periodo."); return; }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape', 'mm', 'a4');
        doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(15, 23, 42);
        doc.text("SISTEMA ALPHA V6 - BASE DE DATOS DE CLIENTES", 14, 18);
        doc.setFontSize(10); doc.setTextColor(2, 132, 199);
        doc.text(`PERIODO: ${rango.titulo} | TOTAL: ${data.length} CLIENTES`, 14, 25);

        doc.autoTable({
            startY: 32,
            head: [['CÓDIGO', 'NOMBRES Y APELLIDOS', 'CÉDULA', 'WHATSAPP', 'SECTOR / RUTA', 'NIVEL']],
            body: data.map(c => [
                'CLI-' + String(c.id).padStart(6, '0'),
                `${c.nombres} ${c.apellidos}`.toUpperCase(),
                c.cedula,
                c.whatsapp || 'N/A',
                `${c.sector || ''} (${c.ruta || ''})`,
                (c.nivel || 'Bronce').replace(/[^\w\s()]/gi, '').trim()
            ]),
            theme: 'striped', headStyles: { fillColor: [15, 23, 42] }, styles: { fontSize: 8 }
        });
        doc.save(`REPORTE_CLIENTES_${filtro.toUpperCase()}.pdf`);
    } catch (e) { alert("❌ Error PDF Clientes: " + e.message); }
};

// =========================================================================
// 3. AUDITORÍA DE CARTERA / CRÉDITOS (EXCEL Y PDF)
// =========================================================================
window.exportarCreditosExcelMovil = async function() {
    if (typeof XLSX === 'undefined') { alert("⚠️ Librería Excel no cargada."); return; }
    try {
        const filtro = document.getElementById('filtro-mes-reportes-movil')?.value || 'todos';
        const rango = obtenerRangoFiltroMovil(filtro);
        let q = window.supabaseClient.from('creditos').select('*, clientes(nombres, apellidos, cedula)').order('id', { ascending: false });
        if (filtro !== 'todos') q = q.gte('fecha_emision', rango.ini).lte('fecha_emision', rango.fin);
        const { data, error } = await q;
        if (error) throw error;
        if (!data || data.length === 0) { alert("⚠️ No hay créditos en este periodo."); return; }

        const filas = data.map(c => ({
            "ID CRÉDITO": `CRE #${c.id}`,
            "CLIENTE": c.clientes ? `${c.clientes.nombres} ${c.clientes.apellidos}`.toUpperCase() : 'N/A',
            "CÉDULA": c.clientes?.cedula || 'N/A',
            "CAPITAL ($)": parseFloat(c.monto_capital || 0),
            "TOTAL A PAGAR ($)": parseFloat(c.total_pagar || 0),
            "CUOTA ($)": parseFloat(c.valor_cuota || 0),
            "CUOTAS": c.num_cuotas,
            "MODALIDAD": c.frecuencia_pago || 'Diario',
            "ESTADO": (c.estado || '').toUpperCase()
        }));

        const ws = XLSX.utils.json_to_sheet(filas);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Cartera Creditos");
        XLSX.writeFile(wb, `AUDITORIA_CREDITOS_${filtro.toUpperCase()}.xlsx`);
    } catch (e) { alert("❌ Error Excel Créditos: " + e.message); }
};

window.exportarCreditosPDFMovil = async function() {
    try {
        const filtro = document.getElementById('filtro-mes-reportes-movil')?.value || 'todos';
        const rango = obtenerRangoFiltroMovil(filtro);
        let q = window.supabaseClient.from('creditos').select('*, clientes(nombres, apellidos, cedula)').order('id', { ascending: false });
        if (filtro !== 'todos') q = q.gte('fecha_emision', rango.ini).lte('fecha_emision', rango.fin);
        const { data, error } = await q;
        if (error) throw error;
        if (!data || data.length === 0) { alert("⚠️ No hay créditos en este periodo."); return; }

        let totCap = 0, totProy = 0;
        data.forEach(c => { totCap += parseFloat(c.monto_capital || 0); totProy += parseFloat(c.total_pagar || 0); });

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape', 'mm', 'a4');
        doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(15, 23, 42);
        doc.text("SISTEMA ALPHA V6 - AUDITORÍA DE CARTERA (CRÉDITOS)", 14, 18);
        doc.setFontSize(10); doc.setTextColor(234, 88, 12);
        doc.text(`PERIODO: ${rango.titulo} | CAPITAL COLOCADO: $${totCap.toFixed(2)} | PROYECTADO: $${totProy.toFixed(2)}`, 14, 25);

        doc.autoTable({
            startY: 32,
            head: [['ID', 'CLIENTE', 'CAPITAL', 'TOTAL PAGAR', 'CUOTA', 'MODALIDAD', 'ESTADO']],
            body: data.map(c => [
                `#${c.id}`,
                c.clientes ? `${c.clientes.nombres} ${c.clientes.apellidos}`.toUpperCase() : 'N/A',
                `$${parseFloat(c.monto_capital || 0).toFixed(2)}`,
                `$${parseFloat(c.total_pagar || 0).toFixed(2)}`,
                `$${parseFloat(c.valor_cuota || 0).toFixed(2)}`,
                c.frecuencia_pago || 'Diario',
                (c.estado || '').toUpperCase()
            ]),
            theme: 'striped', headStyles: { fillColor: [15, 23, 42] }, styles: { fontSize: 8 }
        });
        doc.save(`AUDITORIA_CREDITOS_${filtro.toUpperCase()}.pdf`);
    } catch (e) { alert("❌ Error PDF Créditos: " + e.message); }
};

// =========================================================================
// 4. FLUJO DE CAPITAL (PDF)
// =========================================================================
window.exportarCapitalPDFMovil = async function() {
    try {
        const filtro = document.getElementById('filtro-capital-reporte-movil')?.value || 'actual';
        const rango = obtenerRangoFiltroMovil(filtro);
        const { data, error } = await window.supabaseClient
            .from('historial_capital')
            .select('id, created_at, monto, concepto, cajas_capital(nombre_caja)')
            .gte('created_at', rango.ini).lte('created_at', rango.fin)
            .order('created_at', { ascending: false });
        if (error) throw error;
        if (!data || data.length === 0) { alert("⚠️ No hay movimientos de capital en este periodo."); return; }

        let neto = 0;
        data.forEach(m => neto += parseFloat(m.monto || 0));

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('portrait', 'mm', 'a4');
        doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(15, 23, 42);
        doc.text("SISTEMA ALPHA V6 - FLUJO DE CAPITAL", 14, 18);
        doc.setFontSize(10); doc.setTextColor(16, 185, 129);
        doc.text(`PERIODO: ${rango.titulo} | BALANCE NETO DEL PERIODO: $${neto.toFixed(2)}`, 14, 25);

        doc.autoTable({
            startY: 32,
            head: [['FECHA', 'CAJA', 'CONCEPTO', 'MONTO']],
            body: data.map(m => [
                new Date(m.created_at).toLocaleDateString('es-EC'),
                m.cajas_capital?.nombre_caja || 'CAJA',
                (m.concepto || 'MOVIMIENTO').substring(0, 60),
                `${parseFloat(m.monto) >= 0 ? '+' : '-'}$${Math.abs(parseFloat(m.monto)).toFixed(2)}`
            ]),
            theme: 'striped', headStyles: { fillColor: [15, 23, 42] }, styles: { fontSize: 8 }
        });
        doc.save(`REPORTE_CAPITAL_${filtro.toUpperCase()}.pdf`);
    } catch (e) { alert("❌ Error PDF Capital: " + e.message); }
};

// =========================================================================
// 5. BÓVEDA DE UTILIDADES / INTERESES (EXCEL Y PDF)
// =========================================================================
async function obtenerDatosUtilidadesMovil(filtro) {
    const rango = obtenerRangoFiltroMovil(filtro);
    const supa = window.supabaseClient;
    const [resPag, resMan] = await Promise.all([
        supa.from('historial_pagos').select('fecha_pago, monto_interes, forma_pago, id_credito, creditos(clientes(nombres, apellidos))').gt('monto_interes', 0).gte('fecha_pago', rango.ini).lte('fecha_pago', rango.fin),
        supa.from('movimientos_utilidad').select('*').gte('fecha', rango.ini).lte('fecha', rango.fin)
    ]);

    const lista = [];
    (resPag.data || []).forEach(p => {
        const cli = p.creditos?.clientes ? `${p.creditos.clientes.nombres} ${p.creditos.clientes.apellidos}`.toUpperCase() : 'CLIENTE';
        lista.push({ fecha: new Date(p.fecha_pago), tipo: 'COBRO INTERÉS', detalle: `${cli} (CRE #${p.id_credito})`, caja: (p.forma_pago || 'EFECTIVO').toUpperCase(), monto: parseFloat(p.monto_interes || 0) });
    });
    (resMan.data || []).forEach(m => {
        const esRet = m.tipo === 'RETIRO';
        lista.push({ fecha: new Date(m.fecha), tipo: m.tipo, detalle: (m.concepto || 'AJUSTE').toUpperCase(), caja: (m.origen || 'EFECTIVO').toUpperCase(), monto: esRet ? -Math.abs(m.monto) : Math.abs(m.monto) });
    });
    lista.sort((a, b) => b.fecha - a.fecha);
    return { lista, rango };
}

window.exportarUtilidadesExcelMovil = async function() {
    if (typeof XLSX === 'undefined') { alert("⚠️ Librería Excel no cargada."); return; }
    try {
        const filtro = document.getElementById('filtro-mes-reportes-movil')?.value || 'actual';
        const { lista } = await obtenerDatosUtilidadesMovil(filtro);
        if (lista.length === 0) { alert("⚠️ No hay utilidades en este periodo."); return; }

        const filas = lista.map(i => ({
            "FECHA": i.fecha.toLocaleString('es-EC'),
            "OPERACIÓN": i.tipo,
            "CLIENTE / CONCEPTO": i.detalle,
            "CAJA": i.caja,
            "VALOR NETO ($)": i.monto
        }));
        const ws = XLSX.utils.json_to_sheet(filas);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Utilidades");
        XLSX.writeFile(wb, `REPORTE_UTILIDADES_${filtro.toUpperCase()}.xlsx`);
    } catch (e) { alert("❌ Error Excel Utilidades: " + e.message); }
};

window.exportarUtilidadesPDFMovil = async function(idSelector) {
    try {
        const filtro = document.getElementById(idSelector || 'filtro-mes-reportes-movil')?.value || 'actual';
        const { lista, rango } = await obtenerDatosUtilidadesMovil(filtro);
        if (lista.length === 0) { alert("⚠️ No hay utilidades en este periodo."); return; }

        const total = lista.reduce((s, i) => s + i.monto, 0);
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape', 'mm', 'a4');
        doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(15, 23, 42);
        doc.text("SISTEMA ALPHA V6 - BÓVEDA DE UTILIDADES", 14, 18);
        doc.setFontSize(10); doc.setTextColor(124, 58, 237);
        doc.text(`PERIODO: ${rango.titulo} | BALANCE NETO: $${total.toFixed(2)}`, 14, 25);

        doc.autoTable({
            startY: 32,
            head: [['FECHA', 'OPERACIÓN', 'CLIENTE / CONCEPTO', 'CAJA', 'VALOR NETO']],
            body: lista.map(i => [
                i.fecha.toLocaleDateString('es-EC'),
                i.tipo,
                i.detalle,
                i.caja,
                `${i.monto >= 0 ? '+' : '-'}$${Math.abs(i.monto).toFixed(2)}`
            ]),
            theme: 'striped', headStyles: { fillColor: [15, 23, 42] }, styles: { fontSize: 8 }
        });
        doc.save(`REPORTE_UTILIDADES_${filtro.toUpperCase()}.pdf`);
    } catch (e) { alert("❌ Error PDF Utilidades: " + e.message); }
};
// =========================================================================
// 👑 MOTOR DE AUDITORÍA CORPORATIVA Y CIERRE DE EJERCICIO (SISTEMA ALPHA)
// =========================================================================

window.generarAuditoriaCorporativaPDF = async function() {
    const fechaDesdeStr = document.getElementById('mega-fecha-desde').value;
    const fechaHastaStr = document.getElementById('mega-fecha-hasta').value;

    if (!fechaDesdeStr || !fechaHastaStr) {
        alert("⚠️ Gerente, por favor seleccione la Fecha de Inicio y la Fecha de Corte para la auditoría.");
        return;
    }

    if (new Date(fechaDesdeStr) > new Date(fechaHastaStr)) {
        alert("⚠️ La Fecha de Inicio no puede ser mayor a la Fecha de Corte.");
        return;
    }

    try {
        alert("⏳ Calculando Estado de Resultados... Este proceso auditará todas las operaciones de las fechas seleccionadas. Presione Aceptar.");

        // Ajuste estricto de horas para abarcar los días completos
        const inicioDate = new Date(`${fechaDesdeStr}T00:00:00`);
        const finDate = new Date(`${fechaHastaStr}T23:59:59`);
        const isoIni = inicioDate.toISOString();
        const isoFin = finDate.toISOString();

        // 1. EXTRAER TODOS LOS DATOS EN PARALELO PARA MAYOR VELOCIDAD
        const [resPagos, resCreditos, resGastos] = await Promise.all([
            supabaseClient.from('historial_pagos').select('*').gte('fecha_pago', isoIni).lte('fecha_pago', isoFin),
            supabaseClient.from('creditos').select('*').gte('fecha_emision', isoIni).lte('fecha_emision', isoFin),
            supabaseClient.from('gastos_varios').select('*').gte('fecha_gasto', isoIni).lte('fecha_gasto', isoFin)
        ]);

        if (resPagos.error) throw resPagos.error;
        if (resCreditos.error) throw resCreditos.error;
        if (resGastos.error) throw resGastos.error;

        // 2. CÁLCULO DEL ESTADO DE RESULTADOS
        let totalCapitalPrestado = 0;
        let totalCapitalRecuperado = 0;
        let totalInteresCobrado = 0;
        let totalGastosOperativos = 0;

        resCreditos.data.forEach(c => totalCapitalPrestado += parseFloat(c.monto_capital || c.monto || 0));
        resPagos.data.forEach(p => {
            totalCapitalRecuperado += parseFloat(p.monto_capital || 0);
            totalInteresCobrado += parseFloat(p.monto_interes || 0);
        });
        resGastos.data.forEach(g => totalGastosOperativos += parseFloat(g.monto || 0));

        // LA FÓRMULA DE RIQUEZA (UTILIDAD NETA)
        const utilidadNetaReal = totalInteresCobrado - totalGastosOperativos;

        // 3. GENERACIÓN DEL PDF CORPORATIVO
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('portrait', 'mm', 'a4'); 

        // Membrete
        doc.setFillColor(15, 23, 42); 
        doc.rect(0, 0, 210, 40, 'F');
        doc.setFont("helvetica", "bold"); doc.setFontSize(24); doc.setTextColor(255, 255, 255);
        doc.text("SISTEMA ALPHA V6", 14, 20);
        doc.setFontSize(14); doc.setTextColor(56, 189, 248);
        doc.text("ESTADO DE RESULTADOS Y AUDITORÍA CORPORATIVA", 14, 28);
        doc.setFontSize(10); doc.setTextColor(148, 163, 184); doc.setFont(undefined, 'normal');
        doc.text(`PERIODO AUDITADO: Del ${fechaDesdeStr} al ${fechaHastaStr}`, 14, 34);

        let yPos = 50;
        doc.setFontSize(14); doc.setTextColor(15, 23, 42); doc.setFont(undefined, 'bold');
        doc.text("1. FLUJO DE EFECTIVO Y CAPITALIZACIÓN", 14, yPos);
        yPos += 10;

        // Bloques de Capital
        doc.setFillColor(241, 245, 249); doc.roundedRect(14, yPos, 88, 22, 2, 2, 'F');
        doc.setFontSize(10); doc.setTextColor(71, 85, 105); doc.text("Total Capital Prestado (Inversión)", 18, yPos + 8);
        doc.setFontSize(16); doc.setTextColor(220, 38, 38); doc.text(`$${totalCapitalPrestado.toFixed(2)}`, 18, yPos + 18);

        doc.setFillColor(240, 253, 244); doc.roundedRect(108, yPos, 88, 22, 2, 2, 'F');
        doc.setFontSize(10); doc.setTextColor(71, 85, 105); doc.text("Total Capital Recuperado", 112, yPos + 8);
        doc.setFontSize(16); doc.setTextColor(22, 163, 74); doc.text(`$${totalCapitalRecuperado.toFixed(2)}`, 112, yPos + 18);

        yPos += 35;
        doc.setFontSize(14); doc.setTextColor(15, 23, 42); doc.setFont(undefined, 'bold');
        doc.text("2. RENTABILIDAD Y GASTOS (ESTADO DE RESULTADOS)", 14, yPos);
        yPos += 10;

        // Bloques de Rentabilidad
        doc.setFillColor(254, 252, 232); doc.roundedRect(14, yPos, 56, 22, 2, 2, 'F');
        doc.setFontSize(9); doc.setTextColor(161, 98, 7); doc.text("Intereses Brutos", 18, yPos + 8);
        doc.setFontSize(14); doc.setTextColor(202, 138, 4); doc.text(`+$${totalInteresCobrado.toFixed(2)}`, 18, yPos + 18);

        doc.setFillColor(254, 242, 242); doc.roundedRect(77, yPos, 56, 22, 2, 2, 'F');
        doc.setFontSize(9); doc.setTextColor(153, 27, 27); doc.text("Gastos Operativos", 81, yPos + 8);
        doc.setFontSize(14); doc.setTextColor(220, 38, 38); doc.text(`-$${totalGastosOperativos.toFixed(2)}`, 81, yPos + 18);

        // Bloque VIP de Utilidad Neta
        doc.setFillColor(15, 23, 42); doc.roundedRect(140, yPos, 56, 22, 2, 2, 'F');
        doc.setFontSize(9); doc.setTextColor(148, 163, 184); doc.text("UTILIDAD NETA", 144, yPos + 8);
        doc.setFontSize(16); 
        if(utilidadNetaReal >= 0) {
            doc.setTextColor(52, 211, 153); doc.text(`$${utilidadNetaReal.toFixed(2)}`, 144, yPos + 18);
        } else {
            doc.setTextColor(248, 113, 113); doc.text(`-$${Math.abs(utilidadNetaReal).toFixed(2)}`, 144, yPos + 18);
        }

        yPos += 35;
        doc.setFontSize(11); doc.setTextColor(71, 85, 105); doc.setFont(undefined, 'normal');
        doc.text("DIAGNÓSTICO EJECUTIVO:", 14, yPos);
        yPos += 7;
        
        doc.setFontSize(10);
        if (utilidadNetaReal > 0) {
            doc.text(`Durante este periodo, la empresa cubrió todos sus gastos operativos ($${totalGastosOperativos.toFixed(2)}) y generó`, 14, yPos);
            doc.text(`una ganancia neta y libre de $${utilidadNetaReal.toFixed(2)}. Este dinero puede ser retirado como dividendos o`, 14, yPos + 5);
            doc.text(`reinvertido en el Capital General para expandir la cartera de créditos el próximo periodo.`, 14, yPos + 10);
        } else {
            doc.text(`ALERTA: Los gastos operativos ($${totalGastosOperativos.toFixed(2)}) superaron a los ingresos por intereses.`, 14, yPos);
            doc.text(`El periodo presenta un déficit de $${Math.abs(utilidadNetaReal).toFixed(2)}. Evalúe reducir gastos o aumentar la colocación.`, 14, yPos + 5);
        }

        yPos += 30;
        doc.setDrawColor(200, 200, 200); doc.line(14, yPos, 196, yPos);
        yPos += 10;
        doc.setFontSize(9); doc.setTextColor(150, 150, 150); 
        doc.text(`Documento gerencial confidencial. Generado el: ${new Date().toLocaleString('es-EC')}`, 14, yPos);
        doc.text(`Sistema Alpha V6 - Business Intelligence`, 14, yPos + 5);

        // Guardar el documento
        doc.save(`Auditoria_Corporativa_${fechaDesdeStr}_al_${fechaHastaStr}.pdf`);

    } catch (error) {
        console.error("Error al generar Auditoría Corporativa:", error);
        alert("❌ Error al procesar los datos de la auditoría.");
    }
};
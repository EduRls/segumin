import ExcelJS from "exceljs";
import type { IncidenteRow } from "./incidentes.service";

/* Helpers para nombre de archivo */
function getNombreAfectado(row: IncidenteRow) {
    const n = (row as any)?.payload?.personasAfectadas?.[0]?.nombre
        || (row as any)?.payload?.datosGenerales?.reportadoPor
        || "SinNombre";
    return String(n).replace(/\s+/g, " ").trim();
}
function fechaToDDMMYYYY(fechaISO?: string) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(fechaISO || "").trim());
    if (!m) return "00_00_0000";
    const [, y, mo, d] = m;
    return `${d}_${mo}_${y}`;
}
function safeFilename(s: string) {
    return s.replace(/[\\/:*?"<>|]+/g, "").trim();
}

/**
 * LLENA la plantilla Excel **conservando estilos** (ExcelJS).
 * Mapea todos los bloques que indicaste (suponiendo 3 filas por bloque).
 * Deja “Firmas” vacío. En “INCIDENTE” rellena Fecha, Hora, Localización.
 */
export async function exportIncidenteExcelRellenoStyled(
    row: IncidenteRow & { id?: string },
    opts?: { xlsxUrl?: string; sheetName?: string }
) {
    const url = opts?.xlsxUrl ?? "/FO-SSM-001.xlsx";
    const ab = await fetch(url).then(r => r.arrayBuffer());

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(ab);
    const ws = opts?.sheetName ? wb.getWorksheet(opts.sheetName) : wb.worksheets[0];
    if (!ws) throw new Error("No se encontró la hoja en la plantilla.");

    // Apaga gridlines (por si estuvieran visibles)
    ws.views = [{ showGridLines: false }];

    const p = (row as any)?.payload ?? {};
    const DG = p.datosGenerales ?? {};
    const DT = p.detalles ?? {};

    // Utilidad: llenar una columna vertical con valores (hasta la longitud del arreglo/cantidad de celdas)
    const fillDown = (cells: string[], values: (string | undefined)[]) => {
        for (let i = 0; i < cells.length; i++) {
            ws.getCell(cells[i]).value = values[i] ?? "";
        }
    };

    /* ====== DATOS GENERALES (ya los teníamos) ====== */
    ws.getCell("L3").value = DG.fechaReporte || "";
    ws.getCell("C5").value = DG.reportadoPor || "";
    ws.getCell("C6").value = DG.puestoDepartamento || "";
    ws.getCell("I5").value = DG.fechaReporte || "";
    ws.getCell("I6").value = DG.incidenteNo || `#${(row.id || "").slice(0, 6)}`;

    /* ====== INCIDENTE (solo rellena lo que pediste) ====== */
    ws.getCell("C8").value = DT.fechaIncidente || "";   // Fecha del incidente
    ws.getCell("C9").value = DT.horaIncidente || "";    // Hora del incidente
    ws.getCell("G9").value = DG.localizacion || ""; // por si tu payload tiene otro nombre
    // NOTA: me diste "Localización específica → G9". Si tu valor viene en `detalles.areaOcurrencia` o `datosGenerales.localizacion`,
    // cámbialo aquí. Ejemplo:
    // ws.getCell("G9").value = DG.localizacion || DT.areaOcurrencia || "";

    /* ====== PERSONAS AFECTADAS (3 filas) ====== */
    const personas = (p.personasAfectadas ?? []) as Array<{ nombre?: string; puesto?: string }>;
    fillDown(["D14", "D15", "D16"], [personas[0]?.nombre, personas[1]?.nombre, personas[2]?.nombre]);
    fillDown(["I14", "I15", "I16"], [personas[0]?.puesto, personas[1]?.puesto, personas[2]?.puesto]);

    /* ====== ÁREA O PROPIEDAD AFECTADA (4 filas por columna) ====== */
    const areasAfectadas = (p.areaPropiedadAfectada?.areasAfectadas ?? []) as string[];
    const propsAfectadas = (p.areaPropiedadAfectada?.propiedadesAfectadas ?? []) as string[];
    fillDown(["C19", "C20", "C21", "C22"], [areasAfectadas[0], areasAfectadas[1], areasAfectadas[2], areasAfectadas[3]]);
    fillDown(["I19", "I20", "I21", "I22"], [propsAfectadas[0], propsAfectadas[1], propsAfectadas[2], propsAfectadas[3]]);

    /* ====== TESTIGOS (4 filas) ====== */
    const testigos = (p.testigos ?? []) as Array<{ nombre?: string; puesto?: string }>;
    fillDown(["C24", "C25", "C26", "C27"], [testigos[0]?.nombre, testigos[1]?.nombre, testigos[2]?.nombre, testigos[3]?.nombre]);
    fillDown(["I24", "I25", "I26", "I27"], [testigos[0]?.puesto, testigos[1]?.puesto, testigos[2]?.puesto, testigos[3]?.puesto]);

    /* ====== RELATO (A29) ====== */
    ws.getCell("A29").value = p.relatoIncidente || "";
    // (Si quieres forzar wrapText, podríamos hacerlo, pero tocaría el estilo del cell; lo dejo intacto.)

    /* ====== ACCIONES DE CONTENCIÓN (filas 41–44) ====== */
    const cont = (p.accionesContencion ?? []) as Array<{ descripcion?: string; fecha?: string; responsable?: string }>;
    // No.
    fillDown(["A41", "A42", "A43", "A44"], ["1", "2", "3", "4"].map((n, i) => cont[i] ? String(i + 1) : ""));
    // Descripción
    fillDown(["B41", "B42", "B43", "B44"], [cont[0]?.descripcion, cont[1]?.descripcion, cont[2]?.descripcion, cont[3]?.descripcion]);
    // Fecha
    fillDown(["H41", "H42", "H43", "H44"], [cont[0]?.fecha, cont[1]?.fecha, cont[2]?.fecha, cont[3]?.fecha]);
    // Responsable
    fillDown(["I41", "I42", "I43", "I44"], [cont[0]?.responsable, cont[1]?.responsable, cont[2]?.responsable, cont[3]?.responsable]);

    /* ====== ACCIONES PREVENTIVAS / CORRECTIVAS / MEJORA (filas 48–51) ====== */
    const prev = (p.accionesPreventivas ?? []) as Array<{
        descripcion?: string;
        tipoAccion?: "Preventiva" | "Correctiva" | "Mejora";
        fechaCompromiso?: string;
        fechaTermino?: string;
        responsable?: string;
    }>;
    // No.
    fillDown(["A48", "A49", "A50", "A51"], ["1", "2", "3", "4"].map((n, i) => prev[i] ? String(i + 1) : ""));
    // Descripción
    fillDown(["B48", "B49", "B50", "B51"], [prev[0]?.descripcion, prev[1]?.descripcion, prev[2]?.descripcion, prev[3]?.descripcion]);
    // Tipo de acción
    fillDown(["F48", "F49", "F50", "F51"], [prev[0]?.tipoAccion, prev[1]?.tipoAccion, prev[2]?.tipoAccion, prev[3]?.tipoAccion]);
    // Fecha compromiso
    fillDown(["G48", "G49", "G50", "G51"], [prev[0]?.fechaCompromiso, prev[1]?.fechaCompromiso, prev[2]?.fechaCompromiso, prev[3]?.fechaCompromiso]);
    // Fecha de término
    fillDown(["I48", "I49", "I50", "I51"], [prev[0]?.fechaTermino, prev[1]?.fechaTermino, prev[2]?.fechaTermino, prev[3]?.fechaTermino]);
    // Responsable
    fillDown(["K48", "K49", "K50", "K51"], [prev[0]?.responsable, prev[1]?.responsable, prev[2]?.responsable, prev[3]?.responsable]);

    /* ====== Firmas: se dejan vacías ====== */
    // (sin cambios)

    /* ====== ÁREA DE FECHAS DEBAJO DE LAS FIRMAS ====== */
    ws.getCell("A58").value = "Fecha: " + DG.fechaReporte || "";
    ws.getCell("C58").value = "Fecha: " + DG.fechaReporte || "";
    ws.getCell("E58").value = "Fecha: " + DG.fechaReporte || "";
    ws.getCell("G58").value = "Fecha: " + DG.fechaReporte || "";
    ws.getCell("I58").value = "Fecha: " + DG.fechaReporte || "";
    ws.getCell("K58").value = "Fecha: " + DG.fechaReporte || "";

    // ---- Descargar ----
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const nombre = getNombreAfectado(row);
    const fecha = fechaToDDMMYYYY(p?.detalles?.fechaIncidente);
    const filename = safeFilename(`FO-SSM-001_${nombre}_${fecha}.xlsx`);

    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl; a.download = filename; a.click();
    URL.revokeObjectURL(blobUrl);
}

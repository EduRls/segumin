import { supabase } from "../../../lib/supabase/client"; // ajusta si tu ruta es distinta
import type { ResumenArchivo } from "./resumenes.service";

/**
 * Sube múltiples archivos al bucket "resumenes", carpeta por ID del resumen: resumenes/{resumenId}/{filename}
 * Devuelve arreglo con { url, path, name, type, size }.
 */
export async function uploadResumenFiles(resumenId: string, files: File[]): Promise<ResumenArchivo[]> {
  const out: ResumenArchivo[] = [];
  for (const f of files) {
    const cleanName = f.name.replace(/[^\w.\- ]+/g, "_");
    const path = `${resumenId}/${Date.now()}_${cleanName}`;
    const { data, error } = await supabase.storage.from("resumenes").upload(path, f, {
      contentType: f.type || "application/octet-stream",
      upsert: false,
    });
    if (error) throw error;
    const { data: pub } = supabase.storage.from("resumenes").getPublicUrl(path);
    out.push({
      name: f.name,
      url: pub.publicUrl,
      path,
      type: f.type,
      size: f.size,
    });
  }
  return out;
}

/** Borra múltiples rutas del bucket "resumenes". */
export async function deleteResumenFiles(paths: string[]) {
  if (!paths.length) return;
  const { error } = await supabase.storage.from("resumenes").remove(paths);
  if (error) throw error;
}

import { supabase } from "../../../lib/supabase/client";

const BUCKET = (import.meta.env.VITE_SUPABASE_BUCKET as string) || "incident-images";

/** Sube un solo archivo al bucket y retorna la URL pública */
export async function uploadIncidentImage(file: File, folder?: string): Promise<string> {
  const key = `${folder ?? "uploads"}/${crypto.randomUUID()}-${file.name}`.replace(/\s+/g, "_");
  const { data, error } = await supabase.storage.from(BUCKET).upload(key, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return pub.publicUrl;
}

/** Sube múltiples archivos y devuelve las URLs públicas */
export async function uploadIncidentImages(files: File[], folder?: string): Promise<string[]> {
  const urls: string[] = [];
  for (const f of files) {
    urls.push(await uploadIncidentImage(f, folder));
  }
  return urls;
}

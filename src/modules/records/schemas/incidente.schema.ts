// src/modules/records/schemas/incidente.schema.ts
import { z } from "zod";

export const TestigoSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  puesto: z.string().optional(),
});

export const LesionadoSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  puesto: z.string().optional(),
  tipoLesion: z.string().optional(),
});

export const IncidenteSchema = z.object({
  // Datos generales del reporte
  reportadoPor: z.string().min(1, "Campo requerido"),
  puestoDepartamento: z.string().optional(),
  fechaReporte: z.coerce.date(),
  incidenteNo: z.string().optional(),

  // Detalles del incidente
  fechaIncidente: z.coerce.date(),
  horaIncidente: z.string().min(1, "Hora requerida"), // HH:mm
  tipoIncidente: z.enum(["Seguridad", "Ambiental", "Daño a la propiedad"]),
  severidad: z.enum(["Menor", "Moderado", "Mayor", "Crítico"]),
  areaOcurrencia: z.string().min(1, "Área requerida"),
  localizacion: z.string().optional(),

  // Personas afectadas
  lesionados: z.array(LesionadoSchema).default([]),

  // Área o propiedad afectada
  areasAfectadas: z.string().optional(),
  propiedadAfectada: z.string().optional(),
  danoAmbiental: z.string().optional(),
  danoPropiedad: z.string().optional(),

  // Testigos
  testigos: z.array(TestigoSchema).default([]),

  // Acciones de contención
  accionesContencion: z.string().optional(),
  recursosUtilizados: z.string().optional(),

  // Firmas / validación
  firmaResponsable: z.string().optional(),
  firmaSupervisor: z.string().optional(),
  fechaCierre: z.coerce.date().optional(),
});

export type IncidenteDTO = z.infer<typeof IncidenteSchema>;

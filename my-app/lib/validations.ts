import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
});

export const projectSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  clientId: z.string().min(1, "Cliente é obrigatório"),
  status: z.string().optional(),
});

export const memberSchema = z.object({
  userId: z.string().min(1, "Usuário é obrigatório"),
  role: z.string().optional(),
});

export const meetingSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  date: z.string(),
  attendees: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type MemberInput = z.infer<typeof memberSchema>;
export type MeetingInput = z.infer<typeof meetingSchema>;

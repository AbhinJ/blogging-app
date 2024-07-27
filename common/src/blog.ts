import z from "zod";

export const createBlog = z.object({
  title: z.string(),
  content: z.string(),
});

export const updateBlog = z.object({
  id: z.string().uuid(),
  title: z.string().optional(),
  content: z.string().optional(),
});

export type CreateBlog = z.infer<typeof createBlog>;
export type UpdateBlog = z.infer<typeof updateBlog>;

import { z } from 'zod';
export declare const CreateTagRequestSchema: z.ZodObject<{
    tagName: z.ZodString;
}, z.core.$strip>;
export declare const UpdateTagRequestSchema: z.ZodObject<{
    tagId: z.ZodString;
    tagName: z.ZodString;
}, z.core.$strip>;
export type CreateTagRequest = z.infer<typeof CreateTagRequestSchema>;
export type UpdateTagRequest = z.infer<typeof UpdateTagRequestSchema>;
//# sourceMappingURL=tag.d.ts.map
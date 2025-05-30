'use server';

import { suggestTagsAndDescription as genkitSuggestTagsAndDescription, SuggestTagsAndDescriptionInput } from '@/ai/flows/suggest-tags-and-description';
import { z } from 'zod';

const SuggestionInputSchema = z.object({
  templateContent: z.string().min(50, "Template content must be at least 50 characters."),
});

export async function suggestTagsAndDescription(formData: FormData) {
  try {
    const templateContent = formData.get('templateContent') as string;
    
    const validation = SuggestionInputSchema.safeParse({ templateContent });
    if (!validation.success) {
      return { error: validation.error.flatten().fieldErrors.templateContent?.join(', ') || "Invalid input." };
    }

    const input: SuggestTagsAndDescriptionInput = { templateContent: validation.data.templateContent };
    const result = await genkitSuggestTagsAndDescription(input);
    return { data: result };
  } catch (error) {
    console.error("Error in suggestTagsAndDescription action:", error);
    return { error: "Failed to get suggestions from AI. Please try again." };
  }
}

// Placeholder for saving a new template
export async function saveTemplate(formData: FormData) {
  // This is a placeholder. In a real app, you would:
  // 1. Validate formData (e.g., using Zod).
  // 2. Handle file uploads (preview images, ZIP file, README) to a storage service.
  // 3. Save template metadata to a database.
  // 4. Return success or error message.
  
  const title = formData.get('title') as string;
  console.log("Attempting to save template:", title);
  
  // Simulate network delay and success/error
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Example:
  // const { data, error } = await validateAndParseTemplateForm(formData);
  // if (error) return { error };
  // const dbResult = await db.templates.create(data);
  // if (!dbResult) return { error: "Database error" };

  // For demo purposes, always return success after a delay
  return { success: true, message: `Template "${title}" would be saved here.` };
}

'use server';

/**
 * @fileOverview AI-powered tag and description suggestion for templates.
 *
 * This file defines a Genkit flow that takes template content as input and
 * suggests relevant tags and a description for the template.
 *
 * @fileOverview AI-powered tag and description suggestion for templates.
 * @fileOverview AI-powered tag and description suggestion for templates.
 * @fileOverview AI-powered tag and description suggestion for templates.
 *
 * - suggestTagsAndDescription - The main function to trigger the suggestion flow.
 * - SuggestTagsAndDescriptionInput - The input type for the function.
 * - SuggestTagsAndDescriptionOutput - The output type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTagsAndDescriptionInputSchema = z.object({
  templateContent: z
    .string()
    .describe('The content of the template, including code snippets, file names, and directory structure.'),
});
export type SuggestTagsAndDescriptionInput = z.infer<typeof SuggestTagsAndDescriptionInputSchema>;

const SuggestTagsAndDescriptionOutputSchema = z.object({
  tags: z
    .array(z.string())
    .describe('An array of suggested tags for the template, each tag should be a single word or a short phrase.'),
  description:
    z.string().describe('A concise and informative description of the template.'),
});
export type SuggestTagsAndDescriptionOutput = z.infer<typeof SuggestTagsAndDescriptionOutputSchema>;

export async function suggestTagsAndDescription(
  input: SuggestTagsAndDescriptionInput
): Promise<SuggestTagsAndDescriptionOutput> {
  return suggestTagsAndDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTagsAndDescriptionPrompt',
  input: {schema: SuggestTagsAndDescriptionInputSchema},
  output: {schema: SuggestTagsAndDescriptionOutputSchema},
  prompt: `You are an expert in categorizing and describing web application templates.
  Based on the content of the template provided, suggest relevant tags and a concise description.
  The tags should be suitable for filtering and searching the template.

  Template Content:
  {{templateContent}}

  Your suggestions should be accurate, relevant, and helpful for users looking for specific types of templates.
  Return the tags as an array of strings, and the description as a single string.
  Tags should be short and to the point, and reflect the important technologies or use cases of the template.
  The description should be no more than 100 words.
  `,
});

const suggestTagsAndDescriptionFlow = ai.defineFlow(
  {
    name: 'suggestTagsAndDescriptionFlow',
    inputSchema: SuggestTagsAndDescriptionInputSchema,
    outputSchema: SuggestTagsAndDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

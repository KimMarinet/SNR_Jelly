import { z } from "zod";

export const MAX_COMBINATION_CHARACTERS = 5;
export const MAX_COMBINATION_SKILLS = 3;

export const combinationCharacterSchema = z.object({
  characterId: z.number().int().positive(),
  name: z.string().trim().min(1),
  portraitUrl: z.string().trim().min(1),
});

export const combinationSkillSchema = z.object({
  key: z.string().trim().min(1),
  characterId: z.number().int().positive(),
  characterName: z.string().trim().min(1),
  skillName: z.string().trim().min(1),
  skillImageUrl: z.string().trim().min(1),
});

export const postCombinationSchema = z.object({
  characters: z.array(combinationCharacterSchema).max(MAX_COMBINATION_CHARACTERS),
  skills: z.array(combinationSkillSchema).max(MAX_COMBINATION_SKILLS),
});

export type PostCombinationData = z.infer<typeof postCombinationSchema>;
export type CombinationCharacter = z.infer<typeof combinationCharacterSchema>;
export type CombinationSkill = z.infer<typeof combinationSkillSchema>;

export type SelectableCharacter = {
  id: number;
  name: string;
  portraitUrl: string;
  skillOneName: string;
  skillOneImageUrl: string;
  skillTwoName: string;
  skillTwoImageUrl: string;
  passiveName: string;
  passiveImageUrl: string;
};

export function normalizePostCombinationData(value: unknown): PostCombinationData {
  const parsed = postCombinationSchema.safeParse(value);

  if (!parsed.success) {
    return {
      characters: [],
      skills: [],
    };
  }

  return parsed.data;
}

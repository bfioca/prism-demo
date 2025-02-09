import { MARKETING_BRANDING_PERSPECTIVE, SALES_BUSINESS_DEVELOPMENT_PERSPECTIVE, PRODUCT_USER_EXPERIENCE_PERSPECTIVE, ENGINEERING_TECHNICAL_ARCHITECTURE_PERSPECTIVE, FINANCE_FUNDRAISING_PERSPECTIVE, OPERATIONS_SUPPLY_CHAIN_PERSPECTIVE, PEOPLE_CULTURE_PERSPECTIVE, SPECIALTY_PERSPECTIVES } from "./specialties";
import { createConflictPrompt } from "../conflict";

export const marketingBrandingConflictPrompt = createConflictPrompt(MARKETING_BRANDING_PERSPECTIVE);
export const salesBusinessDevelopmentConflictPrompt = createConflictPrompt(SALES_BUSINESS_DEVELOPMENT_PERSPECTIVE);
export const productUserExperienceConflictPrompt = createConflictPrompt(PRODUCT_USER_EXPERIENCE_PERSPECTIVE);
export const engineeringTechnicalArchitectureConflictPrompt = createConflictPrompt(ENGINEERING_TECHNICAL_ARCHITECTURE_PERSPECTIVE);
export const financeFundraisingConflictPrompt = createConflictPrompt(FINANCE_FUNDRAISING_PERSPECTIVE);
export const operationsSupplyChainConflictPrompt = createConflictPrompt(OPERATIONS_SUPPLY_CHAIN_PERSPECTIVE);
export const peopleCultureConflictPrompt = createConflictPrompt(PEOPLE_CULTURE_PERSPECTIVE);

export const specialtyConflictPrompts = [
  marketingBrandingConflictPrompt,
  salesBusinessDevelopmentConflictPrompt,
  productUserExperienceConflictPrompt,
  engineeringTechnicalArchitectureConflictPrompt,
  financeFundraisingConflictPrompt,
  operationsSupplyChainConflictPrompt,
  peopleCultureConflictPrompt,
];

export const specialtyConflictPromptMaps = specialtyConflictPrompts.map((prompt, index) => ({
  prompt,
  perspective: SPECIALTY_PERSPECTIVES[index],
}));

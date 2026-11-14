// src/domain/inventory/calculator.ts: Логика калькулятора расхода на 1 литр базы

import { RecipeIngredient } from '../../types';

export interface BatchRequirementItem {
  name: string;
  unit: string;
  required: number;
  available: number;
  willBe: number;
  warning: string | null;
}

/**
 * Пересчет потребности ингредиентов на N литров партии со сравнением с текущим остатком на складе
 */
export function calculateBatchRequirements(
  ingredients: RecipeIngredient[],
  targetVolumeLiters: number,
  currentStock: Record<string, number>
): BatchRequirementItem[] {
  return ingredients.map((ing) => {
    let required = ing.qty * targetVolumeLiters;
    const available = currentStock[ing.name.toLowerCase()] ?? 0;

    // Округление до 2 знаков
    required = Math.round(required * 100) / 100;
    const willBe = Math.round((available - required) * 100) / 100;
    const isDeficit = willBe < 0;

    return {
      name: ing.name,
      unit: ing.unit,
      required,
      available,
      willBe,
      warning: isDeficit ? `Нехватка ${Math.abs(willBe)} ${ing.unit} на складе` : null
    };
  });
}

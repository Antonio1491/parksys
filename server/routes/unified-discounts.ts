import { Router } from 'express';

export const unifiedDiscountRouter = Router();

// Función helper para calcular descuentos unificados
export function calculateUnifiedDiscounts(
  basePrice: number,
  discounts: {
    discountSeniors?: number;
    discountStudents?: number;
    discountFamilies?: number;
    discountDisability?: number;
    discountEarlyBird?: number;
  },
  earlyBirdDeadline?: string
): {
  originalAmount: number;
  finalAmount: number;
  totalDiscountPercentage: number;
  appliedDiscounts: string[];
  discountBreakdown: Record<string, number>;
} {
  const originalAmount = basePrice;
  let totalDiscountPercentage = 0;
  const appliedDiscounts: string[] = [];
  const discountBreakdown: Record<string, number> = {};

  // Aplicar descuento por adultos mayores
  if (discounts.discountSeniors && discounts.discountSeniors > 0) {
    totalDiscountPercentage += discounts.discountSeniors;
    appliedDiscounts.push(`Adultos mayores: ${discounts.discountSeniors}%`);
    discountBreakdown.seniors = discounts.discountSeniors;
  }

  // Aplicar descuento por estudiantes
  if (discounts.discountStudents && discounts.discountStudents > 0) {
    totalDiscountPercentage += discounts.discountStudents;
    appliedDiscounts.push(`Estudiantes: ${discounts.discountStudents}%`);
    discountBreakdown.students = discounts.discountStudents;
  }

  // Aplicar descuento por familias
  if (discounts.discountFamilies && discounts.discountFamilies > 0) {
    totalDiscountPercentage += discounts.discountFamilies;
    appliedDiscounts.push(`Familias: ${discounts.discountFamilies}%`);
    discountBreakdown.families = discounts.discountFamilies;
  }

  // Aplicar descuento por discapacidad
  if (discounts.discountDisability && discounts.discountDisability > 0) {
    totalDiscountPercentage += discounts.discountDisability;
    appliedDiscounts.push(`Discapacidad: ${discounts.discountDisability}%`);
    discountBreakdown.disability = discounts.discountDisability;
  }

  // Aplicar descuento por reserva temprana (verificar fecha límite)
  if (discounts.discountEarlyBird && discounts.discountEarlyBird > 0) {
    const isEarlyBird = earlyBirdDeadline ? new Date() <= new Date(earlyBirdDeadline) : true;
    if (isEarlyBird) {
      totalDiscountPercentage += discounts.discountEarlyBird;
      appliedDiscounts.push(`Reserva temprana: ${discounts.discountEarlyBird}%`);
      discountBreakdown.earlyBird = discounts.discountEarlyBird;
    }
  }

  // Limitar el descuento total al 100%
  totalDiscountPercentage = Math.min(totalDiscountPercentage, 100);

  // Calcular monto final
  const discountAmount = (originalAmount * totalDiscountPercentage) / 100;
  const finalAmount = Math.max(0, originalAmount - discountAmount);

  return {
    originalAmount,
    finalAmount,
    totalDiscountPercentage,
    appliedDiscounts,
    discountBreakdown
  };
}

// Endpoint para validar y calcular descuentos
unifiedDiscountRouter.post('/validate-discounts', (req, res) => {
  try {
    const { basePrice, discounts, earlyBirdDeadline } = req.body;

    if (!basePrice || basePrice <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un precio base válido'
      });
    }

    const result = calculateUnifiedDiscounts(basePrice, discounts || {}, earlyBirdDeadline);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error validando descuentos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

export default unifiedDiscountRouter;
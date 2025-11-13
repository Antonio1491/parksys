import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// ============================================
// UTILIDADES DE FECHAS (Multi-timezone)
// ============================================

/**
 * Formatea fecha UTC a formato legible en zona local del usuario
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "N/A";

  try {
    const dateStr = typeof date === 'string' ? date : date.toISOString();

    // Extraer año, mes, día directamente del string ISO (antes del 'T')
    const [datePart] = dateStr.split('T');
    const [year, month, day] = datePart.split('-').map(Number);

    // Crear fecha en UTC sin conversión de timezone
    const dateObj = new Date(Date.UTC(year, month - 1, day));

    return dateObj.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC"  // ✅ Forzar interpretación en UTC
    });
  } catch {
    return "N/A";
  }
}

/**
 * Formatea fecha UTC para input type="date" (YYYY-MM-DD)
 */
export function formatDateForInput(date: string | Date): string {
  const dateObj = new Date(date);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Obtiene fecha actual para input type="date"
 */
export function getTodayInputValue(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Obtiene fecha relativa (+/- días) para input type="date"
 */
export function getRelativeDateInputValue(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
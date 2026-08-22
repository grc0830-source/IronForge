export type MeasurementSystem = "imperial" | "metric";

const POUNDS_PER_KILOGRAM = 2.2046226218;
const CENTIMETERS_PER_INCH = 2.54;

function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function kgToLb(kilograms: number): number {
  return round(kilograms * POUNDS_PER_KILOGRAM);
}

export function lbToKg(pounds: number): number {
  return round(pounds / POUNDS_PER_KILOGRAM);
}

export function cmToFeetInches(centimeters: number): {
  feet: number;
  inches: number;
} {
  if (!Number.isFinite(centimeters) || centimeters <= 0) {
    return { feet: 0, inches: 0 };
  }

  const totalInches = centimeters / CENTIMETERS_PER_INCH;
  let feet = Math.floor(totalInches / 12);
  let inches = Math.round((totalInches - feet * 12) * 10) / 10;

  if (inches >= 12) {
    feet += 1;
    inches = 0;
  }

  return { feet, inches };
}

export function feetInchesToCm(feet: number, inches: number): number {
  if (
    !Number.isFinite(feet) ||
    !Number.isFinite(inches) ||
    feet < 0 ||
    inches < 0
  ) {
    return Number.NaN;
  }

  return round((feet * 12 + inches) * CENTIMETERS_PER_INCH);
}

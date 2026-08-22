export const EQUIPMENT_OPTIONS = [
  "full_gym",
  "barbell",
  "dumbbell",
  "cable",
  "machine",
  "bodyweight",
  "kettlebell",
  "band",
  "cardio",
  "functional",
] as const;

export type EquipmentOption = (typeof EQUIPMENT_OPTIONS)[number];

export const EQUIPMENT_LABELS: Record<EquipmentOption, string> = {
  band: "Resistance bands",
  barbell: "Barbell",
  bodyweight: "Bodyweight",
  cable: "Cable station",
  cardio: "Cardio equipment",
  dumbbell: "Dumbbells",
  full_gym: "Full gym",
  functional: "Functional / CrossFit equipment",
  kettlebell: "Kettlebells",
  machine: "Machines",
};

export type EquipmentCategory = EquipmentOption | "other";

export function classifyEquipment(value: string | null): EquipmentCategory {
  const equipment = value?.toLocaleLowerCase().trim() ?? "";

  if (!equipment || equipment.includes("body")) return "bodyweight";
  if (equipment.includes("barbell") || equipment.includes("rack")) return "barbell";
  if (equipment.includes("dumbbell")) return "dumbbell";
  if (equipment.includes("cable")) return "cable";
  if (equipment.includes("machine")) return "machine";
  if (
    equipment.includes("medicine") ||
    equipment.includes("sandbag") ||
    equipment.includes("plyo") ||
    equipment.includes("box") ||
    equipment.includes("rope") ||
    equipment.includes("ring") ||
    equipment.includes("rig") ||
    equipment.includes("sled") ||
    equipment.includes("tire")
  ) return "functional";
  if (equipment.includes("kettlebell")) return "kettlebell";
  if (equipment.includes("band")) return "band";
  if (
    equipment.includes("bike") ||
    equipment.includes("rower") ||
    equipment.includes("treadmill") ||
    equipment.includes("ski") ||
    equipment.includes("elliptical") ||
    equipment.includes("stair") ||
    equipment.includes("pool") ||
    equipment.includes("cardio")
  ) return "cardio";

  return "other";
}

export function equipmentIsAvailable(
  equipment: string | null,
  available: EquipmentOption[],
): boolean {
  const category = classifyEquipment(equipment);

  return (
    available.includes("full_gym") ||
    (category !== "other" && available.includes(category))
  );
}

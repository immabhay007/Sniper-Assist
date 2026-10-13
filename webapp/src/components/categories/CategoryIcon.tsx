import { getCategoryIcon } from "@/config/categoryIcons";
import { resolveCategoryIconKey } from "@/utils/categoryIcon";

export default function CategoryIcon({ iconKey, className = "size-6" }) {
  const Icon = getCategoryIcon(resolveCategoryIconKey(iconKey));
  return <Icon className={className} aria-hidden />;
}

import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MacroNutrients } from "./MacroNutrients";
import { MealHeader } from "./MealHeader";
import { MealIngredients } from "./MealIngredients";

interface MealCardProps {
  meal: any;
  onDelete: (id: string) => void;
}

export function MealCard({ meal, onDelete }: MealCardProps) {
  return (
    <div className="glass-card rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg group">
      {meal.image_url && (
        <div className="relative aspect-video">
          <img
            src={meal.image_url}
            alt={meal.name}
            className="w-full h-full object-cover"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
            onClick={() => onDelete(meal.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          {meal.quantity > 1 && (
            <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-sm font-medium">
              x{meal.quantity}
            </div>
          )}
        </div>
      )}
      <div className="p-4 space-y-4">
        <MealHeader meal={meal} />
        <MacroNutrients meal={meal} />
        <MealIngredients ingredients={meal.ingredients} />
      </div>
    </div>
  );
}
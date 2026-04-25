import { format } from "date-fns";
import { es } from "date-fns/locale";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const formatCardDate = (date: string | Date): string => {
  const [day, month] = format(new Date(date), "d MMM", { locale: es }).split(" ");
  return `${day} ${capitalize(month)}`;
};

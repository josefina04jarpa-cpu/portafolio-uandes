import type { SubdireccionCardData } from "../lib/subdirecciones";
import SubdireccionCard from "./SubdireccionCard";

type Props = {
  items: SubdireccionCardData[];
};

export default function SubdireccionesGrid({ items }: Props) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <SubdireccionCard key={item.slug} item={item} />
      ))}
    </div>
  );
}

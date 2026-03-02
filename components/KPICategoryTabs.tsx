"use client";

type Props = {
  categories: string[];
  activeCategory: string;
  onChange: (category: string) => void;
};

export default function KPICategoryTabs({ categories, activeCategory, onChange }: Props) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max items-center gap-2 pb-1">
        {categories.map((category) => {
          const isActive = category === activeCategory;
          return (
            <button
              key={category}
              type="button"
              onClick={() => onChange(category)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                isActive
                  ? "border-slate-300 bg-slate-100 text-slate-900"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
}

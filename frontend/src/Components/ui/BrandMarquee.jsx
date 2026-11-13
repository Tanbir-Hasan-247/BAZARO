const MARQUEE_ITEMS = [
  { label: "BAZARO MAISON", accent: "Banani Atelier • Dhaka" },
  { label: "AUTHENTICATED HOROLOGY", accent: "Serialized Swiss & Japanese" },
  { label: "ROYAL OUD & PARFUMERY", accent: "Small-Batch Extrait" },
  { label: "INSURED PRIORITY DISPATCH", accent: "64 Districts Covered" },
  { label: "PATRON PRIVILEGE", accent: "Code BAZARO20" },
];

const BrandMarquee = () => {
  return (
    <div
      aria-label="Maison highlights marquee"
      className="marquee-track w-full bg-[#100C09] border-y border-[#C59B4B]/25 py-3 overflow-hidden select-none"
    >
      <div className="animate-bazaro-marquee flex items-center whitespace-nowrap">
        {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map(
          (item, index) => (
            <div
              key={`${item.label}-${index}`}
              className="inline-flex items-center gap-3 px-6 sm:px-8"
            >
              <span
                aria-hidden="true"
                className="w-1 h-1 rounded-full bg-[#C59B4B]"
              />
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.26em] text-[#F6E3B4]">
                {item.label}
              </span>
              <span className="font-serif-editorial italic text-sm text-[#B8AB98]">
                {item.accent}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default BrandMarquee;

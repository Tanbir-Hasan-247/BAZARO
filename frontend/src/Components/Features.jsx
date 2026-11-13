import { FiLock, FiShield, FiTag, FiTruck } from "react-icons/fi";

const ATELIER_PILLARS = [
  {
    index: "01",
    icon: FiTruck,
    title: "Insured Nationwide Dispatch",
    detail:
      "Temperature-controlled signature packaging dispatched within 24 hours across all 64 districts.",
    caption: "Complimentary over $50",
  },
  {
    index: "02",
    icon: FiShield,
    title: "Verified Atelier Provenance",
    detail:
      "Every timepiece, fragrance, and acoustic instrument passes multi-point studio inspection.",
    caption: "Maison Authenticity Seal",
  },
  {
    index: "03",
    icon: FiTag,
    title: "Private Patron Privileges",
    detail:
      "Early vault access and seasonal member allocations unlocked with curated privilege codes.",
    caption: "Privilege Code: BAZARO20",
  },
  {
    index: "04",
    icon: FiLock,
    title: "Encrypted Royal Settlement",
    detail:
      "Seamless digital checkout supporting bKash, Nagad, Visa, and Mastercard with protected invoicing.",
    caption: "256-Bit Bank Security",
  },
];

const Features = () => {
  return (
    <section
      aria-label="Maison standards and guarantees"
      className="bg-[#FAF5EB] text-[#1F1916] px-4 sm:px-6 lg:px-8 py-12 sm:py-16"
    >
      <div className="max-w-7xl mx-auto">
        <div className="border-y border-[#C59B4B]/24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#C59B4B]/20">
          {ATELIER_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.index}
                className="group py-7 sm:py-9 px-2 sm:px-6 lg:px-7 flex flex-col justify-between transition-colors hover:bg-[#FDF9F1]/70"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-serif-editorial text-2xl italic font-semibold text-[#9E7831] bazaro-tabular">
                      {pillar.index}
                    </span>
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-[#C59B4B]/28 text-[#7D5E26] group-hover:bg-[#1A1512] group-hover:text-[#E5C77A] group-hover:border-[#1A1512] transition-colors">
                      <Icon className="w-4 h-4" />
                    </span>
                  </div>

                  <h3 className="mt-5 font-serif-editorial text-xl font-semibold text-[#1F1916] leading-snug">
                    {pillar.title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-[13px] text-[#5C4E41] leading-relaxed">
                    {pillar.detail}
                  </p>
                </div>

                <p className="mt-5 pt-3 border-t border-[#C59B4B]/14 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8E6A28]">
                  {pillar.caption}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;

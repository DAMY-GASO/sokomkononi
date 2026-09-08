import React from "react";
import { Link } from "react-router-dom";

export default function CategoryStalls() {
  const stalls = [
    { name: "Nyumba", count: "3,200+", img: "https://picsum.photos/seed/nyumba/600/500" },
    { name: "Viwanja", count: "2,100+", img: "https://picsum.photos/seed/viwanja/600/500" },
    { name: "Magari", count: "2,800+", img: "https://picsum.photos/seed/magari/600/500" },
    { name: "Biashara", count: "900+", img: "https://picsum.photos/seed/biashara/600/500" },
    { name: "Mashine", count: "600+", img: "https://picsum.photos/seed/mashine/600/500" },
  ];

  return (
    <section className="bg-night py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl md:text-2xl font-bold text-sand mb-6 md:mb-8">
          Kategoria Maarufu
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {stalls.map((s) => (
            <Link
              key={s.name}
              to="/dashboard"
              className="relative group overflow-hidden rounded-lg h-48 md:h-56 hover:scale-[1.02] transition-transform duration-300"
            >
              <img
                src={s.img}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-night/90 via-night/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-4">
                <p className="text-sand font-semibold text-sm md:text-base">{s.name}</p>
                <p className="text-gold text-sm font-bold tabular-nums mt-0.5">
                  {s.count}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

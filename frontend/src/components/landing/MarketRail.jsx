import React from "react";
import { mockListings } from "./mockListings.js";

// "Market Rail" — mstari unaotembea wa bidhaa halisi, unaonyesha msongamano
// wa soko hata kabla mtu hajajisajili (tazama muongozo 2). Hii ndiyo moment
// pekee ya motion kwenye ukurasa — inasimama ukiweka mouse juu yake.
export default function MarketRail() {
  const doubled = [...mockListings, ...mockListings];

  return (
    <div className="overflow-hidden py-4 border-y border-white/10">
      <div className="flex gap-4 w-max market-rail-track">
        {doubled.map((item, i) => (
          <div
            key={`${item.id}-${i}`}
            className="w-56 shrink-0 bg-night-2 rounded-lg overflow-hidden border border-white/10"
          >
            <img src={item.img} alt="" className="w-full h-28 object-cover" />
            <div className="p-2.5">
              <p className="text-sand text-xs font-medium truncate">{item.title}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-gold text-sm font-bold tabular-nums">
                  TZS {item.price}
                </span>
                <span className="text-sand/50 text-[11px]">{item.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

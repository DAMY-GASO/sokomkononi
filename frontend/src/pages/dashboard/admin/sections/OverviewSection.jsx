return (
  <>
    <SectionHeader
      title={
        lang === "sw" ? "Muhtasari & Uchanganuzi" : "Overview & Analytics"
      }
      subtitle={
        lang === "sw"
          ? "Muhtasari wa mfumo mzima wa SokoMkononi"
          : "Overview of the entire SokoMkononi system"
      }
    />

    {/* Grid ya stats za kawaida */}
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
      {stats.map((stat) => (
        <StatCard key={stat.id} {...stat} />
      ))}
    </div>

    {/* ⬇️ MPYA: Total Revenue — kadi kubwa chini ya grid */}
    <div
      className="rounded-2xl p-5 sm:p-7 lg:p-8 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 lg:gap-8"
      style={{
        background: `linear-gradient(135deg, ${COLORS.night} 0%, #1a2842 100%)`,
        color: COLORS.sand,
      }}
    >
      {/* Kiasi kikubwa cha mapato */}
      <div className="flex items-center gap-4 min-w-0">
        <div
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(232,163,61,0.18)" }}
        >
          <Wallet size={28} color={COLORS.gold} />
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider opacity-70">
            {lang === "sw" ? "Mapato ya Jumla" : "Total Revenue"}
          </p>
          <p className="text-[clamp(1.75rem,6vw,3rem)] font-bold mt-1 break-words leading-tight tabular-nums">
            {formatTZS(totalRevenue)}
          </p>
          {revenueIsPlatformWide ? (
            <p className="text-xs sm:text-sm mt-2 opacity-70">
              {lang === "sw"
                ? "Mapato yote ya jukwaa kutoka vyanzo vyote"
                : "All platform revenue from every source"}
            </p>
          ) : (
            <p
              className="text-[11px] sm:text-xs mt-2 inline-block px-2 py-0.5 rounded"
              style={{ background: "rgba(232,163,61,0.18)", color: COLORS.gold }}
            >
              {lang === "sw"
                ? "⚠️ Kikokotoo cha jumla hakijapatikana — inaonyesha miamala yako pekee"
                : "⚠️ Platform total unavailable — showing your transactions only"}
            </p>
          )}
        </div>
      </div>

      {/* Breakdown ya mapato kwa aina */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 w-full lg:w-auto shrink-0">
        <RevenueBreakdown
          label={lang === "sw" ? "Listing Fee" : "Listing Fee"}
          value={transactions
            .filter((t) => t.type === "listing_fee" && t.status === "completed")
            .reduce((s, t) => s + (t.amount || 0), 0)}
          color={COLORS.gold}
        />
        <RevenueBreakdown
          label={lang === "sw" ? "Reservation" : "Reservation"}
          value={transactions
            .filter((t) => t.type === "reservation" && t.status === "completed")
            .reduce((s, t) => s + (t.amount || 0), 0)}
          color={COLORS.green}
        />
        <RevenueBreakdown
          label={lang === "sw" ? "Boost" : "Boost"}
          value={transactions
            .filter((t) => t.type === "boost" && t.status === "completed")
            .reduce((s, t) => s + (t.amount || 0), 0)}
          color="#2563EB"
        />
        <RevenueBreakdown
          label={lang === "sw" ? "Leading" : "Leading"}
          value={transactions
            .filter((t) => t.type === "leading" && t.status === "completed")
            .reduce((s, t) => s + (t.amount || 0), 0)}
          color="#7C3AED"
        />
        <RevenueBreakdown
          label={lang === "sw" ? "Ads" : "Ads"}
          value={transactions
            .filter((t) => t.type === "advertisement" && t.status === "completed")
            .reduce((s, t) => s + (t.amount || 0), 0)}
          color={COLORS.rust}
        />
      </div>
    </div>

    {/* Chart ya mapato ya siku 7 */}
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 mb-6">
      <h3 className="font-semibold text-primary flex items-center gap-2 text-sm sm:text-base mb-4">
        <TrendingUp size={16} color={COLORS.gold} className="shrink-0" />
        {lang === "sw"
          ? "Mapato ya SokoMkononi — Siku 7 Zilizopita"
          : "SokoMkononi Revenue — Last 7 Days"}
      </h3>
      <div className="flex items-end gap-2 sm:gap-3 h-36 sm:h-44">
        {revenueByDay.map((d) => {
          const heightPct = Math.max((d.total / maxDayRevenue) * 100, 2);
          return (
            <div
              key={d.key}
              className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full"
            >
              <span className="text-[9px] sm:text-[10px] text-muted truncate max-w-full">
                {d.total > 0 ? formatTZS(d.total) : ""}
              </span>
              <div
                title={formatTZS(d.total)}
                style={{ height: `${heightPct}%`, background: COLORS.gold }}
                className="w-full rounded-t-md min-h-[2px]"
              />
              <span className="text-[10px] sm:text-xs text-secondary">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>

    {/* Live Transactions */}
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 mb-6">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h3 className="font-semibold text-primary flex items-center gap-2 text-sm sm:text-base">
          <Clock size={16} color={COLORS.gold} className="shrink-0" />
          {lang === "sw"
            ? "Live Transactions Zinazoendelea"
            : "Live Transactions in Progress"}
        </h3>
        <button
          onClick={() => onNavigate("deals")}
          className="text-xs font-semibold hover:underline flex items-center gap-1 shrink-0"
          style={{ color: COLORS.gold }}
        >
          {lang === "sw" ? "Nenda Deal Rooms" : "Go to Deal Rooms"}
          <ArrowRight size={12} />
        </button>
      </div>
      {activeDeals.length === 0 ? (
        <p className="text-sm text-muted text-center py-6">
          {lang === "sw"
            ? "Hakuna deals zinazoendelea kwa sasa."
            : "No active deals right now."}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {activeDeals.slice(0, 5).map((d) => (
            <div
              key={d.id}
              className="border rounded-lg px-3 py-3"
              style={{ borderColor: COLORS.sandLine }}
            >
              {/* Mobile */}
              <div className="sm:hidden">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-sm font-semibold text-primary min-w-0 flex-1 line-clamp-2">
                    {d.listingTitle}
                  </p>
                  <div className="shrink-0">
                    <StatusBadge status={d.status} lang={lang} />
                  </div>
                </div>
                <p className="text-xs text-secondary truncate mb-2">
                  {d.buyerName} ← → {d.sellerName}
                </p>
                <p
                  className="text-sm font-bold"
                  style={{ color: COLORS.rust }}
                >
                  {formatTZS(d.currentOffer ?? d.askingPrice)}
                </p>
              </div>
              {/* Desktop */}
              <div className="hidden sm:flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-primary truncate">
                    {d.listingTitle}
                  </p>
                  <p className="text-xs text-secondary truncate">
                    {d.buyerName} ← → {d.sellerName}
                  </p>
                </div>
                <span
                  className="text-sm font-bold shrink-0"
                  style={{ color: COLORS.rust }}
                >
                  {formatTZS(d.currentOffer ?? d.askingPrice)}
                </span>
                <div className="shrink-0">
                  <StatusBadge status={d.status} lang={lang} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </>
);
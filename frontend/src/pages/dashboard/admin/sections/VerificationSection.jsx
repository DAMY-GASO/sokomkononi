{/* Tabs */}
<div className="flex gap-2 mb-5 overflow-x-auto pb-2 w-full min-w-0">
  {TABS.map(({ key, label, icon: Icon }) => {
    const isActive = activeTab === key;
    return (
      <button
        key={key}
        onClick={() => setActiveTab(key)}
        style={{
          background: isActive ? COLORS.night : "white",
          color: isActive ? COLORS.sand : COLORS.night,
          borderColor: COLORS.sandLine,
        }}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full border whitespace-nowrap shrink-0"
      >
        <Icon size={13} />
        {label?.[lang] || label?.sw}
      </button>
    );
  })}
</div>

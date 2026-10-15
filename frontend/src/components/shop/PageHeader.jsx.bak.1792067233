import React from "react";
import Breadcrumb from "../Breadcrumb.jsx";

export default function PageHeader({ title, subtitle, imageUrl, breadcrumb, children }) {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: imageUrl
          ? undefined
          : "linear-gradient(135deg, #010F3A 0%, #011957 60%, #042475 100%)",
      }}
    >
      {imageUrl && (
        <>
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(1,15,58,0.55) 0%, rgba(1,15,58,0.85) 100%)",
            }}
          />
        </>
      )}
      <div className="relative max-w-7xl mx-auto px-4 py-10 sm:py-14">
        {breadcrumb?.length > 0 && (
          <Breadcrumb items={breadcrumb} className="mb-4" />
        )}
        <div className="max-w-2xl">
          <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-white/70 text-xs sm:text-sm mt-3 leading-relaxed">
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}

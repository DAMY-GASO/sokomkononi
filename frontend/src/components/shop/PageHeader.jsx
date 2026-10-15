import React from "react";
import Breadcrumb from "../Breadcrumb.jsx";
import { Eyebrow } from "../ui";

export default function PageHeader({ eyebrow, title, subtitle, imageUrl, breadcrumb, children }) {
  return (
    <section className="surface-night noise relative overflow-hidden">
      {imageUrl && (
        <>
          <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(1,15,58,.55) 0%, rgba(1,15,58,.88) 100%)" }} />
        </>
      )}
      <div className="container relative py-12 sm:py-16">
        {breadcrumb?.length > 0 && <Breadcrumb items={breadcrumb} className="mb-4" />}
        <div className="max-w-3xl">
          {eyebrow && <Eyebrow className="mb-3 !text-[rgb(254,164,6)]">{eyebrow}</Eyebrow>}
          <h1 className="text-headline text-white">{title}</h1>
          {subtitle && <p className="mt-3 text-sm sm:text-base text-white/70 leading-relaxed max-w-2xl">{subtitle}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}

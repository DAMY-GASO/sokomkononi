// ============================================================
// CategoriesSection.jsx
// Section inayojitegemea kwa kusimamia categories.
// Inatumia CategoriesPanel lakini na SectionHeader.
// ============================================================

import React from "react";
import SectionHeader from "../shared/SectionHeader.jsx";
import CategoriesPanel from "../components/SystemSettings/CategoriesPanel.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";

export default function CategoriesSection() {
  const { lang } = useLanguage();
  return (
    <>
      <SectionHeader
        title={lang === "sw" ? "Kategoria" : "Categories"}
        subtitle={
          lang === "sw"
            ? "Ongeza, hariri, zima, au futa kategoria za mali"
            : "Add, edit, disable, or delete property categories"
        }
      />
      <div className="grid grid-cols-1 gap-4 items-start">
        <CategoriesPanel />
      </div>
    </>
  );
}

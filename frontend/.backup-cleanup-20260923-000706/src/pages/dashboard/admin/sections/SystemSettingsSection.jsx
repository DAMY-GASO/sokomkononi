// ============================================================
// SystemSettingsSection.jsx
// Mipangilio ya mfumo — panels 6.
// Bilingual.
// ============================================================

import React from "react";
import SectionHeader from "../shared/SectionHeader.jsx";
import WebhooksPanel from "../components/SystemSettings/WebhooksPanel.jsx";
import SubAdminsPanel from "../components/SystemSettings/SubAdminsPanel.jsx";
import AppStoreLinksPanel from "../components/SystemSettings/AppStoreLinksPanel.jsx";
import PlatformPolicyPanel from "../components/SystemSettings/PlatformPolicyPanel.jsx";
import CategoriesPanel from "../components/SystemSettings/CategoriesPanel.jsx";
import AnnouncementsPanel from "../components/SystemSettings/AnnouncementsPanel.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";

export default function SystemSettingsSection() {
  const { lang } = useLanguage();
  return (
    <>
      <SectionHeader
        title={lang === "sw" ? "Mipangilio ya Mfumo" : "System Settings"}
        subtitle={
          lang === "sw"
            ? "Mipangilio ya ndani ya mfumo"
            : "Internal system settings"
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
        <CategoriesPanel />
        <WebhooksPanel />
        <SubAdminsPanel />
        <AppStoreLinksPanel />
        <PlatformPolicyPanel />
        <AnnouncementsPanel />
      </div>
    </>
  );
}

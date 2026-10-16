// ============================================================
// SystemSettingsSection.jsx
// ============================================================

import React from "react";
import SectionHeader from "../shared/SectionHeader.jsx";
import WebhooksPanel from "../components/SystemSettings/WebhooksPanel.jsx";
import AppStoreLinksPanel from "../components/SystemSettings/AppStoreLinksPanel.jsx";
import PlatformPolicyPanel from "../components/SystemSettings/PlatformPolicyPanel.jsx";
import AnnouncementsPanel from "../components/SystemSettings/AnnouncementsPanel.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";

export default function SystemSettingsSection() {
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-hidden">
      <SectionHeader
        title={t("Mipangilio ya Mfumo", "System Settings")}
        subtitle={t(
          "Mipangilio ya ndani ya mfumo — webhooks, app links, sera, na matangazo.",
          "Internal system settings — webhooks, app links, policy, and announcements."
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start w-full min-w-0">
        <WebhooksPanel />
        <AppStoreLinksPanel />
        <PlatformPolicyPanel />
        {/* Announcements inachukua full width chini ya panels 3 */}
        <div className="md:col-span-2 xl:col-span-3 w-full min-w-0">
          <AnnouncementsPanel />
        </div>
      </div>
    </div>
  );
}
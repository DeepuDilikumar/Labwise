import { getRequestConfig } from "next-intl/server";
import { getRegion } from "@regions";
import { getPrefs } from "@/server/prefs";
import { loadMessages } from "./messages";

export default getRequestConfig(async () => {
  const prefs = await getPrefs();
  const region = getRegion(prefs.region);
  return {
    locale: prefs.locale,
    messages: await loadMessages(prefs.locale, region),
    timeZone: region.id === "us" ? "America/New_York" : "Asia/Kolkata",
    onError(err) {
      if (process.env.NODE_ENV !== "production") console.warn("[i18n]", err.message);
    },
    getMessageFallback({ namespace, key }) {
      return [namespace, key].filter(Boolean).join(".");
    },
  };
});

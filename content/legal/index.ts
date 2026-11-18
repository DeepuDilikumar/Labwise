import type { RegionConfig } from "@regions";

/**
 * DRAFT legal text — NEEDS LEGAL REVIEW for each region before launch.
 * English only for now; translations follow legal sign-off.
 */
export type LegalDoc = "privacy" | "terms" | "disclaimer";
export interface LegalSection {
  heading: string;
  body: string[];
}

export function legalDoc(doc: LegalDoc, region: RegionConfig): { title: string; sections: LegalSection[] } {
  const law = region.legal.dataProtectionLaw;
  const contact = region.legal.grievanceContactLabel;
  const residency = region.dataResidency.note;
  switch (doc) {
    case "privacy":
      return {
        title: "Privacy Policy",
        sections: [
          { heading: "The short version", body: ["We use your reports only to explain them to you. We don't sell your data, we don't show ads, and we don't use third-party trackers. You can download or delete everything at any time."] },
          { heading: "What we collect", body: ["Your phone number or email, so you can sign in.", "The reports and prescriptions you upload, the values we read from them, and the explanations we write.", "Profiles you create for family members (a name and, optionally, birth year and sex).", "Your consent choices, with the date and time you made them.", "Basic security logs (for example, that you signed in). These never contain report contents."] },
          { heading: "How we use it", body: ["To read and explain your reports, show trends over time, and keep your account secure. To read reports we send the page images to an AI provider after removing names, phone numbers, addresses and IDs where we can. The provider processes it on our behalf and may not use it to train models."] },
          { heading: "Where it's stored", body: [`${residency} Original uploads are encrypted and, by default, deleted after 30 days. You can change this in Settings.`] },
          { heading: "Your rights", body: [`Under the ${law} you can access, correct, export and delete your data, and withdraw consent. Use the Privacy centre in the app, or contact our ${contact}.`] },
          { heading: "Children", body: ["Labwise is for adults. You may add reports for family members, including children, only if you are their parent or legal guardian."] },
        ],
      };
    case "terms":
      return {
        title: "Terms of Use",
        sections: [
          { heading: "What Labwise is", body: ["Labwise explains lab reports and prescriptions in plain language and suggests which type of doctor you might talk to. It is not a medical device, does not diagnose, and does not replace a doctor, pharmacist or emergency service."] },
          { heading: "Your responsibilities", body: ["Only upload reports you have the right to share. Check the values we read against your report. Always follow your doctor's advice.", `In an emergency, call ${region.emergencyNumber} or go to the nearest hospital.`] },
          { heading: "Payments", body: [`Your first report is free. After that you can pay per report or monthly, in ${region.currency.code}. Monthly plans renew until you cancel. Refunds follow applicable consumer law.`] },
          { heading: "Limits of liability", body: ["We work hard to read and explain reports accurately, but mistakes are possible — especially with blurry photos or handwriting. Labwise is provided as is, to the extent the law allows."] },
        ],
      };
    case "disclaimer":
      return {
        title: "Medical disclaimer",
        sections: [
          { heading: "Labwise explains. It doesn't diagnose.", body: [region.disclaimer.short, "Whether a result is in range is worked out from the reference range printed on your report — not by AI. Explanations describe what a test measures and common reasons values change. They never say you have a condition, and never suggest starting, stopping or changing a medicine.", "If something on your report worries you, please talk to a doctor."] },
        ],
      };
  }
}

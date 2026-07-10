import { LegalPage } from "@/components/legal-page";

export default function Terms() {
  return (
    <LegalPage
      title="Terms of service"
      updated="July 2026"
      intro="These terms govern your use of the NUQD app and services. By creating an account you agree to them."
      sections={[
        { h: "Eligibility", p: "You must be at least 18 and legally able to enter a contract in your jurisdiction. Availability of specific products varies by market and applicable regulation." },
        { h: "Your account", p: "You are responsible for keeping your credentials and devices secure. Enable biometrics, two-factor authentication and a transaction PIN to protect your account." },
        { h: "Trading & risk", p: "Digital assets are volatile and their value can rise or fall sharply. You may lose some or all of the funds you commit. Trade only with what you can afford to lose." },
        { h: "Fees", p: "Applicable fees are shown before you confirm any transaction and may change over time. Your account tier can reduce trading fees." },
        { h: "Prohibited use", p: "You may not use the service for unlawful activity, market abuse, or to circumvent sanctions or compliance controls." },
        { h: "Changes", p: "We may update these terms; material changes will be notified in-app. Continued use after changes take effect constitutes acceptance." },
      ]}
    />
  );
}

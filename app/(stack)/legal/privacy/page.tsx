import { LegalPage } from "@/components/legal-page";

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy policy"
      updated="July 2026"
      intro="This policy explains what personal data NUQD collects, how it is used, and the rights you have over it."
      sections={[
        { h: "Data we collect", p: "Account details (name, email, phone), verification documents, device and usage data, and transaction records needed to operate the service." },
        { h: "How we use it", p: "To provide and secure the service, verify your identity, prevent fraud, meet legal and regulatory obligations, and improve the product." },
        { h: "Sharing", p: "We share data with verification, custody and payment partners strictly as needed, and with regulators where legally required. We do not sell your personal data." },
        { h: "Security", p: "Sensitive data is encrypted in transit and at rest. Access is limited and monitored. No system is perfectly secure — protect your credentials." },
        { h: "Your rights", p: "You may access, correct, export or request deletion of your personal data, subject to legal retention requirements. Contact support to make a request." },
        { h: "Retention", p: "We keep data only as long as needed for the purposes above or as required by law, after which it is deleted or anonymized." },
      ]}
    />
  );
}

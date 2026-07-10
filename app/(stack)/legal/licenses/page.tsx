import { LegalPage } from "@/components/legal-page";

export default function Licenses() {
  return (
    <LegalPage
      title="Licenses & disclosures"
      updated="July 2026"
      intro="Regulatory disclosures and third-party attributions for the NUQD app."
      sections={[
        { h: "Regulatory status", p: "NUQD is a demo and is not a licensed exchange, broker-dealer or bank. In production, regulated services are offered only where the required authorizations are in place, and product availability varies by jurisdiction." },
        { h: "Risk disclosure", p: "Crypto and tokenized assets are volatile and may not be covered by deposit-insurance schemes. Rates and yields shown are illustrative. Past performance does not guarantee future results." },
        { h: "Market data", p: "Live prices, charts and market movers are provided by CoinGecko. News headlines and images are sourced from public RSS feeds (Cointelegraph, Decrypt, CoinDesk) and remain the property of their publishers." },
        { h: "Open-source software", p: "This app is built with Next.js, React, Tailwind CSS, Zustand and lucide-react, used under their respective open-source licenses. Icon and coin artwork belongs to the respective projects." },
        { h: "Trademarks", p: "Third-party names and logos are trademarks of their respective owners and are used for identification only; their appearance does not imply endorsement." },
      ]}
    />
  );
}

import { FlowGate } from "@/components/flow/flow-gate";
import { LandingPage } from "@/components/landing/landing-page";

// `/` is the single-page flow: marketing landing → Q&A → completion (PRD §8).
// The landing is server-rendered for SEO; FlowGate swaps in the client flow
// once a CTA is pressed.
export default function HomePage() {
  return (
    <FlowGate>
      <LandingPage />
    </FlowGate>
  );
}

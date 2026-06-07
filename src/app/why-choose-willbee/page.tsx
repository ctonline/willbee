import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/content-page";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Why Choose WillBee",
  description:
    "Scotland-specific, plain-English Wills in 10–15 minutes for a fraction of solicitor fees. Here’s why people choose WillBee.",
  alternates: { canonical: "/why-choose-willbee" },
};

export default function WhyChoosePage() {
  return (
    <ContentPage
      title="Why choose WillBee"
      intro="A modern, jurisdiction-correct way to make your Will, without the solicitor’s waiting room."
    >
      <h2>Built specifically for Scotland</h2>
      <p>
        Scots law is different. Executors, the residue of your estate, legal
        rights for spouses and children, guardianship for under-16s, and the
        one-witness signing rule all work differently here. WillBee is built
        around these rules from the ground up, not adapted from an English
        template.
      </p>

      <h2>Plain English, every step</h2>
      <p>
        We ask one clear question at a time and explain the tricky parts as we go.
        You’ll understand exactly what each choice means before you make it.
      </p>

      <h2>Minutes, not weeks</h2>
      <p>
        Most people finish in 10–15 minutes and download their document straight
        away. We also email you a copy with step-by-step signing instructions.
      </p>

      <h2>A fraction of the cost</h2>
      <p>
        A solicitor-drafted Will can cost well over a hundred pounds. WillBee is a
        single, transparent one-off fee, with no subscriptions and no surprises.
      </p>

      <h2>When you should still see a solicitor</h2>
      <p>
        WillBee is ideal for straightforward estates. If you have business
        interests, complex trusts, overseas assets, or a contentious family
        situation, we’ll always recommend professional advice.
      </p>

      <div className="not-prose mt-10">
        <Button render={<Link href="/" />} size="lg">
          Create my Will
        </Button>
      </div>
    </ContentPage>
  );
}

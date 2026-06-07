import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How WillBee handles your data: no retention beyond delivery, UK GDPR compliant, and the third-party processors we use.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <ContentPage
      title="Privacy Policy"
      intro="Your privacy matters. This policy explains what we collect, why, and how long we keep it."
    >
      <p>
        WillBee (“we”, “us”) is committed to protecting your personal data and
        complying with the UK GDPR and the Data Protection Act 2018. This is a
        plain-English summary of how we handle your information.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          The answers you provide in the Will questionnaire (your name, address,
          executors, beneficiaries and related details).
        </li>
        <li>Your email address, used to deliver your document and receipt.</li>
        <li>
          Payment confirmation from our payment processor (we never see or store
          your full card details).
        </li>
      </ul>

      <h2>How we use it</h2>
      <p>
        We use your information solely to generate your Will document, take
        payment, deliver the document to you by email, and provide support if you
        ask for it. We do not sell your data or use it for advertising.
      </p>

      <h2>Data retention</h2>
      <p>
        We keep your completed Will associated with your email address so you can
        return and download it again. You can ask us to delete it at any time by
        emailing {SITE.supportEmail}. We retain payment records only as required
        for accounting and legal obligations.
      </p>

      <h2>Third-party processors</h2>
      <ul>
        <li>
          <strong>Stripe</strong> processes your card payment securely. See
          Stripe’s privacy policy for details.
        </li>
        <li>
          <strong>Resend</strong> delivers your document and receipt by email.
        </li>
      </ul>

      <h2>Your rights</h2>
      <p>
        Under UK GDPR you have the right to access, correct, or delete your
        personal data, and to object to or restrict its processing. To exercise
        any of these rights, contact us at {SITE.supportEmail}.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy? Email {SITE.supportEmail} and we’ll be happy
        to help.
      </p>
    </ContentPage>
  );
}

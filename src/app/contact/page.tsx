import type { Metadata } from "next";
import { Mail, Clock, MapPin } from "lucide-react";
import { ContentPage } from "@/components/content-page";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the WillBee team. We’re here to help.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <ContentPage
      title="Contact us"
      intro="Have a question about your Will or your order? We’re happy to help, though please note we can’t provide legal advice."
    >
      <div className="not-prose grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <Mail className="h-5 w-5 text-primary" aria-hidden />
          <h2 className="mt-3 font-semibold">Email</h2>
          <a
            href={`mailto:${SITE.supportEmail}`}
            className="mt-1 block text-sm text-primary underline"
          >
            {SITE.supportEmail}
          </a>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <Clock className="h-5 w-5 text-primary" aria-hidden />
          <h2 className="mt-3 font-semibold">Hours</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Monday–Friday, 9am–5pm. We aim to reply within one working day.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <MapPin className="h-5 w-5 text-primary" aria-hidden />
          <h2 className="mt-3 font-semibold">Based in</h2>
          <p className="mt-1 text-sm text-muted-foreground">Scotland, UK</p>
        </div>
      </div>

      <p className="mt-8">
        For data requests (access, correction, or deletion of your information),
        email {SITE.supportEmail} with the subject line “Data request”.
      </p>
    </ContentPage>
  );
}

import { Printer, PenLine, Users, Archive, CalendarClock } from "lucide-react";

const STEPS = [
  {
    icon: Printer,
    title: "Print your document",
    body: "Print the full Will on plain paper. Don’t sign it yet: your signature must be witnessed.",
  },
  {
    icon: PenLine,
    title: "Sign every page with a witness present",
    body: "In Scotland you need just one witness, aged 16 or over, who is not a beneficiary. Sign each page while they watch.",
  },
  {
    icon: Users,
    title: "Your witness completes their details",
    body: "Your witness then signs and prints their full name, address and occupation, and adds the date.",
  },
  {
    icon: Archive,
    title: "Store the original safely",
    body: "Keep the signed original somewhere secure and tell your executor exactly where to find it.",
  },
  {
    icon: CalendarClock,
    title: "Review it regularly",
    body: "Review your Will every 3–5 years, or sooner after a major life event such as marriage, divorce or a new child.",
  },
];

export function NextSteps() {
  return (
    <div>
      <h2 className="text-xl font-semibold">What to do next</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Your Will is only legally valid once it has been correctly signed and
        witnessed. Follow these steps carefully.
      </p>
      <ol className="mt-6 space-y-4">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent">
              <step.icon className="h-5 w-5 text-accent-foreground" aria-hidden />
            </div>
            <div>
              <h3 className="font-medium">
                {i + 1}. {step.title}
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

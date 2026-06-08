// Static marketing content used across the landing and static pages.

export const SITE = {
  name: "WillBee",
  tagline: "Your Scottish Will, sorted in minutes.",
  description:
    "Create a legally-structured Last Will and Testament for Scotland in 10–15 minutes. Plain English, no solicitor, instant PDF.",
  url: "https://will.willbee.site",
  supportEmail: "willbee2025@gmail.com",
  emailFrom: "WillBee <noreply@will.willbee.site>",
} as const;

export interface Testimonial {
  name: string;
  town: string;
  quote: string;
  rating: number;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Fiona M.",
    town: "Edinburgh",
    quote:
      "I’d been putting off making a Will for years. WillBee walked me through it over a cup of tea, and it was done before the tea went cold.",
    rating: 5,
  },
  {
    name: "Callum R.",
    town: "Glasgow",
    quote:
      "Plain English the whole way through. I finally understood ‘legal rights’ and the residue without needing a solicitor.",
    rating: 5,
  },
  {
    name: "Aileen S.",
    town: "Aberdeen",
    quote:
      "Naming guardians for our wee ones gave my husband and me real peace of mind. Worth every penny.",
    rating: 5,
  },
  {
    name: "Graeme T.",
    town: "Dundee",
    quote:
      "The PDF looked properly professional, and the signing instructions made the witnessing part dead simple.",
    rating: 5,
  },
  {
    name: "Mhairi D.",
    town: "Inverness",
    quote:
      "I added a few specific gifts for my grandchildren and split the rest. Took me about twelve minutes on my phone.",
    rating: 5,
  },
  {
    name: "Stuart B.",
    town: "Stirling",
    quote:
      "Scotland-specific and reassuringly clear. No jargon, no upsells, no fuss. Exactly what I needed.",
    rating: 5,
  },
];

export const FEATURES = [
  {
    title: "Guided Process",
    body: "One simple question at a time, with helpful explanations as you go. No legal training required.",
  },
  {
    title: "Built for Scots Law",
    body: "Executors, residue, legal rights, guardians and witnessing: all structured correctly for Scotland.",
  },
  {
    title: "Plain English",
    body: "Every step is written the way you’d actually talk. We explain the tricky bits so nothing trips you up.",
  },
];

export const TRUST_BADGES = [
  "Scottish Law Compliant",
  "10–15 Minutes",
  "No Legal Jargon",
];

export const WHAT_YOU_NEED = [
  "Your full legal name and address",
  "The name and address of your chosen executor",
  "Who you’d like to inherit your estate",
  "Guardians for any children under 16 (if relevant)",
  "Any specific gifts you’d like to leave",
];

export const DISCLAIMERS = [
  "WillBee provides a document-generation service and does not provide legal advice.",
  "Your Will is only valid once it has been properly signed and witnessed in line with the instructions provided.",
  "Larger or more complex estates (business interests, trusts, overseas assets) should be reviewed by a solicitor.",
  "This service is only suitable if you are domiciled in Scotland and aged 12 or over.",
];

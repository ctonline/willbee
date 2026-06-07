// The generated Scottish Will PDF (PRD §7). Built with @react-pdf/renderer so
// the same component renders client-side (download) and server-side (email).
//
// Sections are numbered dynamically and empty ones are skipped.

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { WillData, Legacy } from "../types";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    fontSize: 12,
    lineHeight: 1.5,
    paddingTop: 56, // ~20mm
    paddingBottom: 64,
    paddingHorizontal: 56,
    color: "#1a1a1a",
  },
  titleBlock: { marginBottom: 24, textAlign: "center" },
  title: { fontSize: 18, fontFamily: "Times-Bold" },
  subtitle: { fontSize: 12, marginTop: 6 },
  section: { marginBottom: 14 },
  heading: {
    fontSize: 12,
    fontFamily: "Times-Bold",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  body: { textAlign: "justify" },
  para: { marginBottom: 6, textAlign: "justify" },
  listItem: { flexDirection: "row", marginBottom: 4 },
  bullet: { width: 14, textAlign: "center" },
  listText: { flex: 1, textAlign: "justify" },
  sigBlock: { marginTop: 18 },
  sigRow: { marginTop: 18, flexDirection: "row", justifyContent: "space-between" },
  sigField: { width: "47%" },
  line: { borderBottomWidth: 1, borderBottomColor: "#1a1a1a", height: 22 },
  lineLabel: { fontSize: 10, marginTop: 3, color: "#444" },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 56,
    right: 56,
    fontSize: 8,
    textAlign: "center",
    color: "#777",
  },
});

function oneLineAddress(address: string): string {
  return address
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .join(", ");
}

function capitalise(s: string): string {
  const t = s.trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

function legacyClause(l: Legacy): string {
  const who = `to ${l.beneficiary.name}`;
  if (l.type === "pecuniary") {
    return `The sum of ${l.amountOrDescription} ${who}.`;
  }
  if (l.type === "charitable") {
    return `A gift of ${l.amountOrDescription} ${who}, and I declare that the receipt of its treasurer or other proper officer shall be a sufficient discharge to my Executor.`;
  }
  // Specific item — the description usually reads like "my grandmother's locket",
  // so capitalise it rather than prefixing another "My".
  return `${capitalise(l.amountOrDescription)} ${who}.`;
}

interface SectionDef {
  heading: string;
  content: React.ReactNode;
}

export function WillDocument({ data }: { data: WillData }) {
  const { testator, executors, guardians, legacies, residue, powers } = data;
  const name = testator.fullName || "[Your name]";
  const addr = oneLineAddress(testator.address) || "[Your address]";
  const vestingAge = powers.trustCreationIfMinor.ageVesting;

  const sections: SectionDef[] = [];

  // 1. Revocation
  sections.push({
    heading: "Revocation",
    content: (
      <Text style={styles.body}>
        I, {name}, residing at {addr}, revoke all previous Wills and testamentary
        writings made by me and declare this to be my last Will and Testament.
      </Text>
    ),
  });

  // 2. Appointment of executors
  sections.push({
    heading: "Appointment of Executors",
    content: (
      <View>
        <Text style={styles.para}>
          I appoint {executors.primary[0]?.name || "[Executor]"}, residing at{" "}
          {oneLineAddress(executors.primary[0]?.address || "") || "[address]"}, to
          be the sole Executor of this my Will (my &ldquo;Executor&rdquo;).
        </Text>
        {executors.substitutes.length > 0 && (
          <Text style={styles.para}>
            If my said Executor is unable or unwilling to act, or fails to survive
            me, then I appoint{" "}
            {executors.substitutes
              .map(
                (s) =>
                  `${s.name}, residing at ${oneLineAddress(s.address)}`,
              )
              .join("; whom failing ")}{" "}
            to act as my Executor in their place.
          </Text>
        )}
        <Text style={styles.para}>
          I give my Executor the fullest powers of management, including power to
          sell, realise, let, lease or otherwise deal with my whole estate; power
          to invest and re-invest in their discretion; and power to apply both
          income and capital for the purposes of this Will. My Executor shall not
          be liable for any loss except such as may arise from their own
          dishonesty.
        </Text>
      </View>
    ),
  });

  // 3. Guardians
  if (guardians.length > 0) {
    sections.push({
      heading: "Appointment of Guardians",
      content: (
        <Text style={styles.body}>
          If on my death any of my children are under the age of sixteen (16) and
          there is no surviving parent with parental responsibilities and rights,
          I appoint {guardians[0].name}, residing at{" "}
          {oneLineAddress(guardians[0].address)}, to be the guardian of such
          children.
        </Text>
      ),
    });
  }

  // 4. Specific legacies
  if (legacies.length > 0) {
    sections.push({
      heading: "Specific Legacies",
      content: (
        <View>
          <Text style={styles.para}>
            I direct my Executor to give effect to the following legacies as soon
            as is reasonably practicable after my death:
          </Text>
          {legacies.map((l, i) => (
            <View style={styles.listItem} key={i}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{legacyClause(l)}</Text>
            </View>
          ))}
          <Text style={[styles.para, { marginTop: 6 }]}>
            If any beneficiary of a legacy predeceases me, that legacy shall fall
            into and form part of the residue of my estate, unless otherwise
            stated above.
          </Text>
        </View>
      ),
    });
  }

  // 5. Residue
  const beneficiaries = residue.beneficiaries.filter((b) => b.name);
  sections.push({
    heading: "Residue of my Estate",
    content: (
      <View>
        <Text style={styles.para}>
          I direct my Executor to pay my debts, funeral expenses and the expenses
          of administering my estate, and to hold and distribute the whole residue
          of my estate as follows:
        </Text>
        {beneficiaries.map((b, i) => (
          <View style={styles.listItem} key={i}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>
              {b.sharePercent}% to {b.name}.
            </Text>
          </View>
        ))}
        {beneficiaries.length > 1 && (
          <Text style={[styles.para, { marginTop: 6 }]}>
            If any residuary beneficiary fails to survive me, their share shall
            accrue proportionately to the remaining residuary beneficiaries who do
            survive me.
          </Text>
        )}
      </View>
    ),
  });

  // 6. Trust for minors
  sections.push({
    heading: "Trust for Beneficiaries Under " + vestingAge,
    content: (
      <Text style={styles.body}>
        If any beneficiary under this Will is under the age of {vestingAge} years
        at the date their interest would otherwise vest, my Executor shall hold
        that beneficiary&rsquo;s share in trust until they attain that age, with
        full power to apply the income and/or capital of that share for their
        maintenance, education or benefit in the meantime.
      </Text>
    ),
  });

  // 7. Funeral wishes (optional)
  if (data.funeral.preferences.trim()) {
    sections.push({
      heading: "Funeral Wishes",
      content: (
        <Text style={styles.body}>
          I express the following wishes regarding my funeral, which I ask my
          Executor and family to follow so far as is reasonably practicable,
          acknowledging that they are wishes and not binding directions:{" "}
          {data.funeral.preferences}
        </Text>
      ),
    });
  }

  // 8. Digital assets (optional)
  if (data.digitalAssets.instructions.trim()) {
    sections.push({
      heading: "Digital Assets",
      content: (
        <Text style={styles.body}>
          I direct my Executor, so far as lawful and practicable, to deal with my
          digital assets and online accounts in accordance with the following
          instructions: {data.digitalAssets.instructions}
        </Text>
      ),
    });
  }

  // 9. Legal rights notice (mandatory)
  sections.push({
    heading: "Legal Rights (Scots Law)",
    content: (
      <Text style={styles.body}>
        I acknowledge that, under the law of Scotland, my spouse or civil partner
        and my children (or their descendants) may be entitled to claim
        &ldquo;legal rights&rdquo; out of the moveable part of my estate,
        regardless of the provisions of this Will. The provisions of this Will are
        made subject to any such legal rights as may competently be claimed.
      </Text>
    ),
  });

  // 10. Attestation / signing
  sections.push({
    heading: "Attestation",
    content: (
      <View>
        <Text style={styles.para}>
          IN WITNESS WHEREOF I have signed this Will, consisting of the pages
          hereof, before the witness named below.
        </Text>
        <View style={styles.sigRow}>
          <View style={styles.sigField}>
            <View style={styles.line} />
            <Text style={styles.lineLabel}>Signature of {name}</Text>
          </View>
          <View style={styles.sigField}>
            <View style={styles.line} />
            <Text style={styles.lineLabel}>Full name (printed)</Text>
          </View>
        </View>
        <View style={styles.sigRow}>
          <View style={styles.sigField}>
            <View style={styles.line} />
            <Text style={styles.lineLabel}>Date</Text>
          </View>
          <View style={styles.sigField}>
            <View style={styles.line} />
            <Text style={styles.lineLabel}>Place of signing</Text>
          </View>
        </View>
      </View>
    ),
  });

  // 11. Witness clause
  sections.push({
    heading: "Witness",
    content: (
      <View>
        <Text style={styles.para}>
          The foregoing Will was signed by {name} in my presence. I am aged 16 or
          over and I am not a beneficiary under this Will.
        </Text>
        <View style={styles.sigRow}>
          <View style={styles.sigField}>
            <View style={styles.line} />
            <Text style={styles.lineLabel}>Signature of witness</Text>
          </View>
          <View style={styles.sigField}>
            <View style={styles.line} />
            <Text style={styles.lineLabel}>Full name (printed)</Text>
          </View>
        </View>
        <View style={styles.sigRow}>
          <View style={styles.sigField}>
            <View style={styles.line} />
            <Text style={styles.lineLabel}>Address</Text>
          </View>
          <View style={styles.sigField}>
            <View style={styles.line} />
            <Text style={styles.lineLabel}>Occupation</Text>
          </View>
        </View>
        <View style={styles.sigRow}>
          <View style={styles.sigField}>
            <View style={styles.line} />
            <Text style={styles.lineLabel}>Date</Text>
          </View>
          <View style={styles.sigField} />
        </View>
      </View>
    ),
  });

  return (
    <Document
      title={`Last Will and Testament of ${name}`}
      author="WillBee"
      creator="WillBee"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>
            LAST WILL AND TESTAMENT OF {name.toUpperCase()}
          </Text>
          <Text style={styles.subtitle}>of {addr}</Text>
        </View>

        {sections.map((s, i) => (
          <View style={styles.section} key={i} wrap={false}>
            <Text style={styles.heading}>
              {i + 1}. {s.heading}
            </Text>
            {s.content}
          </View>
        ))}

        <Text style={styles.footer} fixed>
          Generated by WillBee — this is not legal advice.
        </Text>
      </Page>
    </Document>
  );
}

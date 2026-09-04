import type { Metadata } from "next";
import { Archivo, Courier_Prime } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const courierPrime = Courier_Prime({
  variable: "--font-courier",
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PairCode",
  description:
    "Collaborative engineering room with persistent threaded context, live presence, AI facilitation, and room-level implementation history",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${archivo.variable} ${courierPrime.variable} antialiased`}
      >
        {/* Direction contract — emitted as a real HTML comment so it survives
            the production build and can be audited against the render. */}
        <div
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: `<!--\n${DIRECTION_CONTRACT}\n-->` }}
        />
        {children}
      </body>
    </html>
  );
}

const DIRECTION_CONTRACT = `
          THESIS: PairCode is an access-control system, so the interface is the
          credential and the reader — not a dashboard about security. It refuses
          the elevated-card grid every collaboration tool ships.
          OWN-WORLD: Safety-paper green-grey stock, intaglio-green committed ink,
          ochre visitor band, vermilion cancellation stamp. Archivo Narrow caps
          for printed legends, Courier Prime for machine-typed values. Square
          sheets and hairline rules everywhere; the ID-1 12px corner belongs to
          issued credentials alone. Guilloché is a deterministic hash of a real
          identity, never ornament.
          STORY: A reviewer sees identity, permission and liveness being decided
          server-side and printed onto the artifact; an operator reads the room's
          access state at a glance and issues a pass.
          FIRST VIEWPORT: Full-width intaglio masthead band carrying the mark,
          the operator's own credential and the reader lamp. Below it three
          ruled columns: the rack of credentials (present above, enrolled below,
          each a real card with guilloché panel and role band), the centre access
          register as banded ruled courses ending in the entry field, and the
          issuing desk holding the pass, the countersigned context sheet and the
          agent. Primary action is the green stamped JOIN beside the room field.
          FORM: The Credential — candidate 1 of my grounded list, chosen by the
          user over the roll's assigned candidate 4. Seed key bfad00c9.
          FINISH: unreviewed and undocumented is unfinished; this build ends with
          the finish review, the verdict, DESIGN.md, and every shipping raster
          carrying its provenance.
`;

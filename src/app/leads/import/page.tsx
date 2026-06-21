import { PageHeader } from "@/components/ui";
import ImportLeads from "@/components/ImportLeads";
import { SAMPLE_CSV } from "@/lib/data/csv";

export default function ImportLeadsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Phase 2 · Lead Store"
        title="Import Leads (CSV)"
        subtitle="Bulk-import leads until Lead Hunter goes live. Imports land as source=csv_import, stage=new, consent=pending — so the Outreach consent gate applies before any send. Duplicates (email or phone) are skipped."
      />
      <ImportLeads sample={SAMPLE_CSV} />
    </>
  );
}

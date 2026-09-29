import { Checkbox, Input, Select, Textarea } from "./ui";

const CATEGORY_LABEL: Record<string, string> = {
  faq: "FAQ",
  company: "Company information",
  service: "Service description",
  case_study: "Case-study information",
  general: "General website knowledge",
};

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label }));
export const categoryLabel = (c: string) => CATEGORY_LABEL[c] ?? c;

type Entry = { category: string; question: string; answer: string; keywords: string; sortOrder: number; enabled: boolean };

export function KnowledgeFields({ entry }: { entry?: Entry }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Input label="Question / topic" name="question" defaultValue={entry?.question} required maxLength={300} />
        </div>
        <Select label="Category" name="category" defaultValue={entry?.category ?? "faq"} options={CATEGORY_OPTIONS} />
      </div>
      <Textarea
        label="Approved answer"
        name="answer"
        defaultValue={entry?.answer}
        rows={4}
        required
        maxLength={4000}
        hint="Write facts only. The assistant treats this as reference data, so instructions placed here are ignored."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Input
            label="Keywords"
            name="keywords"
            defaultValue={entry?.keywords}
            maxLength={500}
            hint="Comma-separated. Helps the no-AI fallback find this answer."
          />
        </div>
        <Input label="Sort order" name="sortOrder" type="number" min={0} max={999} defaultValue={entry?.sortOrder ?? 0} />
      </div>
      <Checkbox label="Enabled (used by the assistant)" name="enabled" defaultChecked={entry?.enabled ?? true} />
    </>
  );
}

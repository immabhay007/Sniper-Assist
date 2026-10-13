type Props = {
  form: {
    entity_name: string;
    entity_code: string;
    description: string;
    priority: number | string;
    is_active: boolean;
  };
  setForm: (updater: any) => void;
};

export default function EntityFormFields({ form, setForm }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Entity Name *</span>
        <input
          value={form.entity_name}
          onChange={(e) => setForm((prev: any) => ({ ...prev, entity_name: e.target.value }))}
          placeholder="e.g. Operations"
          className="sniper-input w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          required
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Entity Code *</span>
        <input
          value={form.entity_code}
          onChange={(e) => setForm((prev: any) => ({ ...prev, entity_code: e.target.value.toUpperCase() }))}
          placeholder="e.g. OPS"
          className="sniper-input w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          required
        />
      </label>

      <label className="block md:col-span-2">
        <span className="mb-1.5 block text-sm font-medium">Description</span>
        <textarea
          value={form.description}
          onChange={(e) => setForm((prev: any) => ({ ...prev, description: e.target.value }))}
          rows={3}
          placeholder="Optional notes about this entity"
          className="sniper-input w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Priority *</span>
        <input
          type="number"
          min={0}
          value={form.priority}
          onChange={(e) => setForm((prev: any) => ({ ...prev, priority: e.target.value }))}
          className="sniper-input w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          required
        />
      </label>

      <label className="mt-7 inline-flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setForm((prev: any) => ({ ...prev, is_active: e.target.checked }))}
          className="rounded border-input text-primary focus:ring-primary"
        />
        Active
      </label>
    </div>
  );
}

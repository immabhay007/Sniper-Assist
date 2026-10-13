import FormInput from "@/components/common/FormInput";
import SelectInput from "@/components/common/SelectInput";
import IconPicker from "@/components/categories/IconPicker";
import { CATEGORY_COLOR_PRESETS } from "@/config/categoryIcons";

export default function CategoryFormFields({ form, setForm }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <FormInput
        label="Category name"
        placeholder="e.g. Stationery"
        value={form.category_name}
        onChange={(e) => setForm({ ...form, category_name: e.target.value })}
      />
      <SelectInput label="Type" value={form.category_type} onChange={(e) => setForm({ ...form, category_type: e.target.value })}>
        <option>Recurring</option>
        <option>Variable</option>
        <option>One-time</option>
      </SelectInput>
      <FormInput
        label="Monthly budget limit (₹)"
        placeholder="Optional — for alert threshold"
        type="number"
        min="0"
        className="sm:col-span-2"
        value={form.monthly_budget}
        onChange={(e) => setForm({ ...form, monthly_budget: e.target.value })}
      />
      <div className="sm:col-span-2">
        <span className="block text-[13px] font-medium mb-2">Color</span>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLOR_PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setForm({ ...form, color_code: color })}
              className={`size-8 rounded-full border-2 transition ${form.color_code === color ? "border-foreground scale-110" : "border-transparent"}`}
              style={{ background: color }}
              aria-label={`Color ${color}`}
            />
          ))}
        </div>
      </div>
      <div className="sm:col-span-2">
        <IconPicker value={form.icon} onChange={(icon) => setForm({ ...form, icon })} />
      </div>
    </div>
  );
}

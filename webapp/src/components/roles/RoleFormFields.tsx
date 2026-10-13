import FormInput from "@/components/common/FormInput";

export default function RoleFormFields({ form, setForm }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <FormInput
        label="Role name"
        required
        placeholder="e.g. Accountant"
        value={form.role_name}
        onChange={(e) => setForm({ ...form, role_name: e.target.value })}
      />
      <FormInput
        label="Description"
        placeholder="Optional description"
        className="sm:col-span-2"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
    </div>
  );
}

import FormInput from "@/components/common/FormInput";
import SelectInput from "@/components/common/SelectInput";

export default function UserFormFields({
  form,
  setForm,
  roles = [],
  showPasswordHint = false,
  disabled = false,
}) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <FormInput
        label="Full name"
        required
        placeholder="e.g. Priya Sharma"
        value={form.full_name}
        disabled={disabled}
        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
      />
      <FormInput
        label="Email"
        type="email"
        required
        placeholder="priya@company.com"
        value={form.email}
        disabled={disabled}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <FormInput
        label="Mobile"
        placeholder="+91 98765 43210"
        value={form.phone}
        disabled={disabled}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />
      <SelectInput
        label="Role"
        required
        value={form.role_id}
        disabled={disabled}
        onChange={(e) => setForm({ ...form, role_id: e.target.value })}
      >
        <option value="">Select role</option>
        {roles.map((r) => (
          <option key={r.id} value={r.id}>
            {r.role_name}
          </option>
        ))}
      </SelectInput>
      <FormInput
        label={showPasswordHint ? "New password (optional)" : "Password (optional)"}
        type="password"
        placeholder={showPasswordHint ? "Leave blank to keep current" : "Auto-generated if empty"}
        className="sm:col-span-2"
        value={form.password}
        disabled={disabled}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      {!showPasswordHint && (
        <p className="sm:col-span-2 text-xs text-muted-foreground -mt-2">
          If left empty, a temporary password is generated for onboarding (shown once after create).
        </p>
      )}
    </div>
  );
}

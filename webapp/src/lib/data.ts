export type Ticket = {
  id: string;
  subject: string;
  customer: string;
  category: "Billing" | "Technical" | "Account" | "General" | "Shipping";
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: "Open" | "In Progress" | "Pending" | "Resolved" | "Escalated";
  agent: string;
  updated: string;
};

export const tickets: Ticket[] = [
  { id: "TKT-1042", subject: "Refund not credited to my account", customer: "Aanya Mehta", category: "Billing", priority: "High", status: "Open", agent: "Riya Kapoor", updated: "2m ago" },
  { id: "TKT-1041", subject: "Login fails after password reset", customer: "Karthik Rao", category: "Account", priority: "Urgent", status: "Escalated", agent: "Aarav Shah", updated: "14m ago" },
  { id: "TKT-1040", subject: "Wrong item delivered in order #88231", customer: "Saanvi Iyer", category: "Shipping", priority: "Medium", status: "In Progress", agent: "Neel Verma", updated: "1h ago" },
  { id: "TKT-1039", subject: "How do I export invoices as CSV?", customer: "Devanshi Patel", category: "General", priority: "Low", status: "Resolved", agent: "Priya Nair", updated: "3h ago" },
  { id: "TKT-1038", subject: "Webhook returns 502 intermittently", customer: "Ishaan Gupta", category: "Technical", priority: "High", status: "Pending", agent: "Aarav Shah", updated: "5h ago" },
  { id: "TKT-1037", subject: "Cannot update billing address", customer: "Meera Joshi", category: "Account", priority: "Medium", status: "Open", agent: "Riya Kapoor", updated: "Yesterday" },
  { id: "TKT-1036", subject: "Subscription auto-renewed unexpectedly", customer: "Rohit Sen", category: "Billing", priority: "High", status: "In Progress", agent: "Neel Verma", updated: "Yesterday" },
  { id: "TKT-1035", subject: "API rate limit clarification", customer: "Tara Bhatt", category: "Technical", priority: "Low", status: "Resolved", agent: "Priya Nair", updated: "2d ago" },
];

export const enquiries = tickets.filter((_, i) => i % 2 === 0).map((t, i) => ({ ...t, id: `ENQ-20${42 - i}` }));

export const categories = [
  { name: "Billing & Payments", tone: "warning", count: 38, desc: "Refunds, invoices, charges" },
  { name: "Technical Issues", tone: "info", count: 64, desc: "APIs, bugs, integrations" },
  { name: "Account Access", tone: "primary", count: 22, desc: "Login, password, MFA" },
  { name: "Shipping & Delivery", tone: "success", count: 17, desc: "Tracking, delays, returns" },
] as const;

export const team = [
  { name: "Aarav Shah", email: "aarav@sniper.support", role: "Admin", phone: "+91 98201 12345", initials: "AS", tone: "primary" },
  { name: "Riya Kapoor", email: "riya@sniper.support", role: "Agent", phone: "+91 98765 22118", initials: "RK", tone: "success" },
  { name: "Neel Verma", email: "neel@sniper.support", role: "Agent", phone: "+91 99887 65432", initials: "NV", tone: "info" },
  { name: "Priya Nair", email: "priya@sniper.support", role: "Supervisor", phone: "+91 98191 99001", initials: "PN", tone: "warning" },
  { name: "Vikram Singh", email: "vikram@sniper.support", role: "Agent", phone: "+91 97000 84211", initials: "VS", tone: "danger" },
  { name: "Sara Khan", email: "sara@sniper.support", role: "Agent", phone: "+91 98330 87711", initials: "SK", tone: "primary" },
] as const;

export const roles = [
  { name: "Administrator", desc: "Full access to all settings, data, and billing.", members: 2, perms: ["Manage team", "Manage roles", "Billing", "Export data"] },
  { name: "Supervisor", desc: "Oversee agents, reassign tickets, view reports.", members: 3, perms: ["Assign tickets", "View reports", "Edit categories"] },
  { name: "Agent", desc: "Handle tickets, respond to customers.", members: 12, perms: ["Reply to tickets", "Internal notes"] },
  { name: "Read-only", desc: "View tickets and reports without editing.", members: 4, perms: ["View tickets", "View reports"] },
];

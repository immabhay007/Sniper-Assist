import api from "@/config/axios";

function getMonthRange() {
  const now = new Date();

  const firstDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const lastDay = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  );

  const fmt = (d: Date): string =>
    `${d.getFullYear()}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  return {
    fromDate: fmt(firstDay),
    toDate: fmt(lastDay),
  };
}

export const complaintService = {
  async getComplaints(
    {
      customerId = 0,
      fromDate,
      toDate,
    }: {
      customerId?: number;
      fromDate?: string;
      toDate?: string;
    } = {}
  ) {
    const monthRange = getMonthRange();

    const { data } = await api.get("/complaints/", {
      params: {
        customer_id: customerId,
        from_date: fromDate ?? monthRange.fromDate,
        to_date: toDate ?? monthRange.toDate,
      },
    });

    return Array.isArray(data) ? data : [];
  },
};
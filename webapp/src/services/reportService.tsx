import api from "@/config/axios";

function getMonthRange() {
  const now = new Date();

  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const fmt = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  return {
    fromDate: fmt(firstDay),
    toDate: fmt(lastDay),
  };
}

export const reportService = {
  async getReports(
    {
      type = "both",
      fromDate,
      toDate,
      categoryId,
    }: {
      type?: "enquiry" | "complaint" | "both" | string;
      fromDate?: string;
      toDate?: string;
      categoryId?: number;
    } = {}
  ) {
    const monthRange = getMonthRange();

    const { data } = await api.get("/reports", {
      params: {
        from_date: fromDate ?? monthRange.fromDate,
        to_date: toDate ?? monthRange.toDate,
        type,
        ...(categoryId ? { category_id: categoryId } : {}),
      },
    });

    return data || {};
  },
};
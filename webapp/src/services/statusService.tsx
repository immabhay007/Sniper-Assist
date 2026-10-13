import api from "@/config/axios";

// Matches the response from GET /status-master/
export type StatusMaster = {
  id: number;
  module_type: string;
  status_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const statusService = {
  /**
   * Fetch a paginated list of statuses
   * @param skip - number of records to skip (default 0)
   * @param limit - max records to return (default 100)
   */
  async getStatuses(skip: number = 0, limit: number = 100): Promise<StatusMaster[]> {
    const { data } = await api.get<StatusMaster[]>("/status-master/", {
      params: { skip, limit },
    });
    return data;
  },
};
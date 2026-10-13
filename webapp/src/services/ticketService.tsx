import api from "@/config/axios";

export type TicketNote = {
  id: number;
  ticket_no: string;
  module_type: string;
  module_id: number;
  note_text: string;
  assigned_to: number;
  status_id: number;
  created_by?: number;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;
};

export type CreateTicketPayload = {
  module_type: string;
  module_id: number;
  note_text: string;
  ticket_no: string;
  assigned_to: number;
  status_id: number;
  created_by: number;
  next_action_item: string;
};

export type UpdateTicketPayload = {
  note_text: string;
  ticket_no: string;
  assigned_to: number;
  updated_by: number;
  status_id: number;
  next_action_item: string;
  updated_at?: string;      // 👈 add
  timezone_str?: string;   
};

export const ticketService = {
  // Get all tickets
  async getTickets(): Promise<TicketNote[]> {
    const { data } = await api.get("/ticket-notes");

    return data || [];
  },

  // Get ticket details by ticket number
  async getTicketByNumber(ticketNo: string): Promise<TicketNote[]> {
    const { data } = await api.get(`/ticket-notes/${ticketNo}`);

    return data || [];
  },

  // Create ticket note
  async createTicket(payload: CreateTicketPayload): Promise<TicketNote> {
    const { data } = await api.post("/ticket-notes", payload);

    return data;
  },

  // Update ticket note
  async updateTicket(
    id: number,
    payload: UpdateTicketPayload
  ): Promise<TicketNote> {
    const { data } = await api.put(`/ticket-notes/${id}`, payload);

    return data;
  },

  // Delete ticket note
  async deleteTicket(id: number): Promise<void> {
    await api.delete(`/ticket-notes/${id}`);
  },

async getNotesByTicketNo(ticketNo: string) {
        const response = await api.get(`/ticket-notes/notes/${ticketNo}`);
return response.data;
}

};
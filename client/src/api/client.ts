import type {
  Circle,
  SafeMember,
  Medicine,
  Dose,
  Duty,
  Checkin,
  Appointment,
  ChangeReceipt,
  PatternInsight,
  PrivacyDials,
} from '@aangan/shared';

const API_BASE = '/api';

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth & Session
  createCircle: (payload: any) =>
    request<{ circle: Circle; member: SafeMember }>('/auth/circle', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  lookupCircle: (joinCode: string) =>
    request<{ circle: { id: string; name: string; joinCode: string }; members: SafeMember[] }>(
      '/auth/lookup',
      {
        method: 'POST',
        body: JSON.stringify({ joinCode }),
      }
    ),

  loginWithPin: (memberId: string, pin: string) =>
    request<{ circle: Circle; member: SafeMember }>('/auth/login-pin', {
      method: 'POST',
      body: JSON.stringify({ memberId, pin }),
    }),

  logout: () =>
    request<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),

  getMe: () =>
    request<{ member: SafeMember; circle: Circle }>('/auth/me'),

  // Members
  getMembers: () => request<SafeMember[]>('/members'),

  addMember: (payload: any) =>
    request<{ member: SafeMember; oneTimePin: string }>('/members', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  resetMemberPin: (memberId: string, newPin: string) =>
    request<{ message: string }>('/members/reset-pin', {
      method: 'POST',
      body: JSON.stringify({ memberId, newPin }),
    }),

  updatePrivacyDials: (memberId: string, dials: PrivacyDials) =>
    request<{ member: SafeMember }>(`/members/${memberId}/dials`, {
      method: 'PATCH',
      body: JSON.stringify(dials),
    }),

  // Medicines
  getMedicines: (active = true) =>
    request<Medicine[]>(`/medicines?active=${active}`),

  createMedicine: (payload: any) =>
    request<Medicine>('/medicines', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateMedicine: (id: string, payload: any) =>
    request<Medicine>(`/medicines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteMedicine: (id: string) =>
    request<{ message: string; medicine: Medicine }>(`/medicines/${id}`, {
      method: 'DELETE',
    }),

  // Doses
  getTodayDoses: (date?: string) =>
    request<Array<Dose & { medicine: Medicine | null }>>(
      `/doses${date ? `?date=${date}` : ''}`
    ),

  getDosesRange: (startDate: string, endDate: string) =>
    request<Array<Dose & { medicine: Medicine | null }>>(
      `/doses/range?startDate=${startDate}&endDate=${endDate}`
    ),

  updateDose: (doseId: string, status: string) =>
    request<Dose>(`/doses/${doseId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  markSlotAll: (date: string, slot: string) =>
    request<{ message: string; updatedCount: number }>('/doses/mark-slot', {
      method: 'POST',
      body: JSON.stringify({ date, slot }),
    }),

  // Receipts
  getReceipts: () => request<ChangeReceipt[]>('/receipts'),

  reverseReceipt: (id: string) =>
    request<{ message: string; receipt: ChangeReceipt }>(`/receipts/${id}/reverse`, {
      method: 'POST',
    }),

  ackReceipt: (id: string) =>
    request<ChangeReceipt>(`/receipts/${id}/ack`, {
      method: 'POST',
    }),

  // Duty Roster
  getDutyRoster: (startDate?: string, endDate?: string) =>
    request<Duty[]>(
      `/duty${startDate ? `?startDate=${startDate}&endDate=${endDate}` : ''}`
    ),

  setDuty: (payload: { date: string; slot: string; memberId: string; handoffNote?: string }) =>
    request<Duty>('/duty', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Checkins
  getCheckins: () => request<Checkin[]>('/checkins'),

  createCheckin: (payload: { mood: number; symptoms: string[]; note?: string }) =>
    request<Checkin>('/checkins', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Appointments
  getAppointments: () => request<Appointment[]>('/appointments'),

  createAppointment: (payload: any) =>
    request<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateAppointment: (id: string, payload: any) =>
    request<Appointment>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteAppointment: (id: string) =>
    request<{ message: string }>(`/appointments/${id}`, {
      method: 'DELETE',
    }),

  addDoctorQuestion: (appointmentId: string, question: string) =>
    request<Appointment>(`/appointments/${appointmentId}/questions`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),

  // Dadi Voice
  talkToDadi: (payload: {
    message: string;
    confirmPendingAction?: boolean;
    pendingCompartment?: string;
  }) =>
    request<{
      reply: string;
      actionTaken?: string;
      requiresConfirmation?: boolean;
      pendingCompartment?: string;
      isEmergency?: boolean;
    }>('/dadi', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Pattern Insights
  getInsights: () => request<PatternInsight[]>('/insights'),

  // Audit Logs
  getAuditLogs: () => request<any[]>('/audit'),

  // Demo Engine
  getDemoInbox: () => request<any[]>('/demo/inbox'),

  triggerAlertEngine: () =>
    request<any>('/demo/trigger-engine', { method: 'POST' }),

  simulateMissedDose: (slot: string) =>
    request<any>('/demo/simulate-missed', {
      method: 'POST',
      body: JSON.stringify({ slot }),
    }),
};

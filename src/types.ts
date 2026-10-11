export type Role = 'doctor' | 'patient' | 'admin';

export interface User {
  cedula: string;
  name: string;
  role: Role;
  sedeName?: string;
}

export type AppointmentStatus =
  | 'scheduled'
  | 'checked-in'
  | 'called'
  | 'in-attendance'
  | 'attended'
  | 'absent'
  | 'rescheduled';

export interface Appointment {
  id: string;
  patientCedula: string;
  patientName: string;
  scheduledTime: string;
  status: AppointmentStatus;
  ticketNumber: number;
  checkInTime?: number;
  calledAt?: number;
  gpsDistance?: number;
  attendanceStartAt?: number;
  attendanceEndAt?: number;
  rescheduleCount: number;
}

export interface SedeConfig {
  name: string;
  address: string;
  lat: number;
  lng: number;
  consultationMinutes: number;
  geofenceRadius: number;
}

export interface AppData {
  users: User[];
  appointments: Appointment[];
  sede: SedeConfig;
  nextTicketNumber: number;
  currentCalledId: string | null;
  countdownEndsAt: number | null;
  attendedCount: number;
  totalConsultationMinutes: number;
}

export const COUNTDOWN_SECONDS = 180;

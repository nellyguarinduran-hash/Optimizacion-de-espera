import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AppData, User, SedeConfig, Appointment } from '@/types';
import { COUNTDOWN_SECONDS } from '@/types';
import { supabase } from '@/lib/supabase';
import { DEFAULT_SEDE } from '@/data/mockData';

const SESSION_KEY = 'turnomedico-session-cedula';

interface AppContextValue {
  data: AppData;
  currentUser: User | null;
  loading: boolean;
  login: (cedula: string) => Promise<User | null>;
  logout: () => void;
  checkIn: (cedula: string, name: string, gpsDistance: number) => Promise<Appointment | null>;
  getMyAppointment: (cedula: string) => Appointment | undefined;
  getQueuePosition: (cedula: string) => number;
  getEstimatedWait: (cedula: string) => number;
  callNext: () => Promise<void>;
  markPresent: () => Promise<void>;
  markAbsentAndReschedule: () => Promise<void>;
  updateSede: (sede: Partial<SedeConfig>) => Promise<void>;
  addUser: (user: User) => Promise<void>;
  removeUser: (cedula: string) => Promise<void>;
  resetAll: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

interface DbUser {
  cedula: string;
  name: string;
  role: string;
  sede_name: string | null;
}

interface DbAppointment {
  id: string;
  patient_cedula: string;
  patient_name: string;
  scheduled_time: string;
  status: string;
  ticket_number: number;
  check_in_time: number | null;
  called_at: number | null;
  gps_distance: number | null;
  attendance_start_at: number | null;
  attendance_end_at: number | null;
  reschedule_count: number;
}

interface DbSedeConfig {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  consultation_minutes: number;
  geofence_radius: number;
}

interface DbQueueState {
  id: number;
  next_ticket_number: number;
  current_called_id: string | null;
  countdown_ends_at: number | null;
  attended_count: number;
  total_consultation_minutes: number;
}

function mapUser(u: DbUser): User {
  return {
    cedula: u.cedula,
    name: u.name,
    role: u.role as User['role'],
    sedeName: u.sede_name ?? undefined,
  };
}

function mapAppointment(a: DbAppointment): Appointment {
  return {
    id: a.id,
    patientCedula: a.patient_cedula,
    patientName: a.patient_name,
    scheduledTime: a.scheduled_time,
    status: a.status as Appointment['status'],
    ticketNumber: a.ticket_number,
    checkInTime: a.check_in_time ?? undefined,
    calledAt: a.called_at ?? undefined,
    gpsDistance: a.gps_distance ?? undefined,
    attendanceStartAt: a.attendance_start_at ?? undefined,
    attendanceEndAt: a.attendance_end_at ?? undefined,
    rescheduleCount: a.reschedule_count,
  };
}

const DEFAULT_DATA: AppData = {
  users: [],
  appointments: [],
  sede: { ...DEFAULT_SEDE },
  nextTicketNumber: 1,
  currentCalledId: null,
  countdownEndsAt: null,
  attendedCount: 0,
  totalConsultationMinutes: 0,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(DEFAULT_DATA);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load all data from Supabase
  const loadData = async () => {
    const [usersRes, apptsRes, sedeRes, queueRes] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('appointments').select('*'),
      supabase.from('sede_config').select('*').eq('id', 1).maybeSingle(),
      supabase.from('queue_state').select('*').eq('id', 1).maybeSingle(),
    ]);

    const users = (usersRes.data as DbUser[] ?? []).map(mapUser);
    const appointments = (apptsRes.data as DbAppointment[] ?? []).map(mapAppointment);

    let sede: SedeConfig = { ...DEFAULT_SEDE };
    if (sedeRes.data) {
      const s = sedeRes.data as DbSedeConfig;
      sede = {
        name: s.name,
        address: s.address,
        lat: s.lat,
        lng: s.lng,
        consultationMinutes: s.consultation_minutes,
        geofenceRadius: s.geofence_radius,
      };
    }

    let queueState = { nextTicketNumber: 1, currentCalledId: null as string | null, countdownEndsAt: null as number | null, attendedCount: 0, totalConsultationMinutes: 0 };
    if (queueRes.data) {
      const q = queueRes.data as DbQueueState;
      queueState = {
        nextTicketNumber: q.next_ticket_number,
        currentCalledId: q.current_called_id,
        countdownEndsAt: q.countdown_ends_at,
        attendedCount: q.attended_count,
        totalConsultationMinutes: q.total_consultation_minutes,
      };
    }

    setData({ users, appointments, sede, ...queueState });
  };

  // Initial load + restore session
  useEffect(() => {
    (async () => {
      await loadData();
      const savedCedula = localStorage.getItem(SESSION_KEY);
      if (savedCedula) {
        const { data: userRow } = await supabase
          .from('users')
          .select('*')
          .eq('cedula', savedCedula)
          .maybeSingle();
        if (userRow) setCurrentUser(mapUser(userRow as DbUser));
      }
      setLoading(false);
    })();
  }, []);

  // Poll for updates every 2 seconds (real-time sync across users)
  useEffect(() => {
    if (loading) return;
    pollRef.current = setInterval(loadData, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loading]);

  // Auto-absent when countdown hits 0
  useEffect(() => {
    if (!data.countdownEndsAt || !data.currentCalledId) return;
    const remaining = data.countdownEndsAt - Date.now();
    if (remaining <= 0) {
      markAbsentAuto(data.currentCalledId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.countdownEndsAt, data.currentCalledId]);

  const markAbsentAuto = async (calledId: string) => {
    const { data: appts } = await supabase.from('appointments').select('*');
    const all = (appts as DbAppointment[] ?? []);
    const waitingApts = all
      .filter((a) => a.status === 'checked-in' || a.status === 'rescheduled')
      .sort((a, b) => a.ticket_number - b.ticket_number);
    const lastTicket = waitingApts.length > 0
      ? Math.max(...waitingApts.map((a) => a.ticket_number))
      : Math.max(...all.map((a) => a.ticket_number), 0);

    const called = all.find((a) => a.id === calledId);
    if (!called) return;

    await supabase
      .from('appointments')
      .update({
        status: 'absent',
        reschedule_count: called.reschedule_count + 1,
        ticket_number: lastTicket + 1,
      })
      .eq('id', calledId);

    await supabase
      .from('queue_state')
      .update({ current_called_id: null, countdown_ends_at: null, updated_at: new Date().toISOString() })
      .eq('id', 1);

    await loadData();
  };

  const login = async (cedula: string): Promise<User | null> => {
    const { data: userRow, error } = await supabase
      .from('users')
      .select('*')
      .eq('cedula', cedula.trim())
      .maybeSingle();
    if (error || !userRow) return null;
    const user = mapUser(userRow as DbUser);
    setCurrentUser(user);
    localStorage.setItem(SESSION_KEY, user.cedula);
    return user;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const checkIn = async (cedula: string, name: string, gpsDistance: number): Promise<Appointment | null> => {
    const { data: existing } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_cedula', cedula)
      .in('status', ['checked-in', 'scheduled', 'rescheduled']);

    const existingAppts = (existing as DbAppointment[] ?? []);
    if (existingAppts.length > 0) {
      const ex = existingAppts[0];
      const { data: updated, error } = await supabase
        .from('appointments')
        .update({
          status: 'checked-in',
          check_in_time: Date.now(),
          gps_distance: gpsDistance,
        })
        .eq('id', ex.id)
        .select('*')
        .maybeSingle();
      if (error || !updated) return null;
      await loadData();
      return mapAppointment(updated as DbAppointment);
    }

    const { data: queueRow } = await supabase
      .from('queue_state')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    const ticketNumber = (queueRow as DbQueueState | null)?.next_ticket_number ?? 1;

    const { data: newApt, error } = await supabase
      .from('appointments')
      .insert({
        patient_cedula: cedula,
        patient_name: name,
        scheduled_time: '--:--',
        status: 'checked-in',
        ticket_number: ticketNumber,
        check_in_time: Date.now(),
        gps_distance: gpsDistance,
        reschedule_count: 0,
      })
      .select('*')
      .maybeSingle();
    if (error || !newApt) return null;

    await supabase
      .from('queue_state')
      .update({ next_ticket_number: ticketNumber + 1, updated_at: new Date().toISOString() })
      .eq('id', 1);

    await loadData();
    return mapAppointment(newApt as DbAppointment);
  };

  const getMyAppointment = (cedula: string) =>
    data.appointments.find(
      (a) =>
        a.patientCedula === cedula &&
        a.status !== 'attended' &&
        a.status !== 'absent',
    );

  const getQueuePosition = (cedula: string): number => {
    const waiting = data.appointments
      .filter((a) => a.status === 'checked-in' || a.status === 'rescheduled')
      .sort((a, b) => a.ticketNumber - b.ticketNumber);
    return waiting.findIndex((a) => a.patientCedula === cedula);
  };

  const getEstimatedWait = (cedula: string): number => {
    const pos = getQueuePosition(cedula);
    if (pos <= 0) return 5;
    return pos * data.sede.consultationMinutes;
  };

  const callNext = async () => {
    const { data: appts } = await supabase.from('appointments').select('*');
    const all = (appts as DbAppointment[] ?? []);
    const waiting = all
      .filter((a) => a.status === 'checked-in' || a.status === 'rescheduled')
      .sort((a, b) => a.ticket_number - b.ticket_number);
    const next = waiting[0];
    if (!next) return;

    const now = Date.now();
    let attendedCount = 0;
    let totalConsultationMinutes = 0;

    const { data: queueRow } = await supabase
      .from('queue_state')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    const qs = queueRow as DbQueueState | null;
    attendedCount = qs?.attended_count ?? 0;
    totalConsultationMinutes = qs?.total_consultation_minutes ?? 0;

    const currentInAttendance = all.find((a) => a.status === 'in-attendance');
    if (currentInAttendance) {
      const durationMin = Math.round(
        (now - (currentInAttendance.attendance_start_at ?? now)) / 60000,
      );
      totalConsultationMinutes += durationMin;
      attendedCount += 1;
      await supabase
        .from('appointments')
        .update({ status: 'attended', attendance_end_at: now })
        .eq('id', currentInAttendance.id);
    }

    await supabase
      .from('appointments')
      .update({ status: 'called', called_at: now })
      .eq('id', next.id);

    await supabase
      .from('queue_state')
      .update({
        current_called_id: next.id,
        countdown_ends_at: now + COUNTDOWN_SECONDS * 1000,
        attended_count: attendedCount,
        total_consultation_minutes: totalConsultationMinutes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);

    await loadData();
  };

  const markPresent = async () => {
    if (!data.currentCalledId) return;
    await supabase
      .from('appointments')
      .update({ status: 'in-attendance', attendance_start_at: Date.now() })
      .eq('id', data.currentCalledId);

    await supabase
      .from('queue_state')
      .update({ current_called_id: null, countdown_ends_at: null, updated_at: new Date().toISOString() })
      .eq('id', 1);

    await loadData();
  };

  const markAbsentAndReschedule = async () => {
    if (!data.currentCalledId) return;
    const calledId = data.currentCalledId;

    const { data: appts } = await supabase.from('appointments').select('*');
    const all = (appts as DbAppointment[] ?? []);
    const waitingApts = all
      .filter((a) => a.status === 'checked-in' || a.status === 'rescheduled')
      .sort((a, b) => a.ticket_number - b.ticket_number);
    const lastTicket = waitingApts.length > 0
      ? Math.max(...waitingApts.map((a) => a.ticket_number))
      : Math.max(...all.map((a) => a.ticket_number), 0);

    const called = all.find((a) => a.id === calledId);
    if (!called) return;

    await supabase
      .from('appointments')
      .update({
        status: 'rescheduled',
        reschedule_count: called.reschedule_count + 1,
        ticket_number: lastTicket + 1,
      })
      .eq('id', calledId);

    await supabase
      .from('queue_state')
      .update({ current_called_id: null, countdown_ends_at: null, updated_at: new Date().toISOString() })
      .eq('id', 1);

    await loadData();
  };

  const updateSede = async (sede: Partial<SedeConfig>) => {
    const update: Record<string, number | string> = {};
    if (sede.name !== undefined) update.name = sede.name;
    if (sede.address !== undefined) update.address = sede.address;
    if (sede.lat !== undefined) update.lat = sede.lat;
    if (sede.lng !== undefined) update.lng = sede.lng;
    if (sede.consultationMinutes !== undefined) update.consultation_minutes = sede.consultationMinutes;
    if (sede.geofenceRadius !== undefined) update.geofence_radius = sede.geofenceRadius;
    update.updated_at = new Date().toISOString();

    await supabase.from('sede_config').update(update).eq('id', 1);
    await loadData();
  };

  const addUser = async (user: User) => {
    const { data: existing } = await supabase
      .from('users')
      .select('cedula')
      .eq('cedula', user.cedula)
      .maybeSingle();
    if (existing) return;

    await supabase.from('users').insert({
      cedula: user.cedula,
      name: user.name,
      role: user.role,
      sede_name: user.sedeName ?? null,
    });
    await loadData();
  };

  const removeUser = async (cedula: string) => {
    await supabase.from('users').delete().eq('cedula', cedula);
    await loadData();
  };

  const resetAll = async () => {
    await supabase.from('appointments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase
      .from('queue_state')
      .update({
        next_ticket_number: 1,
        current_called_id: null,
        countdown_ends_at: null,
        attended_count: 0,
        total_consultation_minutes: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);
    await loadData();
  };

  return (
    <AppContext.Provider
      value={{
        data,
        currentUser,
        loading,
        login,
        logout,
        checkIn,
        getMyAppointment,
        getQueuePosition,
        getEstimatedWait,
        callNext,
        markPresent,
        markAbsentAndReschedule,
        updateSede,
        addUser,
        removeUser,
        resetAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

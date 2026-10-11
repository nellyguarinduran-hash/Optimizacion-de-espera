import { useState } from 'react';
import {
  Stethoscope,
  UserCheck,
  Clock,
  TrendingUp,
  MapPin,
  ChevronRight,
  CheckCircle2,
  Users,
  Timer,
  CreditCard,
  RefreshCw,
  UserX,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useNow, formatCountdown } from '@/hooks/useNow';
import { COUNTDOWN_SECONDS } from '@/types';
import type { User as AppUser, Appointment } from '@/types';

interface DoctorPanelProps {
  user: AppUser;
}

export function DoctorPanel({ user }: DoctorPanelProps) {
  const { data, callNext, markPresent, markAbsentAndReschedule, resetAll } = useApp();
  const now = useNow(1000);
  const [busy, setBusy] = useState(false);

  const handleCallNext = async () => {
    setBusy(true);
    await callNext();
    setBusy(false);
  };

  const handlePresent = async () => {
    setBusy(true);
    await markPresent();
    setBusy(false);
  };

  const handleAbsent = async () => {
    setBusy(true);
    await markAbsentAndReschedule();
    setBusy(false);
  };

  const handleReset = async () => {
    setBusy(true);
    await resetAll();
    setBusy(false);
  };

  const waitingPatients = data.appointments
    .filter((a) => a.status === 'checked-in' || a.status === 'rescheduled')
    .sort((a, b) => a.ticketNumber - b.ticketNumber);

  const calledPatient = data.appointments.find((a) => a.id === data.currentCalledId);
  const inAttendance = data.appointments.find((a) => a.status === 'in-attendance');

  const attendedToday = data.appointments.filter((a) => a.status === 'attended');
  const avgTime = data.attendedCount > 0
    ? Math.round(data.totalConsultationMinutes / data.attendedCount)
    : 0;

  const countdownRemaining = calledPatient && data.countdownEndsAt
    ? Math.max(0, Math.floor((data.countdownEndsAt - now) / 1000))
    : 0;
  const countdownProgress = calledPatient
    ? ((COUNTDOWN_SECONDS - countdownRemaining) / COUNTDOWN_SECONDS) * 100
    : 0;

  const attendanceElapsed = inAttendance?.attendanceStartAt
    ? Math.floor((now - inAttendance.attendanceStartAt) / 60000)
    : 0;

  const formatDistance = (m: number | undefined) => {
    if (m === undefined) return '—';
    return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
  };

  return (
    <div className="min-h-[calc(100vh-140px)] px-4 py-5 max-w-md mx-auto">
      {/* Doctor profile */}
      <div className="bg-gradient-to-br from-sky-600 to-blue-700 rounded-3xl p-5 shadow-lg shadow-sky-200 mb-4 text-white animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold">{user.name}</p>
            <div className="flex items-center gap-1.5 text-white/80 text-sm">
              <CreditCard className="w-3.5 h-3.5" />
              CC: {user.cedula}
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-white/80 text-sm bg-white/10 rounded-lg px-3 py-2">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{data.sede.name}</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4 animate-slide-up">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-medium text-slate-500">Atendidos hoy</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{data.attendedCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-medium text-slate-500">Tiempo promedio</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {avgTime}<span className="text-base font-medium text-slate-400"> min</span>
          </p>
        </div>
      </div>

      {/* In-attendance banner */}
      {inAttendance && (
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 shadow-md shadow-emerald-200 mb-4 text-white animate-slide-up">
          <div className="flex items-center gap-2 mb-2">
            <Stethoscope className="w-5 h-5" />
            <span className="text-sm font-medium text-white/80">En consulta ahora</span>
          </div>
          <p className="text-xl font-bold">
            #{String(inAttendance.ticketNumber).padStart(2, '0')} · {inAttendance.patientName}
          </p>
          <div className="flex items-center gap-1.5 text-white/90 text-sm mt-2 bg-white/10 rounded-lg px-3 py-1.5">
            <Clock className="w-4 h-4" />
            <span>En consulta: {attendanceElapsed} min</span>
          </div>
        </div>
      )}

      {/* Countdown card — when patient is called */}
      {calledPatient && (
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 shadow-lg shadow-red-200 mb-4 text-white text-center animate-bounce-in">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Timer className="w-5 h-5" />
            <span className="text-sm font-medium text-white/80">Llamado en curso</span>
          </div>
          <p className="text-lg font-bold mb-3">
            #{String(calledPatient.ticketNumber).padStart(2, '0')} · {calledPatient.patientName}
          </p>

          <div className="inline-flex items-center gap-2 bg-white/15 rounded-2xl px-5 py-2.5 mb-3">
            <span className="text-3xl font-extrabold font-mono tracking-tight">
              {formatCountdown(countdownRemaining)}
            </span>
          </div>

          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-white rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${countdownProgress}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePresent}
              disabled={busy}
              className="bg-white/20 hover:bg-white/30 active:scale-[0.98] transition-all
                         font-semibold py-3 rounded-xl flex items-center justify-center gap-2
                         disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              Paciente Presente
            </button>
            <button
              onClick={handleAbsent}
              disabled={busy}
              className="bg-white/20 hover:bg-white/30 active:scale-[0.98] transition-all
                         font-semibold py-3 rounded-xl flex items-center justify-center gap-2
                         disabled:opacity-50"
            >
              <UserX className="w-5 h-5" />
              Ausente / Reagendar
            </button>
          </div>
        </div>
      )}

      {/* Call next button — only when no countdown active */}
      {!calledPatient && (
        <button
          onClick={handleCallNext}
          disabled={waitingPatients.length === 0 || busy}
          className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl
                     hover:bg-emerald-600 active:scale-[0.98] transition-all
                     disabled:opacity-40 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2.5 shadow-md shadow-emerald-200 mb-4"
        >
          <UserCheck className="w-6 h-6" />
          {inAttendance ? 'Finalizar y Llamar Siguiente' : 'Llamar Siguiente Paciente'}
        </button>
      )}

      {/* Appointment list */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-600" />
            Citas en espera
            <span className="bg-sky-100 text-sky-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {waitingPatients.length}
            </span>
          </h3>
        </div>

        {waitingPatients.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No hay pacientes en espera.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {waitingPatients.map((apt, idx) => (
              <AppointmentRow
                key={apt.id}
                apt={apt}
                position={idx + 1}
                isNext={idx === 0 && !calledPatient}
                distanceText={formatDistance(apt.gpsDistance)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Attended today */}
      {attendedToday.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Atendidos ({attendedToday.length})
          </h3>
          <div className="space-y-2">
            {attendedToday.slice(-4).reverse().map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl p-3 flex items-center gap-3 border border-slate-100"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-700">
                    #{String(p.ticketNumber).padStart(2, '0')} · {p.patientName}
                  </span>
                </div>
                {p.attendanceStartAt && p.attendanceEndAt && (
                  <span className="text-xs text-slate-400">
                    {Math.round((p.attendanceEndAt - p.attendanceStartAt) / 60000)} min
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset */}
      <button
        onClick={handleReset}
        disabled={busy}
        className="w-full text-sm text-slate-400 py-2 flex items-center justify-center gap-1.5 hover:text-slate-600
                       disabled:opacity-50"
      >
        <RefreshCw className="w-4 h-4" />
        Reiniciar con datos de prueba
      </button>
    </div>
  );
}

interface AppointmentRowProps {
  apt: Appointment;
  position: number;
  isNext: boolean;
  distanceText: string;
}

function AppointmentRow({ apt, position, isNext, distanceText }: AppointmentRowProps) {
  return (
    <div
      className={`bg-white rounded-xl p-3 flex items-center gap-3 border transition-all animate-slide-in ${
        isNext ? 'border-sky-300 ring-1 ring-sky-100' : 'border-slate-100'
      }`}
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
          isNext ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500'
        }`}
      >
        {String(apt.ticketNumber).padStart(2, '0')}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{apt.patientName}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {apt.scheduledTime}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {distanceText}
          </span>
          {apt.status === 'rescheduled' && (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
              REAGENDADO
            </span>
          )}
          {isNext && (
            <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">
              SIGUIENTE
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-200" />
    </div>
  );
}

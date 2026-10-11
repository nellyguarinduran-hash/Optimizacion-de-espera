import { useEffect, useRef } from 'react';
import {
  Clock,
  Users,
  Stethoscope,
  Bell,
  CheckCircle2,
  XCircle,
  MapPin,
  Volume2,
  Timer,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useNotificationSound } from '@/hooks/useSound';
import { useNow, formatCountdown } from '@/hooks/useNow';
import { COUNTDOWN_SECONDS } from '@/types';
import type { User as AppUser, Appointment } from '@/types';

interface WaitingScreenProps {
  user: AppUser;
}

type Phase = 'waiting' | 'next' | 'called' | 'in-attendance' | 'attended' | 'absent' | 'rescheduled';

function getPhase(apt: Appointment | undefined, position: number): Phase {
  if (!apt) return 'waiting';
  if (apt.status === 'called') return 'called';
  if (apt.status === 'in-attendance') return 'in-attendance';
  if (apt.status === 'attended') return 'attended';
  if (apt.status === 'absent') return 'absent';
  if (apt.status === 'rescheduled') return 'rescheduled';
  if (position === 0) return 'next';
  return 'waiting';
}

export function WaitingScreen({ user }: WaitingScreenProps) {
  const { data, getMyAppointment, getQueuePosition, getEstimatedWait } = useApp();
  const { play } = useNotificationSound();
  const now = useNow(1000);
  const previousPhaseRef = useRef<Phase>('waiting');
  const soundPlayedRef = useRef(false);

  const apt = getMyAppointment(user.cedula);
  const position = apt ? getQueuePosition(user.cedula) : -1;
  const estimatedWait = apt ? getEstimatedWait(user.cedula) : 0;
  const phase = getPhase(apt, position);

  const isCalled = phase === 'called';
  const countdownRemaining = isCalled && data.countdownEndsAt
    ? Math.max(0, Math.floor((data.countdownEndsAt - now) / 1000))
    : 0;
  const countdownProgress = isCalled
    ? ((COUNTDOWN_SECONDS - countdownRemaining) / COUNTDOWN_SECONDS) * 100
    : 0;

  // Play sound when called
  useEffect(() => {
    if (isCalled && !soundPlayedRef.current && previousPhaseRef.current !== 'called') {
      play();
      soundPlayedRef.current = true;
    }
    if (!isCalled) {
      soundPlayedRef.current = false;
    }
    previousPhaseRef.current = phase;
  }, [isCalled, phase, play]);

  // Vibrate when called
  useEffect(() => {
    if (isCalled && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
  }, [isCalled]);

  if (!apt) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No tienes un turno activo.</p>
        </div>
      </div>
    );
  }

  const waitingPatients = data.appointments
    .filter((a) => a.status === 'checked-in' || a.status === 'rescheduled')
    .sort((a, b) => a.ticketNumber - b.ticketNumber);

  return (
    <div className="min-h-[calc(100vh-140px)] px-4 py-5 max-w-md mx-auto">
      {/* Countdown Alert — when called */}
      {isCalled && (
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl p-6 shadow-xl shadow-red-200 mb-4 text-white text-center animate-bounce-in">
          <div className="relative inline-block mb-3">
            <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse-ring" />
            <div className="relative w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto">
              <Bell className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold mb-1">¡Has sido llamado!</h2>
          <p className="text-white/90 text-sm mb-4">Presentáte en el cubículo de atención</p>

          {/* Countdown timer */}
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-2xl px-5 py-3 mb-3">
            <Timer className="w-7 h-7" />
            <span className="text-4xl font-extrabold font-mono tracking-tight">
              {formatCountdown(countdownRemaining)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-white rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${countdownProgress}%` }}
            />
          </div>
          <p className="text-white/80 text-xs flex items-center justify-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5" />
            Tienes {formatCountdown(countdownRemaining)} para presentarte
          </p>
        </div>
      )}

      {/* Ticket Card */}
      <div
        className={`rounded-3xl p-6 shadow-lg mb-4 transition-all duration-500 animate-slide-up ${
          phase === 'in-attendance'
            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
            : isCalled
              ? 'bg-white text-slate-800 border border-slate-100'
              : phase === 'next'
                ? 'bg-gradient-to-br from-sky-500 to-blue-600 text-white'
                : phase === 'rescheduled'
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                  : 'bg-white text-slate-800 border border-slate-100'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className={`text-sm ${phase === 'waiting' ? 'text-slate-500' : 'text-white/70'}`}>
              Tu número de turno
            </p>
            <div className="text-5xl font-extrabold tracking-tight mt-1">
              #{String(apt.ticketNumber).padStart(2, '0')}
            </div>
          </div>
          {phase === 'in-attendance' && (
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <Stethoscope className="w-7 h-7" />
            </div>
          )}
          {phase === 'next' && (
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <Users className="w-7 h-7" />
            </div>
          )}
          {phase === 'waiting' && (
            <div className="w-14 h-14 rounded-full bg-sky-50 flex items-center justify-center">
              <Clock className="w-7 h-7 text-sky-600" />
            </div>
          )}
          {phase === 'rescheduled' && (
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <Clock className="w-7 h-7" />
            </div>
          )}
        </div>

        <div className={`h-px ${phase === 'waiting' ? 'bg-slate-100' : 'bg-white/20'} mb-4`} />

        {phase === 'waiting' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Tu posición en la fila</span>
              <span className="font-bold text-slate-800">
                {position >= 0 ? `#${position + 1}` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Pacientes antes que tú</span>
              <span className="font-bold text-sky-600 text-lg">{position}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Tiempo estimado
              </span>
              <span className="font-bold text-slate-800">~{estimatedWait} min</span>
            </div>
          </div>
        )}

        {phase === 'next' && (
          <div className="text-center py-2">
            <p className="text-lg font-bold">¡Eres el siguiente!</p>
            <p className="text-white/80 text-sm mt-1">Prepárate para entrar al consultorio</p>
          </div>
        )}

        {phase === 'in-attendance' && (
          <div className="text-center py-2">
            <p className="text-xl font-extrabold">En atención</p>
            <p className="text-white/90 text-sm mt-1">Estás siendo atendido por el médico</p>
          </div>
        )}

        {phase === 'rescheduled' && (
          <div className="text-center py-2">
            <p className="text-lg font-bold">Turno reagendado</p>
            <p className="text-white/90 text-sm mt-1">
              Te has movido un turno hacia atrás. Nueva posición: #{position >= 0 ? position + 1 : '—'}
            </p>
            <p className="text-white/70 text-xs mt-2">
              Reagendado {apt.rescheduleCount} vez{apt.rescheduleCount !== 1 ? 'ces' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Progress bar (waiting states) */}
      {(phase === 'waiting' || phase === 'next' || phase === 'rescheduled') && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4 animate-slide-up">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Estado del turno
          </p>
          <div className="flex items-center gap-1">
            {[
              { key: 'waiting', label: 'En espera', icon: Clock },
              { key: 'next', label: 'Próximo', icon: Users },
              { key: 'called', label: 'Llamado', icon: Bell },
              { key: 'in-attendance', label: 'En consulta', icon: Stethoscope },
            ].map((step, i) => {
              const stepOrder = ['waiting', 'next', 'called', 'in-attendance'];
              const currentIdx = stepOrder.indexOf(phase);
              const isActive = i <= currentIdx;
              return (
                <div key={step.key} className="flex-1 flex items-center gap-1">
                  <div className="flex-1">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        isActive ? 'bg-sky-500' : 'bg-slate-100'
                      }`}
                    />
                    <div className="flex items-center gap-1 mt-1.5">
                      <step.icon
                        className={`w-3.5 h-3.5 transition-colors ${
                          isActive ? 'text-sky-600' : 'text-slate-300'
                        }`}
                      />
                      <span
                        className={`text-[10px] font-medium transition-colors ${
                          isActive ? 'text-sky-600' : 'text-slate-300'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Queue preview */}
      {(phase === 'waiting' || phase === 'rescheduled') && waitingPatients.length > 1 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4 animate-slide-up">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Fila actual
          </p>
          <div className="space-y-2">
            {waitingPatients.slice(0, 6).map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 p-2 rounded-lg ${
                  p.patientCedula === user.cedula ? 'bg-sky-50' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    p.patientCedula === user.cedula
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {String(p.ticketNumber).padStart(2, '0')}
                </div>
                <span
                  className={`text-sm ${
                    p.patientCedula === user.cedula ? 'font-semibold text-sky-700' : 'text-slate-600'
                  }`}
                >
                  {p.patientCedula === user.cedula ? 'Tú' : p.patientName}
                  {p.status === 'rescheduled' && (
                    <span className="text-amber-500 text-xs ml-1.5">(Reagendado)</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sede info */}
      <div className="bg-sky-50 rounded-2xl p-4 mb-4 flex items-start gap-3">
        <MapPin className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-slate-700">{data.sede.name}</p>
          <p className="text-xs text-slate-500">{data.sede.address}</p>
        </div>
      </div>
    </div>
  );
}

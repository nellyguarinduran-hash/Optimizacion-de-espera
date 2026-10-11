import { useState, useEffect } from 'react';
import { MapPin, User, CreditCard, Navigation, Loader2, CheckCircle2, AlertTriangle, Stethoscope } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useApp } from '@/context/AppContext';
import type { User as AppUser } from '@/types';

interface CheckInScreenProps {
  user: AppUser;
  onCheckedIn: () => void;
}

export function CheckInScreen({ user, onCheckedIn }: CheckInScreenProps) {
  const { data, checkIn } = useApp();
  const { checkLocation, simulateNear, result, loading } = useGeolocation(
    data.sede.lat,
    data.sede.lng,
    data.sede.geofenceRadius,
  );
  const [name, setName] = useState(user.name);
  const [cedula, setCedula] = useState(user.cedula);
  const [formError, setFormError] = useState('');

  const geoOk = result.status === 'success' || result.status === 'simulated';

  useEffect(() => {
    setName(user.name);
    setCedula(user.cedula);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cedula.trim()) {
      setFormError('Por favor completa todos los campos.');
      return;
    }
    if (!geoOk || result.distance === null) {
      setFormError('Debes verificar tu ubicación primero.');
      return;
    }
    const apt = await checkIn(cedula.trim(), name.trim(), result.distance);
    if (apt) {
      onCheckedIn();
    } else {
      setFormError('No se pudo registrar el check-in. Intenta de nuevo.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col px-4 py-5 max-w-md mx-auto">
      {/* Hero */}
      <div className="text-center mb-5 animate-slide-up">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-100 mb-3">
          <Stethoscope className="w-8 h-8 text-sky-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Check-in de Llegada</h1>
        <p className="text-slate-500 mt-1 text-balance">
          Verifica tu ubicación y regístrate en la fila de espera.
        </p>
      </div>

      {/* Sede info */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4 animate-slide-up">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-sky-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 text-sm">{data.sede.name}</p>
            <p className="text-sm text-slate-500">{data.sede.address}</p>
            <p className="text-xs text-sky-600 mt-1">
              Zona de check-in: {data.sede.geofenceRadius}m a la redonda
            </p>
          </div>
        </div>
      </div>

      {/* Geolocation */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-4 animate-slide-up">
        <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-sky-600" />
          Paso 1: Verificar ubicación
        </h2>

        <button
          onClick={checkLocation}
          disabled={loading}
          className="w-full bg-sky-600 text-white font-semibold py-3.5 rounded-xl
                     hover:bg-sky-700 active:scale-[0.98] transition-all
                     disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-sky-200"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <MapPin className="w-5 h-5" />
          )}
          {loading ? 'Verificando...' : 'Verificar Ubicación por GPS'}
        </button>

        <button
          onClick={simulateNear}
          className="w-full mt-2 text-sm text-sky-600 py-2 rounded-lg hover:bg-sky-50 transition-colors"
        >
          O simular ubicación cerca de la sede
        </button>

        {result.status !== 'idle' && (
          <div
            className={`mt-3 p-3 rounded-xl flex items-start gap-2.5 animate-slide-up ${
              geoOk
                ? 'bg-emerald-50 text-emerald-800'
                : result.status === 'too-far'
                  ? 'bg-amber-50 text-amber-800'
                  : 'bg-red-50 text-red-700'
            }`}
          >
            {geoOk ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm">{result.message}</p>
          </div>
        )}
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 animate-slide-up"
      >
        <h2 className="font-semibold text-slate-800 mb-3">Paso 2: Confirma tus datos</h2>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-600 mb-1.5 block">
              Nombre completo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setFormError('');
                }}
                placeholder="Ej. Juan Pérez"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200
                           focus:border-sky-400 focus:ring-2 focus:ring-sky-100
                           outline-none transition-all text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 mb-1.5 block">
              Cédula de Ciudadanía
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                inputMode="numeric"
                value={cedula}
                onChange={(e) => {
                  setCedula(e.target.value.replace(/\D/g, ''));
                  setFormError('');
                }}
                placeholder="Ej. 12345678"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200
                           focus:border-sky-400 focus:ring-2 focus:ring-sky-100
                           outline-none transition-all text-slate-800"
              />
            </div>
          </div>
        </div>

        {formError && (
          <p className="text-sm text-red-600 mt-3 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={!geoOk}
          className="w-full mt-4 bg-emerald-500 text-white font-semibold py-3.5 rounded-xl
                     hover:bg-emerald-600 active:scale-[0.98] transition-all
                     disabled:opacity-40 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2 shadow-sm shadow-emerald-200"
        >
          <CheckCircle2 className="w-5 h-5" />
          Registrar mi llegada (Check-in)
        </button>
      </form>

      <p className="text-center text-xs text-slate-400 mt-4">
        Tus datos solo se usan para gestionar tu turno en esta sesión.
      </p>
    </div>
  );
}

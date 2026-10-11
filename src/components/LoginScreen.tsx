import { useState } from 'react';
import { Stethoscope, CreditCard, ArrowRight, AlertCircle, Loader2, MapPin } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export function LoginScreen() {
  const { login, data } = useApp();
  const [cedula, setCedula] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!cedula.trim()) {
      setError('Ingresa tu número de Cédula de Ciudadanía.');
      return;
    }
    setLoading(true);
    const user = await login(cedula);
    if (!user) {
      setError('Cédula no encontrada. Verifica el número e intenta de nuevo.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex flex-col px-4 py-8 max-w-md mx-auto">
      {/* Logo */}
      <div className="text-center mt-6 mb-8 animate-slide-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-200 mb-4">
          <Stethoscope className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800">TurnoMédico Live</h1>
        <p className="text-slate-500 mt-1.5">Gestión de salas de espera médicas</p>
      </div>

      {/* Sede info */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6 animate-slide-up flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-5 h-5 text-sky-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm">{data.sede.name}</p>
          <p className="text-sm text-slate-500">{data.sede.address}</p>
        </div>
      </div>

      {/* Login form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-slide-up"
      >
        <h2 className="font-bold text-slate-800 mb-1">Iniciar Sesión</h2>
        <p className="text-sm text-slate-500 mb-4">
          Ingresa tu Cédula de Ciudadanía para continuar.
        </p>

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
              setError('');
            }}
            placeholder="Ej. 12345678"
            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200
                       focus:border-sky-400 focus:ring-2 focus:ring-sky-100
                       outline-none transition-all text-slate-800 text-lg tracking-wide"
            autoFocus
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 mt-3 flex items-center gap-1.5 animate-slide-up">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 bg-sky-600 text-white font-semibold py-3.5 rounded-xl
                     hover:bg-sky-700 active:scale-[0.98] transition-all
                     disabled:opacity-60 flex items-center justify-center gap-2
                     shadow-sm shadow-sky-200"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Ingresar
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {/* Demo credentials */}
      <div className="mt-6 bg-sky-50 rounded-2xl p-4 border border-sky-100 animate-slide-up">
        <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide mb-2">
          Cédulas de prueba
        </p>
        <div className="space-y-1.5 text-sm">
          <button
            onClick={() => setCedula('1001')}
            className="w-full flex items-center justify-between text-left hover:bg-white rounded-lg px-2 py-1 transition-colors"
          >
            <span className="text-slate-600">Médico</span>
            <span className="font-mono font-semibold text-sky-700">1001</span>
          </button>
          <button
            onClick={() => setCedula('87654321')}
            className="w-full flex items-center justify-between text-left hover:bg-white rounded-lg px-2 py-1 transition-colors"
          >
            <span className="text-slate-600">Paciente</span>
            <span className="font-mono font-semibold text-sky-700">87654321</span>
          </button>
          <button
            onClick={() => setCedula('1082917595')}
            className="w-full flex items-center justify-between text-left hover:bg-white rounded-lg px-2 py-1 transition-colors"
          >
            <span className="text-slate-600">Administrador</span>
            <span className="font-mono font-semibold text-sky-700">1082917595</span>
          </button>
        </div>
      </div>
    </div>
  );
}

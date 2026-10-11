import { useState } from 'react';
import {
  Settings,
  MapPin,
  Users,
  Clock,
  Save,
  Plus,
  Trash2,
  CreditCard,
  Stethoscope,
  User,
  Shield,
  Navigation,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { Role, User as AppUser } from '@/types';

interface AdminPanelProps {
  user: AppUser;
}

type Tab = 'sede' | 'users' | 'params';

export function AdminPanel({ user: _user }: AdminPanelProps) {
  const { data, updateSede, addUser, removeUser, resetAll } = useApp();
  const [tab, setTab] = useState<Tab>('sede');

  return (
    <div className="min-h-[calc(100vh-140px)] px-4 py-5 max-w-md mx-auto">
      {/* Admin header */}
      <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-3xl p-5 shadow-lg mb-4 text-white animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-lg font-bold">Panel Administrador</p>
            <p className="text-white/60 text-sm">Configuración global del sistema</p>
          </div>
        </div>
      </div>

      {/* Tab selector */}
      <div className="grid grid-cols-3 gap-1 bg-slate-100 rounded-xl p-1 mb-4">
        {[
          { key: 'sede' as Tab, label: 'Sede', icon: MapPin },
          { key: 'users' as Tab, label: 'Usuarios', icon: Users },
          { key: 'params' as Tab, label: 'Parámetros', icon: Clock },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === t.key
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-600'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'sede' && <SedeTab sede={data.sede} onSave={updateSede} />}
      {tab === 'users' && <UsersTab users={data.users} onAdd={addUser} onRemove={removeUser} />}
      {tab === 'params' && <ParamsTab sede={data.sede} onSave={updateSede} onReset={resetAll} />}
    </div>
  );
}

function SedeTab({
  sede,
  onSave,
}: {
  sede: { name: string; address: string; lat: number; lng: number };
  onSave: (s: Partial<typeof sede>) => void;
}) {
  const [name, setName] = useState(sede.name);
  const [address, setAddress] = useState(sede.address);
  const [lat, setLat] = useState(String(sede.lat));
  const [lng, setLng] = useState(String(sede.lng));
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave({
      name,
      address,
      lat: parseFloat(lat) || 0,
      lng: parseFloat(lng) || 0,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 animate-slide-up space-y-4">
      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
        <Settings className="w-5 h-5 text-sky-600" />
        Datos de la Sede
      </h3>

      <div>
        <label className="text-sm font-medium text-slate-600 mb-1.5 block">
          Nombre de la Clínica/Sede
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-200
                     focus:border-sky-400 focus:ring-2 focus:ring-sky-100
                     outline-none transition-all text-slate-800"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-600 mb-1.5 block">
          Dirección
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-200
                     focus:border-sky-400 focus:ring-2 focus:ring-sky-100
                     outline-none transition-all text-slate-800"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-slate-600 mb-1.5 block">
            Latitud GPS
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200
                       focus:border-sky-400 focus:ring-2 focus:ring-sky-100
                       outline-none transition-all text-slate-800"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600 mb-1.5 block">
            Longitud GPS
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200
                       focus:border-sky-400 focus:ring-2 focus:ring-sky-100
                       outline-none transition-all text-slate-800"
          />
        </div>
      </div>

      <div className="bg-sky-50 rounded-xl p-3 flex items-start gap-2.5">
        <Navigation className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600">
          Estas coordenadas definen el punto de referencia para el check-in geolocalizado de los pacientes.
        </p>
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-sky-600 text-white font-semibold py-3.5 rounded-xl
                   hover:bg-sky-700 active:scale-[0.98] transition-all
                   flex items-center justify-center gap-2"
      >
        {saved ? (
          <>
            <CheckCircle2 className="w-5 h-5" />
            ¡Guardado!
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Guardar cambios
          </>
        )}
      </button>
    </div>
  );
}

function UsersTab({
  users,
  onAdd,
  onRemove,
}: {
  users: AppUser[];
  onAdd: (u: AppUser) => void;
  onRemove: (cedula: string) => void;
}) {
  const [newName, setNewName] = useState('');
  const [newCedula, setNewCedula] = useState('');
  const [newRole, setNewRole] = useState<Role>('patient');
  const [error, setError] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCedula.trim()) {
      setError('Completa nombre y cédula.');
      return;
    }
    if (users.some((u) => u.cedula === newCedula.trim())) {
      setError('Ya existe un usuario con esa cédula.');
      return;
    }
    onAdd({ cedula: newCedula.trim(), name: newName.trim(), role: newRole });
    setNewName('');
    setNewCedula('');
    setNewRole('patient');
    setError('');
  };

  const roleIcon = (role: Role) => {
    if (role === 'doctor') return <Stethoscope className="w-4 h-4" />;
    if (role === 'admin') return <Shield className="w-4 h-4" />;
    return <User className="w-4 h-4" />;
  };

  const roleLabel = (role: Role) => {
    if (role === 'doctor') return 'Médico';
    if (role === 'admin') return 'Admin';
    return 'Paciente';
  };

  const roleColor = (role: Role) => {
    if (role === 'doctor') return 'bg-sky-50 text-sky-700';
    if (role === 'admin') return 'bg-slate-100 text-slate-700';
    return 'bg-emerald-50 text-emerald-700';
  };

  return (
    <div className="space-y-4">
      {/* Add user form */}
      <form
        onSubmit={handleAdd}
        className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 animate-slide-up space-y-3"
      >
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Plus className="w-5 h-5 text-sky-600" />
          Agregar Usuario
        </h3>

        <div>
          <label className="text-sm font-medium text-slate-600 mb-1.5 block">
            Nombre completo
          </label>
          <input
            type="text"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              setError('');
            }}
            placeholder="Ej. Dra. Pérez"
            className="w-full px-4 py-3 rounded-xl border border-slate-200
                       focus:border-sky-400 focus:ring-2 focus:ring-sky-100
                       outline-none transition-all text-slate-800"
          />
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
              value={newCedula}
              onChange={(e) => {
                setNewCedula(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              placeholder="Ej. 12345678"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200
                         focus:border-sky-400 focus:ring-2 focus:ring-sky-100
                         outline-none transition-all text-slate-800"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-600 mb-1.5 block">Rol</label>
          <div className="grid grid-cols-3 gap-2">
            {(['patient', 'doctor', 'admin'] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setNewRole(r)}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                  newRole === r
                    ? 'border-sky-400 bg-sky-50 text-sky-700'
                    : 'border-slate-200 text-slate-500'
                }`}
              >
                {roleIcon(r)}
                {roleLabel(r)}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          className="w-full bg-sky-600 text-white font-semibold py-3 rounded-xl
                     hover:bg-sky-700 active:scale-[0.98] transition-all
                     flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Agregar
        </button>
      </form>

      {/* User list */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 animate-slide-up">
        <h3 className="font-semibold text-slate-800 mb-3">
          Usuarios registrados ({users.length})
        </h3>
        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.cedula}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${roleColor(u.role)}`}>
                {roleIcon(u.role)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{u.name}</p>
                <p className="text-xs text-slate-400">CC: {u.cedula} · {roleLabel(u.role)}</p>
              </div>
              <button
                onClick={() => onRemove(u.cedula)}
                className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                title="Eliminar usuario"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ParamsTab({
  sede,
  onSave,
  onReset,
}: {
  sede: { consultationMinutes: number; geofenceRadius: number };
  onSave: (s: Partial<typeof sede>) => void;
  onReset: () => void;
}) {
  const [consultationMinutes, setConsultationMinutes] = useState(String(sede.consultationMinutes));
  const [geofenceRadius, setGeofenceRadius] = useState(String(sede.geofenceRadius));
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSave = () => {
    onSave({
      consultationMinutes: parseInt(consultationMinutes) || 15,
      geofenceRadius: parseInt(geofenceRadius) || 200,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 animate-slide-up space-y-4">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Clock className="w-5 h-5 text-sky-600" />
          Parámetros de Atención
        </h3>

        <div>
          <label className="text-sm font-medium text-slate-600 mb-1.5 block">
            Tiempo por consulta (minutos)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={consultationMinutes}
            onChange={(e) => setConsultationMinutes(e.target.value.replace(/\D/g, ''))}
            className="w-full px-4 py-3 rounded-xl border border-slate-200
                       focus:border-sky-400 focus:ring-2 focus:ring-sky-100
                       outline-none transition-all text-slate-800"
          />
          <p className="text-xs text-slate-400 mt-1.5">
            Se usa para calcular el tiempo estimado de espera de cada paciente.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-600 mb-1.5 block">
            Radio de Check-in GPS (metros)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={geofenceRadius}
            onChange={(e) => setGeofenceRadius(e.target.value.replace(/\D/g, ''))}
            className="w-full px-4 py-3 rounded-xl border border-slate-200
                       focus:border-sky-400 focus:ring-2 focus:ring-sky-100
                       outline-none transition-all text-slate-800"
          />
          <p className="text-xs text-slate-400 mt-1.5">
            El paciente debe estar dentro de este radio para autorizar el check-in.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-sky-600 text-white font-semibold py-3.5 rounded-xl
                     hover:bg-sky-700 active:scale-[0.98] transition-all
                     flex items-center justify-center gap-2"
        >
          {saved ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              ¡Guardado!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Guardar parámetros
            </>
          )}
        </button>
      </div>

      {/* Reset */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 animate-slide-up">
        <h3 className="font-semibold text-slate-800 mb-2">Datos del sistema</h3>
        <p className="text-sm text-slate-500 mb-3">
          Restablece todos los datos (usuarios, citas, sede) a los valores de prueba iniciales.
        </p>
        {confirmReset ? (
          <div className="bg-amber-50 rounded-xl p-3 flex items-center justify-between gap-2">
            <span className="text-sm text-amber-800">¿Confirmar reinicio?</span>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmReset(false)}
                className="text-sm px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                No
              </button>
              <button
                onClick={() => {
                  onReset();
                  setConfirmReset(false);
                }}
                className="text-sm px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600"
              >
                Sí, reiniciar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="w-full text-sm text-slate-400 py-2.5 flex items-center justify-center gap-1.5
                       hover:text-slate-600 border border-slate-200 rounded-xl"
          >
            <RefreshCw className="w-4 h-4" />
            Reiniciar datos de prueba
          </button>
        )}
      </div>
    </div>
  );
}

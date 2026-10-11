import type { AppData, SedeConfig } from '@/types';

export const DEFAULT_SEDE: SedeConfig = {
  name: 'Batallón de Infantería N.5 Córdova - Santa Marta',
  address: 'Calle 24 # 7-100 / Av. Ferrocarril, Santa Marta, Magdalena',
  lat: 11.2358,
  lng: -74.2083,
  consultationMinutes: 15,
  geofenceRadius: 200,
};

export function createMockData(): AppData {
  const now = Date.now();
  return {
    users: [
      {
        cedula: '12345678',
        name: 'Dr. Mario',
        role: 'doctor',
        sedeName: DEFAULT_SEDE.name,
      },
      {
        cedula: '87654321',
        name: 'Paciente Juan',
        role: 'patient',
      },
      {
        cedula: '99999999',
        name: 'Admin Global',
        role: 'admin',
      },
      {
        cedula: '11223344',
        name: 'Paciente María',
        role: 'patient',
      },
      {
        cedula: '55667788',
        name: 'Paciente Carlos',
        role: 'patient',
      },
      {
        cedula: '99887766',
        name: 'Paciente Ana',
        role: 'patient',
      },
    ],
    appointments: [
      {
        id: 'apt-1',
        patientCedula: '87654321',
        patientName: 'Paciente Juan',
        scheduledTime: '08:00',
        status: 'checked-in',
        ticketNumber: 1,
        checkInTime: now - 30 * 60 * 1000,
        gpsDistance: 85,
        rescheduleCount: 0,
      },
      {
        id: 'apt-2',
        patientCedula: '11223344',
        patientName: 'Paciente María',
        scheduledTime: '08:30',
        status: 'checked-in',
        ticketNumber: 2,
        checkInTime: now - 20 * 60 * 1000,
        gpsDistance: 120,
        rescheduleCount: 0,
      },
      {
        id: 'apt-3',
        patientCedula: '55667788',
        patientName: 'Paciente Carlos',
        scheduledTime: '09:00',
        status: 'checked-in',
        ticketNumber: 3,
        checkInTime: now - 12 * 60 * 1000,
        gpsDistance: 45,
        rescheduleCount: 0,
      },
      {
        id: 'apt-4',
        patientCedula: '99887766',
        patientName: 'Paciente Ana',
        scheduledTime: '09:30',
        status: 'checked-in',
        ticketNumber: 4,
        checkInTime: now - 5 * 60 * 1000,
        gpsDistance: 175,
        rescheduleCount: 0,
      },
    ],
    sede: { ...DEFAULT_SEDE },
    nextTicketNumber: 5,
    currentCalledId: null,
    countdownEndsAt: null,
    attendedCount: 6,
    totalConsultationMinutes: 90,
  };
}

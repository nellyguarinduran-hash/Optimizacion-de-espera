import { useState, useCallback } from 'react';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type GeoStatus = 'idle' | 'checking' | 'success' | 'too-far' | 'error' | 'simulated';

export interface GeoResult {
  status: GeoStatus;
  distance: number | null;
  message: string;
}

export function useGeolocation(sedeLat: number, sedeLng: number, geofenceRadius: number) {
  const [result, setResult] = useState<GeoResult>({
    status: 'idle',
    distance: null,
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const checkLocation = useCallback((): Promise<GeoResult> => {
    setLoading(true);
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        const r: GeoResult = {
          status: 'error',
          distance: null,
          message: 'Geolocalización no disponible en este dispositivo.',
        };
        setResult(r);
        setLoading(false);
        resolve(r);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const distance = calculateDistance(
            position.coords.latitude,
            position.coords.longitude,
            sedeLat,
            sedeLng,
          );
          const withinRange = distance <= geofenceRadius;
          const r: GeoResult = {
            status: withinRange ? 'success' : 'too-far',
            distance: Math.round(distance),
            message: withinRange
              ? `Estás a ${Math.round(distance)}m de la sede. Check-in autorizado.`
              : `Estás a ${Math.round(distance)}m de la sede. Acércate a menos de ${geofenceRadius}m para hacer check-in.`,
          };
          setResult(r);
          setLoading(false);
          resolve(r);
        },
        () => {
          const r: GeoResult = {
            status: 'error',
            distance: null,
            message: 'No se pudo acceder a tu ubicación. Verifica los permisos de GPS.',
          };
          setResult(r);
          setLoading(false);
          resolve(r);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    });
  }, [sedeLat, sedeLng, geofenceRadius]);

  const simulateNear = useCallback(() => {
    const r: GeoResult = {
      status: 'simulated',
      distance: 75,
      message: 'Ubicación simulada: a 75m de la sede. Check-in autorizado.',
    };
    setResult(r);
  }, []);

  const reset = useCallback(() => {
    setResult({ status: 'idle', distance: null, message: '' });
  }, []);

  return { result, loading, checkLocation, simulateNear, reset };
}

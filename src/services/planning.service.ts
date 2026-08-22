const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export interface PlanningRoute {
  group_name: string;
  route_id: string | null;
  route_name?: string | null;
}

export interface PlanningDay {
  appointment_id: number | null;
  date: string;
  departure_time?: string | null;
  observations: string | null;
  routes: PlanningRoute[];
  is_missing?: boolean;
  _menuOpen?: boolean;
}

function decodeText(text: string | null | undefined): string {
  if (!text) return text as any;
  if (typeof text !== 'string') return text;
  
  let decoded = text;
  if (decoded.startsWith('"') && decoded.endsWith('"')) {
    try {
      const parsed = JSON.parse(decoded);
      if (typeof parsed === 'string') {
        decoded = parsed;
      }
    } catch(e) {}
  }
  return decoded.replace(/\\u([\d\w]{4})/gi, (m, g) => String.fromCharCode(parseInt(g, 16)));
}

function fixEncodingDay(day: PlanningDay): PlanningDay {
  if (day.observations) day.observations = decodeText(day.observations);
  if (day.routes) {
    day.routes.forEach(route => {
      if (route.group_name) route.group_name = decodeText(route.group_name);
      if (route.route_name) route.route_name = decodeText(route.route_name);
      if (route.route_id !== null && route.route_id !== undefined) route.route_id = String(route.route_id);
    });
  }
  return day;
}

export class PlanningService {
  static async getPlanning(year: number, month: number): Promise<PlanningDay[]> {
    const response = await fetch(`${API_URL}/api2/planning/${year}/${month}`);
    if (!response.ok) throw new Error("Erreur serveur");
    const data = await response.json();
    return data.map((day: any) => fixEncodingDay(day));
  }

  static async duplicatePlanning(year: number, month: number): Promise<any> {
    const response = await fetch(`${API_URL}/api2/planning/duplicate/${year}/${month}`, {
      method: 'POST'
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Erreur de duplication");
    }
    const data = await response.json();
    return data.map((day: any) => fixEncodingDay(day));
  }

  static async duplicateAndOverwritePlanning(year: number, month: number): Promise<any> {
    const response = await fetch(`${API_URL}/api2/planning/duplicate/${year}/${month}/overwrite`, {
      method: 'POST'
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Erreur lors de la réimportation");
    }
    const data = await response.json();
    return data.map((day: any) => fixEncodingDay(day));
  }

  static async getEquivalentDay(dateStr: string): Promise<PlanningDay> {
    const response = await fetch(`${API_URL}/api2/planning/equivalent-day/${dateStr}`);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Erreur de récupération du jour équivalent");
    }
    const data = await response.json();
    return fixEncodingDay(data);
  }

  static async savePlanningDay(day: PlanningDay): Promise<any> {
    const response = await fetch(`${API_URL}/api2/planning/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(day)
    });
    if (!response.ok) throw new Error("Erreur de sauvegarde");
    return response.json();
  }

  static async deletePlanningDay(appointmentId: number): Promise<any> {
    const response = await fetch(`${API_URL}/api2/planning/${appointmentId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error("Erreur de suppression");
    return response.json();
  }

  static async suggestRoute(date: string, group_name: string, current_route_id?: string | null, mode?: 'easier' | 'harder' | 'equivalent'): Promise<any> {
    let url = `${API_URL}/api2/planning/suggest-route/find?date=${date}&group_name=${encodeURIComponent(group_name)}`;
    if (current_route_id) {
      url += `&current_route_id=${current_route_id}`;
    }
    if (mode) {
      url += `&mode=${mode}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Erreur de suggestion");
    }
    return response.json();
  }

  static async getDriveUrl(year: number, month: number): Promise<{url: string}> {
    const url = `${API_URL}/api2/planning/drive-url/${year}/${month}`;
    const response = await fetch(url);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Fichier non trouvé");
    }
    return response.json();
  }

  static async exportPlanning(year: number, month: number): Promise<{status: string, filename: string, path: string}> {
    const url = `${API_URL}/api2/planning/export/${year}/${month}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Erreur lors de la génération du fichier");
    }
    return response.json();
  }
}

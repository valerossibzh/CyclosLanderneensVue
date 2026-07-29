export interface RouteSummaryBean {
  date: string;
  group: string;
  route: number;
  name: string;
  polyline: string;
}

export interface RouteBean {
  id: string | number;
  name: string;
  length: number;
  elevation: number;
  difficulty: number;
  orientation: string;
  towns: string;
  link: string;
  strava_polyline: string;
  last_used_date?: string;
  elevation_data?: string;
}

export interface CalendarBean {
  date: string;
  title: string;
  info: string;
  links: string;
  dayName: string;
  dayNum: string;
  month: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export class RoutesService {
  static async getRoutes(): Promise<RouteBean[]> {
    const res = await fetch(`${API_URL}/api2/getRoutes`);
    return res.json();
  }

  static async getRoutesSummary(nbMonthsBefore: number, nbMonthsAfter: number): Promise<RouteSummaryBean[]> {
    const res = await fetch(`${API_URL}/api2/getRoutesSummary?nbMonthsBefore=${nbMonthsBefore}&nbMonthsAfter=${nbMonthsAfter}`);
    return res.json();
  }

  static async getLanderneauData(): Promise<any> {
    const res = await fetch(`${API_URL}/api2/getLanderneauData`);
    return res.json();
  }

  static async getLanderneauHash(localHash: string): Promise<boolean> {
    const res = await fetch(`${API_URL}/api2/getLanderneauUpdate?id=0&hash=${localHash}`);
    return res.json();
  }

  static async downloadRoutes(): Promise<Blob> {
    const res = await fetch(`${API_URL}/api2/downloadRoutes`);
    return res.blob();
  }

  static async synchronizeRoutes(): Promise<boolean> {
    const res = await fetch(`${API_URL}/api2/synchronizeRoutes`);
    return res.status === 200;
  }

  static async synchronizeExcelRoutes(): Promise<any> {
    const res = await fetch(`${API_URL}/api2/synchronizeExcelRoutes`);
    return res.json();
  }

  static async updateLanderneauData(): Promise<any> {
    const res = await fetch(`${API_URL}/api2/updateLanderneauData`);
    return res.json();
  }

  static async getCalendar(): Promise<CalendarBean[]> {
    const res = await fetch(`${API_URL}/api2/getCalendar`);
    return res.json();
  }

  static async addRoute(routeData: any): Promise<any> {
    const res = await fetch(`${API_URL}/api2/addRoute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(routeData)
    });
    return res.json();
  }

  static decode(encoded: string): [number, number][] {
    const resultArray: [number, number][] = [];
    let index = 0;
    let lat = 0, lng = 0;
    while (index < encoded.length) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      resultArray.push([lat / 1E5, lng / 1E5]);
    }    
    return resultArray;
  }
}

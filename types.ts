
export interface Airport {
  iata: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
}

export enum FlightPhase {
  PLANNING = 'PLANNING',
  BOARDING = 'BOARDING',
  IN_FLIGHT = 'IN_FLIGHT',
  ARRIVED = 'ARRIVED'
}

export enum TimerMode {
  NORMAL = 'NORMAL',
  POMODORO = 'POMODORO'
}

export enum PomodoroStatus {
  WORKING = 'WORKING',
  BREAK = 'BREAK'
}

export type Domicile = 'MEM' | 'IND' | 'OAK' | 'LAX' | 'ANC' | 'CGN';

export interface NavigationLink {
  name: string;
  href: string | {hash: string};
  icon: string;
  current: boolean;
}

export interface DutyLimitOptions {
  isDayRoomScheduledAndReserved?: boolean;
  is2Trips?: boolean;
  is2TripsWithOneOptional?: boolean; // TODO: list examples here
  isInternational?: boolean;
  isGrid?: boolean; // "grid" means the trip starts more than 96 hours from now
  isInboundFlightSegmentGreaterThan5HoursTZD?: boolean;
  crewNumberOfPilots?: number;
  layoverLength?: number;
  domicile?: Domicile;
}

export interface DomesticDutyLimit {

    // duty limit in number of minutes
    scheduled: number;
    operational: number;
    far: number;
    endOfScheduledDutyDate: Date;
    endOfOperationalDutyDate: Date;
    endOfFARDutyDate: Date;
}

export interface InternationalDutyLimit {
    scheduled: number;
    scheduledNotes?: string;
    operational?: number;
    operationalNotes?: string;

    landings?: number;
    blockHours: {
      scheduled: string | number,
      operational?: string | number,
    };
}

export interface InternationalDutyLimitTimes {
  endOfScheduledDutyDate: Date;
  endOfOperationalDutyDate?: Date;
}

export interface InternationalDuty extends InternationalDutyLimit, InternationalDutyLimitTimes {};

export interface DutyLimitsDeprecated {
  scheduledDutyLimit: number,
  operationalDutyLimit: number,
  farDutyLimit: number,
}

export interface DutyLimits {
  domestic: Ref<DomesticDutyLimit>,
  dutyStartTimeLBT: Ref<number>;
}

export interface DutyLimitCard {
  title: string,
  notes?: string,
  duration: string,
  minutes: number,
  dutyEndTime: string, // 'dd-MM HH:MM'
  dutyEndTimeZulu: Date,
  minutesRemaining: number,
  blockHours?: string,
  landings?: string,
}

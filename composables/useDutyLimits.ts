import { addMinutes, isValid } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { computed, toRef } from 'vue';
// import { DomesticDutyLimit } from '../sched-committee-types';
import { DomesticDutyLimit } from '../sched-committee-types';
import type { Domicile, DutyLimitOptions } from '~/sched-committee-types';

// Domestic duty limits in format [scheduled, operational, far]
const DAY_DUTY_LIMITS = [13 * 60, 14.5 * 60, 16 * 60];
const DAY_DUTY_LIMITS_WITH_SHOWTIME_BETWEEN_0500_0530 = [13 * 60, 13.5 * 60, 16 * 60]; // if a pilot's showtime is 0500-0530, then the operational duty limit is 13:30.
const DAY_DUTY_LIMITS_WITH_SHOWTIME_BETWEEN_0530_0630 = [13 * 60, 14 * 60, 16 * 60]; // If a pilot's showtime is 0531-0600, operational limits are 14:00
const DAY_DUTY_LIMITS_WITH_OPTIONAL = [13.5 * 60, 15 * 60, 16 * 60]; // TODO: Understand this: If a day or night duty period comprised of 2 trips exceeds scheduled on duty limitations, then the duty period shall be limted to a max of 13:30 Day/13:00 night
const NIGHT_DUTY_LIMITS = [11.5 * 60, 13 * 60, 16 * 60];
const NIGHT_DUTY_LIMITS_WTIH_OPTIONAL = [13 * 60, 14.5 * 60, 16 * 60];// TODO: Understand this: If a day or night duty period comprised of 2 trips exceeds scheduled on duty limitations, then the duty period shall be limted to a max of 13:30 Day/13:00 night
const CRITICAL_DUTY_LIMITS = [9 * 60, 10.5 * 60, 16 * 60];
const CRITICAL_DUTY_LIMITS_WITH_OPTIONAL = [9 * 60, 10.5 * 60, 16 * 60];

const timeZonesLBT = {
  MEM: 'America/Chicago',
  IND: 'America/Chicago',
  OAK: 'America/Los_Angeles',
  LAX: 'America/Los_Angeles',
  ANC: 'America/Anchorage',
  CGN: 'Europe/Berlin',
} as const;

export function useDutyLimits (dutyStartTimeZulu: MaybeRef<Date>, domicile: MaybeRef<Domicile>, options?: MaybeRef<DutyLimitOptions>): DomesticDutyLimit {
  /**
   * returns [scheduledDutyLimit, operationalDutyLimit, farDutyLimit?]: [number, number, number?] - in minutes
   */

  const dutyStartTimeZuluRef = toRef(dutyStartTimeZulu);
  const domicileRef = toRef(domicile);
  const optionsRef = toRef(options);

  const dutyLimits = computed(() => {
    console.log(dutyStartTimeZuluRef.value);
    if (!dutyStartTimeZuluRef.value || !domicileRef.value) { return undefined; }
    if (!isValid(dutyStartTimeZuluRef.value)) { return undefined; }

    const calculatedDomesticDutyLimits = calculateDomesticDutyLimit(dutyStartTimeZuluRef.value, domicileRef.value, optionsRef.value);

    if (!optionsRef.value?.isInternational && calculatedDomesticDutyLimits !== undefined) {
      const [scheduledDutyLimit, operationalDutyLimit, farDutyLimit] = calculatedDomesticDutyLimits;
      return { scheduledDutyLimit, operationalDutyLimit, farDutyLimit };
    }

    return undefined;
  });

  const scheduledDutyLimit = computed(() => (dutyLimits.value) ? dutyLimits.value.scheduledDutyLimit : 0);
  const operationalDutyLimit = computed(() => (dutyLimits.value) ? dutyLimits.value.operationalDutyLimit : 0);
  const farDutyLimit = computed(() => (dutyLimits.value) ? dutyLimits.value.farDutyLimit : 0);
  const endOfScheduledDutyTime = computed(() => (dutyLimits.value) ? calculateEndOfDutyTime(dutyStartTimeZuluRef.value, dutyLimits.value.scheduledDutyLimit) : 0);
  const endOfOperationalDutyTime = computed(() => (dutyLimits.value) ? calculateEndOfDutyTime(dutyStartTimeZuluRef.value, dutyLimits.value.operationalDutyLimit) : 0);
  const endOfFARDutyTime = computed(() => (dutyLimits.value) ? calculateEndOfDutyTime(dutyStartTimeZuluRef.value, dutyLimits.value.farDutyLimit) : 0);
  /**
   *
   * returns [scheduledDutyLimit, operationalDutyLimit, farDutyLimit]: [number, number, number] - in minutes
   */
  function calculateDomesticDutyLimit (dutyStartTime: Date, dom: Domicile, options?: DutyLimitOptions) {
    // get local time of duty start time based on domicile using timeZonesLBT using date-fns
    const localDutyStartTime = getLBTInHHMM(dutyStartTime, dom); // returns in format 0500, 0530, 0600, etc.

    if (options?.isInternational) { return undefined; }

    console.log({ localDutyStartTime });

    if (localDutyStartTime < 1559) {
      if (localDutyStartTime > 600) { return !options?.is2TripsWithOneOptional ? DAY_DUTY_LIMITS : DAY_DUTY_LIMITS_WITH_OPTIONAL; }
      if (localDutyStartTime > 530) { return !options?.is2TripsWithOneOptional ? DAY_DUTY_LIMITS_WITH_SHOWTIME_BETWEEN_0530_0630 : DAY_DUTY_LIMITS_WITH_OPTIONAL; }
      if (localDutyStartTime > 500) { return !options?.is2TripsWithOneOptional ? DAY_DUTY_LIMITS_WITH_SHOWTIME_BETWEEN_0500_0530 : DAY_DUTY_LIMITS_WITH_OPTIONAL; }
    }
    if (localDutyStartTime > 1600 || localDutyStartTime < 100) { return !options?.is2TripsWithOneOptional ? NIGHT_DUTY_LIMITS : NIGHT_DUTY_LIMITS_WTIH_OPTIONAL; }
    return !options?.is2TripsWithOneOptional ? CRITICAL_DUTY_LIMITS : CRITICAL_DUTY_LIMITS_WITH_OPTIONAL;
  }

  /**
   * Calculates the end of duty time based on the duty start time and duty limit in minutes.
   * @param {Date} dutyStartTime - The duty start time.
   * @param {number} dutyLimitMinutes - The duty limit in minutes.
   * @returns {Date | undefined} - The end of duty time or undefined if the duty limit is not defined.
   */
  function calculateEndOfDutyTime (dutyStartTime: Date, dutyLimitMinutes: number) {
    return dutyLimitMinutes ? addMinutes(new Date(dutyStartTime), dutyLimitMinutes) : undefined;
  }

  /**
   * Returns the local base time in format HHMM based on the domicile.
   * @param {Date} startTime - startTime in Zulu
   * @param {Domicile} dom - domicile
   * @returns {number} - The local base time in format HHMM. For example, 0500, 0530, 0600, etc.
   */
  function getLBTInHHMM (startTime: Date, dom: Domicile) {
    return Number.parseInt(formatInTimeZone(startTime, timeZonesLBT[dom], 'HHmm'));
  }

  const dutyStartTimeLBT = computed(() => getLBTInHHMM(dutyStartTimeZuluRef.value, domicileRef.value));

  return { dutyLimits, scheduledDutyLimit, operationalDutyLimit, farDutyLimit, endOfScheduledDutyTime, endOfOperationalDutyTime, endOfFARDutyTime, dutyStartTimeLBT };
}
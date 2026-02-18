import {
  endOfDay,
  format as _format,
  getUnixTime,
  isBefore,
  isEqual,
  isFuture,
  isPast,
  isSameDay,
  isSameMonth,
  isSameYear,
  parseISO,
  subYears,
  startOfDay,
  startOfYear
} from 'date-fns'
import { formatInTimeZone, toDate } from 'date-fns-tz'

export const useDateFns = () => {
  /**
   * Set time zone (LTA is in Eastern)
   * Note: this `config` key is new, it is not part of date-fns
   */
  const config = {
    timeZone: 'America/New_York'
  }

  /**
   * Wrap format function to set a default time zone
   */
  function format(date: any, formatStr: string, timeZone?: boolean | string) {
    const tZ = typeof timeZone === 'boolean' && timeZone === true ? config.timeZone : timeZone as string
    const dateObj =
      typeof date === 'string' ? toDate(date, { timeZone: tZ }) : date

    return tZ
      ? formatInTimeZone(dateObj, tZ, formatStr)
      : _format(dateObj, formatStr)
  }

  /**
   * Helper functions for consistent formatting
   */
  
  function formatDate(date?: any, timeZone: boolean | string = true) {
    return date
      ? isSameYear(date, new Date())
        ? format(date, 'MMMM d', timeZone)
        : format(date, 'MMMM d, yyyy', timeZone)
      : undefined
  }

  function formatTime(date?: any, timeZone: boolean | string = true) {
    return date
      ? format(date, `h:mm aaaa${timeZone ? ' z' : ''}`, timeZone)
      : undefined
  }

  function formatDateTime(date?: any, allDay?: boolean, timeZone: boolean | string = true) {
    return date
      ? allDay
        ? formatDate(date, timeZone)
        : `${formatDate(date, timeZone)}, ${formatTime(
            date,
            timeZone
          )}`
      : undefined
  }
  
  function formatDateRange(date1?: any, date2?: any, timeZone: boolean | string = true) {
    if (!date1 || !date2) {
      return
    }

    if (isSameDay(date1, date2)) {
      return formatDate(date1, timeZone)
    } else if (isSameMonth(date1, date2)) {
      if (isSameYear(date1, new Date())) {
        return `${format(date1, 'MMMM d', timeZone)}–${format(
          date2,
          'd',
          timeZone
        )}`
      } else {
        return `${format(date1, 'MMMM d', timeZone)}–${format(
          date2,
          'd, yyyy',
          timeZone
        )}`
      }
    }

    return `${formatDate(date1, timeZone)} – ${formatDate(
      date2,
      timeZone
    )}`
  }

  function formatDateTimeRange(
    date1?: any,
    date2?: any,
    date1AllDay?: boolean,
    date2AllDay?: boolean,
    timeZone: boolean | string = true
  ) {
    if (!date1 || !date2) {
      return
    }

    if (date1AllDay && date2AllDay) {
      return formatDateRange(date1, date2, timeZone)
    } else if (isSameDay(date1, date2)) {
      if (isEqual(date1, date2)) {
        return formatDateTime(date1, false, timeZone)
      } else {
        return `${formatDate(
          date1,
          false
        )}, ${format(
          date1,
          `h:mm aaaa`,
          timeZone
        )} – ${formatTime(date2, timeZone)}`
      }
    }

    return `${formatDateTime(
      date1,
      date1AllDay,
      timeZone
    )} – ${formatDateTime(date2, date2AllDay, timeZone)}`
  }
  
  return {
    config,
    endOfDay,
    format,
    formatDate,
    formatTime,
    formatDateTime,
    formatDateRange,
    formatDateTimeRange,
    formatInTimeZone,
    getUnixTime,
    isBefore,
    isEqual,
    isFuture,
    isPast,
    isSameDay,
    isSameMonth,
    isSameYear,
    parseISO,
    subYears,
    startOfDay,
    startOfYear,
    toDate
  }
}

/** Shared ICS recurrence data shapes with no parser or expansion dependencies. */

export type ParsedIcsEvent = {
  id: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
  campusId?: string;
  description?: string;
  isRecurring?: boolean;
  recurringInstanceId?: string;
};

export type IcsDateProperty = { value: string; params: Record<string, string> };
export type RecurrenceWorkBudget = { remaining: number };

export type RecurrenceExpansionOptions = {
  dtStart: IcsDateProperty;
  exdates: IcsDateProperty[];
  horizonDays: number;
  maxInstances: number;
  referenceDate: Date;
  workBudget: RecurrenceWorkBudget;
};

export type RecurrencePreflightOptions = Pick<RecurrenceExpansionOptions, "dtStart" | "horizonDays" | "maxInstances" | "referenceDate">;

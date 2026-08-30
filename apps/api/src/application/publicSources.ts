import type { PublicEvent, ScheduleItem } from "@concourse/contracts";
import type { InstitutionPack } from "@concourse/institutions";

export type PublicEventsSourceResult = { events: PublicEvent[]; degraded: boolean };
export type PublicScheduleSourceResult = { schedule: ScheduleItem[]; degraded: boolean };

export type PublicDataSources = {
  fetchEvents(institution: InstitutionPack): Promise<PublicEventsSourceResult>;
  fetchSchedule(institution: InstitutionPack): Promise<PublicScheduleSourceResult>;
};

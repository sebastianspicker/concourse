/** Provides the temporary ILIAS connector contract used before private integration is implemented. */

import { log } from "../../utils/logger";

export type IliasCourse = {
  id: string;
  title: string;
};

export type IliasResult = {
  data: IliasCourse[];
  _isStub: boolean;
};

/** Returns an explicitly marked empty course result until the private ILIAS connector exists. */
export async function fetchCourses(): Promise<IliasResult> {
  log("warn", "stub_called", { connector: "ilias" });
  return { data: [], _isStub: true };
}

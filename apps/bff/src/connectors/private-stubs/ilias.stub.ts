import { log } from "../../utils/logger";

export type IliasCourse = {
  id: string;
  title: string;
};

export type IliasResult = {
  data: IliasCourse[];
  _isStub: boolean;
};

export async function fetchCourses(): Promise<IliasResult> {
  log("warn", "stub_called", { connector: "ilias" });
  return { data: [], _isStub: true };
}

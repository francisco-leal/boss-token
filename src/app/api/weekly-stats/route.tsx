import { getNominationsWeeklyStats } from "@/app/_api/data/nominations";
import { restApiHandler } from "@/app/_api/helpers/rest-api-handler";

export const GET = restApiHandler(async (request, params) => {
  const nominationsWeeklyStats = await getNominationsWeeklyStats();
  return nominationsWeeklyStats;
});

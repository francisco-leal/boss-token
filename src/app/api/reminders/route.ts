import {
  // getNominationsUserSent,
  getNominationsWeeklyReminder, // getNominationsWeeklyStatsForUser,
} from "@/app/_api/data/nominations";
// import { getUserFromWallet } from "@/app/_api/data/users";
import { restApiHandler } from "@/app/_api/helpers/rest-api-handler";

// import { BadRequestError, NotFoundError } from "@/shared/utils/error";

// const statsParamsSchema = z.object({
//   wallet: z.string().optional(),
// });

export const GET = restApiHandler(async (request, params) => {
  // const nominationsMadeParams = statsParamsSchema.parse({
  //   wallet: params?.wallet,
  // });

  // if (
  //   !nominationsMadeParams.wallet ||
  //   nominationsMadeParams.wallet.length !== 42 ||
  //   !nominationsMadeParams.wallet.startsWith("0x")
  // ) {
  //   throw new BadRequestError("Invalid wallet address");
  // }

  // const user = await getUserFromWallet(
  //   nominationsMadeParams.wallet.toLowerCase(),
  // );
  // if (!user) {
  //   throw new NotFoundError("User not found");
  // }

  const reminders = await getNominationsWeeklyReminder();

  return reminders;
});

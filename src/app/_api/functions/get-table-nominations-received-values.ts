import { notFound } from "next/navigation";
import { DateTime } from "luxon";
import { TableNominationsReceivedValue } from "@/app/_components/table-nominations-received";
import { getNominationsUserReceived } from "../data/nominations";
import { getCurrentUser } from "../data/users";

export const getTableNominationsReceivedValues = async (): Promise<
  TableNominationsReceivedValue[]
> => {
  const user = await getCurrentUser();
  if (!user) return notFound();
  const nominations = await getNominationsUserReceived(user);

  const values = nominations.map(
    (n): TableNominationsReceivedValue => ({
      key: `${n.createdAt}-${n.originWallet}`,
      date: DateTime.fromISO(n.createdAt).toFormat("LLL dd"),
      name: n.originUsername,
      walletAddress: n.originWallet,
      rank: n.originRank,
      pointsGiven: n.buildPointsSent,
      pointsEarned: n.buildPointsReceived,
    }),
  );

  return values;
};

import { FunctionComponent } from "react";
import { Box, Sheet, SheetProps, Skeleton, Table } from "@mui/joy";
import { formatLargeNumber } from "@/shared/utils/format-number";

export type TableNominationsSentValue = {
  key: string;
  date: string;
  name: string | null;
  rank: number | null;
  pointsGiven: number | null;
  missed?: boolean;
  odd?: boolean;
};

export type TableNominationsSentProps = {
  values?: TableNominationsSentValue[];
  loading?: boolean;
} & SheetProps;

export const TableNominationsSent: FunctionComponent<
  TableNominationsSentProps
> = ({ values = [], loading, variant = "outlined", ...props }) => (
  <Sheet {...props} variant={variant} sx={props.sx}>
    <Table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Name</th>
          <th>Rank</th>
          <th>Points Sent</th>
        </tr>
      </thead>
      <tbody>
        {!loading &&
          values.map((val) => (
            <Box
              component={"tr"}
              key={val.key}
              className={[
                val.missed ? "yellow" : "",
                val.odd ? "odd" : "",
              ].join(" ")}
            >
              <td>{val.date}</td>
              <td>{val.missed ? "Missed" : val.name ?? "---"}</td>
              <td>{val.missed ? "Missed" : val.rank ?? "---"}</td>
              <td>
                {val.missed
                  ? "Missed"
                  : formatLargeNumber(val.pointsGiven ?? 0) ?? "---"}
              </td>
            </Box>
          ))}
        {loading &&
          [1, 2, 3, 4, 5].map((i) => (
            <tr key={i}>
              <td colSpan={4}>
                <Skeleton variant="text" />
              </td>
            </tr>
          ))}
      </tbody>
    </Table>
  </Sheet>
);
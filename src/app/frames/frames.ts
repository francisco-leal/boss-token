/* eslint-disable react/jsx-key */
import { farcasterHubContext, openframes } from "frames.js/middleware";
import { imagesWorkerMiddleware } from "frames.js/middleware/images-worker";
import { createFrames } from "frames.js/next";
import { getXmtpFrameMessage, isXmtpFrameActionPayload } from "frames.js/xmtp";
import {
  appURL,
  DEFAULT_DEBUGGER_HUB_URL,
  FRAMES_BASE_PATH,
} from "@/shared/frames/utils";
import { BadRequestError } from "@/shared/utils/error";
import { getConnectedUserProfile } from "../_api/functions/authentication";

export const frames = createFrames({
  basePath: FRAMES_BASE_PATH,
  baseUrl: appURL(),
  middleware: [
    imagesWorkerMiddleware({
      imagesRoute: "/images",
      secret: "MY_VERY_SECRET_SECRET",
    }),
    farcasterHubContext({
      hubHttpUrl: DEFAULT_DEBUGGER_HUB_URL,
    }),
    openframes({
      clientProtocol: {
        id: "xmtp",
        version: "2024-02-09",
      },
      handler: {
        isValidPayload: (body: JSON) => isXmtpFrameActionPayload(body),
        getFrameMessage: async (body: JSON) => {
          if (!isXmtpFrameActionPayload(body)) {
            return undefined;
          }
          const result = await getXmtpFrameMessage(body);

          return { ...result };
        },
      },
    }),
  ],
});

type FrameContext = Parameters<Parameters<typeof frames>[0]>[0];

export const getFramesUser = async (ctx: FrameContext) => {
  const userAddress =
    ctx.message?.requesterVerifiedAddresses &&
      ctx.message?.requesterVerifiedAddresses.length > 0
      ? ctx.message?.requesterVerifiedAddresses[0]
      : ctx.message?.verifiedWalletAddress; // XMTP wallet address
  if (!userAddress) throw new BadRequestError("User not found");
  return await getConnectedUserProfile(userAddress);
}
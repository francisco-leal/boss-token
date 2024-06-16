import { Metadata } from "next";
import { fetchMetadata } from "frames.js/next";
import { RedirectToHome } from "@/app/_components/redirect-to-home";
import { FRAMES_BASE_PATH, appURL } from "@/shared/frames/utils";

export async function generateMetadata({
  params: { walletId },
}: {
  params: { walletId: string };
}): Promise<Metadata> {
  return {
    other: {
      ...(await fetchMetadata(
        new URL(FRAMES_BASE_PATH + `/nominations/${walletId}`, appURL()),
      )),
    },
  };
}

export default async function Page({
  params,
}: {
  params: { walletId: string };
}) {
  return (
    <div>
      <RedirectToHome />
    </div>
  );
}

export const maxDuration = 60;
export const dynamic = "force-dynamic";
export const revalidate = 0;

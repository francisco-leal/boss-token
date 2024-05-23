import { Nomination } from "@/app/_api/data/nominations";

export function getWarpcastSharableLink(
  todayNominations: Nomination[],
  userWallet: string,
): string {
  let sharableText = "My daily nominations for /build:\n\n";
  if (todayNominations.length === 0) {
    sharableText += "No nominations yet.";
  } else {
    todayNominations.forEach((nomination) => {
      sharableText += `@${nomination.destinationUsername} \n`;
    });
  }
  let sharableTextUriEncoded = "";
  try {
    sharableTextUriEncoded = encodeURI(sharableText);
  } catch (e) {
    sharableTextUriEncoded = encodeURI("My daily nominations for /build:\n\n");
  }
  return `https://warpcast.com/~/compose?text=${sharableTextUriEncoded}&embeds%5B%5D=https://build.top/nominations/${userWallet}`;
}
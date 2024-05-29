import { FunctionComponent } from "react";
import { Typography, Stack, Button, Link, Box } from "@mui/joy";
import { BackgroundImage } from "@/app/_components/background-image";
import { HowToPlay } from "@/app/_components/how-to-play";
import { SearchBuilder } from "@/app/_components/search-builder";
import { BlockyCard } from "@/shared/components/blocky-card";
import { HeroSection } from "@/shared/components/hero-section";
import { HeroSectionSlim } from "@/shared/components/hero-section-slim";
import { Interface } from "@/shared/icons/interface";
import { Lego } from "@/shared/icons/lego";
import { MusicHeadset } from "@/shared/icons/music-headset";
import { Terminal } from "@/shared/icons/terminal";
import { formatLargeNumber } from "@/shared/utils/format-number";

type HomePageComponentProps = {
  loading?: boolean;
  nominationsCount?: number;
  usersCount?: number;
};

export const HomePageComponent: FunctionComponent<HomePageComponentProps> = ({
  nominationsCount,
  usersCount,
}) => {
  return (
    <Stack component="main" sx={{ position: "relative" }}>
      <BackgroundImage />
      <HeroSectionSlim sx={{ mb: 0 }}>
        <Typography level="h1">
          Nominate <Interface /> the best builders <MusicHeadset /> you know.
        </Typography>

        <Typography level="title-lg" sx={{ maxWidth: "sm" }}>
          Celebrate the unsung onchain heroes.{" "}
          <Box component={"br"} display={{ xs: "none", sm: "initial" }} />
          Nominate incredible builders to give and earn BUILD
        </Typography>
        <SearchBuilder sx={{ mt: 1 }} />
      </HeroSectionSlim>
      <HeroSection
        sx={{ flexDirection: { xs: "column", md: "row" }, gap: 3, mt: 0 }}
      >
        <BlockyCard sx={{ minHeight: 164, width: "100%" }}>
          <Typography level="body-lg" textColor="primary.500">
            Total Builders
          </Typography>
          <Typography
            textColor="neutral.900"
            sx={{
              fontWeight: 700,
              lineHeight: "133%",
              fontSize: "36px",
              display: "flex",
              gap: 1,
              alignItems: "center",
            }}
          >
            <MusicHeadset sx={{ "&&": { height: 32, width: 32 } }} />
            {formatLargeNumber(usersCount ?? 0)}
          </Typography>
        </BlockyCard>
        <BlockyCard sx={{ minHeight: 164, width: "100%" }}>
          <Typography level="body-lg" textColor="primary.500">
            Total Nominations
          </Typography>
          <Typography
            textColor="neutral.900"
            sx={{
              fontWeight: 700,
              lineHeight: "133%",
              fontSize: "36px",
              display: "flex",
              gap: 1,
              alignItems: "center",
            }}
          >
            <Interface sx={{ "&&": { height: 32, width: 32 } }} />
            {formatLargeNumber(nominationsCount ?? 0)}
          </Typography>
        </BlockyCard>
      </HeroSection>
      <HeroSection
        sx={{ flexDirection: { xs: "column", md: "row" }, gap: 3, mt: 0 }}
      >
        <BlockyCard sx={{ minHeight: 250 }}>
          <Lego />
          <Typography level="h3" textColor="common.black">
            What is BUILD?
          </Typography>
          <Typography textColor="neutral.500">
            BUILD is a token of appreciation on Base, and a social game that
            rewards onchain builders via peer nominations.
          </Typography>
          <Button
            href={
              "https://app.uniswap.org/explore/tokens/base/0x3c281a39944a2319aa653d81cfd93ca10983d234"
            }
            target="_blank"
            component={Link}
            variant="solid"
            color="primary"
            sx={{ mt: 2 }}
          >
            Buy $BUILD
          </Button>
        </BlockyCard>
        <BlockyCard sx={{ minHeight: 250 }}>
          <Terminal />
          <Typography level="h3" textColor="common.black">
            How BUILD works?
          </Typography>
          <Typography textColor="neutral.500">
            Players have a budget of BUILD points to donate to 3 builders/day.
            Points will convert to $BUILD tokens in June.
          </Typography>
          <Button
            href={"/airdrop/#daily-budget"}
            component={Link}
            variant="solid"
            color="primary"
            sx={{ mt: 2 }}
          >
            See BUILD budget
          </Button>
        </BlockyCard>
      </HeroSection>
      <HeroSection>
        <HowToPlay />
      </HeroSection>
    </Stack>
  );
};

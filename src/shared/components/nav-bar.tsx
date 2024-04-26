'use client';
import { Box, Button, Drawer, IconButton, Link, Stack, Typography } from '@mui/joy';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { Cross, Hamburger, LogoLong, LogoShort } from '../icons';
import { useRef } from 'react';
import { useDisclose } from '../hooks/use-disclose';
import { useAccount } from 'wagmi';

const MOBILE_BREAKPOINT = 'md' as const;
const MOBILE_ONLY = { xs: 'block', [MOBILE_BREAKPOINT]: 'none' } as const;
const DESKTOP_ONLY = { xs: 'none', [MOBILE_BREAKPOINT]: 'flex' } as const;

export const NavBar = () => {
    // Wallet
    const { open } = useWeb3Modal();
    const { address } = useAccount();
    // UI
    const drawer = useDisclose();
    const headerRef = useRef<HTMLDivElement>(null);

    // FIXME this could lead to leaky styles if the header size becomes dynamic.
    const headerHeight = headerRef.current?.clientHeight ?? 0;
    const drawerHeight = `calc(100vh - ${headerHeight}px)`;

    return (
        <Box ref={headerRef} component="nav" sx={{ py: 2, px: 2, borderBottom: 1, borderColor: 'common.white' }}>
            <Stack direction="row" spacing={2} maxWidth="lg" justifyContent="space-between" mx="auto">
                <Link href="/" sx={{ '& svg': { color: 'common.white', height: 40 } }}>
                    <LogoLong sx={{ display: DESKTOP_ONLY, width: 132 }} />
                    <LogoShort sx={{ display: MOBILE_ONLY, width: 40 }} />
                </Link>

                <Box sx={{ gap: '24px', display: DESKTOP_ONLY }}>
                    <Link sx={{ color: 'common.white' }}>Memo</Link>
                    <Link sx={{ color: 'common.white' }}>Bossenomics</Link>
                    <Link sx={{ color: 'common.white' }}>Airdrop</Link>
                </Box>

                <Stack direction={'row'} spacing={2}>
                    <Button variant="solid" color="neutral" onClick={() => open()}>
                        {address ? address.slice(0, 8) : 'Connect Wallet'}
                    </Button>

                    <IconButton
                        onClick={drawer.toggle}
                        sx={{
                            display: MOBILE_ONLY,
                            '& svg': {
                                color: 'common.white',
                                width: '40px',
                                height: '40px'
                            },
                            ':hover': {
                                background: 'transparent',
                                '& svg': {
                                    color: 'neutral.solidHoverBg'
                                }
                            }
                        }}
                    >
                        {drawer.isOpen ? <Cross /> : <Hamburger />}
                    </IconButton>
                </Stack>
            </Stack>
            <Drawer
                anchor={'bottom'}
                open={drawer.isOpen}
                onClose={drawer.close}
                hideBackdrop
                disableEnforceFocus
                slotProps={{
                    root: {
                        sx: {
                            display: MOBILE_ONLY,
                            height: drawerHeight,
                            bottom: 0,
                            top: headerHeight
                        }
                    },
                    content: {
                        sx: {
                            backgroundColor: 'primary.500',
                            borderTop: 1,
                            borderColor: 'common.white',
                            height: drawerHeight,
                            px: 2,
                            pt: 6,
                            pb: 3,

                            [`& a`]: {
                                color: 'common.white',
                                pb: 5,
                                fontSize: '32px',
                                fontWeight: '700',
                                lineHeight: '115%'
                            }
                        }
                    }
                }}
            >
                <Link>Memo</Link>
                <Link>Bossenomics</Link>
                <Link>Airdrop</Link>

                <Typography sx={{ color: 'neutral.50', mt: 'auto', textAlign: 'center' }} level="body-md">
                    BOSS is an experimental community project, not owned by <u>Talent Protocol</u>. Not Financial
                    Advice. DYOR.
                </Typography>
            </Drawer>
        </Box>
    );
};

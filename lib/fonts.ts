import { Fraunces, Work_Sans, IBM_Plex_Mono } from 'next/font/google';

// Mismas fuentes que la landing (app/(site)/layout.tsx), para las zonas con su propio layout.
const fraunces = Fraunces({ subsets: ['latin'], style: ['normal', 'italic'], axes: ['opsz'], display: 'swap', variable: '--font-fraunces' });
const workSans = Work_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--font-work-sans' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['500', '600'], display: 'swap', variable: '--font-plex-mono' });

export const fontVariables = `${fraunces.variable} ${workSans.variable} ${plexMono.variable}`;

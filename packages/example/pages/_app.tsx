import React from 'react';
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '../components/ui/toaster';
import MswProvider from '../server/MswProvider';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <MswProvider>
      <Component {...pageProps} />
      </MswProvider>
      <Toaster />
    </ThemeProvider>
  );
}

export default MyApp;

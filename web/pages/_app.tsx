import React from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import Header from '../components/Header';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Favorite Barber</title>
      </Head>
      <Header />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;

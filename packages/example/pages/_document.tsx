import React from 'react';
import { Html, Head, Main, NextScript } from 'next/document';
export default function Document() {
  return (
    <Html>
      <Head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
        />
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.4.1/css/bootstrap.min.css"
          rel="stylesheet"
        />
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/mdbootstrap/4.14.1/css/mdb.min.css"
          rel="stylesheet"
        />
        <script src="https://cdn.tailwindcss.com" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
            tailwind.config = {
              // disable reset css (normalize css)
              // https://tailwindcss.com/docs/preflight#disabling-preflight
              corePlugins: {
                preflight: false,
              },
            };
        `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
        <script
          dangerouslySetInnerHTML={{
            __html: `
            if(window.$onekey && window.$onekey.ethereum){
              window.$onekey.ethereum.request({ method: 'net_version' }).then((res) => {
                console.log('Dom onload check:   EVM net_version=',res);
              });
            }
            `,
          }}
        />
      </body>
    </Html>
  );
}

import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        />
        <title>LesTrades — Premium Apple Products & Accessories</title>
        <meta
          name="description"
          content="LesTrades — Premium minimalist Apple hardware and accessories shopping experience."
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#FFFFFF" />

        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background-color: #FFFFFF;
  color: #1D1D1F;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
  -webkit-tap-highlight-color: transparent;
}
#root {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
}
/* Smooth transitions */
* {
  box-sizing: border-box;
}
`;


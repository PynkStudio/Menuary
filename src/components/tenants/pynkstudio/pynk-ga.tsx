import Script from "next/script";

export function PynkGAScript() {
  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-3RNKC5BYHH"
        strategy="afterInteractive"
      />
      <Script id="pynk-ga" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-3RNKC5BYHH');
        `}
      </Script>
    </>
  );
}

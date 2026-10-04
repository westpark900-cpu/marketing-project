import '@/styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <>
      <style jsx global>{`
        * {
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        body {
          margin: 0;
          padding: 0;
          background-color: #f9fafb;
          color: #111827;
        }
      `}</style>
      <Component {...pageProps} />
    </>
  );
}

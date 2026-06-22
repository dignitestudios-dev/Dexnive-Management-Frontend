"use client";

import { AppProgressBar as ProgressBar } from "next-nprogress-bar";

export default function ProgressProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ProgressBar
        height="4px"
        color="#9026d2"
        options={{ showSpinner: true }}
        shallowRouting={false}
        delay={0}
        style={`
          #nprogress .bar {
            background: #9026d2 !important;
            z-index: 99999 !important;
          }
          #nprogress .spinner {
            z-index: 99999 !important;
          }
        `}
      />
    </>
  );
}

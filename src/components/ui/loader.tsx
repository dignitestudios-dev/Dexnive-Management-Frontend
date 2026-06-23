import * as React from "react";
import { cn } from "@/lib/utils";

export interface LoaderProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export function Loader({ className, ...props }: LoaderProps) {
  return (
    <svg 
      className={cn("dexnive-loader", className)} 
      viewBox="25 25 50 50"
      {...props}
    >
      <circle r="20" cy="50" cx="50"></circle>
    </svg>
  );
}

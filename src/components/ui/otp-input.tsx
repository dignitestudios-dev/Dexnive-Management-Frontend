"use client";

import React, { useRef, useState, KeyboardEvent, ClipboardEvent, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

export function OTPInput({ length = 5, value, onChange, error }: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Sync external value to internal state (especially for resets)
    if (value.length <= length) {
      const newOtp = value.split("").concat(new Array(length - value.length).fill(""));
      setOtp(newOtp);
    }
  }, [value, length]);

  const focusNext = (index: number) => {
    if (index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const focusPrev = (index: number) => {
    if (index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    if (isNaN(Number(val))) return;

    // Take only the last typed character in case they hit a key while it already had a char
    const singleChar = val.slice(-1);
    
    const newOtp = [...otp];
    newOtp[index] = singleChar;
    setOtp(newOtp);
    onChange(newOtp.join(""));

    if (singleChar !== "") {
      focusNext(index);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (otp[index] === "") {
        // Current input is empty, delete previous and move focus
        e.preventDefault();
        const newOtp = [...otp];
        newOtp[Math.max(0, index - 1)] = "";
        setOtp(newOtp);
        onChange(newOtp.join(""));
        focusPrev(index);
      } else {
        // Current input has value, delete it but don't move focus yet
        e.preventDefault();
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
        onChange(newOtp.join(""));
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusPrev(index);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusNext(index);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").slice(0, length).replace(/\D/g, "");
    if (pastedData) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      onChange(newOtp.join(""));
      
      // Focus the next empty input or the last one
      const focusIndex = pastedData.length < length ? pastedData.length : length - 1;
      inputRefs.current[focusIndex]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-2">
      {otp.map((digit, index) => (
        <Input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={2}
          value={digit}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className={cn(
            "w-12 h-14 text-center text-xl font-semibold transition-all",
            error ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-primary"
          )}
        />
      ))}
    </div>
  );
}

"use client";

import * as React from "react";

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  className?: string;
}

export function Slider({
  value,
  onValueChange,
  min,
  max,
  step,
  disabled = false,
  className = "",
}: SliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange([parseFloat(e.target.value)]);
  };

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[0]}
      onChange={handleChange}
      disabled={disabled}
      className={`w-full h-2 bg-green-500/20 border border-green-500/30 rounded-lg appearance-none cursor-pointer slider-thumb ${className}`}
      style={{
        background: `linear-gradient(to right, rgb(34 197 94 / 0.5) 0%, rgb(34 197 94 / 0.5) ${((value[0] - min) / (max - min)) * 100}%, rgb(34 197 94 / 0.2) ${((value[0] - min) / (max - min)) * 100}%, rgb(34 197 94 / 0.2) 100%)`,
      }}
    />
  );
}

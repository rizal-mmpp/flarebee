// This file provides a basic type declaration for the 'rc-color' module,
// which does not have its own TypeScript definitions or a package in @types.
// This allows TypeScript to recognize the module and prevents TS7016 errors.

declare module 'rc-color' {
  // You can be more specific here if you know the structure of the module.
  // For now, 'any' will suffice to resolve the error.
  // Example:
  // export default class Color {
  //   constructor(color: string | { r: number; g: number; b: number; a?: number } | { h: number; s: number; l: number; a?: number } | { h: number; s: number; v: number; a?: number });
  //   toHexString(): string;
  //   toHsb(): { h: number; s: number; b: number; a: number };
  //   toHsbString(): string;
  //   toRgb(): { r: number; g: number; b: number; a: number };
  //   toRgbString(): string;
  //   toHsl(): { h: number; s: number; l: number; a: number };
  //   // Add other methods/properties if known
  // }
  const Color: any;
  export default Color;
}

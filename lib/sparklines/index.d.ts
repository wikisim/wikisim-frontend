declare module "sparklines" {
  export default class Sparkline {
    constructor(
      element: HTMLElement,
      options?: { width?: number; height?: number; lineColor?: string }
    );

    draw: (data: number[]) => void;
  }
}

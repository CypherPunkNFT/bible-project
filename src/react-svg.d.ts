import "react";

// SVG labels use the same translation opt-out as surrounding HTML.
declare module "react" {
  interface SVGAttributes<T> {
    translate?: HTMLAttributes<T>["translate"];
  }
}

import { type ReactNode } from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

type IconName = "home" | "bag" | "person" | "arrow" | "back" | "plus" | "minus" | "trash" | "close" | "check" | "sparkle" | "clock" | "truck" | "lock" | "refresh" | "pin" | "heart";

export function Icon({ name, size = 22, color = "#292720", strokeWidth = 1.65 }: { name: IconName; size?: number; color?: string; strokeWidth?: number }) {
  const common = { stroke: color, strokeWidth, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  const paths: Record<IconName, ReactNode> = {
    home: <><Path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" {...common} /></>,
    bag: <><Path d="M5 8h14l1 13H4L5 8Z" {...common} /><Path d="M9 9V6a3 3 0 0 1 6 0v3" {...common} /></>,
    person: <><Circle cx="12" cy="8" r="3.3" {...common} /><Path d="M4.5 21c.6-4.2 3.2-6.5 7.5-6.5s6.9 2.3 7.5 6.5" {...common} /></>,
    arrow: <><Path d="M4 12h15" {...common} /><Path d="m13 6 6 6-6 6" {...common} /></>,
    back: <><Path d="M20 12H5" {...common} /><Path d="m11 6-6 6 6 6" {...common} /></>,
    plus: <><Path d="M12 5v14M5 12h14" {...common} /></>,
    minus: <><Path d="M5 12h14" {...common} /></>,
    trash: <><Path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" {...common} /></>,
    close: <><Path d="m6 6 12 12M18 6 6 18" {...common} /></>,
    check: <><Path d="m5 12 4.2 4.2L19 6.5" {...common} /></>,
    sparkle: <><Path d="m12 2 1.5 6.5L20 11l-6.5 1.5L12 19l-1.5-6.5L4 11l6.5-2.5L12 2Z" {...common} /><Path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" {...common} /></>,
    clock: <><Circle cx="12" cy="12" r="9" {...common} /><Path d="M12 7v5l3.5 2" {...common} /></>,
    truck: <><Path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" {...common} /><Circle cx="7.5" cy="19" r="1.7" {...common} /><Circle cx="17.5" cy="19" r="1.7" {...common} /></>,
    lock: <><Rect x="5" y="10" width="14" height="11" rx="2" {...common} /><Path d="M8 10V7a4 4 0 0 1 8 0v3" {...common} /><Path d="M12 14v3" {...common} /></>,
    refresh: <><Path d="M20 7v5h-5M4 17v-5h5" {...common} /><Path d="M5.5 9a7 7 0 0 1 12-2l2.5 2M4 15l2.5 2a7 7 0 0 0 12-2" {...common} /></>,
    pin: <><Path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" {...common} /><Circle cx="12" cy="10" r="2.5" {...common} /></>,
    heart: <><Path d="M20.5 8.8c0 4.4-8.5 10-8.5 10s-8.5-5.6-8.5-10a4.7 4.7 0 0 1 8.5-2.7 4.7 4.7 0 0 1 8.5 2.7Z" {...common} /></>,
  };
  return <Svg width={size} height={size} viewBox="0 0 24 24">{paths[name]}</Svg>;
}

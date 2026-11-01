type IconProps = {
  name: "swap" | "clear" | "up" | "down" | "sample" | "columns";
};

const paths: Record<IconProps["name"], string> = {
  swap: "M3 7h17m-4-4 4 4-4 4M21 17H4m4-4-4 4 4 4",
  clear: "M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6m4-6v6",
  up: "m6 15 6-6 6 6",
  down: "m6 9 6 6 6-6",
  sample:
    "M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3M12 3h9v9M21 3 10 14",
  columns: "M3 4h18v16H3zM12 4v16",
};

export function Icon({ name }: IconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}

import { SVGProps } from "react";

export default function HamburgerSvg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={32}
      height={32}
      {...props}
    >
      <path d="M6 9a2 2 0 1 0 0 4h36a2 2 0 1 0 0-4H6zm0 13a2 2 0 1 0 0 4h36a2 2 0 1 0 0-4H6zm0 13a2 2 0 1 0 0 4h36a2 2 0 1 0 0-4H6z" />
    </svg>
  );
}

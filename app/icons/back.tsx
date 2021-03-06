import { SVGProps } from "react";

export default function BackSvg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={24}
      height={24}
      data-name="24x24/On Light/Arrow-Left"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path fill="none" d="M0 0h24v24H0z" />
      <path d="M14.53 7.53a.75.75 0 0 0-1.06-1.06l-5 5a.75.75 0 0 0 0 1.061l5 5a.75.75 0 0 0 1.06-1.061L10.06 12Z" />
    </svg>
  );
}

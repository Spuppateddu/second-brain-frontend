import { ImgHTMLAttributes } from "react";

export default function ApplicationLogo(
  props: ImgHTMLAttributes<HTMLImageElement>,
) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      src="/logo.png"
      alt="SecondBrain Logo"
      className={props.className}
    />
  );
}

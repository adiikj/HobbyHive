import { Poppins, Quicksand, Montserrat } from "next/font/google";
import localFont from "next/font/local";

export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

export const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-quicksand",
  display: "swap",
});

export const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

export const bnt = localFont({
  src: "../../public/fonts/big_noodle_titling.ttf",
  variable: "--font-bnt",
  display: "swap",
});

export const monigue = localFont({
  src: "../../public/fonts/Monigue.otf",
  variable: "--font-monigue",
  display: "swap",
});

export const awesome = localFont({
  src: "../../public/fonts/AwesomeSerif-Regular.otf",
  variable: "--font-awesome",
  display: "swap",
});

export const fontVariables = `${poppins.variable} ${quicksand.variable} ${montserrat.variable} ${bnt.variable} ${monigue.variable} ${awesome.variable}`;

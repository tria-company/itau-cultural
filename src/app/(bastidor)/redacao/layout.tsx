import { SuperficieSoWeb } from "@/componentes/superficie-so-web";

/** redacao continua sendo superfície de desktop (D-67). Ver `superficie-so-web.tsx`. */
export default function LayoutRedacao({ children }: { children: React.ReactNode }) {
  return <SuperficieSoWeb>{children}</SuperficieSoWeb>;
}

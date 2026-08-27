import { SuperficieSoWeb } from "@/componentes/superficie-so-web";

/** roteiro continua sendo superfície de desktop (D-67). Ver `superficie-so-web.tsx`. */
export default function LayoutRoteiro({ children }: { children: React.ReactNode }) {
  return <SuperficieSoWeb>{children}</SuperficieSoWeb>;
}

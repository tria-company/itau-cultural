import { SuperficieSoWeb } from "@/componentes/superficie-so-web";

/** observatorio continua sendo superfície de desktop (D-67). Ver `superficie-so-web.tsx`. */
export default function LayoutObservatorio({ children }: { children: React.ReactNode }) {
  return <SuperficieSoWeb>{children}</SuperficieSoWeb>;
}

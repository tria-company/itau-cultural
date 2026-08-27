import { SuperficieSoWeb } from "@/componentes/superficie-so-web";

/** admin continua sendo superfície de desktop (D-67). Ver `superficie-so-web.tsx`. */
export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return <SuperficieSoWeb>{children}</SuperficieSoWeb>;
}

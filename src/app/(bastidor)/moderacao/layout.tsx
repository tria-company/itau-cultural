import { SuperficieSoWeb } from "@/componentes/superficie-so-web";

/** moderacao continua sendo superfície de desktop (D-67). Ver `superficie-so-web.tsx`. */
export default function LayoutModeracao({ children }: { children: React.ReactNode }) {
  return <SuperficieSoWeb>{children}</SuperficieSoWeb>;
}

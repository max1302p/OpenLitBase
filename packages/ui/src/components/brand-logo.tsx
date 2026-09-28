import { cn } from "cn"
import logoDark from "../assets/logo-dark.png"
import logoLight from "../assets/logo-light.png"
import mark from "../assets/mark.png"

interface BrandLogoProps {
  className?: string
  /** Nur die Bildmarke („O“) statt der Wortmarke. */
  markOnly?: boolean
  alt?: string
}

/** OpenLitBase-Logo; wechselt im Dunkelmodus automatisch auf die helle Variante. */
function BrandLogo({ className, markOnly = false, alt = "OpenLitBase" }: BrandLogoProps) {
  if (markOnly) {
    return <img src={mark} alt={alt} className={cn("h-6 w-6 dark:brightness-0 dark:invert", className)} />
  }
  return (
    <>
      <img src={logoLight} alt={alt} className={cn("h-6 w-auto dark:hidden", className)} />
      <img src={logoDark} alt={alt} className={cn("hidden h-6 w-auto dark:block", className)} />
    </>
  )
}

export { BrandLogo }

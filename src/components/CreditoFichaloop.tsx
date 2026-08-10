/** Crédito común a todos los footers/pantallas de la plataforma: cita a
 *  fichaloop (el producto) y a ENSODev (quien lo desarrolla). Se usa en la web
 *  del cliente, el login de cliente, etc. */
export function CreditoFichaloop({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      Con la tecnología de{" "}
      <a href="https://fichaloop.com" target="_blank" rel="noopener noreferrer" className="font-semibold hover:opacity-70">
        fichaloop
      </a>{" "}
      · un sistema de{" "}
      <a href="https://ensodev.eu" target="_blank" rel="noopener noreferrer" className="font-semibold hover:opacity-70">
        ENSODev
      </a>
    </span>
  );
}

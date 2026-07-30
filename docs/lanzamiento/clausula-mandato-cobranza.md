# Cláusula de gestión de cobranza y retención de pagos (mandato)

> **BORRADOR para revisión del abogado** — 22/07/2026.
> Se suma al borrador de TyC existente (secciones Servicios Profesionales y
> Propiedad Intelectual). Los corchetes `[...]` son decisiones pendientes.

## Contexto para el abogado (no va en los TyC)

Dale Deal es un marketplace: compradores pagan por la plataforma y los
vendedores/prestadores reciben su dinero después de confirmarse la entrega.
Los pagos se procesan por **Mercado Pago** (los fondos nunca están en poder
físico de Dale Deal: quedan en cuentas de pago del PSP regulado). El modelo a
encuadrar es el estándar de marketplaces (mandato/agencia de cobranza, mismo
esquema que MercadoLibre): Dale Deal cobra en nombre del vendedor, retiene
hasta la entrega y libera neto de comisión. En una fase 2 se migrará a
"Split de Pagos" de MP, donde la retención/liberación la ejecuta MP
directamente.

## Cláusula propuesta (texto para los TyC)

### X. Gestión de cobranza, retención y liberación de pagos

**X.1 — Mandato de cobranza.** Al publicar un producto o servicio, el
Vendedor otorga a Dale Deal un mandato de cobranza para percibir, en su
nombre y representación, los importes abonados por los Compradores a través
de los medios de pago habilitados en la plataforma. El pago realizado por el
Comprador a Dale Deal tiene efecto cancelatorio y libera al Comprador de su
obligación de pago frente al Vendedor.

**X.2 — Procesamiento.** Los pagos se procesan a través de Mercado Pago u
otros proveedores de servicios de pago regulados que la plataforma habilite.
Dale Deal no es una entidad financiera, no capta depósitos ni realiza
intermediación financiera; los fondos permanecen acreditados en cuentas de
pago provistas por dichos proveedores hasta su liberación.

**X.3 — Retención hasta la entrega (Compra Protegida).** El importe abonado
por el Comprador permanecerá retenido hasta que ocurra el primero de los
siguientes eventos: (i) el Comprador confirme en la plataforma la recepción
del producto o la prestación del servicio; o (ii) transcurran **[7] días
corridos** desde la entrega registrada sin que el Comprador haya iniciado un
reclamo.

**X.4 — Liberación y comisión.** Cumplida la condición del punto X.3, Dale
Deal transferirá al Vendedor el importe correspondiente, deducida la
comisión por uso de plataforma vigente (**[X]% + impuestos**) y, cuando
corresponda, los costos del medio de pago. Las comisiones se documentan con
el comprobante fiscal correspondiente.

**X.5 — Reclamos y reembolsos.** Si el Comprador inicia un reclamo por falta
de entrega o disconformidad dentro del plazo del punto X.3, la liberación se
suspende hasta la resolución del reclamo conforme a la [Política de
Disputas]. Resuelto el reclamo a favor del Comprador, Dale Deal podrá
reembolsarle el importe con los fondos retenidos.

**X.6 — Naturaleza de los fondos.** Los fondos retenidos pertenecen al
Vendedor (netos de la comisión devengada a favor de Dale Deal) y en ningún
caso constituyen un depósito, inversión ni operación financiera de ningún
tipo. La retención existe al solo efecto de la protección de la operación.

## Decisiones pendientes / notas

1. **Plazo de liberación automática**: sugerido 7 días corridos desde la
   entrega (MercadoLibre usa plazos similares). Definir con Dylan.
2. **Política de Disputas**: hay que redactarla como anexo (quién decide,
   plazos, evidencia). Hoy el admin ya tiene reembolsos funcionando.
3. **Jurisdicción/competencia**: alinear con el resto del borrador de TyC.
4. **Encuadre regulatorio**: mientras los fondos estén en cuentas de MP y
   Dale Deal solo instruya liberaciones, no hay captación de fondos. Si el
   modelo cambiara (fondos en cuenta bancaria propia a escala), revisar
   encuadre BCRA/UIF con el abogado.
5. **Split de Pagos (fase 2)**: al migrar, la retención/liberación la
   ejecuta MP (money release); la cláusula sigue valiendo, cambia el
   mecanismo operativo.

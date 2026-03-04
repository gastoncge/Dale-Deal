# Prompt para Claude — Implementación de diseño responsivo

Actúa como un **Front-End Senior Engineer** especializado en **responsive design mobile-first**.

## Contexto del proyecto
Estoy trabajando en este repositorio web (HTML/CSS/JS). Quiero que **edites el proyecto completo** para que funcione y se vea correctamente en distintos tamaños de pantalla, sin romper funcionalidad existente.

## Objetivo principal
Convertir toda la interfaz a un diseño totalmente responsivo y consistente para:
- **Mobile pequeño**: 320px–374px
- **Mobile estándar**: 375px–767px
- **Tablet**: 768px–1023px
- **Laptop/Desktop**: 1024px–1439px
- **Pantallas grandes**: 1440px+

## Requisitos técnicos obligatorios
1. Usa enfoque **mobile-first**.
2. Revisa y corrige:
   - Layout general (header, nav, secciones, footer)
   - Grids/cards/listados
   - Tipografía (escalado fluido)
   - Botones/inputs/formularios
   - Imágenes, iconos y medios embebidos
   - Tablas (si existen)
   - Modales, menús desplegables, carruseles, sliders (si existen)
3. Evita overflow horizontal y elimina cualquier `width` rígido innecesario.
4. Usa unidades fluidas cuando sea apropiado (`%`, `rem`, `clamp()`, `minmax()`, `vw`).
5. Añade/ajusta breakpoints claros y consistentes.
6. Mantén accesibilidad básica:
   - foco visible
   - contraste razonable
   - tamaños táctiles mínimos (~44px)
7. No elimines funcionalidades de JS; adapta el comportamiento responsivo cuando aplique (menú hamburguesa, accordions, etc.).

## Entregables esperados
1. **Cambios directos en código** (HTML/CSS/JS) listos para producción.
2. **Resumen de cambios por archivo** indicando qué se ajustó y por qué.
3. **Lista de breakpoints finales** utilizados.
4. **Checklist de validación responsiva** con estado (OK/Pendiente):
   - 320px
   - 375px
   - 768px
   - 1024px
   - 1440px
5. Si detectas problemas de arquitectura CSS (duplicación, especificidad excesiva, estilos dispersos), aplica una refactorización mínima segura y explícala.

## Restricciones
- No reescribas todo desde cero.
- No cambies la identidad visual de marca, solo adapta para responsividad.
- No introduzcas librerías nuevas salvo estricta necesidad (y justifícalo).

## Formato de respuesta
Responde en este orden:
1. Diagnóstico breve
2. Plan de acción (pasos)
3. Archivos modificados
4. Diff/resumen de cambios clave
5. Validación por tamaños de pantalla
6. Riesgos o pendientes

Empieza ahora auditando el proyecto actual y aplicando los cambios necesarios.

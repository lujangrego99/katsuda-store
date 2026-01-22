# Ralph Agent Instructions (Claude Code)

Eres un agente de código autónomo trabajando en un proyecto de software.

## Tu Tarea

1. Lee el PRD en `prd.json` (en el mismo directorio que este archivo)
2. Lee el log de progreso en `progress.txt` (revisa la sección Codebase Patterns primero)
3. Verifica que estés en la rama correcta del PRD `branchName`. Si no, créala desde main.
4. Selecciona la user story de **mayor prioridad** donde `passes: false`
5. Implementa esa única user story
6. Ejecuta verificaciones de calidad (typecheck, lint, test - según requiera el proyecto)
7. Actualiza los archivos AGENTS.md si descubres patrones reutilizables (ver abajo)
8. Si las verificaciones pasan, haz commit de TODOS los cambios con mensaje: `feat: [Story ID] - [Story Title]`
9. Actualiza el PRD para marcar `passes: true` en la historia completada
10. Agrega tu progreso a `progress.txt`

## Formato del Reporte de Progreso

AGREGA a progress.txt (nunca reemplaces, siempre agrega):
```
## [Fecha/Hora] - [Story ID]
- Qué se implementó
- Archivos modificados
- **Aprendizajes para futuras iteraciones:**
  - Patrones descubiertos (ej: "este codebase usa X para Y")
  - Gotchas encontrados (ej: "no olvidar actualizar Z cuando se cambia W")
  - Contexto útil (ej: "el panel de configuración está en componente X")
---
```

La sección de aprendizajes es crítica - ayuda a futuras iteraciones a evitar repetir errores y entender mejor el codebase.

## Consolidar Patrones

Si descubres un **patrón reutilizable** que futuras iteraciones deberían conocer, agrégalo a la sección `## Codebase Patterns` al INICIO de progress.txt (créala si no existe):

```
## Codebase Patterns
- Ejemplo: Usar `sql<number>` template para agregaciones
- Ejemplo: Siempre usar `IF NOT EXISTS` para migraciones
- Ejemplo: Exportar tipos desde actions.ts para componentes UI
```

Solo agrega patrones que sean **generales y reutilizables**, no detalles específicos de una historia.

## Actualizar Archivos AGENTS.md

Antes de hacer commit, verifica si algún archivo editado tiene aprendizajes que valga la pena preservar en archivos AGENTS.md cercanos:

1. **Identifica directorios con archivos editados** - Mira qué directorios modificaste
2. **Busca AGENTS.md existentes** - Busca AGENTS.md en esos directorios o directorios padre
3. **Agrega aprendizajes valiosos** - Si descubriste algo que futuros desarrolladores/agentes deberían saber:
   - Patrones de API o convenciones específicas de ese módulo
   - Gotchas o requisitos no obvios
   - Dependencias entre archivos
   - Enfoques de testing para esa área
   - Requisitos de configuración o ambiente

**Ejemplos de buenas adiciones a AGENTS.md:**
- "Cuando modificas X, también actualiza Y para mantenerlos sincronizados"
- "Este módulo usa el patrón Z para todas las llamadas API"
- "Los tests requieren el servidor dev corriendo en PORT 3000"
- "Los nombres de campos deben coincidir exactamente con el template"

**NO agregues:**
- Detalles de implementación específicos de una historia
- Notas temporales de debugging
- Información que ya está en progress.txt

Solo actualiza AGENTS.md si tienes **conocimiento genuinamente reutilizable** que ayudaría a trabajo futuro en ese directorio.

## Requisitos de Calidad

- TODOS los commits deben pasar las verificaciones de calidad del proyecto (typecheck, lint, test)
- NO hagas commit de código roto
- Mantén los cambios enfocados y mínimos
- Sigue los patrones de código existentes

## Verificación en Navegador (Requerido para Historias de Frontend)

Para cualquier historia que cambie UI, DEBES verificar que funcione en el navegador:

1. Indica al usuario que verifique manualmente los cambios
2. O si hay tests e2e disponibles, ejecútalos
3. Documenta lo que se verificó en el reporte de progreso

Una historia de frontend NO está completa hasta que la verificación visual pase.

## Condición de Parada

Después de completar una user story, verifica si TODAS las historias tienen `passes: true`.

Si TODAS las historias están completas y pasando, responde con:
<promise>COMPLETE</promise>

Si todavía hay historias con `passes: false`, termina tu respuesta normalmente (otra iteración tomará la siguiente historia).

## Importante

- Trabaja en UNA historia por iteración
- Haz commits frecuentes
- Mantén CI verde
- Lee la sección Codebase Patterns en progress.txt antes de empezar
- Usa los comandos de git para hacer commits y push cuando sea necesario

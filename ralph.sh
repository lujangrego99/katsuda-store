#!/bin/bash
# Ralph para Claude Code - Loop autónomo de agente IA
# Adaptado del patrón Ralph de Geoffrey Huntley
# Usage: ./ralph-claude.sh [max_iterations]

set -e

MAX_ITERATIONS=${1:-10}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PRD_FILE="$SCRIPT_DIR/prd.json"
PROGRESS_FILE="$SCRIPT_DIR/progress.txt"
ARCHIVE_DIR="$SCRIPT_DIR/archive"
LAST_BRANCH_FILE="$SCRIPT_DIR/.last-branch"

# Verificar que Claude Code esté instalado
if ! command -v claude &> /dev/null; then
    echo "Error: Claude Code CLI no está instalado"
    echo "Instálalo con: npm install -g @anthropic-ai/claude-code"
    exit 1
fi

# Verificar que jq esté instalado
if ! command -v jq &> /dev/null; then
    echo "Error: jq no está instalado"
    echo "Instálalo con: sudo apt install jq"
    exit 1
fi

# Verificar que exista prd.json
if [ ! -f "$PRD_FILE" ]; then
    echo "Error: No se encontró $PRD_FILE"
    echo "Crea un archivo prd.json con tus user stories primero"
    exit 1
fi

# Archive previous run if branch changed
if [ -f "$PRD_FILE" ] && [ -f "$LAST_BRANCH_FILE" ]; then
  CURRENT_BRANCH=$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")
  LAST_BRANCH=$(cat "$LAST_BRANCH_FILE" 2>/dev/null || echo "")

  if [ -n "$CURRENT_BRANCH" ] && [ -n "$LAST_BRANCH" ] && [ "$CURRENT_BRANCH" != "$LAST_BRANCH" ]; then
    DATE=$(date +%Y-%m-%d)
    FOLDER_NAME=$(echo "$LAST_BRANCH" | sed 's|^ralph/||')
    ARCHIVE_FOLDER="$ARCHIVE_DIR/$DATE-$FOLDER_NAME"

    echo "Archivando run anterior: $LAST_BRANCH"
    mkdir -p "$ARCHIVE_FOLDER"
    [ -f "$PRD_FILE" ] && cp "$PRD_FILE" "$ARCHIVE_FOLDER/"
    [ -f "$PROGRESS_FILE" ] && cp "$PROGRESS_FILE" "$ARCHIVE_FOLDER/"
    echo "   Archivado en: $ARCHIVE_FOLDER"

    echo "# Ralph Progress Log" > "$PROGRESS_FILE"
    echo "Started: $(date)" >> "$PROGRESS_FILE"
    echo "---" >> "$PROGRESS_FILE"
  fi
fi

# Track current branch
if [ -f "$PRD_FILE" ]; then
  CURRENT_BRANCH=$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")
  if [ -n "$CURRENT_BRANCH" ]; then
    echo "$CURRENT_BRANCH" > "$LAST_BRANCH_FILE"
  fi
fi

# Initialize progress file if it doesn't exist
if [ ! -f "$PROGRESS_FILE" ]; then
  echo "# Ralph Progress Log" > "$PROGRESS_FILE"
  echo "Started: $(date)" >> "$PROGRESS_FILE"
  echo "---" >> "$PROGRESS_FILE"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║        RALPH para CLAUDE CODE                         ║"
echo "║        Loop autónomo de agente IA                     ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "PRD: $PRD_FILE"
echo "Max iteraciones: $MAX_ITERATIONS"
echo ""

for i in $(seq 1 $MAX_ITERATIONS); do
  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "  Ralph Iteración $i de $MAX_ITERATIONS"
  echo "═══════════════════════════════════════════════════════"
  echo ""

  # Mostrar estado actual del PRD
  echo "Estado actual de tareas:"
  jq -r '.userStories[] | "  [\(if .passes then "✓" else " " end)] \(.id): \(.title)"' "$PRD_FILE"
  echo ""

  # Run Claude Code con el prompt de ralph
  # --dangerously-skip-permissions: permite ejecutar sin confirmaciones
  # --print: solo imprime la respuesta final
  OUTPUT=$(claude --dangerously-skip-permissions --print < "$SCRIPT_DIR/prompt.md" 2>&1 | tee /dev/stderr) || true

  # Check for completion signal
  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
    echo ""
    echo "╔═══════════════════════════════════════════════════════╗"
    echo "║  ✓ RALPH COMPLETÓ TODAS LAS TAREAS                   ║"
    echo "╚═══════════════════════════════════════════════════════╝"
    echo ""
    echo "Completado en iteración $i de $MAX_ITERATIONS"
    echo "Ver progreso en: $PROGRESS_FILE"
    exit 0
  fi

  echo ""
  echo "Iteración $i completada. Continuando en 3 segundos..."
  sleep 3
done

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║  ⚠ Ralph alcanzó el máximo de iteraciones            ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "Iteraciones: $MAX_ITERATIONS"
echo "Algunas tareas pueden estar pendientes."
echo "Ver estado en: $PRD_FILE"
echo "Ver progreso en: $PROGRESS_FILE"
exit 1

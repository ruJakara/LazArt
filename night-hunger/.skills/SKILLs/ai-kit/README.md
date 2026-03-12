# AI Kit

Универсальная стартовая библиотека для AI-assisted разработки.

## Core
Базовый обязательный слой для большинства проектов:

- `skills/feature-development.md`
- `skills/bugfix-debugging.md`
- `skills/refactoring.md`
- `skills/architecture-design.md`
- `skills/testing-validation.md`
- `skills/documentation-writing.md`
- `instructions/*`
- `rules/coding-rules.md`
- `rules/architecture-rules.md`
- `rules/naming-rules.md`
- `rules/ai-behavior-rules.md`
- `workflows/new-feature-workflow.md`
- `workflows/bugfix-workflow.md`
- `workflows/refactor-workflow.md`
- `workflows/research-and-plan-workflow.md`
- `workflows/doc-update-workflow.md`
- `templates/task-template.md`
- `templates/skill-template.md`
- `templates/workflow-template.md`
- `specs/feature-spec-template.md`
- `specs/acceptance-criteria-template.md`
- `specs/edge-cases-template.md`

## Extensions
Подключаемый слой по ситуации:

- Recovery: `skills/project-recovery.md`, `workflows/project-recovery-workflow.md`, `prompts/create-recovery-skill.md`
- Integration-heavy: `skills/integration-stitching.md`, `workflows/integration-workflow.md`
- Prototype-first: `skills/fast-prototyping.md`
- Legacy-heavy: `skills/legacy-cleanup.md`
- Governance: `rules/anti-drift-rules.md`, `rules/temporary-fix-rules.md`
- Handoff & control: `templates/handoff-template.md`, `templates/done-criteria-template.md`, `templates/bug-report-template.md`
- Spec-driven planning: `specs/project-spec-template.md`, `specs/module-spec-template.md`, `specs/integration-spec-template.md`, `prompts/create-feature-spec.md`
- Kit maintenance: `prompts/create-project-kit.md`, `prompts/audit-ai-kit.md`, `prompts/expand-ai-kit.md`

## Usage Mode
1. Начинай с Core.
2. Добавляй Extensions только под текущий тип задач.
3. Для задач с высокой неоднозначностью сначала зафиксируй spec (`specs/*`).
4. Раз в несколько итераций запускай аудит через `prompts/audit-ai-kit.md`.

# Marketing Skills Workspace

Мини-проект с AI-навыками для подготовки контента VK по схеме:

`анализ аудитории -> написание поста`.

## Что внутри

- `SKILL analyst VK-.md` - исходный навык анализа аудитории.
- `SKILL post_writer.md` - исходный навык написания постов.
- `SKILL VK director.md` - исходный навык-оркестратор этапов.
- `docs/ai/` - рабочая проектная документация для AI-итераций.
- `skills/` - нормализованные skill-файлы с единой структурой.
- `Taskfile.yml` - базовые команды проверки структуры.

## Как использовать

1. Сначала открой [docs/ai/workflow.md](docs/ai/workflow.md).
2. Для анализа используй [skills/vk-audience-analysis.md](skills/vk-audience-analysis.md).
3. Для текста поста используй [skills/vk-post-writer.md](skills/vk-post-writer.md).
4. Для сквозной оркестрации используй [skills/vk-content-director.md](skills/vk-content-director.md).

## Быстрые команды

Если установлен [Task](https://taskfile.dev/):

- `task tree` - показать дерево проекта.
- `task check` - проверить наличие обязательных файлов и формат skill-файлов.

## Где основная логика

Логика проекта сейчас документарная (markdown-driven): правила и роли описаны в `skills/` и `docs/ai/`.

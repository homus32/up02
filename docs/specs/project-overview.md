# Project Overview

## Purpose

Веб-приложение «AnimeBaza» — каталог аниме, разрабатываемый в рамках учебной практики УП.02.
Представляет собой стриминговый сайт (каталог + плеер-заглушка) без бекенда.
Данные загружаются через Shikimori GraphQL API. Пользовательские списки — localStorage.

## Tech Stack

- **Frontend:** Nuxt 4, Vue 3, TypeScript, Vite, SSR
- **UI Library:** PrimeVue 4 (Aura theme)
- **Styling:** Vanilla CSS, БЭМ (BEM), CSS custom properties
- **API:** Shikimori GraphQL (`shikimori.io/api/graphql`), прокси через Nitro
- **Storage:** localStorage (списки аниме, рейтинг, псевдо-авторизация)

## Задачи практики

1. **Описание тематики дипломного проекта** — документ `docs/guides/concept.md`
2. **Use-case диаграмма** — акторы и их взаимодействие с системой
3. **Проектирование и разработка интерфейса** — 4 страницы: каталог, страница тайтла, вход, профиль

## Acceptance Criteria

- [x] Задание 1: описание проекта — `docs/guides/concept.md`
- [ ] Задание 2: use-case диаграмма в виде изображения
- [x] Задание 3: 4 страницы, PrimeVue + БЭМ, адаптивность, клиентская логика (localStorage), ссылка на репозиторий

---

*Последнее обновление: 2026-05-21*

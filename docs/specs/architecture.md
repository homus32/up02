# Architecture

## Стек

- **Nuxt 4** — фреймворк (SSR, file-based routing)
- **Vue 3** — UI-библиотека (Composition API, `<script setup>`)
- **TypeScript** — типизация
- **Vite** — сборщик
- **Vanilla CSS** — стилизация (БЭМ, custom properties)

## Структура проекта

```
app/
  app.vue          # корневой компонент
  pages/           # страницы
  components/      # переиспользуемые компоненты
  layouts/         # layout-компоненты (опционально)
public/            # статические файлы
docs/
  guides/          # руководства
  specs/           # SDD-спецификации
```

## Рендеринг

- SSR по умолчанию (Nuxt 4 default)
- Все страницы рендерятся на сервере

## Стилизация

- Vanilla CSS, БЭМ-классы
- CSS custom properties для цветов, размеров, отступов
- Компонентные CSS-файлы (`<style scoped>` или отдельные `.css`)
- CSS Grid для раскладки (без Tailwind)

---

*Этот файл обновляется при изменении архитектуры.*

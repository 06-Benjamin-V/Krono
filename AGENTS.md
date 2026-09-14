# Personal Task Manager — Project Instructions

## Goal

Build a local-first personal task and event management mobile application.

## Stack

- React
- TypeScript
- Vite
- Capacitor
- Android
- SQLite local database
- Capacitor Local Notifications
- Vitest
- React Testing Library

Android APK builds are performed through the Gradle project generated/managed by Capacitor.

Do not introduce a remote backend, cloud database, authentication server, or external API unless the user explicitly requests it.

## Git policy

No AI agent may execute:

- git commit
- git push
- git reset --hard
- git clean

Agents may inspect the repository with commands such as:

- git status
- git diff
- git log

After a coherent change is complete, Skynet must propose exactly one Conventional Commit message. The human user performs the actual commit and push.

## Suggested source organization

```text
src/
  components/
  features/
    tasks/
    events/
    calendar/
    settings/
  database/
  services/
    notifications/
  hooks/
  pages/
  types/
  utils/
```

Keep business logic out of presentation components.

## Domain

### Tasks

Tasks are completable.

Common fields:

- id
- title
- description
- type
- startAt
- endAt
- color
- completed
- completedAt
- createdAt
- updatedAt

Task types:

- DAILY
- DEADLINE

#### DAILY

"Daily" currently means a 24-hour task, not a recurring task.

The user chooses `startAt`.

The app calculates:

`endAt = startAt + 24 hours`

While incomplete, notify the user every 2 hours with the remaining time.

When completed, cancel all pending notifications for that task.

#### DEADLINE

The user chooses `startAt` and `endAt`.

`endAt` must be later than `startAt`.

While incomplete, reminders are scheduled at the interval selected in app settings.

When completed, cancel all pending notifications for that task.

### Events

Events are not completable.

Common fields:

- id
- title
- description
- startAt
- endAt
- color
- createdAt
- updatedAt

Do not add event-completion logic.

Do not add event notifications unless explicitly requested.

## Colors

Tasks and events allow a user-selected color.

Persist colors in a standard format such as hexadecimal.

Use the same selected color consistently in cards, calendar indicators and related UI.

## In-app widgets

For this project, "widget" initially means a dashboard component inside the app, not an Android launcher/home-screen widget.

### Daily list widget

Header concept:

`< previous | selected day | next >`

Example:

`< 14 September 2026 >`

Changing arrows changes the selected day.

Show tasks and events associated with the selected date.

Tasks visibly indicate completion state.

### Calendar widget

Monthly calendar.

Days containing tasks/events display colored dots corresponding to item colors.

Below the calendar, show counters for the selected date, for example:

- Tasks: 3
- Events: 2

## Settings

Persist settings locally.

At minimum include:

- deadlineTaskNotificationIntervalHours

Avoid scattering configurable values across files.

## SQLite

SQLite is the local source of truth.

Use a clear data-access boundary:

UI -> hooks/services -> repositories -> SQLite

Use migrations/versioning for schema changes.

Use parameterized SQL.

Do not destroy existing user data during upgrades.

## Notifications

Centralize notification behavior in a service.

React components must not directly schedule native notifications.

Expected operations include:

- scheduleTaskNotifications(task)
- cancelTaskNotifications(taskId)
- rescheduleTaskNotifications(task)
- reschedule notifications when relevant settings change

Avoid duplicate scheduled notifications.

Use stable notification IDs that can be cancelled reliably.

## Dates and time

Use a consistent timestamp representation, preferably ISO-8601.

Centralize date calculations.

Account for local timezone behavior and Android scheduling limitations.

Do not promise exact delivery timing when Android battery optimization/Doze can delay notifications.

## Quality gate

Before a feature is considered complete:

1. TypeScript compiles.
2. Linting passes if configured.
3. Relevant tests pass.
4. No obvious runtime/console errors remain.
5. QA reviews important changes.

Avoid `any` unless justified.
Prefer small, reusable, testable units.

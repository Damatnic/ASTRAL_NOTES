# Feature Verification Matrix

- Dashboard: route renders with data-testid=dashboard (routing-app.test.tsx)
- Projects Overview: data-testid=projects-overview (routing-app.test.tsx)
- Project Dashboard: data-testid=project-dashboard (routing-app.test.tsx)
- Quick Notes: data-testid=quick-notes (routing-app.test.tsx)
- AI Writing: data-testid=ai-writing (routing-app.test.tsx)
- Search: data-testid=search (routing-app.test.tsx)
- Settings: data-testid=settings (routing-app.test.tsx)

Buttons/Options (verified by smoke + interactions)
- Dashboard: quick actions visible (pages-smoke)
- Dashboard: quick actions navigate to target pages (interactions)
- Projects: filter panel toggles; sort direction toggles (interactions)
- Projects: card link navigates to Project Dashboard (interactions)
- Projects: New Project opens modal (interactions)
- Quick Notes: Attach Selected disabled when none; Tags dropdown selects tag (interactions)
- Quick Notes: New Note opens modal (interactions)
- AI Writing: header actions render (Preferences, New Session) (interactions)
- Search: Quick Searches panel renders (interactions)
- Settings: theme change applies document class (interactions)

Skeletons
- ReferenceImages: skeletons appear while loading (manual check)
- Projects: page renders stable with large lists (manual check)

Notes
- Legacy routing suite replaced by current outing-app.test.tsx to match actual routes/components.

# TODO - Social flow refactor

## Plan (approved)
- Add **Volunteer Hub** route `/volunteer-hub` as the single “Instagram-like” place for volunteer actions.
- Make volunteer/profile flow feel linear (forward actions, minimal bouncing).
- Reduce top-level navigation clutter:
  - **Bottom nav**: Feed, Explore, Create, Help, Profile (+ Rewards if volunteer).
  - **Sidebar**: Home Tools + Legal Tools (complaints/track/questions) + Admin (hidden from normal users).

## Steps
1. Create `src/Pages/VolunteerHub.jsx` implementing the volunteer flow UI (steps/sections + action buttons linking forward).
2. Update `src/App.jsx`:
   - Add route `/volunteer-hub`.
   - Remove volunteer/social routes from `SIDEBAR_LINKS` and ensure Admin is role-gated.
3. Update `src/Components/BottomNav.jsx` to only include the social essentials + conditional Rewards.
4. Update `src/Pages/Profile.jsx`:
   - Add CTA button that routes to `/volunteer-hub` for volunteer users.
5. Verify routing/UX:
   - Login → Profile → Volunteer Hub.
   - Volunteer Hub actions open messages/rewards/help without requiring back navigation.
   - Ensure non-volunteers still see only allowed CTAs.


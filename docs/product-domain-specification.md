# Product and Domain Specification

This document turns the initial Pepsi Plans proposal into an implementation-oriented reference. It describes intended behavior; it does not imply that these features are already implemented.

## 1. Product goal

Help a group of friends in Miami choose a plan together without a long message thread. A host creates a room and selects a deck of curated experiences. Participants join through a shared URL, express preferences, and receive a result based on the group's votes.

## 2. Actors and capabilities

| Actor | Capabilities |
|---|---|
| Host | Create a room, select a Vibe, curate the deck, share the room, start voting and close voting |
| Participant | Join an eligible room, inspect the deck, vote once per plan and view the outcome |
| System | Validate state transitions, persist votes, enforce Boost limits, calculate results and expire rooms |

No full user account is required. Every visitor enters a display name and receives a temporary user identity backed by an opaque session token. The same temporary user may create rooms and join other rooms. Host ownership is represented by `rooms.host_user_id`; participant access is represented by a `room_participants` membership. The public room ID locates a room but does not, by itself, authorize voting.

## 3. Room state machine

`DRAFT → READY → VOTING → COMPLETED → EXPIRED`

| From | To | Trigger | Validation |
|---|---|---|---|
| DRAFT | READY | Host finishes deck | Vibe selected; 2–10 unique plans selected |
| READY | VOTING | Host starts voting | Authenticated temporary user is the room host; deck snapshot persisted |
| VOTING | COMPLETED | Host closes voting or configured completion rule runs | Room still accepting votes |
| DRAFT / READY / VOTING / COMPLETED | EXPIRED | Expiration policy | Expiration timestamp reached |

Invalid transitions must be rejected by the server. A browser must never be able to move a room to a new state by directly updating a client-side value.

A room in `VOTING` accepts new participants and votes until it reaches `COMPLETED` or `EXPIRED`. The deck is immutable after entering `VOTING`.

## 4. Deck rules

- A room deck contains at least 2 and at most 10 plans.
- A plan may appear only once in a room deck.
- The host can add, remove or reorder plans while the room is in `DRAFT` or `READY`.
- Discovery is presented in batches of five.
- Loading another batch must preserve the current selection.
- Starting voting stores a room-specific snapshot. Later changes to the general plan catalog do not affect the active room.

## 5. Participant and identity rules

- Every visitor enters a display name and receives a temporary user identity, whether they create a room or join one.
- The identity is browser-profile scoped, not room scoped. The same user can host one room and participate in others.
- The server generates an opaque, cryptographically random token. Only its hash is stored in `users`; the raw token is set in a persistent `Secure`, `HttpOnly`, `SameSite=Lax` cookie.
- The cookie has a 30-day lifetime and is renewed on valid activity. It must survive closing a tab, browser or shared room link.
- On return from the same browser profile, the server resolves the token to the same user and restores their room memberships and persisted votes.
- If cookies are cleared, private browsing is used, or the user switches browser/device, the temporary identity cannot be recovered in this MVP. Cross-device recovery would require an additional mechanism, such as a recovery code or optional account, and is out of scope.
- Server-side operations validate the user's token. Host-only operations additionally verify `rooms.host_user_id`; voting additionally verifies room membership.
- A late participant may join only while the room is in `VOTING`.

The display name is only a presentation field, not an authentication factor. Avoid collecting emails or other unnecessary personal data.

## 6. Vote rules

Each participant can submit exactly one vote per plan in a room.

| Vote action | Stored type | Score contribution |
|---|---|---:|
| Dislike | `dislike` | -1 |
| Like | `like` | +1 |
| Pepsi Boost | `boost` | +3 |

Rules:
- A vote is accepted only when the room is `VOTING`.
- The plan must belong to that room's deck.
- The participant must belong to that room.
- Duplicate votes are rejected; the first accepted vote remains authoritative.
- Clients submit an action, never a score.
- Each participant may submit at most one Boost in a room.
- Boost availability is consumed atomically with successful vote persistence.
- Failed vote persistence must not consume a Boost.
- No vote editing or rewind is supported in the first version.

Recommended database protections:
- Unique constraint on `(room_participant_id, plan_id)`.
- A participant-room Boost usage record or equivalent database constraint.
- Transactional server operation for vote insertion and Boost consumption.

## 7. Result calculation

For each plan:

`score = likes + (boosts * 3) - dislikes`

Sort by:
1. Score descending.
2. Boost count descending.
3. Like count descending.

If plans remain equal after these criteria, represent them as tied. Do not use insertion order, plan ID or random order to claim a winner.

The results screen should show each plan's total score and vote breakdown so participants can understand the recommendation.

## 8. Synchronization and recovery

PostgreSQL is the source of truth. Realtime is a notification mechanism, not a durable event log and not proof of a successful write.

Client behavior:
- Subscribe to room-level changes while viewing a room.
- On reconnect, fetch the current room state, deck and the participant's persisted votes.
- Treat duplicate notifications as harmless.
- Use persisted state to reconcile missed notifications.
- Show a pending state while a vote is being submitted.
- Show success only after the server confirms persistence.
- Prevent accidental repeated submissions in the UI, while retaining database uniqueness as the authoritative defense.

## 9. Suggested conceptual schema

### users
- `id`
- `name` — display name supplied by the visitor; not an authentication factor
- `identity_token_hash` — hash of the opaque temporary identity token
- `created_at`
- `last_seen_at` — updated after valid activity
- `expires_at` — temporary identity expiration, extended on valid activity

### rooms
- `id`
- `host_user_id` — foreign key to `users.id`
- `vibe`
- `status`
- `created_at`
- `expires_at`
- `completed_at`

### room_participants
- `id`
- `room_id`
- `user_id`
- `boost_used_at`
- `joined_at`

Unique constraint: `(room_id, user_id)`.

### plans
- `id`
- `title`
- `category`
- `neighborhood`
- `budget_label`
- `image_key`
- `short_insight`
- `description`
- `vibe_tags`
- `is_active`

### room_plans
- `room_id`
- `plan_id`
- `position`
- Optional immutable content snapshot fields if catalog data must be preserved exactly

Unique constraint: `(room_id, plan_id)`.

### votes
- `id`
- `room_participant_id`
- `plan_id`
- `action`
- `created_at`

Unique constraint: `(room_participant_id, plan_id)`. The room is derived through the room membership, avoiding mismatched room/user references.

The temporary user is stable across browser restarts in the same browser profile, rather than recreated for each tab or room. A user may be the host of one room and a participant in another. The room membership stores room-specific state such as Boost usage. The host does not automatically become a voter; whether the host also joins as a participant is an explicit product behavior to settle before implementation. The 30-day inactivity expiration is a proposed MVP policy. This is a conceptual model, not a committed migration. Exact columns, token rotation and RLS policies should be designed alongside the first implementation.

## 10. Important edge cases

| Scenario | Expected behavior |
|---|---|
| Host starts with fewer than 2 plans | Reject transition; explain deck requirement |
| Host selects more than 10 plans | Prevent additional selection |
| Same plan selected twice | Keep one selection |
| Another batch is loaded | Preserve existing selection |
| Participant opens link after voting started | Allow join and return current deck |
| Participant refreshes after voting | Restore identity and submitted votes |
| Same vote request is sent twice | Accept at most one vote |
| Two Boost requests race | At most one can be persisted |
| Boost write fails | Keep Boost available |
| Vote arrives after room completion | Reject |
| Catalog plan is edited after voting begins | Do not mutate the room snapshot |
| Two plans tie on all ranking criteria | Show a shared tie |

## 11. Security and abuse considerations

For a production launch, review:
- Unpredictable room identifiers and protection against enumeration.
- Persistent temporary-user identity across browser restarts, hashed token storage, cookie security, token renewal and inactivity expiration.
- Host authorization by checking `rooms.host_user_id` against the authenticated temporary user.
- Vote authorization by checking room membership; knowing a `room_id` alone is insufficient.
- Narrow server-side authorization for every mutation.
- RLS policies and service-role key handling.
- Rate limits for room creation, joining and voting.
- Idempotent write semantics for retryable requests.
- Data retention and deletion for expired rooms.
- Abuse monitoring and operational audit logs.

## 12. Test matrix

### Unit
- Every vote action maps to the documented score.
- Boost contributes three points and is the first tie-breaker.
- Like count is the second tie-breaker after Boosts.
- Full tie is represented without inventing a winner.
- Deck bounds are enforced.
- Only allowed room transitions succeed.

### Integration
- Room creation and deck snapshot.
- Temporary user creation from a submitted display name and identity recovery after closing/reopening the browser.
- Host authorization through `rooms.host_user_id`.
- Participant join and late join through `room_participants`.
- Vote rejection for a visitor who knows the room ID but has not joined or has no valid session.
- Vote persistence and duplicate rejection.
- Concurrent Boost requests.
- Realtime notification followed by state reconciliation.
- Vote rejection after completion and expiration.

### Manual acceptance walkthrough
1. Create a room and select a Vibe.
2. Add plans across multiple discovery batches.
3. Verify selections persist and stay within 2–10.
4. Share the room with at least two browser sessions.
5. Start voting and verify both sessions see the same deck.
6. Vote from both sessions, including one Boost each.
7. Refresh one session and verify persisted state.
8. Close voting and compare the result against the score formula.

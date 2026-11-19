# Pepsi Plans

**Make Pepsi Part of the Moment**

A mobile-first group-planning experience that helps friends in Miami move from “What should we do?” to a shared plan, with Pepsi acting as a natural cultural curator.

> **Project status:** Initial product and technical proposal. This document separates Spotdly's original challenge brief from the product decisions proposed for this prototype.

## 1. Original challenge brief

The following is the challenge brief provided by Spotdly, preserved in its original language.

### El reto: Make Pepsi Part of the Moment

En Spotdly estamos construyendo un estudio creativo digital que mezcla creatividad, tecnología, cultura y negocio. Nos interesa crear experiencias que no solo funcionen técnicamente, sino que las personas realmente quieran usar.

Imagina que **Pepsi** quiere conectar con personas en Miami a través de una experiencia digital para descubrir planes y compartirlos con amigos.

El problema es que muchas veces decidir qué hacer en grupo termina en un intercambio interminable de mensajes: cada persona propone algo distinto, no hay claridad sobre las preferencias y nadie termina tomando una decisión.

Tu desafío es crear un **prototipo web funcional** que ayude a un grupo de amigos a pasar de “¿qué hacemos?” a elegir un plan, integrando a Pepsi de una manera que tenga sentido dentro de la experiencia.

La experiencia debe sentirse pensada para la marca y para las personas que la van a utilizar. Puede ser algo sencillo, pero debe demostrar una idea clara y funcionar lo suficientemente bien como para que podamos probarla.

**Restricciones:**
- Debe poder usarse desde un teléfono, sin descargar una aplicación.
- Una persona debe poder iniciar la experiencia y compartirla con otras personas mediante un enlace.
- Las personas deben poder expresar sus preferencias y llegar a un resultado o recomendación compartida. Tú decides cómo funciona la dinámica.
- El resultado debe reflejar las preferencias recibidas. Explica la lógica detrás de tu solución.
- Puedes usar datos de ejemplo y simular servicios externos. No necesitas integrar eventos reales ni crear cuentas de usuario.
- No es necesario procesar pagos ni recopilar datos personales reales.
- La primera versión debe ser una base razonable para desarrollar una experiencia real, no solo una presentación visual.

**Queremos ver:**
1. La idea. Resume en una frase qué construiste y por qué alguien querría usarlo.
2. La experiencia. Muéstranos el recorrido desde que una persona inicia el plan hasta que el grupo obtiene un resultado. ¿Cómo se integra Pepsi de forma natural?
3. El problema técnico. ¿Cómo compartes el estado entre participantes y cómo manejas situaciones como una persona que llega tarde, recarga la página o envía una respuesta más de una vez? Si decides no resolver alguna, cuéntanos cómo la abordarías.
4. El criterio. ¿Qué decisiones tomaste sobre tecnologías, estructura y datos? ¿Qué priorizaste y qué dejaste fuera para esta primera versión?
5. Las pruebas. Muéstranos cómo comprobaste que la experiencia funciona. Incluye al menos una prueba que cubra una parte importante de la lógica y explica brevemente qué otras situaciones probarías antes de lanzar.
6. Pensando en escala. Si Pepsi quisiera lanzar la experiencia para miles de personas, ¿qué tendrías que cambiar o revisar en seguridad, rendimiento y confiabilidad? No esperamos que construyas esa infraestructura; queremos entender tu razonamiento.

---

## 2. The idea

**Pepsi Plans turns group decision-making into a shared, lightweight game: friends react to a curated deck of Miami experiences and get a recommendation shaped by the group's votes.**

The host creates a moment, chooses its Pepsi Vibe, selects a small set of plans, and shares a link. Everyone votes independently. The group sees the plans ranked by collective preference.

### Product principles

- **Frictionless:** mobile web, shared link, no installation or account creation.
- **Social by design:** each person contributes a preference; no one has to negotiate in a long chat thread.
- **Transparent:** the outcome is explainable from the votes received.
- **Brand-native:** Pepsi helps people discover the mood and local culture rather than interrupting the experience with an ad.
- **Prototype-ready:** curated sample data is enough to test the complete experience.

## 3. Product experience

### Host flow

1. Create a moment and receive a unique shareable URL.
2. Choose a Pepsi Vibe.
3. Browse curated Miami recommendations in batches of five.
4. Build a deck of 2–10 plans. Requesting another batch must not erase existing selections.
5. Share the room through any messaging app.
6. Start voting. The deck is frozen from this point so all participants vote on the same options.

### Participant flow

1. Open the shared link on a phone.
2. Join with a temporary, room-scoped identity; no account is required.
3. Review the same deck as every other participant.
4. Vote once on each plan.
5. Follow group progress and see the final recommendation when voting is complete or the host closes the room.

Participants who arrive late can join while the room is in the voting state and vote on the existing deck. Refreshing the page must recover their temporary identity and previously recorded votes.

### Plan cards

Each card contains a plan name and category, image, Miami neighborhood, indicative budget and a short **Pepsi Insight**. An affordance expands the card to show editorial description and practical details.

## 4. Pepsi integration: Pepsi Vibes

The host chooses one Vibe for the room. It influences curated recommendations and editorial tone.

| Vibe | Direction | Example plan types |
|---|---|---|
| **Pepsi Original** | Classic, iconic and culturally recognizable | Restaurants, landmarks and signature local experiences |
| **Pepsi Zero Sugar** | Active, daytime and exploratory | Outdoor activities, sports and cultural exploration |
| **Pepsi Wild Cherry** | Expressive, social and unexpected | Nightlife, live music and unconventional experiences |

Initial discovery areas: **Wynwood, Little Havana, Brickell and South Beach**.

Pepsi's role is **The Insider**: a curator that helps the group find an experience matching its mood. The brand should add context and discovery value, not interrupt the task.

## 5. Voting mechanics

Each participant can submit one vote per plan:

| Action | Score |
|---|---:|
| Dislike | -1 |
| Like | +1 |
| Pepsi Boost | +3 |

Each participant has exactly **one Pepsi Boost per room**. The Boost is an enhanced vote, not an automatic winner.

The Boost is consumed only after the server confirms that the vote was successfully recorded. Its UI state progresses from available, to activated on the selected card, to consumed and disabled for the rest of the room.

There is intentionally no rewind in the first version. This keeps the interaction simple and avoids ambiguous vote replacement rules.

### Ranking

For every plan:

`Score = Likes + (Boosts × 3) - Dislikes`

Plans are ordered by:
1. Highest total score.
2. Highest number of Boosts.
3. Highest number of Likes.

If all three criteria are equal, the result is a shared tie. The application must not invent a winner based on arbitrary ordering.

## 6. Room lifecycle and rules

Proposed lifecycle:

`DRAFT → READY → VOTING → COMPLETED → EXPIRED`

| State | Meaning |
|---|---|
| `DRAFT` | Host is choosing a Vibe and curating plans. |
| `READY` | Deck is valid and can be shared. |
| `VOTING` | Participants can join and submit votes; the deck is immutable. |
| `COMPLETED` | Voting is closed and results are finalized. |
| `EXPIRED` | Room is no longer available. |

Only the host can edit the deck, and only before voting starts. The deck must contain 2–10 plans before voting begins. Participants can join a room in `VOTING` until it is completed or expired. State transitions and voting rules are validated by the server, not trusted to the browser.

## 7. Technical proposal

### Proposed stack

| Concern | Proposal | Why |
|---|---|---|
| Web application | Next.js App Router | One application for shareable routes and server-rendered experiences |
| Language | TypeScript, strict mode | Safer domain logic and contracts |
| Styling | Tailwind CSS | Fast iteration on a responsive interface |
| Database | Supabase PostgreSQL | Relational consistency and transactional operations |
| Live updates | Supabase Realtime | Reflect votes and room progress across participants |
| Critical operations | Server-side functions / PostgreSQL RPC | Enforce room, vote and Boost rules atomically |
| Access control | PostgreSQL Row Level Security | Protect room and participant data |
| Unit tests | Vitest | Test scoring and domain rules independently |

This is a proposal, not a claim that these technologies are already implemented. The final stack may be adjusted to the repository's existing setup before implementation.

### Conceptual data model

| Entity | Responsibility |
|---|---|
| `users` | Temporary visitor identity, display name and hashed session token |
| `rooms` | Room identifier, `host_user_id`, selected Vibe, state and expiration |
| `room_participants` | Membership of a user in a room and room-specific Boost usage |
| `plans` | Curated Miami experiences and editorial content |
| `room_plans` | Snapshot of plans selected for a specific room |
| `votes` | One participant's decision for one plan in one room |

Important constraints:
- Unique room membership per `(room_id, user_id)`.
- Unique vote per `(room_participant_id, plan_id)`.
- At most one Boost per room membership (`room_participants.boost_used_at`).
- `rooms.host_user_id` references the temporary user who created the room.
- A room's selected deck is immutable after entering `VOTING`.
- Vote values are represented by a constrained action type; clients never submit a calculated score.
- The room-specific plan snapshot prevents catalog edits from changing an active room.

### State synchronization and reliability

The database is the source of truth. Realtime events notify clients that data changed; they are not proof that a vote was accepted.

Critical vote operations should be transactional:
1. Validate that the room is accepting votes.
2. Validate the user's session token and room membership, and that the membership has not voted for that plan.
3. Validate Boost availability when the action is a Boost.
4. Insert the vote and update Boost usage atomically.
5. Return the persisted result.

This protects against duplicate submissions, concurrent Boost attempts and forged client-side scores.

When a visitor first enters the app and provides a display name, the server creates a temporary user identity and issues an opaque random session token. The token is stored as a hash in `users`; the raw token is kept in a Secure, HttpOnly, SameSite cookie. The cookie identifies the same temporary user on later visits from that browser. When that user creates a room, `rooms.host_user_id` records the host relationship. When anyone joins a room, a `room_participants` row records membership. The public `room_id` locates a room but does not authorize voting: vote operations also validate the user's session and room membership.

## 8. Testing strategy

### Unit tests

- Like, Dislike and Boost score calculations.
- Boost consumption and reuse rejection.
- Duplicate vote prevention.
- Ranking and tie behavior.
- Deck minimum and maximum.
- Room state transition rules.

### Integration tests

- Create a room and join using its shared URL.
- Recover participant identity after refresh.
- Submit a vote and verify it is persisted.
- Attempt duplicate votes.
- Attempt concurrent Boost submissions.
- Verify Realtime updates across clients.
- Close a room and verify final results remain consistent.

### Acceptance criteria

- Host can create a room, choose a Vibe, browse in batches of five and select 2–10 plans.
- Host can share a unique link without requiring participants to install an app.
- Participants join without an account and receive the same deck.
- Each participant can vote once per plan and use no more than one Boost.
- Refreshing does not discard recorded votes or participant identity.
- Results follow the documented scoring and tie-breaking rules.
- Completed and expired rooms reject new votes.

## 9. Scope of the first version

### Included

- Mobile-first web experience.
- Temporary rooms and shareable links.
- Curated sample catalog of Miami plans.
- Pepsi Vibes and editorial insights.
- Host deck creation and participant voting.
- Shared results and live vote synchronization.
- Core domain and integration tests.

### Explicitly excluded

- User accounts and password flows.
- Native mobile applications.
- Chat or messaging features.
- Vote rewind or vote editing.
- Payment processing.
- Live reservation integrations.
- Live event discovery or third-party discovery APIs.
- Full content-management system.
- Complex recommendation or personalization algorithms.
- Redis and microservices.

The prototype may use seeded plans and simulated external services. These exclusions keep attention on the core challenge: a reliable shared decision experience.

## 10. Thinking about scale

For a launch reaching thousands of participants, revisit:

- **Security:** temporary-user session tokens, host ownership checks, room membership authorization, RLS policies, rate limits, abuse prevention and protection against room enumeration.
- **Concurrency:** transactional vote writes, unique constraints, idempotency keys and load tests for simultaneous submissions.
- **Performance:** indexes for room and vote lookups, efficient aggregate queries, pagination for discovery and appropriate caching for the static plan catalog.
- **Realtime reliability:** reconnect behavior, missed-event recovery from the database and limits on channel/subscription fan-out.
- **Operations:** monitoring, structured logs, error reporting, database backups, retention policies and scheduled cleanup of expired rooms.

Redis, queues or a separate service should be introduced only when measured load or operational needs justify them. They are not required to prove the initial experience.

## 11. Open implementation decisions

The following should be settled while implementing, based on the repository and the smallest secure design:

- How temporary user sessions are issued, expired, rotated and recovered.
- Whether the host may also participate in voting, or is host-only.
- Whether room completion is host-triggered, time-triggered or both.
- The retention window for expired room data.
- The exact Realtime channel strategy and client recovery behavior.

## 12. Traceability to the challenge

| Spotdly asks for | Pepsi Plans proposal |
|---|---|
| A clear idea | Shared group-planning game based on reactions to a curated deck |
| End-to-end experience | Host creates and shares a room; participants vote; group gets a result |
| Natural Pepsi integration | Pepsi Vibes and The Insider editorial curation |
| Shared state and late arrivals | Room state in PostgreSQL and joinable voting rooms |
| Refresh and duplicate submissions | Recoverable temporary user session, room membership and unique vote constraints |
| Technology and data decisions | Next.js, TypeScript, Supabase and a relational model |
| Tests | Domain unit tests, integration tests and acceptance criteria |
| Scaling considerations | Security, concurrency, performance and operational readiness |

## 13. Suggested implementation milestones

1. **Foundation:** repository setup, app shell, design tokens and seeded plan catalog.
2. **Room creation:** host flow, Vibe selection, deck curation and shareable room.
3. **Voting:** participant identity, vote persistence, Boost constraints and result calculation.
4. **Synchronization:** Realtime updates, reconnect recovery and late joiners.
5. **Polish and verification:** responsive/accessibility pass, tests and challenge walkthrough.

---

*This README describes the proposed product and engineering direction. It should be updated as implementation decisions are validated; proposed behavior must not be presented as implemented until it exists and has been tested.*

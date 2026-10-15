# Attendly — facial recognition attendance workspace

A rebuilt academic attendance portfolio project. React provides a responsive administrator workspace; a small Node.js HTTP API persists demo records locally. face-api.js processes enrolled photos and live video in the browser. The original MongoDB/Express project remains separately in the sibling CD-ISD folder and is not used by this app.

## Run locally

Requires Node.js 22 or later and npm. From this repository root:

```sh
npm --prefix ISD ci
npm run build
npm start
```

Open http://localhost:4173. Existing installed dependencies can be reused; `npm --prefix ISD ci` is only needed on a fresh checkout. The root server has no third-party dependencies. It binds to loopback only.

```sh
npm test
```

## A three-minute demo

1. Explore Overview: metrics are calculated from saved records, not hard-coded charts.
2. Open Students and search the directory. Add a student with a unique email.
3. Create a course. New courses include all students registered at creation time; existing course rosters remain unchanged.
4. Select New session → Interactive demo → Start session.
5. Click Simulate 3 face matches. Change another student manually to Present or Absent.
6. Finish session. Remaining Pending students become Absent; completed sessions are immutable.
7. Open Reports and export the session as CSV. Refresh the browser to confirm persistence.

Seeded people and university details are fictional. Historical sessions are labeled demo data. Simulated matches do not use face recognition.

## Real face recognition

In Students, enroll a clear photo containing exactly one face, with the person's permission. Only a 128-value descriptor is stored; the photo is processed in memory. Start a Live recognition session for a course containing that student and click Enable camera. Browser permission is required. Recognition compares enrolled descriptors using face-api.js with a distance threshold of 0.5. Unrecognized faces are not marked. Finishing, leaving, or stopping the session closes the camera stream.

The actual camera/accuracy workflow requires hardware and enrolled photos; automated tests do not establish recognition accuracy. This prototype has no liveness detection or anti-spoofing and should not make real attendance decisions without human verification.

## Architecture

- `ISD/src/App.js`: dashboard, directory, courses, sessions, reports, face enrollment and camera flow.
- `ISD/src/App.css`: responsive visual system.
- `app/server.cjs`: same-origin API and static build server, bound to 127.0.0.1.
- `app/store.cjs`: validated domain operations, roster snapshots, session transitions.
- `app/data/demo.json`: local persisted records, ignored by Git. Stop the server and remove this file to reset the fictional demo.
- `camera/`: existing face-api.js library and model weights.
- `tests/store.test.cjs`: meaningful tests for validation, duplicate handling, session transitions, and descriptor shape.

API: `GET /api/state`; `POST /api/student`, `/api/course`, `/api/enroll`, `/api/start`, `/api/mark`, `/api/finish`.

This Attendly folder is self-contained. The sibling CD-ISD folder contains the original project. Run all commands above from Desktop/Attendly.

## Scope and production roadmap

This is a single-user, local portfolio prototype, not a deployed university service. It intentionally does not pretend that a demo role switch is authentication. Before multi-user use: add authenticated role permissions, a transactional database, course roster management, consent and descriptor deletion controls, TLS, rate limits, audit history, and recognition/liveness evaluation. JSON persistence is intended for one local process. Existing Create React App tooling is retained for compatibility; migration to a maintained build system is a separate improvement.

## CV wording

**Attendly | React, Node.js, face-api.js**

- Rebuilt a facial recognition attendance prototype with a responsive administration dashboard, student management, course sessions, and CSV reporting.
- Integrated browser-based face enrollment and webcam matching, with a clearly separated simulation mode for reproducible demonstrations.
- Implemented validated attendance state transitions, persistent local records, and automated tests covering duplicate marks, completed-session locking, and input validation.

Only describe recognition accuracy, scale, production deployment, or user adoption if you have measured those yourself. See `DEMO.md` for a presentation script.


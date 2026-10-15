# Presenting Attendly

## 30-second introduction

“Attendly is a university attendance workspace. I rebuilt an unfinished project into a coherent React application with a Node.js API, persistent session records, CSV exports, and face-api.js integration. It includes a simulation mode so the core workflow can be demonstrated without camera setup.”

## Demo sequence

- Overview: explain that the chart and cards are calculated from stored attendance.
- Students: search for Emma; show the face enrollment control.
- New session: choose Artificial Intelligence and Interactive demo.
- Simulate matches, then make a manual attendance correction.
- Finish session: explain that pending students become absent and the record is locked.
- Reports: export CSV and show the resulting attendance data.
- Refresh: show that the records remain available.

## Explain the engineering

The server owns validation and session state transitions; the UI cannot edit completed records through the API. A session stores its roster at creation. Browser inference produces face descriptors, and recognized IDs are sent to the attendance API. Demo matching is deliberately labeled as simulation.

## Discuss limitations honestly

This version is a local single-user demo. Authentication, transactional database storage, roster editing, biometric lifecycle controls, and liveness detection are future work. Do not present the demo administrator identity as a real sign-in, or seeded attendance as real university data.

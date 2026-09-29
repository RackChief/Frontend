# RackChief Frontend V1 Goals — Nuxt Edition

This document defines the remaining frontend work required to reach a practical RackChief V1 after pivoting the frontend from React/Vite to Nuxt.

RackChief Frontend V1 should let a user manage the V1 backend without needing Swagger, curl, SQL, or direct Supabase access.

The frontend should make it easy to answer:

- What assets do I own?
- What hardware is installed in each asset?
- What spare hardware do I have?
- Where is each asset located?
- What rack is an asset installed in, and at what U position?
- What network interfaces and physical ports does an asset have?
- How are network ports connected?
- What IP addresses are assigned?
- What relationships exist between assets?
- What projects are planned or in progress?
- What purchases and work items belong to those projects?
- Is MCP enabled, and what MCP tokens exist?

The frontend should remain a focused admin UI.

Do not turn V1 into a monitoring dashboard, topology engine, discovery system, ITSM platform, or full NetBox clone.

---

# New Frontend Stack

RackChief Frontend V1 should use:

```text
Nuxt
Vue 3
TypeScript

@nuxt/ui
@nuxt/icon
@nuxt/image

@supabase/supabase-js
```

Use Nuxt as the application framework and routing layer.

Use Nuxt UI for application UI primitives and layout.

Use Nuxt Icon for icons.

Use Nuxt Image for RackChief branding, rack elevation images, thumbnails, and other device imagery where image optimization is useful.

Continue using Supabase for authentication only.

RackChief application data must continue to come from the RackChief backend.

Do not query RackChief application tables directly from Supabase.

---

# Rendering Strategy

RackChief is an authenticated admin application, not a public content website.

For V1, prefer a client-focused application architecture.

The Nuxt application should not depend on SSR for protected RackChief data.

Acceptable approaches:

- Nuxt SPA mode
- Nuxt with SSR enabled globally but authenticated application pages rendered client-side

Prefer the simpler option unless SSR provides a concrete benefit.

Do not introduce a backend-for-frontend layer unless it solves an actual problem.

The existing RackChief backend remains authoritative.

---

# Current Functionality To Preserve During Migration

The current React frontend already includes:

- Supabase login
- Session handling
- Assets list
- Asset create
- Asset detail
- Asset edit
- Asset archive
- Asset restore
- Asset permanent delete
- Projects list
- Project create
- Project detail
- Project edit
- Project archive
- Project restore
- Project permanent delete
- Project asset association
- Project items
- Project updates/history

These capabilities must be restored in Nuxt before the React implementation is considered replaceable.

The Nuxt migration should preserve behavior, API semantics, and validation rather than attempting to redesign the backend contract.

---

# General Frontend Implementation Rules

For every frontend domain:

1. Inspect the matching backend Zod schema.
2. Inspect the matching backend OpenAPI module.
3. Inspect the actual REST routes.
4. Add or update TypeScript types.
5. Add API client functions.
6. Add Nuxt page/component UI.
7. Add loading state.
8. Add empty state.
9. Add API error handling.
10. Add create/edit/delete flows where supported.
11. Verify against the real development backend.
12. Run the production build/type checks.

The backend V1 contract is authoritative.

Do not invent frontend-only fields or fake backend behavior.

If backend functionality is missing, report the backend gap rather than creating a hidden workaround.

Use Nuxt UI components where they simplify the implementation.

Do not add another component framework on top of Nuxt UI.

Do not add a large state-management framework unless a concrete need appears.

---

# Step 0 — Replace React/Vite With a Clean Nuxt Application

Do not convert every React file line-by-line in place.

Create a clean Nuxt application and port existing functionality deliberately.

Recommended initial setup:

```text
Nuxt
TypeScript
@nuxt/ui
@nuxt/icon
@nuxt/image
@supabase/supabase-js
```

Remove React-specific dependencies once feature parity is reached:

```text
react
react-dom
react-router-dom
@vitejs/plugin-react
```

Do not delete the old working implementation until the Nuxt application has restored:

- login
- assets
- projects
- session handling
- API error handling

## Acceptance criteria

- Nuxt dev server starts successfully.
- Production Nuxt build succeeds.
- Nuxt UI is installed and rendering.
- Nuxt Icon is installed and rendering.
- Nuxt Image is installed and rendering local images.
- Supabase JS is configured.
- No RackChief backend changes are required solely for the framework migration.

---

# Step 1 — Establish Nuxt Application Structure

Use Nuxt file-based routing instead of React Router.

Suggested structure:

```text
app.vue

assets/
└── css/
    └── main.css

components/
├── layout/
├── forms/
├── inventory/
├── racks/
├── network/
└── shared/

composables/
├── useAuth.ts
├── useApi.ts
└── ...

layouts/
└── default.vue

middleware/
└── auth.ts

pages/
├── login.vue
│
├── assets/
│   ├── index.vue
│   └── [id].vue
│
├── components/
│   └── index.vue
│
├── locations/
│   └── index.vue
│
├── racks/
│   ├── index.vue
│   └── [id].vue
│
├── network/
│   └── index.vue
│
├── projects/
│   ├── index.vue
│   └── [id].vue
│
└── settings/
    └── mcp.vue

services/
└── api/
    ├── client.ts
    ├── assets.ts
    ├── components.ts
    ├── locations.ts
    ├── racks.ts
    ├── networking.ts
    ├── projects.ts
    └── settings.ts

types/
├── assets.ts
├── components.ts
├── locations.ts
├── racks.ts
├── networking.ts
├── projects.ts
└── settings.ts
```

This exact layout is not mandatory.

Prefer clear domain organization over unnecessary abstraction.

## Acceptance criteria

- File-based routing replaces manual React Router setup.
- Shared layout is implemented with a Nuxt layout.
- Auth protection is handled through Nuxt middleware/composables.
- API access remains centralized.
- Shared UI components stay reusable.

---

# Step 2 — Supabase Authentication in Nuxt

Continue using:

```text
@supabase/supabase-js
```

Do not add another Supabase abstraction unless there is a concrete benefit.

Create a small Nuxt-side auth layer responsible for:

- Supabase client initialization
- login
- logout
- current session
- session refresh
- auth state changes
- providing the bearer token to the RackChief API

Use Nuxt route middleware for protected pages.

Conceptually:

```text
No valid session
    ↓
navigateTo("/login")
```

Do not put the Supabase secret key in the frontend.

Only the publishable client configuration belongs in Nuxt runtime config.

## Acceptance criteria

- Existing users can log in.
- Session persists across navigation/reload.
- Expired sessions are handled cleanly.
- Logout returns to login.
- Protected routes redirect unauthenticated users.
- RackChief backend receives the Supabase bearer token.

---

# Step 3 — RackChief API Client for Nuxt

Replace the React/Vite API service with a Nuxt-compatible API client.

Prefer Nuxt `$fetch` or `ofetch`.

The client should:

- use `/api/v1` as the application API base path
- attach the current Supabase access token
- normalize RackChief API errors
- support JSON request/response bodies
- support `204 No Content`
- handle `401`, `404`, `409`, and validation responses consistently

Suggested structure:

```text
services/api/client.ts
services/api/assets.ts
services/api/projects.ts
...
```

Do not scatter `$fetch` calls through page components.

## Acceptance criteria

- All API requests go through a shared client.
- Authorization is attached centrally.
- API errors produce user-friendly UI messages.
- Pages do not duplicate request boilerplate.

---

# Step 4 — Nuxt Dev Proxy and Docker Compatibility

The browser should use relative paths:

```text
/api/v1/...
/mcp
```

The Nuxt dev server should proxy those paths to the backend over the Compose network.

Typical topology:

```text
Browser
   ↓
Nuxt frontend
   ├── /api/v1/* → backend
   └── /mcp      → backend
```

The browser must not call Docker-only hostnames directly.

Do not require backend CORS configuration for the normal Compose development workflow.

Verify `/mcp` proxying does not break Streamable HTTP behavior.

## Acceptance criteria

- `/api/v1/*` reaches the RackChief backend.
- `/mcp` reaches the RackChief backend.
- Normal browser traffic is same-origin.
- Backend can remain private to the Compose network if desired.
- Direct API base override remains possible for non-Compose development if useful.

---

# Step 5 — Nuxt UI Foundation and RackChief Theme

Use `@nuxt/ui` as the primary UI component system.

Create a consistent RackChief theme using the existing brand direction:

```text
dark navy
cyan
blue
neutral grays
```

Use Nuxt UI for:

- forms
- inputs
- select menus
- tables
- badges
- buttons
- cards
- modals
- drawers
- tabs
- dropdowns
- alerts
- toasts
- navigation
- command/search UI where appropriate

Avoid duplicating primitives that Nuxt UI already provides.

Do not accept default styling blindly; keep RackChief's established identity.

## Acceptance criteria

- Assets and Projects pages use the shared Nuxt UI design system.
- Forms are visually consistent.
- Status badges are consistent.
- Dialogs and destructive confirmations are consistent.
- RackChief branding remains recognizable.

---

# Step 6 — Nuxt Icon Integration

Use `@nuxt/icon` for application icons.

Prefer a consistent icon family, such as Lucide via Iconify.

Examples of likely application icons:

```text
server
hard-drive
memory-stick
network
ethernet-port
warehouse/rack
folder-kanban
settings
key
map-pin
package
```

Prefer bundled/local icons used by the application rather than requiring a runtime external icon dependency.

Use icons to support labels, not replace understandable labels everywhere.

## Acceptance criteria

- Main navigation uses consistent icons.
- Action icons are understandable.
- No unnecessary custom SVG duplication exists for common UI icons.

---

# Step 7 — Branding Integration With Nuxt Image

Integrate RackChief branding.

Runtime assets should include:

```text
favicon.ico
favicon-16x16.png
favicon-32x32.png
apple-touch-icon.png
android-chrome-192x192.png
android-chrome-512x512.png
rackchief-icon.png
rackchief-horizontal.png
```

Use Nuxt Image where image processing or responsive delivery is useful.

Update:

- favicon
- login page
- sidebar/header
- page title/meta
- optional social metadata

Do not use oversized source artwork directly when optimized runtime assets exist.

## Acceptance criteria

- Browser favicon uses RackChief branding.
- Login screen uses real RackChief logo.
- Sidebar/header uses real RackChief branding.
- No temporary text-only `RC` placeholder remains where a logo should be used.

---

# Step 8 — Restore Existing Assets Functionality in Nuxt

Port the existing Assets flow before adding new inventory domains.

Required:

- `/assets`
- `/assets/[id]`
- create
- edit
- archive
- restore
- permanent delete
- asset type selection
- existing validation and error semantics

Use Nuxt UI tables/forms.

Do not redesign the backend contract.

## Acceptance criteria

- Asset functionality reaches parity with the existing React implementation.
- Asset links use Nuxt navigation.
- Existing archived-resource behavior is preserved.

---

# Step 9 — Restore Existing Projects Functionality in Nuxt

Port:

```text
/projects
/projects/[id]
```

Required:

- list
- create
- edit
- archive
- restore
- permanent delete
- associated assets
- project work/purchase items
- updates/history
- costs
- dates
- links/vendor data

Use Nuxt UI forms/tables/cards as appropriate.

## Acceptance criteria

- Project functionality reaches parity with the existing React implementation.
- Existing backend behavior remains unchanged.
- The React frontend can now be retired once Steps 8 and 9 are verified.

---

# Step 10 — Expand Navigation and App Shell

After parity, expand navigation for V1 domains.

Suggested organization:

```text
Inventory
  Assets
  Components

Infrastructure
  Locations
  Racks
  Network

Planning
  Projects

Settings
  MCP
```

Use the Nuxt layout as the common shell.

Use Nuxt UI navigation components where appropriate.

Do not create links to unimplemented pages.

## Acceptance criteria

- All implemented V1 areas are discoverable.
- Active state is clear.
- Account/logout controls are easy to find.
- Narrow screens remain usable.

---

# Step 11 — Asset Detail Becomes the Main Inventory Hub

Asset detail should become the primary page for understanding a piece of infrastructure.

Recommended sections/tabs:

```text
Overview
Hardware
Rack / Location
Network
Relationships
Projects
```

Use Nuxt UI Tabs if tabs improve readability.

## Overview

Show:

- name
- type
- status
- hostname
- legacy/convenience IP if present
- manufacturer
- model
- serial number
- location
- rack placement summary
- notes
- timestamps

## Hardware

Show installed components and support:

- add
- edit
- delete/remove
- move to spare inventory

## Rack / Location

Show:

- location
- rack
- rack U
- height
- orientation

## Network

Show:

- interfaces
- MAC
- type
- speed
- IPs
- physical ports
- connected peer

## Relationships

Show inbound/outbound relationships.

## Projects

Show projects associated with the asset.

## Acceptance criteria

One asset page should provide most important inventory context without forcing the user to visit many unrelated pages.

---

# Step 12 — Component and Spare Hardware Inventory

Add:

```text
/components
```

Support:

```text
All
Installed
Spare
Planned
Retired
Failed
```

Useful filters:

- component type
- asset
- location

Use a Nuxt UI table.

Suggested columns:

```text
Name
Type
Asset
Manufacturer / Model
Quantity
Status
Location
```

Support:

- create
- edit
- assign to asset
- unassign to spare inventory
- delete
- display/edit useful component attributes

Avoid exposing raw JSON as the only UI for common attributes.

V1 does not need a full dynamic component-schema editor.

---

# Step 13 — Locations UI

Add:

```text
/locations
```

Support a simple parent/child hierarchy.

Example:

```text
Home
└── Basement
    ├── Server Rack Area
    └── Storage Shelf
```

Support:

- create root
- create child
- edit
- delete when allowed
- show associated assets/racks/components

Do not build an elaborate drag-and-drop tree editor.

---

# Step 14 — Racks and Visual Rack Layout

Add:

```text
/racks
/racks/[id]
```

## Rack list

Show:

```text
Name
Location
Size
Used U
Available U
```

## Rack detail

Render a visual rack elevation.

Support:

- front view
- rear view if relevant
- multi-U assets
- empty U
- clickable devices
- create/edit/remove placement

Do not require drag-and-drop for V1.

Forms for rack U and height are acceptable.

---

# Step 15 — Default Device Image Repository Integration

RackChief should support rack faceplate/elevation images.

Use the NetBox Community Device Type Library elevation-image repository as RackChief's default image source.

Do not make the NetBox device schema a dependency.

The image system should be independent of RackChief's core asset model.

Resolution order:

```text
1. User custom override
2. Locally cached default device image
3. Fetch matching NetBox elevation image and cache it
4. Generic RackChief faceplate fallback
```

Recommended persistent cache:

```text
/data/device-images/
├── custom/
└── netbox/
```

Do not require the full image repository to be downloaded for every installation.

Default behavior should be cache-on-first-use.

Optionally support a full preseed operation later:

```text
images:preseed
```

The cached image store should survive application upgrades through persistent Docker storage.

Use manufacturer + model for lookup, with an optional explicit image lookup override where names do not match cleanly.

## Nuxt Image usage

Use `@nuxt/image` to render and optimize cached elevation images.

Use it for:

- rack faceplates
- asset image previews
- thumbnails
- responsive image sizing

Do not rely on remote GitHub images for every page render.

The backend/image service should fetch/cache upstream assets; the frontend should normally render RackChief-served/cached paths.

## Fallback behavior

If no matching image exists, render a branded generic faceplate containing useful asset information.

Example:

```text
┌───────────────────────────────┐
│ Artemis             Dell R730 │
└───────────────────────────────┘
```

## Attribution

Add a third-party attribution entry for the NetBox Community Device Type Library.

Its image repository is used as a default image source and should be acknowledged in the application About/Attributions UI or RackChief website.

## Acceptance criteria

- Rack renderer uses actual elevation images when available.
- Used images are cached locally.
- Cache persists across restarts/upgrades.
- Missing images fall back cleanly.
- Custom images can override defaults.
- Nuxt Image is used for frontend rendering/optimization.
- RackChief does not require NetBox itself.

---

# Step 16 — Network Interfaces UI

Manage interfaces primarily from asset detail.

Show:

```text
Name
Type
MAC
Speed
Enabled
IP addresses
```

Support:

- create
- edit
- delete
- add/remove IP addresses

Format speeds human-readably.

Do not invent live link status.

RackChief V1 stores inventory, not monitoring.

---

# Step 17 — Physical Network Ports UI

Manage physical ports from asset detail and optionally `/network`.

Use compact tables/grids suitable for switches with many ports.

Show:

```text
Port
Type
Speed
PoE
Enabled
Connected To
```

Do not build a photorealistic interactive switch-face editor for V1.

---

# Step 18 — Network Connections UI

Preferred workflow:

1. Select port.
2. Connect.
3. Select target asset.
4. Select target port.
5. Choose optional connection type/label.
6. Save.

Display connections without exposing meaningless A/B direction.

Allow disconnect/delete.

A topology graph is explicitly optional and should not delay V1.

---

# Step 19 — IP Address UI

Manage IPs through interfaces.

Show:

```text
Address
Primary
Description
```

Support:

- IPv4
- IPv6
- edit
- mark primary
- delete

Do not implement full IPAM, subnet allocation, DHCP, DNS, or VLAN management in V1.

---

# Step 20 — Asset Relationships UI

Show inbound and outbound relationships on asset detail.

Support:

- create
- edit
- delete

Use readable labels:

```text
backs_up_to -> Backs up to
managed_by  -> Managed by
```

Related assets should link to their asset pages.

---

# Step 21 — Project Integration With Inventory Domains

Keep existing project behavior.

Improve links between projects and infrastructure.

Project detail should continue to show:

- assets
- work/purchase items
- costs
- updates

Add links from associated assets to relevant asset/rack/network/hardware pages where useful.

Do not attach every component or port directly to projects unless backend support is intentionally added.

---

# Step 22 — MCP Settings UI

Add:

```text
/settings/mcp
```

Show:

```text
MCP enabled
Endpoint
Tokens
```

Support:

- enable/disable MCP
- create token
- rename token
- enable/disable token
- set/clear expiration
- delete token

When a token is created:

- display raw token exactly once
- provide a copy button
- clearly warn that it cannot be shown again
- never persist the raw token in localStorage

Use Nuxt UI modal/alert components for the one-time token flow.

---

# Step 23 — Search and Filtering

Add useful client-side search/filtering where list sizes remain modest.

## Assets

Search:

```text
name
hostname
manufacturer
model
serial number
```

Filters:

```text
type
status
location
```

## Components

Search:

```text
name
manufacturer
model
part number
serial number
```

Filters:

```text
type
status
asset
location
```

## Projects

Search:

```text
name
description
```

Filters:

```text
status
priority
```

Nuxt UI table/filter primitives should be preferred over custom replacements where practical.

---

# Step 24 — Empty, Loading, Error, Toast, and Confirmation States

Every V1 page should handle:

- loading
- empty results
- API unavailable
- unauthorized
- validation errors
- not found
- conflict
- unexpected server error

Use consistent Nuxt UI components.

Use toasts for transient operation feedback where appropriate.

Destructive actions should clearly identify the affected object.

Do not show raw stack traces or unprocessed JSON errors.

---

# Step 25 — Responsive and Accessibility Pass

Desktop is the primary use case.

Still ensure:

- tables scroll appropriately
- sidebar remains usable
- forms do not overflow
- rack layout remains readable
- long technical identifiers are handled sensibly
- focus states are visible
- every input has a label
- tables have headers
- color is not the only status indicator
- modals/drawers are keyboard usable
- contrast remains acceptable

Use Nuxt UI accessibility primitives rather than defeating them with custom behavior.

---

# Step 26 — API Type Strategy

During active backend V1 development, manually maintained TypeScript types are acceptable.

Once the backend V1 contract stabilizes, strongly consider generating frontend types from:

```text
/openapi.json
```

Recommended timing:

```text
finish backend V1 model
→ freeze V1 API contract
→ generate frontend types/client definitions
→ final frontend verification
```

Do not hand-edit generated files.

Do not delay the Nuxt migration solely to implement code generation immediately.

---

# Step 27 — Testing and Verification

Use the real development RackChief backend and Supabase environment.

Do not create a fake API unless explicitly requested.

Minimum automated checks should include the project's actual Nuxt commands, such as:

```text
npm run build
```

and type/lint checks when configured.

Manual V1 verification should cover:

- login/logout
- assets
- projects
- components
- spare inventory
- locations
- racks
- rack image rendering
- rack placements
- interfaces
- ports
- connections
- IPs
- relationships
- MCP settings
- MCP tokens

Verify:

- create/edit/delete flows
- archive/restore flows
- error states
- expired sessions
- NetBox image fallback/cache behavior
- custom image override behavior

---

# Step 28 — V1 Demo Dataset Verification

Use the backend V1 verification dataset.

Suggested example:

```text
Location:
Home
└── Server Room

Rack:
Primary Rack
37U

Assets:
- Artemis / Server
- NAS / Storage
- USW Aggregation / Switch
- UPS / UPS

Hardware:
Artemis:
- CPU
- Memory
- GPU
- HBA
- SSDs

Spare:
- HBA
- SSD

Rack placements:
- Artemis
- NAS
- USW Aggregation
- UPS

Network:
- Artemis 10Gb interface
- Artemis SFP+ port
- USW Aggregation SFP+ port
- connection between them
- primary IP

Relationships:
- UPS powers Artemis
- Artemis hosts a logical asset if desired

Project:
- infrastructure upgrade
- purchase item
- associated assets
```

Where possible, verify rack elevation images for at least one known model from the default device image repository.

The frontend should make this environment understandable without Swagger or database inspection.

---

# Step 29 — About / Powered By / Attribution UI

Add an About or Attributions section.

Suggested location:

```text
Settings
└── About
```

Include:

- RackChief version
- source repository link
- project website
- RackChief license
- frontend framework
- major third-party acknowledgements

Suggested acknowledgements may include:

```text
Nuxt
Vue
Nuxt UI
Nuxt Image
Nuxt Icon / Iconify
Supabase
NetBox Community Device Type Library
```

Use accurate wording.

For the NetBox image source, prefer:

```text
Device elevation images sourced from the NetBox Community Device Type Library.
```

Do not imply RackChief is powered by or dependent on NetBox itself.

A more complete third-party page may also live on the RackChief GitHub Pages website.

---

# Step 30 — Frontend Documentation

Update the Frontend README to document:

- Nuxt
- Vue 3
- TypeScript
- Nuxt UI
- Nuxt Image
- Nuxt Icon
- Supabase Auth
- required runtime config
- backend/API expectations
- development proxy behavior
- Docker/Compose development
- build commands
- major routes
- image cache behavior
- branding asset location
- application-data access rules

Explicitly document:

```text
Supabase is used for authentication.
RackChief application data is accessed through the RackChief backend.
```

Do not instruct users to query RackChief application tables directly from Supabase.

---

# Step 31 — Frontend V1 Release Checklist

Do not tag frontend V1 until Nuxt functionality is complete and tested against the V1 backend.

## Existing functionality that must be restored after migration

- [ ] Supabase login
- [ ] Session handling
- [ ] Assets list
- [ ] Asset create
- [ ] Asset detail
- [ ] Asset edit
- [ ] Asset archive/restore/delete
- [ ] Projects list
- [ ] Project create
- [ ] Project detail
- [ ] Project edit
- [ ] Project archive/restore/delete
- [ ] Project asset associations
- [ ] Project items
- [ ] Project updates/history

## Nuxt platform goals

- [ ] Nuxt application established
- [ ] React/Vite implementation retired after parity
- [ ] Nuxt UI integrated
- [ ] Nuxt Icon integrated
- [ ] Nuxt Image integrated
- [ ] Supabase JS auth integrated
- [ ] Nuxt route middleware protects authenticated routes
- [ ] Central API client works
- [ ] `/api` proxy works
- [ ] `/mcp` proxy works
- [ ] RackChief branding integrated

## Remaining V1 functionality

- [ ] Expanded navigation
- [ ] Component inventory
- [ ] Spare component inventory
- [ ] Locations UI
- [ ] Rack list
- [ ] Visual rack layout
- [ ] Rack placement management
- [ ] Default device image repository support
- [ ] Lazy image cache
- [ ] Generic rack faceplate fallback
- [ ] Custom image override support
- [ ] Network interface management
- [ ] Network port management
- [ ] Network connection management
- [ ] IP address management
- [ ] Asset relationship management
- [ ] Asset detail inventory hub
- [ ] MCP settings UI
- [ ] MCP token lifecycle UI
- [ ] Search/filtering
- [ ] Responsive/usability pass
- [ ] Accessibility pass
- [ ] API type strategy finalized
- [ ] About/Attributions UI
- [ ] README/documentation update

## Required technical checks

- [ ] production Nuxt build passes
- [ ] frontend works against Backend V1
- [ ] login/session refresh works
- [ ] expired session is handled cleanly
- [ ] API validation errors display usefully
- [ ] 404 errors display usefully
- [ ] 409 conflicts display usefully
- [ ] no Supabase secret key exists in frontend configuration
- [ ] no raw MCP token persists after create flow
- [ ] no direct browser access to RackChief database tables
- [ ] same-origin API proxy works in Compose
- [ ] MCP proxy works in Compose
- [ ] favicon and branding assets are integrated
- [ ] default rack/device images render correctly
- [ ] image cache persists
- [ ] missing device images fall back cleanly
- [ ] no temporary fake API behavior remains

---

# Explicit Frontend V1 Non-Goals

Do not implement these before frontend V1 unless explicitly requested:

- monitoring dashboards
- live CPU/RAM graphs
- uptime monitoring
- SNMP views
- automatic discovery
- drag-and-drop rack designer
- photorealistic custom rack modeling
- interactive topology graph
- VLAN editor
- subnet/IPAM planner
- DHCP editor
- DNS editor
- firewall/routing editor
- configuration management
- terminal/SSH console
- remote power control
- virtualization console
- ticketing
- notifications
- native mobile app
- offline mode
- plugin marketplace
- custom dashboard builder
- complex role/permission UI
- theme builder
- arbitrary custom-fields designer
- full NetBox Device Type Library metadata import
- NetBox synchronization
- NetBox dependency at runtime

These may be considered after V1.

---

# Definition of Frontend V1

RackChief Frontend V1 is complete when a user can:

1. Sign in securely through Supabase Auth.
2. Use RackChief through a Nuxt/Vue application.
3. Browse and manage assets.
4. See a useful detailed inventory view for each asset.
5. Add and manage installed hardware components.
6. Track spare hardware.
7. Create and browse locations.
8. Create racks and visually inspect rack placement.
9. See device/rack elevation images where available.
10. Use automatically cached default device images without configuring NetBox.
11. Place and remove assets from racks.
12. Manage network interfaces.
13. Manage physical network ports.
14. Record and remove port-to-port connections.
15. Manage IPv4 and IPv6 addresses on interfaces.
16. Manage useful asset relationships.
17. Create and manage infrastructure projects.
18. Track work items, purchases, cost, ordering, and project updates.
19. Enable or disable MCP.
20. Create, inspect, disable, and revoke MCP tokens.
21. Use all major V1 functionality without Swagger, curl, or direct database access.
22. Run cleanly in the RackChief Compose environment.
23. Present a consistent RackChief-branded UI using Nuxt UI.
24. Provide appropriate attribution for bundled/default third-party assets and dependencies.

The guiding V1 principle is:

> RackChief should give the user one clean place to understand what their homelab contains, where it is, how it is connected, and what they plan to change — with a polished Nuxt-based interface and useful rack/device imagery by default.

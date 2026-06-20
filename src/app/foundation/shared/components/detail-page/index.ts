/**
 * index.ts — Public API for the detail-page shared component library.
 *
 * Import from this barrel in every feature detail page:
 *
 *   import {
 *     DpShellComponent,
 *     DpPageHeaderComponent,
 *     DpDetailCardComponent,
 *     DpDetailFieldComponent,
 *     DpPartyCardComponent,
 *     DpPayloadViewerComponent,
 *     DpProcessTimelineComponent,
 *     DpAttachmentListComponent,
 *     DpTimestampSidebarComponent,
 *     DpMetadataSidebarComponent,
 *     DpQuickActionsSidebarComponent,
 *   } from '@/app/foundation/shared/components/detail-page';
 */

// Shell / layout
export { DpShellComponent } from './detail-page-shell/detail-page-shell.component';

// Header
export { DpPageHeaderComponent } from './page-header/page-header.component';

// Card + Field
export { DpDetailCardComponent } from './detail-card/detail-card.component';
export { DpDetailFieldComponent } from './detail-field/detail-field.component';

// Party (Sender / Receiver)
export { DpPartyCardComponent } from './party-card/party-card.component';

// Payload
export { DpPayloadViewerComponent } from './payload-viewer/payload-viewer.component';

// Timeline + attachments
export { DpProcessTimelineComponent } from './process-timeline/process-timeline.component';
export { DpAttachmentListComponent } from './attachment-list/attachment-list.component';

// Sidebar cards
export { DpTimestampSidebarComponent } from './timestamp-sidebar/timestamp-sidebar.component';
export { DpMetadataSidebarComponent } from './metadata-sidebar/metadata-sidebar.component';

// Models
export * from './models/detail-page.models';

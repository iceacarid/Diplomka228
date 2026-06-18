/* eslint-disable react-refresh/only-export-components */
const I = (props, children) => (
  <svg
    width={props.size || 18}
    height={props.size || 18}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={props.sw || 1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={props.style}
  >
    {children}
  </svg>
)

export const Icons = {
  Truck:        (p) => I(p, <><path d="M14 18V6H1v12h2"/><path d="M14 9h4l3 3v6h-2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>),
  Package:      (p) => I(p, <><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></>),
  User:         (p) => I(p, <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.42 3.58-8 8-8s8 3.58 8 8"/></>),
  Users:        (p) => I(p, <><circle cx="9" cy="8" r="4"/><path d="M3 21c0-3.31 2.69-6 6-6s6 2.69 6 6"/><circle cx="17" cy="9" r="3"/><path d="M21 21c0-2.21-1.79-4-4-4"/></>),
  Wallet:       (p) => I(p, <><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18"/><circle cx="16" cy="15" r="1.2" fill="currentColor"/></>),
  Cpu:          (p) => I(p, <><rect x="6" y="6" width="12" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/></>),
  Logout:       (p) => I(p, <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></>),
  Search:       (p) => I(p, <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>),
  Bell:         (p) => I(p, <><path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2h16l-2-2z"/><path d="M10 21a2 2 0 0 0 4 0"/></>),
  Plus:         (p) => I(p, <><path d="M12 5v14M5 12h14"/></>),
  Filter:       (p) => I(p, <><path d="M3 4h18l-7 9v6l-4 2v-8L3 4z"/></>),
  ChevronRight: (p) => I(p, <><path d="m9 6 6 6-6 6"/></>),
  ChevronLeft:  (p) => I(p, <><path d="m15 6-6 6 6 6"/></>),
  ChevronDown:  (p) => I(p, <><path d="m6 9 6 6 6-6"/></>),
  Pin:          (p) => I(p, <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></>),
  Calendar:     (p) => I(p, <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>),
  Clock:        (p) => I(p, <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>),
  Phone:        (p) => I(p, <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"/></>),
  Mail:         (p) => I(p, <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 8 10 6 10-6"/></>),
  Settings:     (p) => I(p, <><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>),
  Lock:         (p) => I(p, <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>),
  Eye:          (p) => I(p, <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>),
  EyeOff:       (p) => I(p, <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M1 1l22 22"/></>),
  Shield:       (p) => I(p, <><path d="M12 3 4 6v6c0 4.5 3.5 8.5 8 9 4.5-.5 8-4.5 8-9V6l-8-3z"/></>),
  Bolt:         (p) => I(p, <><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></>),
  Map:          (p) => I(p, <><path d="m9 4-6 2v15l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v15M15 6v15"/></>),
  TrendingUp:   (p) => I(p, <><path d="m22 7-9 9-4-4-7 7"/><path d="M16 7h6v6"/></>),
  Sparkles:     (p) => I(p, <><path d="m12 3-2 5-5 2 5 2 2 5 2-5 5-2-5-2-2-5z"/><path d="M19 14.5 18 17l-2.5 1L18 19l1 2.5L20 19l2.5-1L20 17l-1-2.5z"/></>),
  Edit:         (p) => I(p, <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>),
  Trash:        (p) => I(p, <><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></>),
  Check:        (p) => I(p, <><path d="m5 12 5 5L20 7"/></>),
  X:            (p) => I(p, <><path d="M18 6 6 18M6 6l12 12"/></>),
  Arrow:        (p) => I(p, <><path d="M5 12h14M13 5l7 7-7 7"/></>),
  Boxes:        (p) => I(p, <><path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 1.03 1.71l3 1.71a2 2 0 0 0 1.94 0l3-1.71"/><path d="M2.32 13.43 8 16.5l5.68-3.07"/><path d="M8 16.5V21"/><path d="M14 13.5 19 16l5-2.5"/><path d="m20 16.5-3 1.5v3l3 1.5 3-1.5v-3z"/><path d="m9 7 5 2.5L19 7l-5-2.5z"/><path d="M14 4.5V9.5"/></>),
  Refrigerator: (p) => I(p, <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M5 11h14M9 7v1M9 14v3"/></>),
  Logo:         (p) => I({ ...p, sw: 0 }, <><path d="M3 16V8h12l4 4v4M3 16h2M5 16a2 2 0 1 0 4 0M9 16h7M16 16a2 2 0 1 0 4 0M11 8v4h6" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>),
  Dot:          (p) => I(p, <circle cx="12" cy="12" r="5" fill="currentColor" stroke="none"/>),
  Home:         (p) => I(p, <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></>),
  Chat:         (p) => I(p, <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>),
  LifeBuoy:     (p) => I(p, <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="m9.5 9.5-4-4M14.5 9.5l4-4M14.5 14.5l4 4M9.5 14.5l-4 4"/></>),
  Maximize:     (p) => I(p, <><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/></>),
  Minimize:     (p) => I(p, <><path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3"/></>),
  Warehouse:      (p) => I(p, <><path d="M22 9V7l-10-5L2 7v2"/><path d="M1 22h22"/><rect x="2" y="9" width="20" height="13"/><path d="M9 22V14h6v8"/></>),
  AlertTriangle:  (p) => I(p, <><path d="m10.29 3.86-8.49 14.7A1 1 0 0 0 2.69 20H21.31a1 1 0 0 0 .89-1.44L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></>),
  RefreshCw:      (p) => I(p, <><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></>),
}

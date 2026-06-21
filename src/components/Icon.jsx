const PATHS = {
  overview: <><path d="M4 4h6v6H4zM14 4h6v10h-6zM4 14h6v6H4zM14 18h6v2h-6z" /></>,
  system: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m7 9 3 3-3 3M13 15h4" /></>,
  network: <><circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 0 1 0 8.48M7.76 16.24a6 6 0 0 1 0-8.48M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14" /></>,
  processes: <><path d="M4 18V6M8 18v-5M12 18V9M16 18v-3M20 18V4" /></>,
  storage: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v7c0 1.66 3.58 3 8 3s8-1.34 8-3V5M4 12v7c0 1.66 3.58 3 8 3s8-1.34 8-3v-7" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-2.12 2.12-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V20h-3v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06-2.12-2.12.06-.06A1.65 1.65 0 0 0 7.2 15a1.65 1.65 0 0 0-1.51-1H5.6v-3h.09A1.65 1.65 0 0 0 7.2 10a1.65 1.65 0 0 0-.33-1.82l-.06-.06L8.93 6l.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1-1.51V4.8h3v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06 2.12 2.12-.06.06A1.65 1.65 0 0 0 19.4 10a1.65 1.65 0 0 0 1.51 1H21v3h-.09a1.65 1.65 0 0 0-1.51 1Z" /></>,
  accounts: <><circle cx="9" cy="8" r="4" /><path d="M3 21v-2a6 6 0 0 1 6-6h2M16 11h6M19 8v6" /></>,
  apps: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  collapse: <><path d="m15 18-6-6 6-6" /></>,
  refresh: <><path d="M20 11a8.1 8.1 0 1 0 1 5M20 4v7h-7" /></>,
  pause: <><path d="M9 5v14M15 5v14" /></>,
  play: <><path d="m8 5 11 7-11 7Z" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  download: <><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></>,
  expand: <><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" /></>,
  minimize: <><path d="M5 12h14" /></>,
  activity: <><path d="M3 12h4l2-7 4 14 2-7h6" /></>,
  filter: <><path d="M4 5h16M7 12h10M10 19h4" /></>,
  chevron: <><path d="m9 18 6-6-6-6" /></>,
}

export default function Icon({ name, size = 18, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name] || PATHS.activity}
    </svg>
  )
}

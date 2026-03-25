export const clientHeaderConfig = {
  '/client/home': {
    title: 'Home',
    subtitle: 'Find and explore top caterers'
  },
  '/client/requests': {
    title: 'Requests',
    subtitle: 'Manage your catering requests'
  },
  '/client/messages': {
    title: 'Messages',
    subtitle: 'Chat with caterers'
  },
  '/client/profile': {
    title: 'Profile',
    subtitle: 'Manage your personal information'
  }
};

export const adminHeaderConfig = {
  '/admin/dashboard': {
    title: 'Dashboard',
    subtitle: 'Monitor platform health and activity'
  },
  '/admin/caterers': {
    title: 'Caterers',
    subtitle: 'Manage registered caterers'
  },
  '/admin/clients': {
    title: 'Clients',
    subtitle: 'View and manage clients'
  },
  '/admin/reviews': {
    title: 'Reviews',
    subtitle: 'Monitor user feedback'
  },
  '/admin/moderation': {
    title: 'Moderation',
    subtitle: 'Handle reports and issues'
  },
  '/admin/messages': {
    title: 'Messages',
    subtitle: 'Platform communication'
  },
  '/admin/settings': {
    title: 'Settings',
    subtitle: 'Configure system settings'
  }
};

export function findHeaderForPath(config, pathname) {
  if (!config) return null;

  if (config[pathname]) return config[pathname];

  // Fallback to longest prefix match
  const keys = Object.keys(config).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (pathname.startsWith(k)) return config[k];
  }

  return null;
}

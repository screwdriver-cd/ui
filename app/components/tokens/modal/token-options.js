export const expiresOptions = [
  {
    label: '1 day',
    getExpiresAt() {
      const now = new Date();

      now.setDate(now.getDate() + 1);

      return now.toISOString();
    }
  },
  {
    label: '30 days',
    getExpiresAt() {
      const now = new Date();

      now.setDate(now.getDate() + 30);

      return now.toISOString();
    }
  },
  {
    label: '90 days',
    getExpiresAt() {
      const now = new Date();

      now.setDate(now.getDate() + 90);

      return now.toISOString();
    }
  },
  {
    label: '1 year',
    getExpiresAt() {
      const now = new Date();

      now.setFullYear(now.getFullYear() + 1);

      return now.toISOString();
    }
  },
  {
    label: 'No expiration',
    getExpiresAt() {
      return '';
    }
  }
];

export const tokenPermissionOptions = ['read', 'execute', 'write', 'all'];

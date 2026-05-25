const BACKEND = import.meta.env.VITE_API_URL || '';

export const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith('http')) return avatar;
  return `${BACKEND}${avatar}`;
};

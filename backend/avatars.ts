export interface Avatar {
  name: string;
  initials: string;
}

export function generateAvatar(name: string): Avatar {
  const [first, last] = name.split(' ');
  const initials = `${first[0]}${last ? last[0] : ''}`.toUpperCase();
  return { name, initials };
}
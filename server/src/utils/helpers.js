export const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

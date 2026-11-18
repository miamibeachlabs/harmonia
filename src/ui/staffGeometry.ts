export const grandStaffViewBox = { width: 238, height: 124 } as const;

const middleCY = 54;
const stepHeight = 3;

export const staffYFor = (stepFromMiddleC: number) => middleCY - stepFromMiddleC * stepHeight;

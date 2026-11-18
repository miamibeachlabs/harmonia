export const grandStaffViewBox = { width: 270, height: 270 } as const;

const middleCY = 117;
const stepHeight = 6.5;

export const staffYFor = (stepFromMiddleC: number) => middleCY - stepFromMiddleC * stepHeight;

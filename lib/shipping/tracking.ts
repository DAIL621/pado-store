export const TRACKING_NUMBER_MESSAGE = "송장번호는 영문, 숫자, 하이픈 6~40자로 입력해주세요.";

export function isValidTrackingNumber(value: string) {
  return /^[0-9A-Za-z-]{6,40}$/.test(value.trim());
}

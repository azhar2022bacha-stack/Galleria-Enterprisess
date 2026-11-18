export function maskCustomerEmail(value?: string | null): string {
  const email = String(value || '').trim();
  const atIndex = email.lastIndexOf('@');
  if (!email || atIndex <= 0) return email ? '****' : '—';

  const localPart = email.slice(0, atIndex);
  const hiddenCount = Math.min(3, Math.max(0, localPart.length - 1));
  if (hiddenCount === 0) return email;

  const hiddenStart = Math.min(
    Math.max(1, Math.floor((localPart.length - hiddenCount) / 2)),
    localPart.length - hiddenCount
  );
  return `${localPart.slice(0, hiddenStart)}${'*'.repeat(hiddenCount)}${localPart.slice(hiddenStart + hiddenCount)}${email.slice(atIndex)}`;
}

export function maskCustomerPhone(value?: string | null): string {
  const phone = String(value || '').trim();
  if (!phone) return '—';

  const digitPositions: number[] = [];
  for (let index = 0; index < phone.length; index += 1) {
    if (/\d/.test(phone[index])) digitPositions.push(index);
  }
  const hiddenCount = Math.min(4, digitPositions.length);
  if (hiddenCount === 0) return phone;

  const hiddenStart = Math.floor((digitPositions.length - hiddenCount) / 2);
  const hiddenPositions = new Set(digitPositions.slice(hiddenStart, hiddenStart + hiddenCount));
  return phone
    .split('')
    .map((character, index) => (hiddenPositions.has(index) ? '*' : character))
    .join('');
}

export function maskStreetAddress(value?: string | null): string {
  const address = String(value || '').trim();
  if (!address) return '—';

  const words = Array.from(address.matchAll(/\S+/g));
  const hiddenCount = Math.min(5, words.length);
  const hiddenStart = Math.floor((words.length - hiddenCount) / 2);
  let result = '';
  let lastIndex = 0;

  words.forEach((word, index) => {
    const wordStart = word.index ?? lastIndex;
    result += address.slice(lastIndex, wordStart);
    result += index >= hiddenStart && index < hiddenStart + hiddenCount ? '*****' : word[0];
    lastIndex = wordStart + word[0].length;
  });

  return result + address.slice(lastIndex);
}

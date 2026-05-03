import { NYC_NEIGHBORHOODS } from '../data';

export function runNeighborhoodAgent(input: { school?: string; budgetMax?: number; maxCommuteMinutes?: number }) {
  const school = input.school ?? 'Columbia';
  return NYC_NEIGHBORHOODS.map((n) => {
    const commute = school.toLowerCase().includes('nyu') ? n.commuteToNYU : n.commuteToColumbia;
    const recommended = typeof commute === 'number' && commute <= (input.maxCommuteMinutes ?? 35);
    return {
      ...n,
      recommended,
      fitReason: recommended
        ? `${n.name} fits the ${school} commute target and is understandable for newcomers.`
        : `${n.name} may work, but the commute or rent tradeoff needs extra attention for ${school}.`,
    };
  });
}

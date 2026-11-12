import snapshot from './data/presentation.json';

export const data = snapshot;
export const number = (value: number) => new Intl.NumberFormat('en-GB').format(value);
export const categoryNames: Record<string, string> = { biscuits: 'Biscuits', breakfast_cereals: 'Breakfast cereals', dark_chocolates: 'Dark chocolate', fruit_juices: 'Fruit juices' };

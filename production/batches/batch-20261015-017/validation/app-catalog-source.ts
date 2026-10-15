import type { CatalogMachine, MachineCabinetType, MachineGameType } from '../distribution/types';

const normalizeSearchText = (value: string): string => value
  .normalize('NFKC')
  .toLocaleLowerCase('ja-JP')
  .replace(/[\p{P}\p{S}\s]+/gu, '');

const makeSearchTerms = (query: string): string[] => query
  .normalize('NFKC')
  .toLocaleLowerCase('ja-JP')
  .split(/[\p{P}\p{S}\s]+/u)
  .map(normalizeSearchText)
  .filter(Boolean);

export const INITIAL_MACHINE_CATALOG_LIMIT = 10;

export type MachineCatalogSort = 'RECENTLY_ADDED' | 'RECENTLY_UPDATED' | 'INTRODUCTION_NEWEST' | 'INTRODUCTION_OLDEST';

export interface MachineCatalogFilters {
  introductionYearFrom?: number | null;
  machineType?: MachineCabinetType | null;
  gameType?: MachineGameType | null;
  sort?: MachineCatalogSort;
}

export const hasMachineCatalogSearchQuery = (query: string): boolean => (
  makeSearchTerms(query).length > 0
);

export const hasMachineCatalogFilters = (filters: MachineCatalogFilters = {}): boolean => Boolean(
  filters.introductionYearFrom || filters.machineType || filters.gameType ||
  (filters.sort && filters.sort !== 'RECENTLY_ADDED')
);

export const filterMachineCatalog = (
  machines: readonly CatalogMachine[],
  query: string,
): CatalogMachine[] => {
  const visibleMachines = machines.filter((machine) => machine.status !== 'withdrawn');
  const terms = makeSearchTerms(query);
  if (terms.length === 0) return [...visibleMachines];

  return visibleMachines.filter((machine) => {
    const searchableText = normalizeSearchText(`${machine.displayName}${machine.manufacturer}`);
    return terms.every((term) => searchableText.includes(term));
  });
};

const parseTime = (value?: string): number => value ? Date.parse(value) : Number.NaN;

const stableSortByDate = (
  machines: readonly CatalogMachine[],
  readDate: (machine: CatalogMachine) => string | undefined,
  direction: 'asc' | 'desc',
): CatalogMachine[] => machines
  .map((machine, index) => ({ machine, index }))
  .sort((a, b) => {
    const aTime = parseTime(readDate(a.machine));
    const bTime = parseTime(readDate(b.machine));
    if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) {
      return direction === 'desc' ? bTime - aTime : aTime - bTime;
    }
    if (Number.isFinite(aTime) !== Number.isFinite(bTime)) return Number.isFinite(aTime) ? -1 : 1;
    return a.index - b.index;
  })
  .map(({ machine }) => machine);

const sortCatalog = (
  machines: readonly CatalogMachine[],
  sort: MachineCatalogSort = 'RECENTLY_ADDED',
): CatalogMachine[] => {
  if (sort === 'RECENTLY_UPDATED') return stableSortByDate(machines, (machine) => machine.updatedAt ?? machine.addedAt, 'desc');
  if (sort === 'INTRODUCTION_NEWEST') return stableSortByDate(machines, (machine) => machine.introductionDate, 'desc');
  if (sort === 'INTRODUCTION_OLDEST') return stableSortByDate(machines, (machine) => machine.introductionDate, 'asc');
  return stableSortByDate(machines, (machine) => machine.addedAt, 'desc');
};

export const applyMachineCatalogFilters = (
  machines: readonly CatalogMachine[],
  filters: MachineCatalogFilters = {},
): CatalogMachine[] => machines.filter((machine) => {
  if (filters.machineType && machine.machineType !== filters.machineType) return false;
  if (filters.gameType && machine.gameType !== filters.gameType) return false;
  if (filters.introductionYearFrom) {
    const time = parseTime(machine.introductionDate);
    if (!Number.isFinite(time) || new Date(time).getUTCFullYear() < filters.introductionYearFrom) return false;
  }
  return true;
});

export const getVisibleMachineCatalog = (
  machines: readonly CatalogMachine[],
  query: string,
  filters: MachineCatalogFilters = {},
): CatalogMachine[] => {
  const filtered = applyMachineCatalogFilters(filterMachineCatalog(machines, query), filters);
  return sortCatalog(filtered, filters.sort);
};

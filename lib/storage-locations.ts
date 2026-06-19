export const STORAGE_LOCATIONS = [
  { id: 'freezer_20_1', label: '-20°C 냉동고 ①', temp: '-20°C' },
  { id: 'freezer_20_2', label: '-20°C 냉동고 ②', temp: '-20°C' },
  { id: 'freezer_20_3', label: '-20°C 냉동고 ③', temp: '-20°C' },
  { id: 'freezer_20_4', label: '-20°C 냉동고 ④', temp: '-20°C' },
  { id: 'freezer_80',   label: '-80°C 냉동고',   temp: '-80°C' },
  { id: 'freezer_4_1',  label: '4°C 냉장고 ①',  temp: '4°C'   },
  { id: 'freezer_4_2',  label: '4°C 냉장고 ②',  temp: '4°C'   },
  { id: 'freezer_4_3',  label: '4°C 냉장고 ③',  temp: '4°C'   },
  { id: 'cabinet_powder', label: '분말시약 캐비닛', temp: '상온' },
  { id: 'cabinet_liquid', label: '액체시약 캐비닛', temp: '상온' },
] as const

export type StorageLocationId = typeof STORAGE_LOCATIONS[number]['id']

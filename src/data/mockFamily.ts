/*
 * ✏️ TEAM: edit everything here — the demo household ("Al Mansouri family").
 * This family seeds the one-click demo account so judges land on a living,
 * coherent story: multigenerational Emirati home, grandmother on medication,
 * kids with school routines, working parents holding it all together.
 */
import { DEFAULT_MODULES } from '@/config/app.config';
import type { Family } from '@/types';

export const mockFamily: Family = {
  id: 'family-almansouri',
  name: { ar: 'عائلة المنصوري', en: 'Al Mansouri Family' },
  enabledModules: [...DEFAULT_MODULES],
  members: [
    {
      id: 'member-ahmed',
      name: { ar: 'أحمد', en: 'Ahmed' },
      age: 45,
      relation: 'self',
      conditions: ['highCholesterol'],
      allergies: [],
    },
    {
      id: 'member-fatima',
      name: { ar: 'فاطمة', en: 'Fatima' },
      age: 42,
      relation: 'spouse',
      conditions: [],
      allergies: ['seafood'],
    },
    {
      id: 'member-omar',
      name: { ar: 'عمر', en: 'Omar' },
      age: 14,
      relation: 'son',
      conditions: ['asthma'],
      allergies: ['nuts'],
    },
    {
      id: 'member-layla',
      name: { ar: 'ليلى', en: 'Layla' },
      age: 9,
      relation: 'daughter',
      conditions: [],
      allergies: [],
    },
    {
      id: 'member-mariam',
      name: { ar: 'مريم', en: 'Mariam' },
      age: 72,
      relation: 'grandmother',
      conditions: ['hypertension', 'diabetes'],
      allergies: [],
    },
  ],
};

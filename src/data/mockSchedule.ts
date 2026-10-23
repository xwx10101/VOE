/*
 * ✏️ TEAM: edit everything here — the Al Mansouri weekly rhythm (24 events).
 * dayOfWeek: 0=Sunday … 6=Saturday. Two deliberate CONFLICTS are baked in so
 * the schedule intelligence has something real to catch:
 *   ⚠️ Tuesday — Omar football 16:00–17:30 overlaps math tutoring 16:30–17:30
 *   ⚠️ Wednesday — Fatima parents' meeting 17:00–18:00 overlaps driving
 *      Mariam to her clinic check 17:30–18:30
 */
import type { ScheduleEvent } from '@/types';

export const mockSchedule: ScheduleEvent[] = [
  // ---- Omar (14) ----
  { id: 'evt-omar-school-mon', memberId: 'member-omar', title: { ar: 'المدرسة', en: 'School' }, dayOfWeek: 1, startTime: '07:30', endTime: '14:30', category: 'school' },
  { id: 'evt-omar-school-tue', memberId: 'member-omar', title: { ar: 'المدرسة', en: 'School' }, dayOfWeek: 2, startTime: '07:30', endTime: '14:30', category: 'school' },
  { id: 'evt-omar-school-wed', memberId: 'member-omar', title: { ar: 'المدرسة', en: 'School' }, dayOfWeek: 3, startTime: '07:30', endTime: '14:30', category: 'school' },
  { id: 'evt-omar-school-thu', memberId: 'member-omar', title: { ar: 'المدرسة', en: 'School' }, dayOfWeek: 4, startTime: '07:30', endTime: '14:30', category: 'school' },
  { id: 'evt-omar-football-tue', memberId: 'member-omar', title: { ar: 'تدريب كرة القدم', en: 'Football training' }, dayOfWeek: 2, startTime: '16:00', endTime: '17:30', category: 'sport', location: { ar: 'أكاديمية النادي', en: 'Club academy' } },
  { id: 'evt-omar-math-tue', memberId: 'member-omar', title: { ar: 'درس رياضيات خصوصي', en: 'Math tutoring' }, dayOfWeek: 2, startTime: '16:30', endTime: '17:30', category: 'school', location: { ar: 'في المنزل', en: 'At home' } },
  { id: 'evt-omar-football-thu', memberId: 'member-omar', title: { ar: 'تدريب كرة القدم', en: 'Football training' }, dayOfWeek: 4, startTime: '16:00', endTime: '17:30', category: 'sport', location: { ar: 'أكاديمية النادي', en: 'Club academy' } },
  { id: 'evt-omar-quran-sat', memberId: 'member-omar', title: { ar: 'حلقة تحفيظ القرآن', en: 'Quran memorization circle' }, dayOfWeek: 6, startTime: '10:00', endTime: '11:30', category: 'family', location: { ar: 'المسجد', en: 'The mosque' } },

  // ---- Layla (9) ----
  { id: 'evt-layla-school-mon', memberId: 'member-layla', title: { ar: 'المدرسة', en: 'School' }, dayOfWeek: 1, startTime: '07:30', endTime: '13:45', category: 'school' },
  { id: 'evt-layla-school-tue', memberId: 'member-layla', title: { ar: 'المدرسة', en: 'School' }, dayOfWeek: 2, startTime: '07:30', endTime: '13:45', category: 'school' },
  { id: 'evt-layla-school-wed', memberId: 'member-layla', title: { ar: 'المدرسة', en: 'School' }, dayOfWeek: 3, startTime: '07:30', endTime: '13:45', category: 'school' },
  { id: 'evt-layla-school-thu', memberId: 'member-layla', title: { ar: 'المدرسة', en: 'School' }, dayOfWeek: 4, startTime: '07:30', endTime: '13:45', category: 'school' },
  { id: 'evt-layla-piano-wed', memberId: 'member-layla', title: { ar: 'درس بيانو', en: 'Piano lesson' }, dayOfWeek: 3, startTime: '15:30', endTime: '16:15', category: 'other', location: { ar: 'مركز الموسيقى', en: 'Music center' } },
  { id: 'evt-layla-swim-sat', memberId: 'member-layla', title: { ar: 'درس سباحة', en: 'Swimming lesson' }, dayOfWeek: 6, startTime: '09:00', endTime: '10:00', category: 'sport', location: { ar: 'النادي الرياضي', en: 'Sports club' } },

  // ---- Mariam (72, grandmother) ----
  { id: 'evt-mariam-clinic-wed', memberId: 'member-mariam', title: { ar: 'مراجعة عيادة القلب', en: 'Cardiology clinic review' }, dayOfWeek: 3, startTime: '17:30', endTime: '18:30', category: 'medical', location: { ar: 'مركز الخليج الطبي', en: 'Khalij Medical Center' } },
  { id: 'evt-mariam-physio-mon', memberId: 'member-mariam', title: { ar: 'جلسة علاج طبيعي', en: 'Physiotherapy session' }, dayOfWeek: 1, startTime: '10:00', endTime: '11:00', category: 'medical', location: { ar: 'عيادة العلاج الطبيعي', en: 'Physio clinic' } },
  { id: 'evt-mariam-walk-fri', memberId: 'member-mariam', title: { ar: 'مشي صباحي مع فاطمة', en: 'Morning walk with Fatima' }, dayOfWeek: 5, startTime: '06:30', endTime: '07:15', category: 'family', location: { ar: 'حديقة الحي', en: 'Neighborhood park' } },
  { id: 'evt-mariam-diabetes-thu', memberId: 'member-mariam', title: { ar: 'فحص سكري شهري', en: 'Monthly diabetes check' }, dayOfWeek: 4, startTime: '09:00', endTime: '09:45', category: 'medical', location: { ar: 'المختبر الطبي', en: 'Medical lab' } },

  // ---- Fatima (42) ----
  { id: 'evt-fatima-work-mon', memberId: 'member-fatima', title: { ar: 'العمل', en: 'Work' }, dayOfWeek: 1, startTime: '08:30', endTime: '16:30', category: 'work' },
  { id: 'evt-fatima-work-wed', memberId: 'member-fatima', title: { ar: 'العمل', en: 'Work' }, dayOfWeek: 3, startTime: '08:30', endTime: '16:30', category: 'work' },
  { id: 'evt-fatima-parents-wed', memberId: 'member-fatima', title: { ar: 'اجتماع أولياء الأمور بالمدرسة', en: 'School parents meeting' }, dayOfWeek: 3, startTime: '17:00', endTime: '18:00', category: 'school', location: { ar: 'مدرسة ليلى', en: "Layla's school" } },
  { id: 'evt-fatima-grocery-fri', memberId: 'member-fatima', title: { ar: 'تسوق أسبوعي للمنزل', en: 'Weekly grocery run' }, dayOfWeek: 5, startTime: '17:00', endTime: '18:30', category: 'family', location: { ar: 'كارفور', en: 'Carrefour' } },

  // ---- Ahmed (45) ----
  { id: 'evt-ahmed-work-tue', memberId: 'member-ahmed', title: { ar: 'العمل', en: 'Work' }, dayOfWeek: 2, startTime: '08:00', endTime: '17:00', category: 'work' },
  { id: 'evt-ahmed-work-thu', memberId: 'member-ahmed', title: { ar: 'العمل', en: 'Work' }, dayOfWeek: 4, startTime: '08:00', endTime: '17:00', category: 'work' },
  { id: 'evt-ahmed-gym-sun', memberId: 'member-ahmed', title: { ar: 'تمرين في النادي', en: 'Gym workout' }, dayOfWeek: 0, startTime: '19:00', endTime: '20:00', category: 'sport', location: { ar: 'النادي الرياضي', en: 'Sports club' } },
  { id: 'evt-ahmed-family-fri', memberId: 'member-ahmed', title: { ar: 'عشاء عائلي كبير', en: 'Big family dinner' }, dayOfWeek: 5, startTime: '19:30', endTime: '21:30', category: 'family', location: { ar: 'في المنزل', en: 'At home' } },
];

/*
 * ✏️ TEAM: edit everything here — 26 bilingual family-wellbeing insights.
 * They rotate on the dashboard "AI Insight" card and will be reused by the
 * Nasma assistant (Phase 5). Keep them warm, practical, non-alarming — and
 * never a substitute for medical advice.
 */
import type { Insight } from '@/types';

export const insights: Insight[] = [
  {
    id: 'ins-med-routine',
    category: 'medication',
    title: { ar: 'اربط الدواء بعادة ثابتة', en: 'Anchor medicine to a daily habit' },
    body: {
      ar: 'أخذ الجرعة مع الإفطار أو بعد صلاة الفجر يجعل النسيان شبه مستحيل — العادة أقوى من الذاكرة.',
      en: 'Taking a dose with breakfast or after Fajr prayer makes forgetting almost impossible — habit beats memory.',
    },
  },
  {
    id: 'ins-med-evening',
    category: 'medication',
    title: { ar: 'جرعات المساء تُنسى أكثر', en: 'Evening doses are missed most' },
    body: {
      ar: 'تُظهر الدراسات أن جرعات ما بعد العشاء هي الأكثر تفويتًا. تذكير لطيف من أحد الأبناء يصنع فرقًا كبيرًا.',
      en: 'Studies show post-dinner doses are the most forgotten. A gentle check-in from a family member makes a real difference.',
    },
  },
  {
    id: 'ins-med-refill',
    category: 'medication',
    title: { ar: 'أعد التعبئة قبل النفاد بأسبوع', en: 'Refill a week before you run out' },
    body: {
      ar: 'اطلب الدواء عندما يتبقى منه أسبوع — التأخير في الصيدليات وأيام العطل لن يقطع العلاج أبدًا.',
      en: 'Order refills when a week of supply remains — pharmacy delays and weekends will never interrupt treatment.',
    },
  },
  {
    id: 'ins-med-organizer',
    category: 'medication',
    title: { ar: 'علبة تنظيم أسبوعية = راحة بال', en: 'A weekly pill organizer = peace of mind' },
    body: {
      ar: 'تحضير علبة الأدوية الأسبوعية كل يوم جمعة يقلل الأخطاء ويجعل تفويت أي جرعة واضحًا فورًا.',
      en: 'Filling a weekly pill organizer every Friday cuts errors and makes any missed dose visible at a glance.',
    },
  },
  {
    id: 'ins-nut-fiber',
    category: 'nutrition',
    title: { ar: 'الألياف صديقة سكر الدم', en: 'Fiber is blood sugar’s friend' },
    body: {
      ar: 'بدء الوجبة بالسلطة أو الشوربة يبطئ امتصاص السكر — حيلة بسيطة تحمي مرضى السكري بعد كل وجبة.',
      en: 'Starting a meal with salad or soup slows sugar absorption — a simple trick that protects diabetics after every meal.',
    },
  },
  {
    id: 'ins-nut-salt',
    category: 'nutrition',
    title: { ar: 'خفّض الملح دون أن تفقد النكهة', en: 'Lower salt, keep the flavor' },
    body: {
      ar: 'الليمون والسماق والزعتر يعوّضون نكهة الملح — مثالي لمن يعاني من ارتفاع ضغط الدم في الأسرة.',
      en: 'Lemon, sumac and zaatar replace salt’s punch — ideal for family members managing high blood pressure.',
    },
  },
  {
    id: 'ins-nut-dates',
    category: 'nutrition',
    title: { ar: 'التمر باعتدال', en: 'Dates, in moderation' },
    body: {
      ar: 'التمر كنز غذائي، لكن ثلاث حبات مع القهوة تكفي لمرضى السكري — الاستمتاع لا يعني الإفراط.',
      en: 'Dates are a nutritional treasure, but three with coffee is enough for diabetics — enjoyment need not mean excess.',
    },
  },
  {
    id: 'ins-nut-kids',
    category: 'nutrition',
    title: { ar: 'أشرك الأطفال في الطبخ', en: 'Cook with the kids' },
    body: {
      ar: 'الأطفال الذين يساعدون في تحضير الخضار يأكلونها بحماس أكبر — المطبخ أسرع طريق لقلب الصغار وعاداتهم.',
      en: 'Children who help prepare vegetables eat them far more willingly — the kitchen is the fastest route to healthy habits.',
    },
  },
  {
    id: 'ins-act-walk',
    category: 'activity',
    title: { ar: 'مشي 10 دقائق بعد العشاء', en: 'A 10-minute walk after dinner' },
    body: {
      ar: 'مشي قصير بعد وجبة العشاء يخفض سكر الدم بشكل ملحوظ ويحسّن النوم — اجعلوه طقسًا عائليًا حول الحي.',
      en: 'A short post-dinner walk noticeably lowers blood sugar and improves sleep — make it a family ritual around the block.',
    },
  },
  {
    id: 'ins-act-steps',
    category: 'activity',
    title: { ar: 'الخطوات الصغيرة تتراكم', en: 'Small steps add up' },
    body: {
      ar: 'لكبار السن: 500 خطوة إضافية أسبوعيًا أفضل من قفزة كبيرة مرهقة. التقدم اللطيف يدوم.',
      en: 'For elders, adding 500 steps a week beats one exhausting leap. Gentle progress lasts.',
    },
  },
  {
    id: 'ins-act-play',
    category: 'activity',
    title: { ar: 'اللعب النشط دواء الأطفال', en: 'Active play is children’s medicine' },
    body: {
      ar: 'ساعة لعب نشط يوميًا تقوّي عظام الأطفال وتركيزهم ودراستهم — كرة القدم في الفناء تصنع المعجزات.',
      en: 'An hour of active play daily strengthens children’s bones, focus and schoolwork — backyard football works wonders.',
    },
  },
  {
    id: 'ins-sleep-routine',
    category: 'sleep',
    title: { ar: 'موعد نوم ثابت يحمي القلب', en: 'A fixed bedtime protects the heart' },
    body: {
      ar: 'النوم والاستيقاظ في الموعد نفسه ينظّم ضغط الدم والسكر — حتى في عطلة نهاية الأسبوع.',
      en: 'Sleeping and waking at the same time regulates blood pressure and sugar — even on weekends.',
    },
  },
  {
    id: 'ins-sleep-screens',
    category: 'sleep',
    title: { ar: 'شاشات أقل قبل النوم بساعة', en: 'Screens off an hour before bed' },
    body: {
      ar: 'إبعاد الهواتف قبل النوم بساعة يحسّن نوم الأطفال والبالغين — جرّبوا القراءة معًا بدلًا منها.',
      en: 'Putting phones away an hour before bed improves sleep for kids and adults — try reading together instead.',
    },
  },
  {
    id: 'ins-hydro-water',
    category: 'hydration',
    title: { ar: 'كوب ماء بعد كل صلاة', en: 'A glass of water after every prayer' },
    body: {
      ar: 'ربط شرب الماء بالصلوات الخمس يضمن ترطيبًا ممتازًا لكبار السن دون الحاجة لأي تذكير.',
      en: 'Tying a glass of water to the five daily prayers guarantees excellent hydration for elders, no reminders needed.',
    },
  },
  {
    id: 'ins-hydro-heat',
    category: 'hydration',
    title: { ar: 'انتبهوا للجفاف في حر الخليج', en: 'Watch for dehydration in Gulf heat' },
    body: {
      ar: 'كبار السن يشعرون بالعطش أقل. في الصيف، اعرض الماء كل ساعتين حتى دون أن يطلبوه.',
      en: 'Elders feel thirst less. In summer, offer water every two hours even if they don’t ask.',
    },
  },
  {
    id: 'ins-elder-bp',
    category: 'eldercare',
    title: { ar: 'قياس الضغط بالطريقة الصحيحة', en: 'Measure blood pressure correctly' },
    body: {
      ar: 'خمس دقائق جلوس هادئ، والقدمان مسطحتان، والذراع مدعومة — قياس صحيح واحد أصدق من ثلاثة متسرعة.',
      en: 'Five quiet minutes seated, feet flat, arm supported — one correct reading beats three rushed ones.',
    },
  },
  {
    id: 'ins-elder-falls',
    category: 'eldercare',
    title: { ar: 'بيت خالٍ من التعثر', en: 'A trip-free home' },
    body: {
      ar: 'إضاءة ليلية في الممرات وسجاد مثبت ومساند في الحمام — تعديلات صغيرة تمنع أخطر إصابات كبار السن.',
      en: 'Night lights in hallways, secured rugs and bathroom grab bars — small changes prevent the most serious elder injuries.',
    },
  },
  {
    id: 'ins-elder-social',
    category: 'eldercare',
    title: { ar: 'الصحبة دواء لا يُشترى', en: 'Company is medicine money can’t buy' },
    body: {
      ar: 'عشرة دقائق من الحديث مع الجدة يوميًا تحمي ذاكرتها ومزاجها بقدر ما تحميها الفيتامينات.',
      en: 'Ten minutes of daily conversation with grandmother protects her memory and mood as much as any vitamin.',
    },
  },
  {
    id: 'ins-elder-glucose',
    category: 'eldercare',
    title: { ar: 'سجّل السكر وابحث عن النمط', en: 'Log glucose, look for the pattern' },
    body: {
      ar: 'قراءة مرتفعة واحدة ليست خطرًا؛ النمط المتكرر عبر أسبوع هو ما يستحق مشاركته مع الطبيب.',
      en: 'One high reading is not a danger; a repeating weekly pattern is what’s worth sharing with the doctor.',
    },
  },
  {
    id: 'ins-mind-gratitude',
    category: 'mindset',
    title: { ar: 'ثلاثة أشياء نشكر عليها', en: 'Three things we’re grateful for' },
    body: {
      ar: 'طقس صغير عند العشاء: كل فرد يذكر شيئًا جميلًا من يومه. الامتنان المشترك يربط القلوب.',
      en: 'A tiny dinner ritual: each person names one good thing from their day. Shared gratitude bonds hearts.',
    },
  },
  {
    id: 'ins-mind-caregiver',
    category: 'mindset',
    title: { ar: 'من يرعى الجميع يحتاج رعاية أيضًا', en: 'The caregiver needs care too' },
    body: {
      ar: 'إذا كنت العمود الفقري لرعاية الأسرة، فاستراحتك ليست ترفًا — نصف ساعة لك يوميًا تحمي الجميع.',
      en: 'If you hold the family’s care together, your rest is not a luxury — thirty minutes for yourself protects everyone.',
    },
  },
  {
    id: 'ins-mind-progress',
    category: 'mindset',
    title: { ar: 'احتفل بالتقدم لا الكمال', en: 'Celebrate progress, not perfection' },
    body: {
      ar: 'أسبوع التزام بنسبة 90٪ بالأدوية نجاح يستحق الاحتفال — الكمال ليس شرطًا للتحسن.',
      en: 'A 90%-adherence week with medications is a success worth celebrating — perfection is not required for progress.',
    },
  },
  {
    id: 'ins-fam-meals',
    category: 'familyTime',
    title: { ar: 'وجبة واحدة مشتركة يوميًا', en: 'One shared meal a day' },
    body: {
      ar: 'الأسر التي تأكل معًا يوميًا يحقق أطفالها نتائج دراسية أفضل وصحة نفسية أقوى — المائدة قلب البيت.',
      en: 'Families who eat together daily raise children with better grades and mental health — the table is the heart of the home.',
    },
  },
  {
    id: 'ins-fam-phones',
    category: 'familyTime',
    title: { ar: 'ساعة بلا هواتف مساءً', en: 'One phone-free evening hour' },
    body: {
      ar: 'ساعة واحدة مساءً تجمع الأسرة دون شاشات — حديث ولعب وقهوة. جرّبوها أسبوعًا وستصبح عادة محبوبة.',
      en: 'One screen-free hour each evening — talk, games and coffee. Try it for a week and it becomes a beloved habit.',
    },
  },
  {
    id: 'ins-fam-roles',
    category: 'familyTime',
    title: { ar: 'وزّعوا مهام الرعاية بعدل', en: 'Share care tasks fairly' },
    body: {
      ar: 'عندما يتشارك الأبناء رعاية الوالدين بالتناوب، لا ينهك أحد — الرعاية المشتركة رعاية مستدامة.',
      en: 'When siblings rotate parent-care duties, no one burns out — shared care is sustainable care.',
    },
  },
  {
    id: 'ins-fam-stories',
    category: 'familyTime',
    title: { ar: 'قصص الأجداد كنز الأحفاد', en: 'Grandparents’ stories are grandchildren’s treasure' },
    body: {
      ar: 'اطلبوا من الجد أو الجدة حكاية من زمنهم أسبوعيًا وسجّلوها — ذاكرة العائلة إرث لا يُقدّر بثمن.',
      en: 'Ask a grandparent for one story from their youth each week and record it — family memory is a priceless inheritance.',
    },
  },
];

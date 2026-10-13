// Контент лендинга консультации на двух языках (ru/uz).
export interface Dict {
  lang: 'ru' | 'uz'
  slug: string
  metaTitle: string
  metaDesc: string
  ogTitle: string
  ogDesc: string
  eyebrow: string
  h1: string
  sub: string
  cta: string
  trust: string[]
  painTitle: string
  pains: string[]
  painFooter: string
  getsEyebrow: string
  getsTitle: string
  gets: { t: string; d: string }[]
  stepsTitle: string
  steps: { n: string; t: string; d: string }[]
  formTitle: string
  formSub: string
  orCall: string
  footer: string
  form: {
    name: string; namePh: string
    phone: string
    comment: string; commentOpt: string; commentPh: string
    submit: string; consent: string
    successTitle: string; successText: string
    errPhone: string; errName: string; errSend: string; sending: string
  }
}

export const RU: Dict = {
  lang: 'ru',
  slug: 'consultation',
  metaTitle: 'Бесплатная консультация бухгалтера в Ташкенте',
  metaDesc: 'Бесплатная консультация по бухгалтерии и налогам в Ташкенте: разберём вашу ситуацию, покажем, где вы переплачиваете, и рассчитаем стоимость ведения под ваш бизнес.',
  ogTitle: 'Бесплатная консультация бухгалтера — TURAN OS',
  ogDesc: 'Разберём вашу бухгалтерию и налоги бесплатно. Покажем, где вы переплачиваете, и как навести порядок.',
  eyebrow: 'Бухгалтерский аутсорсинг · Ташкент',
  h1: 'Бесплатная консультация по бухгалтерии и налогам',
  sub: 'Разберём вашу ситуацию, покажем, где вы переплачиваете налоги, и рассчитаем стоимость ведения под ваш бизнес. Без обязательств.',
  cta: 'Получить консультацию',
  trust: ['Члены ТПП Узбекистана', 'Аудиторы в штате', 'Ответственность по договору'],
  painTitle: 'Узнали себя хотя бы в одном?',
  pains: [
    'Не знаете точную налоговую нагрузку бизнеса',
    'Отчёты сдаются в последний день или с просрочками',
    'Не уверены, что платите налоги оптимально',
    'Бухгалтер «незаменим» — заболеет, и всё встанет',
    'Боитесь налоговой проверки и доначислений',
    'Первичка и ЭСФ ведутся «как получится»',
  ],
  painFooter: 'Каждый пункт — это риск штрафов и переплат. На бесплатной консультации разберём именно вашу ситуацию.',
  getsEyebrow: 'Что вы получите',
  getsTitle: 'На бесплатной консультации',
  gets: [
    { t: 'Разбор вашей ситуации', d: 'Посмотрим, как ведётся учёт сейчас, и найдём слабые места и риски.' },
    { t: 'Где вы переплачиваете', d: 'Покажем точки, где теряются деньги на налогах, и как это исправить законно.' },
    { t: 'Расчёт стоимости', d: 'Посчитаем стоимость ведения бухгалтерии под ваш оборот — прозрачно.' },
    { t: 'План действий', d: 'Даже если не станете клиентом — уйдёте с понятной картиной и следующими шагами.' },
  ],
  stepsTitle: 'Как это работает',
  steps: [
    { n: '01', t: 'Оставляете заявку', d: 'Имя и телефон — 1 минута.' },
    { n: '02', t: 'Короткий разговор', d: 'Менеджер уточнит сферу и задачи вашего бизнеса.' },
    { n: '03', t: 'Бесплатная консультация', d: 'Разбор, рекомендации и расчёт стоимости. Без обязательств.' },
  ],
  formTitle: 'Оставьте заявку',
  formSub: 'Менеджер свяжется с вами, разберёт ситуацию и рассчитает стоимость. Бесплатно и без обязательств.',
  orCall: 'Или позвоните:',
  footer: 'TURAN OS · Бухгалтерский аутсорсинг в Ташкенте',
  form: {
    name: 'Ваше имя', namePh: 'Имя',
    phone: 'Телефон',
    comment: 'Комментарий', commentOpt: '(необязательно)', commentPh: 'Сфера бизнеса, вопрос…',
    submit: 'Получить бесплатную консультацию', consent: 'Нажимая кнопку, вы соглашаетесь на обработку персональных данных',
    successTitle: 'Заявка принята!', successText: 'Менеджер свяжется с вами в ближайшее время, разберёт вашу ситуацию и рассчитает стоимость.',
    errPhone: 'Введите номер телефона полностью', errName: 'Укажите имя', errSend: 'Не удалось отправить. Попробуйте ещё раз или позвоните нам.', sending: 'Отправляем…',
  },
}

export const UZ: Dict = {
  lang: 'uz',
  slug: 'konsultatsiya',
  metaTitle: 'Toshkentda buxgalter bilan bepul konsultatsiya',
  metaDesc: 'Toshkentda buxgalteriya va soliqlar bo‘yicha bepul konsultatsiya: vaziyatingizni tahlil qilamiz, qayerda ortiqcha to‘layotganingizni ko‘rsatamiz va biznesingiz uchun xizmat narxini hisoblaymiz.',
  ogTitle: 'Buxgalter bilan bepul konsultatsiya — TURAN OS',
  ogDesc: 'Buxgalteriya va soliqlaringizni bepul tahlil qilamiz. Qayerda ortiqcha to‘layotganingizni va tartibga keltirish yo‘lini ko‘rsatamiz.',
  eyebrow: 'Buxgalteriya autsorsingi · Toshkent',
  h1: 'Buxgalteriya va soliqlar bo‘yicha bepul konsultatsiya',
  sub: 'Vaziyatingizni tahlil qilamiz, qayerda ortiqcha soliq to‘layotganingizni ko‘rsatamiz va biznesingiz uchun xizmat narxini hisoblab beramiz. Hech qanday majburiyatsiz.',
  cta: 'Konsultatsiya olish',
  trust: ['O‘zbekiston Savdo-sanoat palatasi a’zosi', 'Shtatda auditorlar', 'Shartnoma bo‘yicha javobgarlik'],
  painTitle: 'O‘zingizni birortasida tanidingizmi?',
  pains: [
    'Biznesingizning aniq soliq yukini bilmaysiz',
    'Hisobotlar oxirgi kuni yoki kechikib topshiriladi',
    'Soliqlarni optimal to‘layotganingizga ishonchingiz yo‘q',
    'Buxgalter «o‘rnini bosib bo‘lmaydigan» — kasal bo‘lsa, hammasi to‘xtaydi',
    'Soliq tekshiruvi va qo‘shimcha hisob-kitoblardan qo‘rqasiz',
    'Birlamchi hujjatlar va ESF «qandaydir» yuritiladi',
  ],
  painFooter: 'Har bir nuqta — jarima va ortiqcha to‘lov xavfi. Bepul konsultatsiyada aynan sizning vaziyatingizni tahlil qilamiz.',
  getsEyebrow: 'Nima olasiz',
  getsTitle: 'Bepul konsultatsiyada',
  gets: [
    { t: 'Vaziyatingiz tahlili', d: 'Hozir hisob qanday yuritilayotganini ko‘rib, zaif joylar va risklarni topamiz.' },
    { t: 'Qayerda ortiqcha to‘layapsiz', d: 'Soliqlarda pul yo‘qotilayotgan nuqtalarni va ularni qonuniy tuzatishni ko‘rsatamiz.' },
    { t: 'Narx hisobi', d: 'Aylanmangizga mos buxgalteriya yuritish narxini shaffof hisoblaymiz.' },
    { t: 'Harakatlar rejasi', d: 'Mijoz bo‘lmasangiz ham — aniq manzara va keyingi qadamlar bilan ketasiz.' },
  ],
  stepsTitle: 'Qanday ishlaydi',
  steps: [
    { n: '01', t: 'Ariza qoldirasiz', d: 'Ism va telefon — 1 daqiqa.' },
    { n: '02', t: 'Qisqa suhbat', d: 'Menejer biznesingiz sohasi va vazifalarini aniqlaydi.' },
    { n: '03', t: 'Bepul konsultatsiya', d: 'Tahlil, tavsiyalar va narx hisobi. Majburiyatsiz.' },
  ],
  formTitle: 'Ariza qoldiring',
  formSub: 'Menejer siz bilan bog‘lanadi, vaziyatni tahlil qiladi va narxni hisoblaydi. Bepul va majburiyatsiz.',
  orCall: 'Yoki qo‘ng‘iroq qiling:',
  footer: 'TURAN OS · Toshkentda buxgalteriya autsorsingi',
  form: {
    name: 'Ismingiz', namePh: 'Ism',
    phone: 'Telefon',
    comment: 'Izoh', commentOpt: '(ixtiyoriy)', commentPh: 'Biznes sohasi, savol…',
    submit: 'Bepul konsultatsiya olish', consent: 'Tugmani bosish orqali shaxsiy ma’lumotlarni qayta ishlashga rozilik bildirasiz',
    successTitle: 'Ariza qabul qilindi!', successText: 'Menejer tez orada siz bilan bog‘lanadi, vaziyatingizni tahlil qiladi va narxni hisoblaydi.',
    errPhone: 'Telefon raqamini to‘liq kiriting', errName: 'Ismingizni kiriting', errSend: 'Yuborib bo‘lmadi. Qayta urinib ko‘ring yoki qo‘ng‘iroq qiling.', sending: 'Yuborilmoqda…',
  },
}

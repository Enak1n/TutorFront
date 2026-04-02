export enum LessonCategory {
    School = 'School',
    EGE = 'EGE',
    OGE = 'OGE',
    VPR = 'VPR',
    Improvement = 'Improvement',
    Assistance = 'Assistance',
    Speaking = 'Speaking',
}

export const LESSON_CATEGORY_LABELS: Record<LessonCategory, string> = {
    [LessonCategory.School]: 'Занятия по школьной программе',
    [LessonCategory.EGE]: 'ЕГЭ',
    [LessonCategory.OGE]: 'ОГЭ',
    [LessonCategory.VPR]: 'ВПР',
    [LessonCategory.Improvement]: 'Повышение успеваемости',
    [LessonCategory.Assistance]: 'Помощь со всеми предметами',
    [LessonCategory.Speaking]: 'Разговорный',
};

export const LESSON_CATEGORY_OPTIONS = Object.entries(LESSON_CATEGORY_LABELS).map(([value, label]) => ({
    value: value as LessonCategory,
    label: label,
}));

export enum LessonType {
    Mathematics = 'Mathematics',
    Russian = 'Russian',
    English = 'English',
    Physics = 'Physics',
    Chemistry = 'Chemistry',
    SocialScience = 'SocialScience',
    History = 'History',
    Biology = 'Biology',
    Informatics = 'Informatics',
    Geography = 'Geography',
    Literature = 'Literature',
    ForeignLanguage = 'ForeignLanguage',
    PrimarySchool = 'PrimarySchool',
    Algebra = 'Algebra',
    Geometry = 'Geometry',
}

export const LESSON_TYPE_LABELS: Record<LessonType, string> = {
    [LessonType.Mathematics]: 'Математика',
    [LessonType.Russian]: 'Русский язык',
    [LessonType.English]: 'Английский язык',
    [LessonType.Physics]: 'Физика',
    [LessonType.Chemistry]: 'Химия',
    [LessonType.SocialScience]: 'Обществознание',
    [LessonType.History]: 'История',
    [LessonType.Biology]: 'Биология',
    [LessonType.Informatics]: 'Информатика',
    [LessonType.Geography]: 'География',
    [LessonType.Literature]: 'Литература',
    [LessonType.ForeignLanguage]: 'Немецкий/испанский/китайский язык',
    [LessonType.PrimarySchool]: 'Начальная школа',
    [LessonType.Algebra]: 'Алгебра',
    [LessonType.Geometry]: 'Геометрия',
};

export const LESSON_TYPE_OPTIONS = Object.entries(LESSON_TYPE_LABELS).map(([value, label]) => ({
    value: value as LessonType,
    label: label,
}));

export const LESSON_CONFIG_MAP: Record<LessonType, LessonCategory[]> = {
    [LessonType.Mathematics]: [LessonCategory.EGE, LessonCategory.OGE, LessonCategory.VPR, LessonCategory.School],
    [LessonType.Russian]: [LessonCategory.EGE, LessonCategory.OGE, LessonCategory.VPR, LessonCategory.School],
    [LessonType.English]: [LessonCategory.EGE, LessonCategory.OGE, LessonCategory.VPR, LessonCategory.School, LessonCategory.Speaking],
    [LessonType.Physics]: [LessonCategory.EGE, LessonCategory.OGE, LessonCategory.VPR, LessonCategory.School],
    [LessonType.Chemistry]: [LessonCategory.EGE, LessonCategory.OGE, LessonCategory.VPR, LessonCategory.School],
    [LessonType.SocialScience]: [LessonCategory.EGE, LessonCategory.OGE, LessonCategory.VPR, LessonCategory.School],
    [LessonType.History]: [LessonCategory.EGE, LessonCategory.OGE, LessonCategory.VPR, LessonCategory.School],
    [LessonType.Biology]: [LessonCategory.EGE, LessonCategory.OGE, LessonCategory.VPR, LessonCategory.School],
    [LessonType.Informatics]: [LessonCategory.EGE, LessonCategory.OGE, LessonCategory.VPR, LessonCategory.School],
    [LessonType.Geography]: [LessonCategory.EGE, LessonCategory.OGE, LessonCategory.VPR, LessonCategory.School],
    [LessonType.Literature]: [LessonCategory.EGE, LessonCategory.OGE, LessonCategory.VPR, LessonCategory.School],
    [LessonType.ForeignLanguage]: [LessonCategory.EGE, LessonCategory.OGE, LessonCategory.School],
    [LessonType.PrimarySchool]: [LessonCategory.VPR, LessonCategory.Improvement, LessonCategory.Assistance],
    [LessonType.Algebra]: [LessonCategory.EGE, LessonCategory.OGE, LessonCategory.School],
    [LessonType.Geometry]: [LessonCategory.EGE, LessonCategory.OGE, LessonCategory.School],
};
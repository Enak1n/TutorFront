export type UserRole = "tutor" | "student_or_parent"

export interface TimeSlot {
    hour: number
    minute: number
    label: string
}

export interface ScheduleLesson {
    id: string
    tutorId: string
    tutorName: string
    studentId: string
    studentName: string
    date: Date
    startTime: string
    endTime: string
    subject?: string
    notes?: string
    status: "scheduled" | "completed" | "cancelled"
}

export interface WeekDay {
    date: Date
    dayName: string
    dayNumber: number
    monthName: string
    isToday: boolean
    isWeekend: boolean
}

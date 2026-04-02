"use client"

import { useState, useEffect } from "react"
// @ts-ignore
import styles from "./SchedulePage.module.scss"
import WeeklyCalendar from "@components/layout/schedule/WeeklyCalendar"

interface SchedulePageProps {
    userRole?: "tutor" | "student_or_parent"
    userName?: string
}

export const SchedulePage = ({ userRole, userName }: SchedulePageProps) => {
    const [currentWeekOffset, setCurrentWeekOffset] = useState(0)
    const [role, setRole] = useState<"tutor" | "student_or_parent">(userRole || "student_or_parent")

    useEffect(() => {
        if (!userRole) {
            const storedRole = localStorage.getItem("role") as "tutor" | "student_or_parent"
            if (storedRole) {
                setRole(storedRole)
            }
        }

        if (!userName) {
            const storedUserId = localStorage.getItem("userId")
            if (storedUserId) {
            }
        }
    }, [userRole, userName])

    const handlePreviousWeek = () => {
        setCurrentWeekOffset((prev) => prev - 1)
    }

    const handleNextWeek = () => {
        setCurrentWeekOffset((prev) => prev + 1)
    }

    const handleToday = () => {
        setCurrentWeekOffset(0)
    }

    return (
        <div className={styles.schedulePage}>
            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.content}>
                        <div className={styles.pageHeader}>
                            <h1 className={styles.pageTitle}>Расписание</h1>
                            <div className={styles.weekNavigation}>
                                <button onClick={handleToday} className={`${styles.navButton} ${styles.todayButton}`}>
                                    Сегодня
                                </button>
                                <button onClick={handlePreviousWeek} className={styles.navButton} aria-label="Предыдущая неделя">
                                    ←
                                </button>
                                <button onClick={handleNextWeek} className={styles.navButton} aria-label="Следующая неделя">
                                    →
                                </button>
                            </div>
                        </div>
                        <div className={styles.calendarWrapper}>
                            <WeeklyCalendar weekOffset={currentWeekOffset} userRole={role} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
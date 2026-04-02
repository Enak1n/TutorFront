"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { TelegramLoginButton, type TelegramUser } from "@components/auth/TelegramLoginButton"
// @ts-ignore
import styles from './LoginModal.module.scss'

export interface LoginModalProps {
    isOpen: boolean
    onClose: () => void
    onLogin: (role: "tutor" | "student_or_parent", telegramData: TelegramUser) => void
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
    const [selectedRole, setSelectedRole] = useState<"tutor" | "student_or_parent" | null>(null)

    useEffect(() => {
        if (isOpen) {
            const savedRole = localStorage.getItem("pendingRole") as "tutor" | "student_or_parent" | null
            if (savedRole) {
                setSelectedRole(savedRole)
            }
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleRoleSelect = (role: "tutor" | "student_or_parent") => {
        setSelectedRole(role)
        localStorage.setItem("pendingRole", role)
    }

    const handleTelegramAuth = (user: TelegramUser) => {
        const normalizedUser = {
            id: user.id,
            firstName: user.first_name,
            authDate: user.auth_date,
            lastName: user.last_name,
            username: user.username,
            photoUrl: user.photo_url,
            hash: user.hash,
        }

        if (selectedRole) {
            onLogin(selectedRole, normalizedUser as any)
            setSelectedRole(null)
            localStorage.removeItem("pendingRole")
        }
    }

    const handleClose = () => {
        setSelectedRole(null)
        localStorage.removeItem("pendingRole")
        onClose()
    }

    return (
        <>
            <div className={styles.overlay} onClick={handleClose} />
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Выберите роль</h2>
                    <button className={styles.closeButton} onClick={handleClose} aria-label="Закрыть">
                        ×
                    </button>
                </div>

                <div className={styles.modalContent}>
                    <p className={styles.description}>Выберите, как вы хотите использовать платформу:</p>

                    <div className={styles.roleOptions}>
                        <button
                            className={`${styles.roleCard} ${selectedRole === "tutor" ? styles.selected : ""}`}
                            onClick={() => handleRoleSelect("tutor")}
                        >
                            <div className={styles.roleIcon}>👨‍🏫</div>
                            <h3 className={styles.roleTitle}>Репетитор</h3>
                            <p className={styles.roleDescription}>Я хочу преподавать и находить учеников</p>
                            {selectedRole === "tutor" && (
                                <div className={styles.checkmark}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M20 6L9 17L4 12"
                                            stroke="white"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                            )}
                        </button>

                        <button
                            className={`${styles.roleCard} ${selectedRole === "student_or_parent" ? styles.selected : ""}`}
                            onClick={() => handleRoleSelect("student_or_parent")}
                        >
                            <div className={styles.roleIcon}>🎓</div>
                            <h3 className={styles.roleTitle}>Ищу репетитора</h3>
                            <p className={styles.roleDescription}>Я хочу найти репетитора для обучения</p>
                            {selectedRole === "student_or_parent" && (
                                <div className={styles.checkmark}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M20 6L9 17L4 12"
                                            stroke="white"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                            )}
                        </button>
                    </div>

                    {selectedRole && (
                        <>
                            <div className={styles.privacyText}>
                                Выполняя вход на сайте, вы соглашаетесь с обработкой персональных данных.
                            </div>

                            <div className={styles.telegramButtonWrapper}>
                                <TelegramLoginButton
                                    // botName="test_ugolok_repetitora_bot"
                                    botName = "ugolrep_bot"
                                    buttonSize="large"
                                    requestAccess={true}
                                    dataOnauth={handleTelegramAuth}
                                    lang="ru"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}

"use client"

import React from "react"
// @ts-ignore
import styles from "./Footer.module.scss"
// @ts-ignore
import icon_telegram from "@icons/icon_telegram.svg"

const handleScroll = (sectionId: string) => {
    if (sectionId === "top") {
        window.scrollTo({ top: 0, behavior: "smooth" })
        return
    }

    const element = document.getElementById(sectionId)
    if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" })
    } else {
        console.error(`Section with ID "${sectionId}" not found for scrolling.`)
    }
}

const TelegramIcon = () => (
    <img
        src={icon_telegram || "/placeholder.svg"}
        alt="Telegram Icon"
        className={styles.telegramIcon}
    />
)

interface FooterProps {
    isAuthenticated: boolean;
}

export const Footer: React.FC<FooterProps> = ({ isAuthenticated }) => {
    const currentYear = new Date().getFullYear()

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                {isAuthenticated ? (
                    <div className={styles.authenticatedContent}>
                        <div className={styles.brandSection}>
                            <div className={styles.logoText} onClick={() => handleScroll("top")}>
                                Уголок репетитора
                            </div>

                            <a
                                href="https://t.me/ugolokrepetitora"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.telegramLink}
                                aria-label="Перейти в Telegram-группу"
                            >
                                <TelegramIcon />
                                <span className={styles.telegramText}>Наша Telegram-группа</span>
                            </a>
                        </div>

                        <div className={styles.section + " " + styles.legalSection}>
                            <h4>Правовая информация</h4>
                            <ul>
                                <li>
                                    <a href="/legal-info" className={styles.legalLink}>
                                        Юридическая информация
                                    </a>
                                </li>
                                <li>
                                    <a href="/privacy-policy" className={styles.legalLink}>
                                        Политика обработки данных
                                    </a>
                                </li>
                                <li>
                                    <a href="/terms-of-service" className={styles.legalLink}>
                                        Пользовательское соглашение
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className={styles.content}>
                        <div className={styles.section}>
                            <h4>Навигация</h4>
                            <ul>
                                <li>
                                    <span className={styles.navLink} onClick={() => handleScroll("features")}>
                                        Возможности
                                    </span>
                                </li>
                                <li>
                                    <span className={styles.navLink} onClick={() => handleScroll("pricing")}>
                                        Тарифы
                                    </span>
                                </li>
                                <li>
                                    <span className={styles.navLink} onClick={() => handleScroll("testimonials")}>
                                        Отзывы
                                    </span>
                                </li>
                            </ul>
                        </div>

                        <div className={styles.brandSection}>
                            <div className={styles.logoText} onClick={() => handleScroll("top")}>
                                Уголок репетитора
                            </div>
                            <span className={styles.navLink} onClick={() => handleScroll("cta")}>
                                Комьюнити
                            </span>
                            <span className={styles.navLink} onClick={() => handleScroll("top")}>
                                В начало
                            </span>

                            <a
                                href="https://t.me/ugolokrepetitora"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.telegramLink}
                                aria-label="Перейти в Telegram-группу"
                            >
                                <TelegramIcon />
                                <span className={styles.telegramText}>Наша Telegram-группа</span>
                            </a>
                        </div>

                        <div className={styles.section + " " + styles.legalSection}>
                            <h4>Правовая информация</h4>
                            <ul>
                                <li>
                                    <a href="/legal-info" className={styles.legalLink}>
                                        Юридическая информация
                                    </a>
                                </li>
                                <li>
                                    <a href="/privacy-policy" className={styles.legalLink}>
                                        Политика обработки данных
                                    </a>
                                </li>
                                <li>
                                    <a href="/terms-of-service" className={styles.legalLink}>
                                        Пользовательское соглашение
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                )}

                <div className={styles.copyright}>
                    &copy; {currentYear} Уголок репетитора. Все права защищены.
                </div>
            </div>
        </footer>
    )
}

export default Footer
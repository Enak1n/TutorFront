"use client"

import type React from "react"
import { useEffect, useRef } from "react"
// @ts-ignore
import styles from "./TelegramLoginButton.module.scss"

export interface TelegramUser {
    id: number
    first_name: string
    last_name?: string
    auth_date: string
    username?: string
    photo_url?: string
    hash: string
}

export interface TelegramLoginButtonProps {
    botName: string
    buttonSize?: "small" | "medium" | "large"
    cornerRadius?: number
    requestAccess?: boolean
    usePic?: boolean
    dataOnauth?: (user: TelegramUser) => void
    dataAuthUrl?: string
    lang?: string
}

export const TelegramLoginButton: React.FC<TelegramLoginButtonProps> = ({
                                                                            botName,
                                                                            buttonSize = "large",
                                                                            cornerRadius,
                                                                            requestAccess = true,
                                                                            usePic = false,
                                                                            dataOnauth,
                                                                            dataAuthUrl,
                                                                            lang = "ru",
                                                                        }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const dataOnauthRef = useRef(dataOnauth);

    useEffect(() => {
        dataOnauthRef.current = dataOnauth;
    }, [dataOnauth]);

    useEffect(() => {
        const stableCallback = (user: TelegramUser) => {
            if (dataOnauthRef.current) {
                dataOnauthRef.current(user);
            }
        };
        if (dataOnauth) {
            (window as any).onTelegramAuth = stableCallback;
        }

        const existingScript = document.getElementById("telegram-login-script")
        if (existingScript) {
            existingScript.remove()
        }

        const script = document.createElement("script")
        script.id = "telegram-login-script"
        script.src = "https://telegram.org/js/telegram-widget.js?22"
        script.async = true
        script.setAttribute("data-telegram-login", botName)
        script.setAttribute("data-size", buttonSize)
        script.setAttribute("data-request-access", requestAccess ? "write" : "")
        script.setAttribute("data-userpic", usePic ? "true" : "false")
        script.setAttribute("data-lang", lang)

        if (cornerRadius !== undefined) {
            script.setAttribute("data-radius", cornerRadius.toString())
        }

        if (dataOnauth) {
            script.setAttribute("data-onauth", "onTelegramAuth(user)")
        } else if (dataAuthUrl) {
            script.setAttribute("data-auth-url", dataAuthUrl)
        }

        if (containerRef.current) {
            containerRef.current.appendChild(script)
        }

        return () => {
            if (containerRef.current && script.parentNode === containerRef.current) {
                containerRef.current.removeChild(script)
            }
            delete (window as any).onTelegramAuth
        }
    }, [botName, buttonSize, cornerRadius, requestAccess, usePic, dataAuthUrl, lang])

    return <div ref={containerRef} className={styles.container} />
}

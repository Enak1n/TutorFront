"use client"

import { useState, useEffect, useCallback } from "react"
import { useRoutes, Navigate, useNavigate } from "react-router"
import { Header } from "@components/layout/Header"
import { Footer } from "@components/layout/Footer"
import LandingPage from "../pages/LandingPage/LandingPage"
import { SchedulePage } from "../pages/SchedulePage/SchedulePage"
import { AdminPage } from "../pages/AdminPage/AdminPage"
import MessagesPage from '@pages/MessagesPage/MessagesPage';
import AdminMessagePage from '@pages/AdminPage/AdminMessagePage/AdminMessagePage';
import LegalInfoPage from '@pages/LegalInfoPage/LegalInfoPage';
import PrivacyPolicyPage from "@pages/PrivacyPolicyPage/PrivacyPolicyPage";
import TermsOfServicePage from "@pages/TermsOfServicePage/TermsOfServicePage";
import MyPersonPage from "@pages/MyPersonPage/MyPersonPage";
import AdminStatisticPage from '@pages/AdminPage/AdminStatisticPage';
import {UserListPage} from "@pages/AdminPage/UserListPage/UserListPage";
import { ParentStudentLinkPage } from '@pages/AdminPage/ParentStudentLinkPage';
import UserProfilePage from '@pages/UserProfilePage/UserProfilePage';
import { PersonStatisticPage } from '@pages/PersonStatisticPage/PersonStatisticPage';
import { TutorStudentLinkPage } from '../pages/AdminPage/TutorStudentLinkPage';
// @ts-ignore
import loadingGif from "@images/loading.gif"
import { loginWithTelegram, getUserInfo, UserDetailedInfo } from "@api/auth"
import type { TelegramUser } from "@components/auth/TelegramLoginButton"
import '../styles/global.scss'
import { AlertProvider } from '@components/ui/alert/AlertContext';
import { useAlert } from '@components/ui/alert/AlertContext';
import { AuthProvider } from '../shared/auth/AuthContext';
import { useAuth } from '../shared/auth/AuthContext';
import { ChatProvider } from '../shared/chat/ChatContext';
import { SSEProvider } from "../shared/sse/SSEComponent/SSEContext";
import { NotificationProvider } from '@components/notification/NotificationToast';
import {useLocation} from "react-router-dom";




interface AppContentProps {
    isAuthenticated: boolean
    onLogin: (role: "tutor" | "student_or_parent", telegramData: TelegramUser) => void | Promise<void>
    userRole: "tutor" | "student_or_parent" | "admin" | null
    navigateToProfile: (userId: string) => void;
    navigateToChat: (chatId: string) => void;
}

const setAuthData = (userInfo: UserDetailedInfo, setAuthInfo: (data: UserDetailedInfo | null) => void) => {
    setAuthInfo(userInfo);
}

const AppContent = ({
                        isAuthenticated,
                        onLogin,
                        userRole,
                        navigateToProfile,
                        navigateToChat
                    }: AppContentProps) => {

    const defaultAuthenticatedRoute = userRole === "admin"
        ? "/admin"
        : "/schedule";

    const routes = [
        {
            path: "/",
            element: isAuthenticated ? (
                <Navigate to={defaultAuthenticatedRoute} replace />
            ) : (
                <LandingPage onLogin={onLogin} />
            ),
        },
        {
            path: "/legal-info",
            element: <LegalInfoPage />,
        },
        {
            path: "/privacy-policy",
            element: <PrivacyPolicyPage />,
        },
        {
            path: "/terms-of-service",
            element: <TermsOfServicePage />
        },
        {
            path: "/profile",
            element: isAuthenticated ? (
                <UserProfilePage />
            ) : (
                <Navigate to="/" replace />
            ),
        },
        {
            path: "/schedule",
            element: isAuthenticated ? (
                <SchedulePage />
            ) : (
                <Navigate to="/" replace />
            ),
        },
        {
            path: "/statistic",
            element: isAuthenticated ? (() => {
                const isPersonRole = userRole === "tutor" || userRole === "student_or_parent";

                if (isPersonRole) {
                    return (
                        <PersonStatisticPage
                            userRole={userRole}
                        />
                    );
                }
                return <Navigate to="/schedule" replace />;
            })() : (
                <Navigate to="/" replace />
            ),
        },
        {
            path: "/students",
            element: isAuthenticated ? (
                <MyPersonPage
                    userRole={userRole}
                    navigateToProfile={navigateToProfile}
                    navigateToChat={navigateToChat}
                />
            ) : (
                <Navigate to="/" replace />
            ),
        },
        {
            path: "/user/profile/:userId",
            element: isAuthenticated ? (
                <UserProfilePage />
            ) : (
                <Navigate to="/" replace />
            ),
        },
        {
            path: "/messages",
            element: isAuthenticated ? (
                <MessagesPage />
            ) : (
                <Navigate to="/" replace />
            ),
        },
        {
            path: "/messages/:chatId",
            element: isAuthenticated ? (
                <MessagesPage />
            ) : (
                <Navigate to="/" replace />
            ),
        },
        {
            path: "/admin",
            element: isAuthenticated && userRole === "admin" ? (
                <AdminPage />
            ) : (isAuthenticated ? (
                <Navigate to="/schedule" replace />
            ) : (
                <Navigate to="/" replace />
            )),
        },
        {
            path: "/all-message",
            element: isAuthenticated && userRole === "admin" ? (
                <AdminMessagePage />
            ) : (isAuthenticated ? (
                <Navigate to="/schedule" replace />
            ) : (
                <Navigate to="/" replace />
            ))
        },
        {
            path: "/all-message/:chatId",
            element: isAuthenticated && userRole === "admin" ? (
                <AdminMessagePage />
            ) : (isAuthenticated ? (
                <Navigate to="/schedule" replace />
            ) : (
                <Navigate to="/" replace />
            ))
        },
        {
            path: "/all-statistic",
            element: isAuthenticated && userRole === "admin" ? (
                <AdminStatisticPage />
            ) : (isAuthenticated ? (
                <Navigate to="/schedule" replace />
            ) : (
                <Navigate to="/" replace />
            )),
        },
        {
            path: "/tutor-student-link",
            element: isAuthenticated && userRole === "admin" ? (
                <TutorStudentLinkPage />
            ) : (
                isAuthenticated ? (
                    <Navigate to="/schedule" replace />
                ) : (
                    <Navigate to="/" replace />
                )
            ),
        },
        {
            path: "/admin/users",
            element: isAuthenticated && userRole === "admin" ? (
                <UserListPage />
            ) : (
                isAuthenticated ? (
                    <Navigate to="/schedule" replace />
                ) : (
                    <Navigate to="/" replace />
                )
            ),
        },
        {
            path: "/admin/parent-links",
            element: isAuthenticated && userRole === "admin" ? (
                <ParentStudentLinkPage />
            ) : (
                isAuthenticated ? (
                    <Navigate to="/schedule" replace />
                ) : (
                    <Navigate to="/" replace />
                )
            ),
        },
        { path: "*", element: <div>404 Page Not Found</div> }
    ]

    const element = useRoutes(routes)

    return (
        <div className="app-content-container">
            {element}
        </div>
    )
}

export const AppLogic = () => {
    const location = useLocation();
    const isChatPage = location.pathname.startsWith("/messages/") && location.pathname.length > "/messages/".length;

    const navigate = useNavigate()
    const { token, role, userInfo, setUserInfo, syncAuthData } = useAuth();
    const { showAlert } = useAlert();
    const isAuthenticated = !!token;
    const userRole = role as "tutor" | "student_or_parent" | "admin" | null;

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const setVh = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        setVh();
        window.addEventListener('resize', setVh);

        return () => window.removeEventListener('resize', setVh);
    }, []);

    useEffect(() => {
        if (isChatPage) {
            document.body.classList.add('chat-mode-active');
        } else {
            document.body.classList.remove('chat-mode-active');
        }
    }, [isChatPage]);

    useEffect(() => {
        const initAuth = async () => {
            if (!token) {
                setIsLoading(false);
                return;
            }

            if (userInfo) {
                setIsLoading(false);
                return;
            }

            try {
                const fetchedUserInfo = await getUserInfo()
                if (fetchedUserInfo) {
                    setAuthData(fetchedUserInfo, setUserInfo)
                } else {
                    localStorage.clear();
                    syncAuthData();
                }
            } catch (error) {
                console.error("[v0] Auth check failed:", error)
                localStorage.clear();
                syncAuthData();
                navigate("/", { replace: true });
            } finally {
                setIsLoading(false)
            }
        }
        initAuth()
    }, [token, setUserInfo, syncAuthData]);

    const handleLogin = useCallback(async (selectedRole: "tutor" | "student_or_parent" | "admin", telegramData: TelegramUser) => {
        try {
            const response = await loginWithTelegram(telegramData, selectedRole)
            localStorage.setItem("authToken", response.accessToken)
            localStorage.setItem("id", response.id)
            localStorage.setItem("role", response.role)

            syncAuthData();
            const targetRole = response.role as "tutor" | "student_or_parent" | "admin";
                const targetPath = targetRole === "admin" ? "/admin" : "/schedule";
                navigate(targetPath, { replace: true });

        } catch (error) {
            console.error("[v0] Login failed:", error)
            showAlert("Ошибка авторизации. Попробуйте еще раз.", 'error');
        }
    }, [showAlert, navigate, syncAuthData]);
    // --- Обработчик выхода ---
    const handleLogout = async () => {
        setUserInfo(null);
        setIsLoading(false);

        // 2. Очистка LocalStorage
        localStorage.removeItem("authToken");
        localStorage.removeItem("id");
        localStorage.removeItem("role");

        syncAuthData();
        navigate("/", { replace: true });

        try {
            // await apiLogout()
        } catch (error) {
            console.error("[v0] Logout failed:", error);
        }
    }

    const handleNavigateToProfile = useCallback((userId: string) => {
        navigate(`/user/profile/${userId}`);
    }, [navigate]);

    const handleNavigateToChat = useCallback((chatId: string) => {
        navigate(`/messages/${chatId}`);
    }, [navigate]);

    if (isLoading || (isAuthenticated && !userInfo)) {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                    fontSize: "18px",
                    color: "#0066ff",
                }}
            >
                <img
                    src={loadingGif}
                    alt="Загрузка..."
                    style={{
                        width: '128px',
                        height: '128px',
                        marginBottom: '15px'
                    }}
                />
                <div>Загрузка...</div>
            </div>
        )
    }

    return (
        <div className="app-container">
            <Header
                isAuthenticated={isAuthenticated}
                userName={userInfo ? `${userInfo.firstName} ${userInfo.lastName || ""}` : ""}
                userAvatar={userInfo ? userInfo.photoUrl : ""}
                userRole={userRole}
                onLogin={handleLogin}
                onLogout={handleLogout}
            />

            <AppContent
                isAuthenticated={isAuthenticated}
                onLogin={handleLogin}
                userRole={userRole}
                navigateToProfile={handleNavigateToProfile}
                navigateToChat={handleNavigateToChat}
            />

            {!(isChatPage) && (
                <Footer
                    isAuthenticated={isAuthenticated}
                />
            )}
        </div>
    )
}

export const App = () => (
    <AuthProvider>
        <AlertProvider>
            <ChatProvider>
                <NotificationProvider>
                    <SSEProvider>
                        <AppLogic />
                    </SSEProvider>
                </NotificationProvider>
            </ChatProvider>
        </AlertProvider>
    </AuthProvider>
);
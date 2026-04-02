"use client"
import { useState } from "react"
// @ts-ignore
import mainImage from "@images/layding_main_picture.jpg"
// @ts-ignore
import secondImage from "@images/student-using-online.jpg"
// @ts-ignore
import styles from "./LandingPage.module.scss"
import { LoginModal } from "@components/layout/Header/LoginModal"
import type { TelegramUser } from "@components/auth/TelegramLoginButton"

interface LandingPageProps {
  onLogin?: (role: "tutor" | "student_or_parent", telegramData: TelegramUser) => void | Promise<void>
}

const LandingPage = ({ onLogin }: LandingPageProps) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  const handleStartClick = () => {
    setIsLoginModalOpen(true)
  }


  const handleLoginFromModal = async (role: "tutor" | "student_or_parent", telegramData: TelegramUser) => {
    setIsLoginModalOpen(false)

    if (onLogin) {
      await onLogin(role, telegramData)
    }
  }

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }


  return (
      <div className={styles.landingPage}>
        <section className={styles.hero}>
          <div className={styles.container}>
            <div className={styles.heroContent}>
              <div className={styles.heroText}>
                <h1 className={styles.heroTitle}>Ваша репетиторская жизнь — в одном окне</h1>
                <p className={styles.heroDescription}>
                  От прозрачного расписания до бесед с родителями и учениками. Всё, что нужно для эффективного обучения,
                  собрано в одном месте.
                </p>
                <div className={styles.heroCta}>
                  <button className={styles.primaryButton} onClick={handleStartClick}>
                    Начать
                  </button>
                </div>
              </div>
              <div className={styles.heroImage}>
                <img src={mainImage || "/placeholder.svg"} alt="Главное изображение" />
              </div>
            </div>
          </div>
        </section>

        <section className={styles.features} id="features">
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Ключевые возможности</h2>
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🔔</div>
                <h3 className={styles.featureTitle}>Напоминания</h3>
                <p className={styles.featureDescription}>
                  Пусть напоминания о занятиях и оплатах остаются за нами — всё будет сказано вовремя и деликатно.
                </p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>✈️</div>
                <h3 className={styles.featureTitle}>Встроенный чат / Телеграм-бот</h3>
                <p className={styles.featureDescription}>
                  Пишите напрямую на сайте или прямо в Telegram. Вся коммуникация с учениками и родителями в одном месте.
                </p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>📓</div>
                <h3 className={styles.featureTitle}>Домашнее задание</h3>
                <p className={styles.featureDescription}>
                  Отслеживание выполнения домашних заданий. Выдавайте задания и контролируйте прогресс без лишних усилий.
                </p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>💳</div>
                <h3 className={styles.featureTitle}>Быстрая оплата</h3>
                <p className={styles.featureDescription}>
                  Больше никаких отдельных переводов. Оплатите занятия у всех репетиторов одной кнопкой.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.pricing} id="pricing">
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Тарифы для репетиторов</h2>
            <div className={styles.pricingGrid}>
              <div className={styles.pricingCard}>
                <div className={styles.pricingIcon}>💡</div>
                <h3 className={styles.pricingTitle}>Тариф "Старт"</h3>
                <p className={styles.pricingSubtitle}>
                  Для репетиторов, которые хотят навести порядок в работе и избавиться от хаоса в таблицах.
                </p>
                <div className={styles.pricingPrice}>Бесплатно</div>
                <div className={styles.pricingFeatures}>
                  <h4>Что включено:</h4>
                  <ul>
                    <li>✓ Хранить список учеников в одном месте</li>
                    <li>✓ Создавать простое расписание</li>
                    <li>✓ Отмечать посещения и оплаты</li>
                    <li>✓ Получать напоминания о занятиях</li>
                    <li>✓ Следить за выполнением домашних заданий</li>
                  </ul>
                </div>
                <p className={styles.pricingCta}>👉 Начните с базового функционала — без ограничений и сложностей</p>
              </div>

              <div className={styles.pricingCard}>
                <div className={styles.pricingIcon}>💼</div>
                <h3 className={styles.pricingTitle}>Тариф "Расширенные возможности"</h3>
                <p className={styles.pricingSubtitle}>
                  Для онлайн-школ и мини-студий, где работает несколько преподавателей.
                </p>
                <div className={styles.pricingPrice}>По запросу</div>
                <div className={styles.pricingFeatures}>
                  <h4>Что включено:</h4>
                  <ul>
                    <li>✓ Управление несколькими аккаунтами</li>
                    <li>✓ Общие отчёты и расписания</li>
                    <li>✓ Финансовая аналитика по преподавателям</li>
                    <li>✓ Поддержка команды</li>
                  </ul>
                </div>
                <p className={styles.pricingCta}>👉 Полный контроль над обучением и бизнесом</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.stats}>
          <div className={styles.container}>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>1000+</div>
                <div className={styles.statLabel}>Активных пользователей</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>600+</div>
                <div className={styles.statLabel}>Репетиторов</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>98%</div>
                <div className={styles.statLabel}>Довольных клиентов</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>17</div>
                <div className={styles.statLabel}>Предметов</div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.testimonials} id="testimonials">
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Отзывы наших пользователей</h2>
            <div className={styles.testimonialsGrid}>
              <div className={styles.testimonialCard}>
                <div className={styles.testimonialRating}>⭐⭐⭐⭐⭐</div>
                <p className={styles.testimonialText}>
                  "Отличная платформа! Очень удобно следить за успеваемостью сына и общаться с репетитором."
                </p>
                <div className={styles.testimonialAuthor}>
                  <strong>Елена М.</strong>
                  <span>Родитель</span>
                </div>
              </div>
              <div className={styles.testimonialCard}>
                <div className={styles.testimonialRating}>⭐⭐⭐⭐⭐</div>
                <p className={styles.testimonialText}>
                  "Календарь и напоминания помогают не пропускать занятия. Все материалы в одном месте!"
                </p>
                <div className={styles.testimonialAuthor}>
                  <strong>Дмитрий К.</strong>
                  <span>Ученик</span>
                </div>
              </div>
              <div className={styles.testimonialCard}>
                <div className={styles.testimonialRating}>⭐⭐⭐⭐⭐</div>
                <p className={styles.testimonialText}>
                  "Как репетитор, я ценю возможность вести учет занятий и получать оплату онлайн. Рекомендую!"
                </p>
                <div className={styles.testimonialAuthor}>
                  <strong>Анна С.</strong>
                  <span>Репетитор</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.cta} id="cta">
          <div className={styles.container}>
            <div className={styles.ctaContent}>
              <div className={styles.ctaAvatar}>👨‍💻</div>
              <h2 className={styles.ctaTitle}>ПОДПИСЫВАЙТЕСЬ И ВСТУПАЙТЕ В НАШЕ КОМЬЮНИТИ РЕПЕТИТОРОВ</h2>
              <a
                  href="https://t.me/ugolokrepetitora"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.ctaButton}
              >
                ПОДПИСАТЬСЯ
              </a>
              <div className={styles.ctaAvatar}>👩‍🏫</div>
            </div>
          </div>
        </section>

        <section className={styles.faq} id="faq">
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Частые вопросы</h2>
            <div className={styles.faqList}>
              <div className={styles.faqItem}>
                <button
                    className={`${styles.faqQuestion} ${openFaqIndex === 0 ? styles.active : ""}`}
                    onClick={() => toggleFaq(0)}
                >
                  <span>Правда ли что я могу писать сообщение репетитору через бота и он его доставит?</span>
                  <span className={styles.faqIcon}>{openFaqIndex === 0 ? "−" : "+"}</span>
                </button>
                {openFaqIndex === 0 && (
                    <div className={styles.faqAnswer}>
                      Да, это правда! Наш Telegram-бот позволяет вам отправлять сообщения репетитору напрямую через
                      Telegram. Все сообщения доставляются мгновенно, и вы можете общаться в удобном для вас мессенджере, не
                      переключаясь между приложениями.
                    </div>
                )}
              </div>

              <div className={styles.faqItem}>
                <button
                    className={`${styles.faqQuestion} ${openFaqIndex === 1 ? styles.active : ""}`}
                    onClick={() => toggleFaq(1)}
                >
                  <span>Можно ли попробовать бесплатно?</span>
                  <span className={styles.faqIcon}>{openFaqIndex === 1 ? "−" : "+"}</span>
                </button>
                {openFaqIndex === 1 && (
                    <div className={styles.faqAnswer}>
                      Конечно! Тариф "Старт" полностью бесплатный и включает все базовые функции для управления учениками,
                      расписанием и домашними заданиями. Вы можете пользоваться им без ограничений по времени.
                    </div>
                )}
              </div>

              <div className={styles.faqItem}>
                <button
                    className={`${styles.faqQuestion} ${openFaqIndex === 2 ? styles.active : ""}`}
                    onClick={() => toggleFaq(2)}
                >
                  <span>Как работает система напоминаний?</span>
                  <span className={styles.faqIcon}>{openFaqIndex === 2 ? "−" : "+"}</span>
                </button>
                {openFaqIndex === 2 && (
                    <div className={styles.faqAnswer}>
                      Система автоматически отправляет напоминания в Telegram о предстоящих занятиях и оплатах всем участникам —
                      репетиторам, ученикам и родителям.
                    </div>
                )}
              </div>

              <div className={styles.faqItem}>
                <button
                    className={`${styles.faqQuestion} ${openFaqIndex === 3 ? styles.active : ""}`}
                    onClick={() => toggleFaq(3)}
                >
                  <span>Безопасны ли платежи на платформе?</span>
                  <span className={styles.faqIcon}>{openFaqIndex === 3 ? "−" : "+"}</span>
                </button>
                {openFaqIndex === 3 && (
                    <div className={styles.faqAnswer}>
                      Да, все платежи проходят через защищенные платежные системы с использованием современных протоколов
                      шифрования. Мы не храним данные банковских карт на наших серверах, что гарантирует максимальную
                      безопасность ваших транзакций.
                    </div>
                )}
              </div>

              <div className={styles.faqItem}>
                <button
                    className={`${styles.faqQuestion} ${openFaqIndex === 4 ? styles.active : ""}`}
                    onClick={() => toggleFaq(4)}
                >
                  <span>Могу ли я использовать платформу на мобильном устройстве?</span>
                  <span className={styles.faqIcon}>{openFaqIndex === 4 ? "−" : "+"}</span>
                </button>
                {openFaqIndex === 4 && (
                    <div className={styles.faqAnswer}>
                      Да! Наша платформа полностью адаптирована для мобильных устройств. Вы можете использовать все функции
                      через браузер на смартфоне или планшете. Также доступна интеграция с Telegram-ботом для еще более
                      удобного доступа.
                    </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <LoginModal isOpen={isLoginModalOpen}
                    onClose={() => setIsLoginModalOpen(false)}
                    onLogin={handleLoginFromModal} />
      </div>
  )
}

export default LandingPage
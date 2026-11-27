import { useNavigate } from 'react-router-dom'
// @ts-ignore
import ui from './ui.module.scss'

interface ProPaywallProps {
	title?: string
	text: string
}

/** Плашка «функция доступна в подписке Pro» со ссылкой на оформление. */
export const ProPaywall = ({ title = 'Доступно в подписке Pro', text }: ProPaywallProps) => {
	const navigate = useNavigate()

	return (
		<div className={ui.paywall}>
			<div className={ui.paywallText}>
				<h3>
					<span className={ui.badgePro}>PRO</span> {title}
				</h3>
				{text}
			</div>
			<button type='button' className={ui.btnPrimary} onClick={() => navigate('/subscription')}>
				Оформить подписку
			</button>
		</div>
	)
}

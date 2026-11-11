import { PrivacyChoicesButton } from '@soonlane/analytics/components/privacy-choices-button'
import { cn } from '@soonlane/ui/cn'
import { Link } from '@tanstack/react-router'
import {
	CONTACT_EMAIL,
	GITHUB_URL,
	LICENSE_URL,
	SITE_NAME,
	SITE_PAGE_LINKS,
} from '../site.constants'

const FOOTER_LINK_CLASS =
	'rounded-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-4'

export function SiteFooter() {
	return (
		<footer className="border-t">
			<div className="mx-auto flex w-full max-w-[1120px] flex-col gap-10 px-4 py-12 sm:px-6">
				<div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
					<div className="flex flex-col gap-1.5">
						<p className="flex items-center gap-2 font-bold">
							<img alt="" height={20} src="/favicon.svg" width={20} />
							{SITE_NAME}
						</p>

						<p className="text-sm text-muted-foreground">
							Your tasks, from today onwards.
						</p>
					</div>

					<div className="flex gap-16 text-sm">
						<nav
							aria-labelledby="footer-product"
							className="flex flex-col gap-3"
						>
							<h2 className="font-semibold" id="footer-product">
								Product
							</h2>

							{SITE_PAGE_LINKS.map(({ label, to }) => (
								<Link className={FOOTER_LINK_CLASS} key={label} to={to}>
									{label}
								</Link>
							))}

							<a className={FOOTER_LINK_CLASS} href={GITHUB_URL}>
								GitHub
							</a>
						</nav>

						<nav aria-labelledby="footer-legal" className="flex flex-col gap-3">
							<h2 className="font-semibold" id="footer-legal">
								Legal
							</h2>

							<Link className={FOOTER_LINK_CLASS} to="/privacy">
								Privacy
							</Link>

							<PrivacyChoicesButton
								className={cn(FOOTER_LINK_CLASS, 'cursor-pointer text-left')}
							/>

							<Link className={FOOTER_LINK_CLASS} to="/terms">
								Terms
							</Link>

							<a className={FOOTER_LINK_CLASS} href={`mailto:${CONTACT_EMAIL}`}>
								Contact
							</a>
						</nav>
					</div>
				</div>

				<p className="text-caption text-muted-foreground">
					© 2026 Igor Makowski ·{' '}
					<a className={FOOTER_LINK_CLASS} href={LICENSE_URL}>
						AGPL-3.0
					</a>
				</p>
			</div>
		</footer>
	)
}

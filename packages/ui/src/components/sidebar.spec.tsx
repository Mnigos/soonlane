import { load } from 'cheerio'
import { renderToStaticMarkup } from 'react-dom/server'
import { Sidebar, SidebarSection, sidebarItemVariants } from './sidebar'

test('labels a section by its heading', () => {
	const $ = load(
		renderToStaticMarkup(
			<Sidebar aria-label="Sidebar" className="hidden md:flex">
				<SidebarSection label="Labels">
					<p>No labels yet</p>
				</SidebarSection>
			</Sidebar>
		)
	)
	const section = $('aside section')
	expect($('aside').attr('aria-label')).toBe('Sidebar')
	expect($('aside').hasClass('md:flex')).toBe(true)
	expect($(`#${section.attr('aria-labelledby')}`).text()).toBe('Labels')
})

test('keeps active and inactive text colors apart', () => {
	expect(sidebarItemVariants({ state: 'active' })).toContain('text-danger')
	expect(sidebarItemVariants({ state: 'active' })).not.toContain(
		'text-foreground'
	)
	expect(sidebarItemVariants()).toContain('text-foreground')
	expect(sidebarItemVariants()).not.toContain('text-danger')
})

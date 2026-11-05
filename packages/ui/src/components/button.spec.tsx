import { load } from 'cheerio'
import { renderToStaticMarkup } from 'react-dom/server'
import { Button } from './button'

test('defaults to a non-submitting primary button', () => {
	const $ = load(renderToStaticMarkup(<Button>Save</Button>))
	expect($('button').attr('type')).toBe('button')
	expect($('button').hasClass('bg-primary')).toBe(true)
})

test('keeps submit buttons and merges extra classes over variants', () => {
	const $ = load(
		renderToStaticMarkup(
			<Button className="h-12" size="sm" type="submit" variant="ghost">
				Add
			</Button>
		)
	)
	expect($('button').attr('type')).toBe('submit')
	expect($('button').hasClass('h-12')).toBe(true)
	expect($('button').hasClass('h-8')).toBe(false)
	expect($('button').hasClass('bg-primary')).toBe(false)
})

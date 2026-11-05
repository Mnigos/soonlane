import { load } from 'cheerio'
import { renderToStaticMarkup } from 'react-dom/server'
import { Avatar } from './avatar'

test('renders the picture without alt text when a source is given', () => {
	const $ = load(
		renderToStaticMarkup(
			<Avatar name="Igor" src="https://images.example.test/igor.png" />
		)
	)
	expect($('img').attr('src')).toBe('https://images.example.test/igor.png')
	expect($('img').attr('alt')).toBe('')
	expect($('img').attr('referrerpolicy')).toBe('no-referrer')
})

test.each([
	['igor', 'I'],
	['  soonlist', 'S'],
	['   ', '?'],
])('falls back to the first letter of %j', (name, initial) => {
	const $ = load(renderToStaticMarkup(<Avatar name={name} />))
	expect($('span').text()).toBe(initial)
	expect($('span').attr('aria-hidden')).toBe('true')
})

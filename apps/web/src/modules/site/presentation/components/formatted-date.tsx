const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
	timeZone: 'UTC',
})

interface FormattedDateProps {
	date: string
}

export function FormattedDate({ date }: Readonly<FormattedDateProps>) {
	return <time dateTime={date}>{DATE_FORMAT.format(new Date(date))}</time>
}

import { DATE_FORMAT } from '../site.constants'

interface FormattedDateProps {
	date: string
}

export function FormattedDate({ date }: Readonly<FormattedDateProps>) {
	return <time dateTime={date}>{DATE_FORMAT.format(new Date(date))}</time>
}

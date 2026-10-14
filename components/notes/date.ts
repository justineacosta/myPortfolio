const FORMAT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

/** A guide's date as people read it: "13 October 2026". UTC, so a YYYY-MM-DD never slips a day. */
export const formatNoteDate = (date: string) => FORMAT.format(new Date(`${date}T00:00:00Z`))

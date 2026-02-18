/**
 * Return a new object without empty-ish values ('', null, and undefined)
*/

export const withoutEmptyValues = (obj: any) => {
  return typeof obj === 'object'
    ? Object.fromEntries(
        Object.entries(obj)
          .filter(([key, value]) => value !== undefined && value !== null && value !== '')
      )
    : obj
}

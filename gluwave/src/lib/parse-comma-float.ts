export const parseCommaFloat = (v: unknown) => {
  return parseFloat(String(v).replace(',', '.'))
}

export interface ChartTooltipPayload<TData = unknown> {
  color?: string
  dataKey?: string
  fill?: string
  name?: string | number
  payload?: TData
  value?: number | string
  [key: string]: unknown
}

export interface ChartTooltipProps<TData = unknown> {
  active?: boolean
  label?: string | number
  payload?: ChartTooltipPayload<TData>[]
}

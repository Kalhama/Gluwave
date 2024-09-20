import { cva } from 'class-variance-authority'
import React from 'react'

interface CompProps extends React.HTMLAttributes<HTMLOrSVGElement> {
  variant?: Variant
}

const variantToElement: Record<Variant, keyof JSX.IntrinsicElements> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  subheading1: 'h6',
  subheading2: 'h6',
  p: 'p',
}

type Variant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'h6'
  | 'subheading1'
  | 'subheading2'
  | 'p'

export const Typography: React.FunctionComponent<CompProps> = ({
  variant: variant = 'p',
  children,
  ...props
}) => {
  const Wrapper = variantToElement[variant]

  const variantStyles = cva('', {
    variants: {
      variant: {
        h2: 'text-2xl font-bold tracking-tight',
        h3: 'text-lg font-medium',
      },
    },
  })

  return (
    <Wrapper className={variantStyles({ variant })} {...props}>
      {children}
    </Wrapper>
  )
}

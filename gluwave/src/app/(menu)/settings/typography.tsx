import { cva } from 'class-variance-authority'
import React from 'react'

interface CompProps extends React.HTMLAttributes<HTMLOrSVGElement> {
  variant?: Variant
}

const variantToElement: Record<Variant, keyof JSX.IntrinsicElements> = {
  h2: 'h2',
  h3: 'h3',
}

type Variant = 'h2' | 'h3'

export const Typography: React.FunctionComponent<CompProps> = ({
  variant: variant = 'h2',
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

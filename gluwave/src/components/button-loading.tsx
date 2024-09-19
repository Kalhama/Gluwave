import { Loader2 } from 'lucide-react'
import * as React from 'react'

import { Button, ButtonProps, buttonVariants } from './ui/button'

export interface ButtonLoadingProps extends ButtonProps {
  loading?: boolean
}

const ButtonLoading = React.forwardRef<HTMLButtonElement, ButtonLoadingProps>(
  ({ children, loading, disabled, ...props }, ref) => {
    return (
      <Button disabled={loading || disabled} ref={ref} {...props}>
        {children}
        {loading && <Loader2 className="animate-spin w-4 h-4 ml-1" />}
      </Button>
    )
  }
)
ButtonLoading.displayName = 'ButtonLoading'

export { ButtonLoading, buttonVariants }

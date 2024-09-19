import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const Logout = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Logout from the site</CardTitle>
        <CardDescription>
          Logout, all the data will still be stored
        </CardDescription>
      </CardHeader>
      {/* <CardContent></CardContent> */}
      <CardFooter className="flex justify-between">
        <Button>
          <a href="/logout">Logout</a>
        </Button>
      </CardFooter>
    </Card>
  )
}

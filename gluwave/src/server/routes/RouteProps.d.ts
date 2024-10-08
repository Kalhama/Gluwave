export interface RouteProps<Input> {
  input: Input
  ctx: {
    user: User
    session: Session
  }
}

FROM node:20

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# set dummy env so that next build passess
ENV GITHUB_ID=_
ENV GITHUB_SECRET=_
ENV DATABASE_URL=_
ENV DATABASE_URL_UNPOOLED=_

# Must be UTC
ENV TZ=UTC

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
CMD ["pnpm", "run", "migrate-and-start"]
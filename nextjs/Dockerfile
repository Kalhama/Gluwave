FROM node:20

ARG DATABASE_URL
ARG GITHUB_ID
ARG GITHUB_SECRET
ARG DATABASE_URL_UNPOOLED

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run deploy
CMD ["pnpm", "run", "start"]
# Production image for container platforms (AWS ECS/Fargate, App Runner, etc.).
# Build:  docker build --build-arg NEXT_PUBLIC_SITE_URL=https://auryx.net -t auryx-website .
# Run:    docker run -p 3000:3000 --env-file .env.production auryx-website
# One-off database setup (same image):
#         docker run --env-file .env.production auryx-website npm run db:migrate
#         docker run --env-file .env.production auryx-website npm run db:seed

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Public site URL is baked into the build (used for links in emails, sitemap and SEO tags).
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000
RUN addgroup -S app && adduser -S app -G app
# Full app incl. dev tooling so the same image can run migrations and admin scripts.
COPY --from=build --chown=app:app /app ./
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["npm", "start"]

# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app

# Install all deps to build the app
FROM base AS deps
COPY package*.json ./
RUN npm ci

# Build Next.js
FROM deps AS build
COPY . .
ARG NEXT_PUBLIC_API_KEY
ENV NEXT_PUBLIC_API_KEY=$NEXT_PUBLIC_API_KEY
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Strip dev deps for a smaller runtime image
FROM deps AS prod-deps
RUN npm prune --omit=dev

# Runtime image
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY package.json ./
EXPOSE 3000
CMD ["npm", "run", "start"]

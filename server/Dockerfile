FROM oven/bun:1.4.2 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY server/public-mcp.ts ./server/public-mcp.ts
RUN bun build ./server/public-mcp.ts --target=bun --outfile /app/public-mcp.js

FROM oven/bun:1.4.2
WORKDIR /app
COPY --from=build /app/public-mcp.js ./public-mcp.js
USER bun
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3088
EXPOSE 3088
CMD ["bun", "run", "public-mcp.js"]

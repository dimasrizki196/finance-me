# ==========================================
# 1. DEPS (Install Dependencies)
# ==========================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy daftar dependensi
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm ci

# ==========================================
# 2. BUILDER (Compile Aplikasi)
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variabel ini penting agar Next.js tidak mengirim data telemetri ke Vercel
ENV NEXT_TELEMETRY_DISABLED 1

# Proses Build (Akan membaca variabel Supabase dari file .env di tahap ini)
RUN npm run build

# ==========================================
# 3. RUNNER (Production Image)
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Buat user non-root untuk keamanan server
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy aset publik
COPY --from=builder /app/public ./public

# Setup folder cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy hasil build standalone (hanya yang penting)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Perintah eksekusi jalankan server
CMD ["node", "server.js"]
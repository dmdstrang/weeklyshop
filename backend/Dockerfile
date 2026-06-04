# Official Playwright image — Chromium + all system deps pre-installed
FROM mcr.microsoft.com/playwright:v1.44.0-jammy

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the backend
COPY . .

# Playwright browsers are already in the base image, but ensure chromium is present
RUN npx playwright install chromium

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "index.js"]

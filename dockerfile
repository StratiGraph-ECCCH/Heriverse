# ---------- BUILD STAGE ----------
FROM node:20-slim AS builder

WORKDIR /aton

RUN apt-get update && apt-get install -y git \
    && rm -rf /var/lib/apt/lists/*

# clone ATON
RUN git clone --depth 1 https://github.com/phoenixbf/aton.git .

# clone flare
RUN git clone --depth 1 https://git.3dresearch.it/cnr-h2iosc/auth-flares.git /tmp/auth-flare \
    && mkdir -p config/flares/Auth \
    && mv /tmp/auth-flare/* config/flares/Auth/ \
    && rm -rf /tmp/auth-flare

# RUN rm -rf .git

RUN rm -rf data/collections/* data/scenes/*

RUN npm ci --omit=dev \
    && npm cache clean --force \
    && rm -rf /root/.npm

COPY . /aton/wapps/heriverse


# ---------- RUNTIME STAGE ----------
FROM node:20-slim

WORKDIR /aton

# install pm2
RUN npm install -g pm2 \
    && npm cache clean --force

COPY --from=builder /aton /aton

CMD ["pm2-runtime", "ecosystem.config.js"]
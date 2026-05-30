FROM rockylinux/rockylinux:9.7

RUN dnf install -y --allowerasing curl git && dnf clean all

# Node.js 24.16.0 — binary direto do nodejs.org
ENV NODE_VERSION=24.16.0
RUN curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz" \
    | tar -xz -C /usr/local --strip-components=1

# pnpm 11.4.0 via corepack
ENV PNPM_VERSION=11.4.0
RUN corepack enable && corepack prepare "pnpm@${PNPM_VERSION}" --activate

WORKDIR /app

EXPOSE 4000

ENTRYPOINT ["docker/app/entrypoint.sh"]

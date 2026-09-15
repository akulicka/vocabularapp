FROM node:22
ARG BUILD_ARG=development
ENV BUILD_CMD="npm run ${BUILD_ARG}"
ENV NODE_ENV=${BUILD_ARG}

COPY ./backend /backend
COPY ./shared /shared

WORKDIR /shared
RUN npm install && npm run build

WORKDIR /backend
RUN npm install
# Migrate at start (DB is available). Do not RUN migrate at build time.
CMD npm run migrate && $BUILD_CMD

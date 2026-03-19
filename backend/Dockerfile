FROM node:22
ARG BUILD_ARG=development
ENV BUILD_CMD="npm run ${BUILD_ARG}"

COPY ./backend /backend
COPY ./shared /shared

WORKDIR /shared
RUN npm install && npm run build

WORKDIR /backend
RUN npm install 
CMD $BUILD_CMD

# RUN cd db && npx sequelize-cli db:migrate
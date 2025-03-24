FROM node:latest
ARG BUILD_ARG=development
ENV BUILD_CMD="npm run ${BUILD_ARG}"
WORKDIR /backend
COPY . .
RUN npm ci 
CMD $BUILD_CMD
# RUN cd db && npx sequelize-cli db:migrate
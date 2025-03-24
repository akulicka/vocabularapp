FROM node:latest AS build
ARG BUILD_ARG=build
WORKDIR /frontend
COPY . .
RUN npm ci 
RUN npm run $BUILD_ARG

FROM nginx
COPY ./proxy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /frontend/dist /usr/share/nginx/html

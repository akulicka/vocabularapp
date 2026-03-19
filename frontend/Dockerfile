FROM node:22 AS build
ARG BUILD_ARG=build

COPY ./frontend /frontend
COPY ./shared /shared

WORKDIR /shared
RUN npm install && npm run build

WORKDIR /frontend
RUN npm install 
RUN npm run $BUILD_ARG

FROM nginx
COPY ./frontend/proxy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /frontend/dist /usr/share/nginx/html
